// app/(auth)/layout.tsx

import React from "react";

/**
 * Layout für den Authentifizierungsbereich
 * Bietet ein einfaches, zentriertes Layout für Login und ggf. weitere Auth-Seiten
 */
export default function AuthLayout({
                                       children,
                                   }: {
    children: React.ReactNode;
}) {
    return (
        <div className="h-screen overflow-hidden bg-gray-50 flex flex-col justify-center">
            {/* Logo/Header-Bereich */}
            <div className="absolute top-4 left-4 flex items-center">
                {/* Optional: Logo hier platzieren */}
                {/* <Image src="/images/logo.svg" alt="GFU Logo" width={40} height={40} /> */}
                <span className="ml-2 text-xl font-bold text-primary">GFU</span>
            </div>

            {/* Hauptinhalt */}
            <div className="flex-1 flex flex-col justify-center">
                {/* auth-relatedter Inhalt (Login, etc.) */}
                {children}
            </div>

            {/* Footer */}
            <footer className="py-4 text-center text-sm text-gray-500">
                <p>
                    &copy; {new Date().getFullYear()} GFU Krankmeldungssystem. Alle Rechte vorbehalten.
                </p>
            </footer>
        </div>
    );
}