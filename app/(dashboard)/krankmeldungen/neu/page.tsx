// app/(dashboard)/krankmeldungen/neu/page.tsx

import { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";

import { authOptions } from "@/lib/auth";
import { prisma, fetchWithCache } from "@/lib/prisma";
import { NeueKrankmeldungClient } from "./client";

export const metadata: Metadata = {
    title: "Neue Krankmeldung - GFU Krankmeldungssystem",
    description: "Erfassen Sie eine neue Krankmeldung für einen Mitarbeiter",
};

/**
 * Server Component: Lädt Mitarbeiterdaten und überprüft Authentifizierung
 */
export default async function NeueKrankmeldungPage() {
    // Benutzer-Session für Zugriffsrechte prüfen
    const session = await getServerSession(authOptions);

    if (!session) {
        redirect("/login");
    }

    // Cache-Schlüssel für Mitarbeiterliste
    const mitarbeiterCacheKey = 'mitarbeiter-active-list';

    // Alle aktiven Mitarbeiter für die Mitarbeiterauswahl laden mit Caching
    const mitarbeiter = await fetchWithCache(
        mitarbeiterCacheKey,
        async () => {
            return prisma.mitarbeiter.findMany({
                where: { istAktiv: true },
                orderBy: { nachname: "asc" },
                select: {
                    id: true,
                    vorname: true,
                    nachname: true,
                    personalnummer: true,
                },
            });
        },
        30000 // 30 Sekunden Cache
    );

    return (
        <NeueKrankmeldungClient
            mitarbeiter={mitarbeiter}
            userId={session.user.id}
        />
    );
}