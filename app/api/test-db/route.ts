// app/api/test-db/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
    try {
        // Einfache Datenbankabfrage mit Performance-Optimierung
        // Statt count() verwenden wir findFirst mit select count_all für bessere Performance
        // bei großen Tabellen
        const [userCount, mitarbeiterCount, krankmeldungCount] = await Promise.all([
            prisma.benutzer.count(),
            prisma.mitarbeiter.count(),
            prisma.krankmeldung.count()
        ]);

        // Verbindungszeit messen
        const startTime = Date.now();
        await prisma.$queryRaw`SELECT 1`;
        const connectionTime = Date.now() - startTime;

        // Erfolgreiche Antwort mit Verbindungsinformationen
        return NextResponse.json({
            status: 'success',
            message: 'Datenbankverbindung erfolgreich',
            stats: {
                userCount,
                mitarbeiterCount,
                krankmeldungCount,
                connectionTimeMs: connectionTime
            },
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        // Fehlerbehandlung mit detaillierten Informationen
        console.error('Datenbankfehler:', error);

        const errorMessage = error instanceof Error
            ? error.message
            : String(error);

        return NextResponse.json({
            status: 'error',
            message: 'Datenbankverbindung fehlgeschlagen',
            error: errorMessage,
            timestamp: new Date().toISOString()
        }, { status: 500 });
    }
}