// app/api/test-db/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
    try {
        // Einfache Datenbankabfrage
        const userCount = await prisma.benutzer.count();
        return NextResponse.json({
            status: 'success',
            message: 'Datenbankverbindung erfolgreich',
            userCount
        });
    } catch (error) {
        console.error('Datenbankfehler:', error);
        return NextResponse.json({
            status: 'error',
            message: 'Datenbankverbindung fehlgeschlagen',
            error: String(error)
        }, { status: 500 });
    }
}