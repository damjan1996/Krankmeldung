// middleware.ts - vereinfachte Version mit Weiterleitung
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Root path '/' sollte zur Login-Seite weiterleiten
    if (pathname === '/') {
        return NextResponse.redirect(new URL('/login', request.url));
    }

    // Öffentliche Routen - benötigen keine Authentifizierung
    const publicPaths = ['/login', '/api/auth'];
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