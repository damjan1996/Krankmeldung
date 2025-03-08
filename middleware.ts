import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

// Diese Middleware-Funktion wird bei allen Anfragen ausgeführt
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

    // Geschützte Routen - prüfen, ob der Benutzer authentifiziert ist
    const token = await getToken({
        req: request,
        secret: process.env.NEXTAUTH_SECRET,
    });

    // Wenn kein Token vorhanden ist, Umleitung zum Login
    if (!token) {
        const loginUrl = new URL('/login', request.url);
        loginUrl.searchParams.set('callbackUrl', encodeURI(request.url));
        return NextResponse.redirect(loginUrl);
    }

    // Admin-Routen - prüfen, ob der Benutzer ein Administrator ist
    const isAdminRoute = pathname.startsWith('/admin');
    if (isAdminRoute && !token.isAdmin) {
        // Wenn der Benutzer kein Administrator ist, Umleitung zum Dashboard
        return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    // Authentifizierter Benutzer - Anfrage fortsetzen
    return NextResponse.next();
}

// Konfiguration der Middleware: Auf welche Pfade soll sie angewendet werden?
export const config = {
    // Alle Pfade außer spezifischen statischen Dateien
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        '/((?!_next/static|_next/image|favicon.ico).*)',
    ],
};