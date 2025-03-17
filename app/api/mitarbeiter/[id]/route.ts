// app/api/mitarbeiter/[id]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { z } from "zod";

import { authOptions } from "@/lib/auth";
import { prisma, fetchWithCache } from "@/lib/prisma";

// Cache-Schlüssel für Mitarbeiter generieren
const getCacheKey = (id: string, includeKrankmeldungen = false) =>
    `mitarbeiter-${id}${includeKrankmeldungen ? '-with-krankmeldungen' : ''}`;

/**
 * Schema für Aktualisierung eines Mitarbeiters
 */
const updateMitarbeiterSchema = z.object({
    vorname: z.string().min(1, "Vorname wird benötigt"),
    nachname: z.string().min(1, "Nachname wird benötigt"),
    personalnummer: z.string().min(1, "Personalnummer wird benötigt").optional(),
    position: z.string().nullable().optional(),
    istAktiv: z.boolean().default(true),
});

/**
 * GET-Handler: Einzelnen Mitarbeiter abrufen mit Caching
 */
export async function GET(
    request: NextRequest,
    context: any
) {
    try {
        // Benutzer-Session für Zugriffsrechte prüfen
        const session = await getServerSession(authOptions);

        if (!session) {
            return NextResponse.json(
                { error: "Nicht autorisiert" },
                { status: 401 }
            );
        }

        // Mitarbeiter-ID sicher aus den Parametern extrahieren
        const id = context.params.id;

        if (!id) {
            return NextResponse.json(
                { error: "Keine gültige Mitarbeiter-ID" },
                { status: 400 }
            );
        }

        // Optional: Krankmeldungen mit abrufen basierend auf Query-Parametern
        const includeKrankmeldungen = request.nextUrl.searchParams.get("includeKrankmeldungen") === "true";

        // Cache-Schlüssel basierend auf Anforderungen
        const cacheKey = getCacheKey(id, includeKrankmeldungen);

        // Mitarbeiter mit Caching abrufen
        const result = await fetchWithCache(
            cacheKey,
            async () => {
                // Mitarbeiter aus der Datenbank abrufen
                const mitarbeiter = await prisma.mitarbeiter.findUnique({
                    where: { id },
                });

                // Wenn kein Mitarbeiter gefunden wurde, null zurückgeben
                if (!mitarbeiter) {
                    return null;
                }

                // Wenn Krankmeldungen angefordert, diese parallel laden
                if (includeKrankmeldungen) {
                    const krankmeldungen = await prisma.krankmeldung.findMany({
                        where: { mitarbeiterId: id },
                        orderBy: { startdatum: "desc" },
                        include: {
                            erstelltVon: {
                                select: {
                                    vorname: true,
                                    nachname: true,
                                    email: true,
                                },
                            },
                        },
                    });

                    // Erweiterte Antwort mit Mitarbeiter und dessen Krankmeldungen
                    return {
                        ...mitarbeiter,
                        krankmeldungen,
                    };
                }

                // Standard-Antwort ohne Krankmeldungen
                return mitarbeiter;
            },
            30000 // 30 Sekunden TTL
        );

        // Wenn kein Mitarbeiter gefunden wurde, 404 zurückgeben
        if (!result) {
            return NextResponse.json(
                { error: "Mitarbeiter nicht gefunden" },
                { status: 404 }
            );
        }

        // Response mit Cache-Control-Header
        const response = NextResponse.json(result);
        response.headers.set('Cache-Control', 'private, max-age=30');
        return response;
    } catch (error) {
        console.error("Fehler beim Abrufen des Mitarbeiters:", error);
        return NextResponse.json(
            { error: "Ein Serverfehler ist aufgetreten" },
            { status: 500 }
        );
    }
}

/**
 * PUT-Handler: Mitarbeiter aktualisieren mit Cache-Invalidierung
 */
