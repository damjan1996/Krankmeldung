// middleware.ts - vereinfachte Version
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Öffentliche Routen - benötigen keine Authentifizierung
    const publicPaths = ['/', '/login', '/api/auth'];
    const isPublicPath = publicPaths.some(path =>
        pathname === path || pathname.startsWith(`${path}/`)
    );

    if (isPublicPath) {
        return NextResponse.next();
    }

    // TEMPORÄR: Alle Anfragen durchlassen für Testzwecke
    // Dies deaktiviert die Auth-Prüfung vorübergehend
    return NextResponse.next();
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico).*)',
    ],
};