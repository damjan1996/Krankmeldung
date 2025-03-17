// app/(dashboard)/mitarbeiter/page.tsx

import { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { MitarbeiterClient } from "./client";

export const metadata: Metadata = {
    title: "Mitarbeiter - GFU Krankmeldungssystem",
    description: "Verwalten Sie alle Mitarbeiter im System",
};

/**
 * Mitarbeiter-Übersichtsseite (Server-Komponente)
 * Lädt Mitarbeiterdaten und überprüft Authentifizierung
 */
export default async function MitarbeiterPage() {
    // Benutzer-Session für Zugriffsrechte prüfen
    const session = await getServerSession(authOptions);

    if (!session) {
        redirect("/login");
    }

    // Parallele Datenbankabfragen für Performance-Optimierung
    const [aktiveCount, inaktiveCount] = await Promise.all([
        // Zählung aktiver Mitarbeiter
        prisma.mitarbeiter.count({
            where: { istAktiv: true }
        }),
        // Zählung inaktiver Mitarbeiter
        prisma.mitarbeiter.count({
            where: { istAktiv: false }
        })
    ]);

    // Benutzerrolle prüfen (für Admin-Funktionen)
    const isAdmin = Boolean(session.user.isAdmin);

    return (
        <MitarbeiterClient
            userId={session.user.id}
            isAdmin={isAdmin}
            aktiveCount={aktiveCount}
            inaktiveCount={inaktiveCount}
            totalCount={aktiveCount + inaktiveCount}
        />
    );
}