export async function PUT(
    request: NextRequest,
    context: any
) {
    try {
        // Benutzer-Session für Zugriffsrechte prüfen
        const session = await getServerSession(authOptions);

        if (!session) {
            return NextResponse.json(
                { error: "Nicht autorisiert" },
                { status: 401 }
            );
        }

        // Mitarbeiter-ID sicher aus den Parametern extrahieren
        const id = context.params.id;

        if (!id) {
            return NextResponse.json(
                { error: "Keine gültige Mitarbeiter-ID" },
                { status: 400 }
            );
        }

        // Anfragedaten parsen
        const rawData = await request.json();

        // Daten gegen Schema validieren
        const validationResult = updateMitarbeiterSchema.safeParse(rawData);

        if (!validationResult.success) {
            return NextResponse.json(
                { error: "Ungültige Daten", details: validationResult.error },
                { status: 400 }
            );
        }

        const data = validationResult.data;

        // Prüfen, ob Mitarbeiter existiert (mit minimalem Select für Performance)
        const existingMitarbeiter = await prisma.mitarbeiter.findUnique({
            where: { id },
            select: {
                id: true,
                vorname: true,
                nachname: true,
                personalnummer: true,
                position: true,
                istAktiv: true
            }
        });

        if (!existingMitarbeiter) {
            return NextResponse.json(
                { error: "Mitarbeiter nicht gefunden" },
                { status: 404 }
            );
        }

        // Bei Änderung der Personalnummer: Prüfen, ob die neue Personalnummer bereits vergeben ist
        if (data.personalnummer && data.personalnummer !== existingMitarbeiter.personalnummer) {
            const existingPersonalnummer = await prisma.mitarbeiter.findUnique({
                where: { personalnummer: data.personalnummer },
                select: { id: true }
            });

            if (existingPersonalnummer && existingPersonalnummer.id !== id) {
                return NextResponse.json(
                    { error: "Die Personalnummer ist bereits vergeben" },
                    { status: 400 }
                );
            }
        }

        // Audit-Log Daten vorbereiten
        const alteWerte = {
            vorname: existingMitarbeiter.vorname,
            nachname: existingMitarbeiter.nachname,
            personalnummer: existingMitarbeiter.personalnummer,
            position: existingMitarbeiter.position,
            istAktiv: existingMitarbeiter.istAktiv,
        };

        // Aktualisierte Mitarbeiterdaten
        const updateData = {
            ...data,
            aktualisiertAm: new Date(),
        };

        // Transaktion starten, um Mitarbeiter zu aktualisieren und Audit-Log zu erstellen
        const result = await prisma.$transaction(async (tx) => {
            // Mitarbeiter aktualisieren
            const updatedMitarbeiter = await tx.mitarbeiter.update({
                where: { id },
                data: updateData,
            });

            // Audit-Log erstellen
            await tx.aenderungsLog.create({
                data: {
                    tabellenname: "Mitarbeiter",
                    datensatzId: id,
                    aktion: "UPDATE",
                    alteWerte: JSON.stringify(alteWerte),
                    neueWerte: JSON.stringify({
                        vorname: updatedMitarbeiter.vorname,
                        nachname: updatedMitarbeiter.nachname,
                        personalnummer: updatedMitarbeiter.personalnummer,
                        position: updatedMitarbeiter.position,
                        istAktiv: updatedMitarbeiter.istAktiv,
                    }),
                    benutzerId: session.user.id,
                    benutzerAgent: request.headers.get("user-agent") || null,
                    ipAdresse: request.headers.get("x-forwarded-for") ||
                        request.headers.get("x-real-ip") ||
                        "127.0.0.1",
                },
            });

            return updatedMitarbeiter;
        });

        // Alle Cache-Einträge für diesen Mitarbeiter invalidieren
        if (global.__prismaCache) {
            global.__prismaCache.delete(getCacheKey(id, false));
            global.__prismaCache.delete(getCacheKey(id, true));

            // Zusätzlich alle Mitarbeiterlisten-Caches löschen
            for (const key of global.__prismaCache.keys()) {
                if (key.startsWith('mitarbeiter-list-')) {
                    global.__prismaCache.delete(key);
                }
            }
        }

        // Erfolgreiche Antwort mit aktualisierten Daten
        return NextResponse.json({
            message: "Mitarbeiter erfolgreich aktualisiert",
            mitarbeiter: result,
        });
    } catch (error) {
        console.error("Fehler beim Aktualisieren des Mitarbeiters:", error);
        return NextResponse.json(
            { error: "Ein Serverfehler ist aufgetreten" },
            { status: 500 }
        );
    }
}

