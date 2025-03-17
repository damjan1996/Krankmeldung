// app/api/mitarbeiter/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { z } from "zod";

import { authOptions } from "@/lib/auth";
import { prisma, fetchWithCache } from "@/lib/prisma";

// Cache-Schlüssel für Mitarbeiterlisten
const getListCacheKey = (params: URLSearchParams) =>
    `mitarbeiter-list-${Array.from(params.entries()).sort().join('-')}`;

/**
 * Schema für die Erstellung eines neuen Mitarbeiters
 */
const createMitarbeiterSchema = z.object({
    vorname: z.string().min(1, "Vorname wird benötigt"),
    nachname: z.string().min(1, "Nachname wird benötigt"),
    personalnummer: z.string().min(1, "Personalnummer wird benötigt"),
    position: z.string().nullable().optional(),
    istAktiv: z.boolean().default(true),
});

/**
 * GET-Handler: Liste von Mitarbeitern abrufen mit optionaler Filterung und Caching
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

        const aktiv = searchParams.get("aktiv") !== "false"; // Standard ist "true"
        const suche = searchParams.get("suche") || "";
        const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : undefined;
        const includeKrankmeldungen = searchParams.get("includeKrankmeldungen") === "true";

        // Daten mit Caching abrufen
        const result = await fetchWithCache(
            cacheKey,
            async () => {
                // Filter für Datenbankabfrage aufbauen
                let filter: any = {
                    istAktiv: aktiv,
                };

                // Suchfilter hinzufügen, wenn vorhanden
                if (suche) {
                    filter = {
                        ...filter,
                        OR: [
                            { vorname: { contains: suche, mode: 'insensitive' } },
                            { nachname: { contains: suche, mode: 'insensitive' } },
                            { personalnummer: { contains: suche, mode: 'insensitive' } },
                            { position: { contains: suche, mode: 'insensitive' } },
                        ],
                    };
                }

                // Include-Option für Krankmeldungen definieren
                const include: any = {};
                if (includeKrankmeldungen) {
                    include.krankmeldungen = {
                        where: { status: "aktiv" },
                        select: {
                            id: true,
                            startdatum: true,
                            enddatum: true,
                            status: true,
                        },
                        orderBy: { startdatum: "desc" },
                    };
                }

                // Parallele Datenbankabfragen für bessere Performance
                const [mitarbeiter, totalCount] = await Promise.all([
                    // Mitarbeiter laden
                    prisma.mitarbeiter.findMany({
                        where: filter,
                        orderBy: [
                            { nachname: "asc" },
                            { vorname: "asc" },
                        ],
                        take: limit,
                        include: Object.keys(include).length ? include : undefined,
                    }),
                    // Gesamtanzahl ermitteln
                    prisma.mitarbeiter.count({
                        where: filter,
                    }),
                ]);

                return {
                    data: mitarbeiter,
                    meta: {
                        total: totalCount,
                        count: mitarbeiter.length,
                        filter: {
                            aktiv,
                            suche: suche || null,
                            includeKrankmeldungen: includeKrankmeldungen || false,
                        },
                    },
                };
            },
            15000 // 15 Sekunden TTL für Listen
        );

        // Response mit Cache-Control-Header
        const response = NextResponse.json(result);
        response.headers.set('Cache-Control', 'private, max-age=15');
        return response;
    } catch (error) {
        console.error("Fehler beim Abrufen der Mitarbeiter:", error);
        return NextResponse.json(
            { error: "Ein Serverfehler ist aufgetreten" },
            { status: 500 }
        );
    }
}

/**
 * POST-Handler: Neuen Mitarbeiter erstellen
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

        // Nur Administratoren dürfen Mitarbeiter anlegen
        if (!session.user.isAdmin) {
            return NextResponse.json(
                { error: "Unzureichende Berechtigungen" },
                { status: 403 }
            );
        }

        // Anfragedaten parsen
        const rawData = await request.json();

        // Daten gegen Schema validieren
        const validationResult = createMitarbeiterSchema.safeParse(rawData);

        if (!validationResult.success) {
            return NextResponse.json(
                { error: "Ungültige Daten", details: validationResult.error },
                { status: 400 }
            );
        }

        const data = validationResult.data;

        // Prüfen, ob die Personalnummer bereits vergeben ist (mit minimalem Select für Performance)
        const existingPersonalnummer = await prisma.mitarbeiter.findUnique({
            where: { personalnummer: data.personalnummer },
            select: { id: true }
        });

        if (existingPersonalnummer) {
            return NextResponse.json(
                { error: "Die Personalnummer ist bereits vergeben" },
                { status: 400 }
            );
        }

        // Transaktion starten, um Mitarbeiter zu erstellen und Audit-Log zu erzeugen
        const result = await prisma.$transaction(async (tx) => {
            // Mitarbeiter erstellen
            const newMitarbeiter = await tx.mitarbeiter.create({
                data,
            });

            // Audit-Log erstellen
            await tx.aenderungsLog.create({
                data: {
                    tabellenname: "Mitarbeiter",
                    datensatzId: newMitarbeiter.id,
                    aktion: "INSERT",
                    neueWerte: JSON.stringify({
                        vorname: data.vorname,
                        nachname: data.nachname,
                        personalnummer: data.personalnummer,
                        position: data.position,
                        istAktiv: data.istAktiv,
                    }),
                    benutzerId: session.user.id,
                    benutzerAgent: request.headers.get("user-agent") || null,
                    ipAdresse: request.headers.get("x-forwarded-for") ||
                        request.headers.get("x-real-ip") ||
                        "127.0.0.1",
                },
            });

            return newMitarbeiter;
        });

        // Cache für Listen invalidieren
        if (global.__prismaCache) {
            // Alle Mitarbeiterlisten-Caches löschen
            for (const key of global.__prismaCache.keys()) {
                if (key.startsWith('mitarbeiter-list-')) {
                    global.__prismaCache.delete(key);
                }
            }
        }

        // Erfolgreiche Antwort mit neu erstelltem Mitarbeiter
        return NextResponse.json({
            message: "Mitarbeiter erfolgreich erstellt",
            mitarbeiter: result,
        }, { status: 201 });
    } catch (error) {
        console.error("Fehler beim Erstellen des Mitarbeiters:", error);
        return NextResponse.json(
            { error: "Ein Serverfehler ist aufgetreten" },
            { status: 500 }
        );
    }
}