// app/(dashboard)/layout.tsx

import React from "react";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";

import { authOptions } from "@/lib/auth";
import { SiteHeader } from "@/components/layout/site-header";
import { SidebarNav } from "@/components/layout/sidebar-nav";

/**
 * Definition für das Dashboard Layout
 */
interface DashboardLayoutProps {
    children: React.ReactNode;
}

/**
 * Layout für den geschützten Dashboard-Bereich
 * Enthält Header, Sidebar und überprüft die Benutzerauthentifizierung
 */
export default async function DashboardLayout({
                                                  children,
                                              }: DashboardLayoutProps) {
    // Benutzer-Session für Zugriffsrechte prüfen
    const session = await getServerSession(authOptions);

    // Wenn nicht angemeldet, zur Login-Seite weiterleiten
    if (!session) {
        redirect("/login");
    }

    return (
        <div className="flex min-h-screen flex-col overflow-hidden">

            {/* Hauptinhalt mit Seitenleiste und Content-Bereich */}
            <div className="container flex-1 items-start overflow-hidden md:grid md:grid-cols-[220px_minmax(0,1fr)] md:gap-6 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-10">
                {/* Seitennavigation (links) */}
                <aside className="fixed top-14 z-30 -ml-2 hidden h-[calc(100vh-3.5rem)] w-full shrink-0 md:sticky md:block">
                    <SidebarNav className="py-6" />
                </aside>

                {/* Hauptinhalt (rechts) */}
                <main className="flex w-full flex-col overflow-hidden py-6">
                    {children}
                </main>
            </div>

            {/* Footer wurde entfernt, um mehr Platz für das Dashboard zu schaffen */}
        </div>
    );
}