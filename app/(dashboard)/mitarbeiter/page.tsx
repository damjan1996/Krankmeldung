import { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Client-Komponente direkt importieren (ohne dynamic)
import MitarbeiterClientWrapper from "./client-wrapper";

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
    const [mitarbeiterData, aktiveCount, inaktiveCount] = await Promise.all([
        // Alle Mitarbeiter laden (wird client-seitig gefiltert)
        prisma.mitarbeiter.findMany({
            select: {
                id: true,
                vorname: true,
                nachname: true,
                personalnummer: true,
                istAktiv: true,
                position: true
                // Nur Felder selektieren, die gemäß Schema existieren
            },
            orderBy: {
                nachname: 'asc'
            }
        }),
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

    // Daten an die Client-Komponente übergeben
    const mitarbeiterProps = {
        mitarbeiter: mitarbeiterData,
        counts: {
            aktive: aktiveCount,
            inaktive: inaktiveCount,
            gesamt: aktiveCount + inaktiveCount
        },
        user: {
            id: session.user.id,
            isAdmin
        }
    };

    // Client-Wrapper-Komponente mit Daten rendern
    return <MitarbeiterClientWrapper data={mitarbeiterProps} />;
}