/**
 * DELETE-Handler: Mitarbeiter deaktivieren (statt physischem Löschen)
 * Hinweis: Wir deaktivieren Mitarbeiter statt sie zu löschen,
 * um Referenzintegrität mit existierenden Krankmeldungen zu wahren
 */
export async function DELETE(
    request: NextRequest,
    context: any
) {
    try {
        // Benutzer-Session für Zugriffsrechte prüfen
        const session = await getServerSession(authOptions);

        if (!session) {
            return NextResponse.json(
                { error: "Nicht autorisiert" },
                { status: 401 }
            );
        }

        // Nur Administratoren dürfen Mitarbeiter deaktivieren
        if (!session.user.isAdmin) {
            return NextResponse.json(
                { error: "Unzureichende Berechtigungen" },
                { status: 403 }
            );
        }

        // Mitarbeiter-ID sicher aus den Parametern extrahieren
        const id = context.params.id;

        if (!id) {
            return NextResponse.json(
                { error: "Keine gültige Mitarbeiter-ID" },
                { status: 400 }
            );
        }

        // Prüfen, ob Mitarbeiter existiert (mit minimalem Select für Performance)
        const existingMitarbeiter = await prisma.mitarbeiter.findUnique({
            where: { id },
            select: { id: true, istAktiv: true }
        });

        if (!existingMitarbeiter) {
            return NextResponse.json(
                { error: "Mitarbeiter nicht gefunden" },
                { status: 404 }
            );
        }

        // Prüfen, ob Mitarbeiter aktive Krankmeldungen hat (mit Count für Performance)
        const activeKrankmeldungenCount = await prisma.krankmeldung.count({
            where: {
                mitarbeiterId: id,
                status: "aktiv",
            },
        });

        if (activeKrankmeldungenCount > 0) {
            // Nur wenn Details benötigt werden, die vollen Datensätze abrufen
            const activeKrankmeldungen = await prisma.krankmeldung.findMany({
                where: {
                    mitarbeiterId: id,
                    status: "aktiv",
                },
                select: {
                    id: true,
                    startdatum: true,
                    enddatum: true
                }
            });

            return NextResponse.json(
                {
                    error: "Mitarbeiter kann nicht deaktiviert werden, da aktive Krankmeldungen vorliegen",
                    krankmeldungen: activeKrankmeldungen
                },
                { status: 400 }
            );
        }

        // Transaktion starten, um Mitarbeiter zu deaktivieren und Audit-Log zu erstellen
        await prisma.$transaction(async (tx) => {
            // Mitarbeiter deaktivieren
            await tx.mitarbeiter.update({
                where: { id },
                data: {
                    istAktiv: false,
                    aktualisiertAm: new Date(),
                },
            });

            // Audit-Log erstellen
            await tx.aenderungsLog.create({
                data: {
                    tabellenname: "Mitarbeiter",
                    datensatzId: id,
                    aktion: "DELETE",
                    alteWerte: JSON.stringify({
                        istAktiv: true,
                    }),
                    neueWerte: JSON.stringify({
                        istAktiv: false,
                    }),
                    benutzerId: session.user.id,
                    benutzerAgent: request.headers.get("user-agent") || null,
                    ipAdresse: request.headers.get("x-forwarded-for") ||
                        request.headers.get("x-real-ip") ||
                        "127.0.0.1",
                },
            });
        });

        // Alle Cache-Einträge für diesen Mitarbeiter und Listen invalidieren
        if (global.__prismaCache) {
            global.__prismaCache.delete(getCacheKey(id, false));
            global.__prismaCache.delete(getCacheKey(id, true));

            // Zusätzlich alle Mitarbeiterlisten-Caches löschen
            for (const key of global.__prismaCache.keys()) {
                if (key.startsWith('mitarbeiter-list-')) {
                    global.__prismaCache.delete(key);
                }
            }
        }

        // Erfolgreiche Antwort
        return NextResponse.json({
            message: "Mitarbeiter erfolgreich deaktiviert",
        });
    } catch (error) {
        console.error("Fehler beim Deaktivieren des Mitarbeiters:", error);
        return NextResponse.json(
            { error: "Ein Serverfehler ist aufgetreten" },
            { status: 500 }
        );
    }
}