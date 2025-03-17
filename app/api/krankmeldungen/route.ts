// app/api/krankmeldungen/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { z } from "zod";

import { authOptions } from "@/lib/auth";
import { prisma, fetchWithCache } from "@/lib/prisma";

// Cache-Schlüssel für Krankmeldungslisten
const getListCacheKey = (params: URLSearchParams) =>
    `krankmeldungen-list-${Array.from(params.entries()).sort().join('-')}`;

/**
 * Schema für Erstellung einer neuen Krankmeldung
 */
const createKrankmeldungSchema = z.object({
    mitarbeiterId: z.string().uuid(),
    startdatum: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).or(z.date()),
    enddatum: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).or(z.date()),
    arztbesuchDatum: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).or(z.date()).nullable().optional(),
    notizen: z.string().nullable().optional(),
    erstelltVonId: z.string().uuid(),
    status: z.enum(["aktiv", "abgeschlossen", "storniert"]).optional(),
});

/**
 * GET-Handler: Liste von Krankmeldungen abrufen mit optionaler Filterung und Caching
 */
export async function GET(request: NextRequest) {
    try {
        // Benutzer-Session für Zugriffsrechte prüfen
        const session = await getServerSession(authOptions);

        if (!session) {
            return NextResponse.json(
                { error: "Nicht autorisiert" },
                { status: 401 }
            );
        }

        // Query-Parameter extrahieren für Filterung
        const searchParams = request.nextUrl.searchParams;
        const cacheKey = getListCacheKey(searchParams);

        const mitarbeiterId = searchParams.get("mitarbeiterId");
        const status = searchParams.get("status");
        const startDate = searchParams.get("startDate");
        const endDate = searchParams.get("endDate");
        const zeitraum = searchParams.get("zeitraum");
        const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : undefined;

        // Daten mit Caching abrufen
        const result = await fetchWithCache(
            cacheKey,
            async () => {
                // Filter für Datenbankabfrage aufbauen
                const filter: any = {};

                // Mitarbeiter-Filter anwenden
                if (mitarbeiterId) {
                    filter.mitarbeiterId = mitarbeiterId;
                }

                // Status-Filter anwenden
                if (status && ["aktiv", "abgeschlossen", "storniert"].includes(status)) {
                    filter.status = status;
                }

                // Datumsbereich-Filter anwenden
                if (startDate) {
                    filter.startdatum = {
                        gte: new Date(startDate),
                    };
                }

                if (endDate) {
                    filter.enddatum = {
                        lte: new Date(endDate),
                    };
                }

                // Zeitraum-Filter anwenden (falls vorhanden)
                if (zeitraum) {
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);

                    if (zeitraum === "aktuell") {
                        filter.startdatum = {
                            lte: today,
                        };
                        filter.enddatum = {
                            gte: today,
                        };
                    } else if (zeitraum === "zukuenftig") {
                        filter.startdatum = {
                            gt: today,
                        };
                    } else if (zeitraum === "vergangen") {
                        filter.enddatum = {
                            lt: today,
                        };
                    } else if (zeitraum === "letzte30") {
                        const thirtyDaysAgo = new Date();
                        thirtyDaysAgo.setDate(today.getDate() - 30);
                        filter.startdatum = {
                            gte: thirtyDaysAgo,
                        };
                    }
                }

                // Parallele Datenbankabfragen für bessere Performance
                const [krankmeldungen, totalCount, aktiveCount, abgeschlosseneCount, stornierteCount, gesamtCount] =
                    await Promise.all([
                        // Krankmeldungen laden mit Optimierung der selektierten Felder
                        prisma.krankmeldung.findMany({
                            where: filter,
                            orderBy: { startdatum: "desc" },
                            take: limit,
                            include: {
                                mitarbeiter: {
                                    select: {
                                        vorname: true,
                                        nachname: true,
                                        personalnummer: true,
                                    },
                                },
                                erstelltVon: {
                                    select: {
                                        vorname: true,
                                        nachname: true,
                                        email: true,
                                    },
                                },
                            },
                        }),
                        prisma.krankmeldung.count({ where: filter }),
                        prisma.krankmeldung.count({ where: { status: "aktiv" } }),
                        prisma.krankmeldung.count({ where: { status: "abgeschlossen" } }),
                        prisma.krankmeldung.count({ where: { status: "storniert" } }),
                        prisma.krankmeldung.count(),
                    ]);

                return {
                    krankmeldungen,
                    meta: {
                        total: totalCount,
                        count: krankmeldungen.length,
                        filter: {
                            mitarbeiterId: mitarbeiterId || null,
                            status: status || null,
                            startDate: startDate || null,
                            endDate: endDate || null,
                            zeitraum: zeitraum || null,
                        },
                    },
                    counts: {
                        aktiv: aktiveCount,
                        abgeschlossen: abgeschlosseneCount,
                        storniert: stornierteCount,
                        total: gesamtCount
                    }
                };
            },
            15000 // 15 Sekunden TTL für Listen
        );

        // Response mit Cache-Control-Header
        const response = NextResponse.json(result);
        response.headers.set('Cache-Control', 'private, max-age=15');
        return response;
    } catch (error) {
        console.error("Fehler beim Abrufen der Krankmeldungen:", error);
        return NextResponse.json(
            { error: "Ein Serverfehler ist aufgetreten" },
            { status: 500 }
        );
    }
}

