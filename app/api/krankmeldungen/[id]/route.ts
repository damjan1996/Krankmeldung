// app/api/krankmeldungen/[id]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { z } from "zod";

import { authOptions } from "@/lib/auth";
import { prisma, fetchWithCache } from "@/lib/prisma";

// Cache-Schlüssel für Krankmeldungen erstellen
const getCacheKey = (id: string) => `krankmeldung-${id}`;

/**
 * Schema für Aktualisierung einer Krankmeldung
 */
const updateKrankmeldungSchema = z.object({
    mitarbeiterId: z.string().uuid(),
    startdatum: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).or(z.date()),
    enddatum: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).or(z.date()),
    arztbesuchDatum: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).or(z.date()).nullable().optional(),
    notizen: z.string().nullable().optional(),
    status: z.enum(["aktiv", "abgeschlossen", "storniert"]),
});

/**
 * GET-Handler: Einzelne Krankmeldung abrufen mit Caching
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

        // Krankmeldungs-ID aus Parametern extrahieren
        const id = context.params.id;
        const cacheKey = getCacheKey(id);

        // Krankmeldung mit Caching abrufen
        const krankmeldung = await fetchWithCache(
            cacheKey,
            async () => {
                return prisma.krankmeldung.findUnique({
                    where: { id },
                    include: {
                        mitarbeiter: {
                            select: {
                                id: true,
                                vorname: true,
                                nachname: true,
                                personalnummer: true,
                                position: true,
                                istAktiv: true,
                            },
                        },
                        erstelltVon: {
                            select: {
                                id: true,
                                email: true,
                                vorname: true,
                                nachname: true,
                            },
                        },
                        aktualisiertVon: {
                            select: {
                                id: true,
                                email: true,
                                vorname: true,
                                nachname: true,
                            },
                        },
                    },
                });
            },
            30000 // 30 Sekunden TTL
        );

        // Wenn keine Krankmeldung gefunden wurde, 404 zurückgeben
        if (!krankmeldung) {
            return NextResponse.json(
                { error: "Krankmeldung nicht gefunden" },
                { status: 404 }
            );
        }

        // Response mit Cache-Control-Header für optimale Browser-Caching
        const response = NextResponse.json(krankmeldung);
        response.headers.set('Cache-Control', 'private, max-age=30');
        return response;
    } catch (error) {
        console.error("Fehler beim Abrufen der Krankmeldung:", error);
        return NextResponse.json(
            { error: "Ein Serverfehler ist aufgetreten" },
            { status: 500 }
        );
    }
}

/**
 * PUT-Handler: Krankmeldung aktualisieren
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

        // Krankmeldungs-ID aus Parametern extrahieren
        const id = context.params.id;

        // Anfragedaten parsen
        const rawData = await request.json();

        // Daten gegen Schema validieren
        const validationResult = updateKrankmeldungSchema.safeParse(rawData);

        if (!validationResult.success) {
            return NextResponse.json(
                { error: "Ungültige Daten", details: validationResult.error },
                { status: 400 }
            );
        }

        const data = validationResult.data;

        // Prüfen, ob Krankmeldung existiert (mit minimaler Selektion für Performance)
        const existingKrankmeldung = await prisma.krankmeldung.findUnique({
            where: { id },
            select: {
                id: true,
                status: true,
                mitarbeiterId: true,
                startdatum: true,
                enddatum: true,
                arztbesuchDatum: true,
                notizen: true
            }
        });

        if (!existingKrankmeldung) {
            return NextResponse.json(
                { error: "Krankmeldung nicht gefunden" },
                { status: 404 }
            );
        }

        // Status-Änderungsprotokollierung vorbereiten
        const statusChanged = existingKrankmeldung.status !== data.status;

        // Datum-Felder korrekt formatieren
        const formattedData = {
            ...data,
            startdatum: new Date(data.startdatum),
            enddatum: new Date(data.enddatum),
            arztbesuchDatum: data.arztbesuchDatum ? new Date(data.arztbesuchDatum) : null,
            aktualisiertAm: new Date(),
            aktualisiertVonId: session.user.id,
        };

        // Audit-Log Daten vorbereiten
        const alteWerte = {
            mitarbeiterId: existingKrankmeldung.mitarbeiterId,
            startdatum: existingKrankmeldung.startdatum,
            enddatum: existingKrankmeldung.enddatum,
            arztbesuchDatum: existingKrankmeldung.arztbesuchDatum,
            notizen: existingKrankmeldung.notizen,
            status: existingKrankmeldung.status,
        };

        // Transaktion starten, um Krankmeldung zu aktualisieren und Audit-Log zu erstellen
        const result = await prisma.$transaction(async (tx) => {
            // Krankmeldung aktualisieren
            const updatedKrankmeldung = await tx.krankmeldung.update({
                where: { id },
                data: formattedData,
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
                    datensatzId: id,
                    aktion: "UPDATE",
                    alteWerte: JSON.stringify(alteWerte),
                    neueWerte: JSON.stringify({
                        mitarbeiterId: formattedData.mitarbeiterId,
                        startdatum: formattedData.startdatum,
                        enddatum: formattedData.enddatum,
                        arztbesuchDatum: formattedData.arztbesuchDatum,
                        notizen: formattedData.notizen,
                        status: formattedData.status,
                    }),
                    benutzerId: session.user.id,
                    benutzerAgent: request.headers.get("user-agent") || null,
                    ipAdresse: request.headers.get("x-forwarded-for") ||
                        request.headers.get("x-real-ip") ||
                        "127.0.0.1",
                },
            });

            return updatedKrankmeldung;
        });

        // Cache invalidieren nach Update
        global.__prismaCache?.delete(getCacheKey(id));

        // Erfolgreiche Antwort mit aktualisierten Daten
        return NextResponse.json({
            message: `Krankmeldung erfolgreich aktualisiert${statusChanged ? ` (Status: ${data.status})` : ''}`,
            krankmeldung: result,
        });
    } catch (error) {
        console.error("Fehler beim Aktualisieren der Krankmeldung:", error);
        return NextResponse.json(
            { error: "Ein Serverfehler ist aufgetreten" },
            { status: 500 }
        );
    }
}

/**
 * DELETE-Handler: Krankmeldung löschen (stornieren)
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

        // Nur Administratoren dürfen Krankmeldungen löschen
        if (!session.user.isAdmin) {
            return NextResponse.json(
                { error: "Unzureichende Berechtigungen" },
                { status: 403 }
            );
        }

        // Krankmeldungs-ID aus Parametern extrahieren
        const id = context.params.id;

        // Prüfen, ob Krankmeldung existiert (mit minimaler Selektion für Performance)
        const existingKrankmeldung = await prisma.krankmeldung.findUnique({
            where: { id },
            select: { id: true, status: true }
        });

        if (!existingKrankmeldung) {
            return NextResponse.json(
                { error: "Krankmeldung nicht gefunden" },
                { status: 404 }
            );
        }

        // Transaktion starten, um Krankmeldung zu stornieren und Audit-Log zu erstellen
        await prisma.$transaction(async (tx) => {
            // Krankmeldung auf "storniert" setzen (statt physischem Löschen)
            await tx.krankmeldung.update({
                where: { id },
                data: {
                    status: "storniert",
                    aktualisiertAm: new Date(),
                    aktualisiertVonId: session.user.id,
                },
            });

            // Audit-Log erstellen
            await tx.aenderungsLog.create({
                data: {
                    tabellenname: "Krankmeldung",
                    datensatzId: id,
                    aktion: "DELETE",
                    alteWerte: JSON.stringify({
                        status: existingKrankmeldung.status,
                    }),
                    neueWerte: JSON.stringify({
                        status: "storniert",
                    }),
                    benutzerId: session.user.id,
                    benutzerAgent: request.headers.get("user-agent") || null,
                    ipAdresse: request.headers.get("x-forwarded-for") ||
                        request.headers.get("x-real-ip") ||
                        "127.0.0.1",
                },
            });
        });

        // Cache invalidieren nach Stornierung
        global.__prismaCache?.delete(getCacheKey(id));

        // Erfolgreiche Antwort
        return NextResponse.json({
            message: "Krankmeldung erfolgreich storniert",
        });
    } catch (error) {
        console.error("Fehler beim Stornieren der Krankmeldung:", error);
        return NextResponse.json(
            { error: "Ein Serverfehler ist aufgetreten" },
            { status: 500 }
        );
    }
}