/**
 * POST-Handler: Neue Krankmeldung erstellen
 */
export async function POST(request: NextRequest) {
    try {
        // Benutzer-Session für Zugriffsrechte prüfen
        const session = await getServerSession(authOptions);

        if (!session) {
            return NextResponse.json(
                { error: "Nicht autorisiert" },
                { status: 401 }
            );
        }

        // Anfragedaten parsen
        const rawData = await request.json();

        // Daten gegen Schema validieren
        const validationResult = createKrankmeldungSchema.safeParse(rawData);

        if (!validationResult.success) {
            return NextResponse.json(
                { error: "Ungültige Daten", details: validationResult.error },
                { status: 400 }
            );
        }

        const data = validationResult.data;

        // Prüfen, ob der referenzierte Mitarbeiter existiert (mit minimaler Selektion für Performance)
        const mitarbeiter = await prisma.mitarbeiter.findUnique({
            where: { id: data.mitarbeiterId },
            select: { id: true }
        });

        if (!mitarbeiter) {
            return NextResponse.json(
                { error: "Der angegebene Mitarbeiter existiert nicht" },
                { status: 404 }
            );
        }

        // Datumsvalidierung: Startdatum muss vor oder gleich Enddatum sein
        const startDate = new Date(data.startdatum);
        const endDate = new Date(data.enddatum);

        if (startDate > endDate) {
            return NextResponse.json(
                { error: "Das Startdatum muss vor oder gleich dem Enddatum sein" },
                { status: 400 }
            );
        }

        // Arztbesuchdatum validieren, falls angegeben
        let arztbesuchDatum = null;
        if (data.arztbesuchDatum) {
            arztbesuchDatum = new Date(data.arztbesuchDatum);
        }

        // Daten für Datenbankerstellung vorbereiten (einschließlich Standardstatus "aktiv")
        const createData = {
            mitarbeiterId: data.mitarbeiterId,
            startdatum: startDate,
            enddatum: endDate,
            arztbesuchDatum: arztbesuchDatum,
            notizen: data.notizen || null,
            status: data.status || "aktiv",
            erstelltVonId: data.erstelltVonId,
        };

        // Transaktion starten, um Krankmeldung zu erstellen und Audit-Log zu erzeugen
        const result = await prisma.$transaction(async (tx) => {
            // Krankmeldung erstellen
            const newKrankmeldung = await tx.krankmeldung.create({
                data: createData,
                include: {
                    mitarbeiter: {
                        select: {
                            vorname: true,
                            nachname: true,
                            personalnummer: true,
                        },
                    },
                },
            });

            // Audit-Log erstellen
            await tx.aenderungsLog.create({
                data: {
                    tabellenname: "Krankmeldung",
                    datensatzId: newKrankmeldung.id,
                    aktion: "INSERT",
                    neueWerte: JSON.stringify({
                        mitarbeiterId: createData.mitarbeiterId,
                        startdatum: createData.startdatum,
                        enddatum: createData.enddatum,
                        arztbesuchDatum: createData.arztbesuchDatum,
                        notizen: createData.notizen,
                        status: createData.status,
                    }),
                    benutzerId: session.user.id,
                    benutzerAgent: request.headers.get("user-agent") || null,
                    ipAdresse: request.headers.get("x-forwarded-for") ||
                        request.headers.get("x-real-ip") ||
                        "127.0.0.1",
                },
            });

            return newKrankmeldung;
        });

        // Cache für Listen invalidieren
        if (global.__prismaCache) {
            // Alle Krankmeldungslisten-Caches löschen
            for (const key of global.__prismaCache.keys()) {
                if (key.startsWith('krankmeldungen-list-')) {
                    global.__prismaCache.delete(key);
                }
            }
        }

        // Erfolgreiche Antwort mit neu erstellter Krankmeldung
        return NextResponse.json({
            message: "Krankmeldung erfolgreich erstellt",
            krankmeldung: result,
        }, { status: 201 });
    } catch (error) {
        console.error("Fehler beim Erstellen der Krankmeldung:", error);
        return NextResponse.json(
            { error: "Ein Serverfehler ist aufgetreten" },
            { status: 500 }
        );
    }
}