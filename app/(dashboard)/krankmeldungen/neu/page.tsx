// app/(dashboard)/krankmeldungen/neu/page.tsx

import { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";

import { Button } from "@/components/ui/button";
import { KrankmeldungForm } from "@/components/krankmeldungen/krankmeldung-form";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export const metadata: Metadata = {
    title: "Neue Krankmeldung - GFU Krankmeldungssystem",
    description: "Erfassen Sie eine neue Krankmeldung für einen Mitarbeiter",
};

/**
 * Seite zum Erstellen einer neuen Krankmeldung
 * Stellt ein Formular zur Erfassung einer neuen Krankmeldung bereit
 */
export default async function NeueKrankmeldungPage({ searchParams }: any) {
    // Benutzer-Session für Zugriffsrechte prüfen
    const session = await getServerSession(authOptions);

    if (!session) {
        redirect("/login");
    }

    // Extraktion des mitarbeiterId Parameters
    const mitarbeiterId = searchParams?.mitarbeiterId || "";

    // Alle aktiven Mitarbeiter für die Mitarbeiterauswahl laden
    const mitarbeiter = await prisma.mitarbeiter.findMany({
        where: { istAktiv: true },
        orderBy: { nachname: "asc" },
        select: {
            id: true,
            vorname: true,
            nachname: true,
            personalnummer: true,
        },
    });

    // Prüfen, ob die vorausgewählte Mitarbeiter-ID existiert
    let selectedMitarbeiter = null;
    if (mitarbeiterId) {
        selectedMitarbeiter = await prisma.mitarbeiter.findUnique({
            where: { id: mitarbeiterId },
            select: { vorname: true, nachname: true },
        });
    }

    // Grunddaten für das neue Krankmeldungsformular
    const initialData = {
        mitarbeiterId: mitarbeiterId || "",
        startdatum: new Date(),
        enddatum: new Date(new Date().setDate(new Date().getDate() + 7)), // Standard: 1 Woche Krankmeldung
        status: "aktiv" as const,
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Neue Krankmeldung</h1>
                    <p className="text-muted-foreground">
                        {selectedMitarbeiter
                            ? `Krankmeldung erfassen für ${selectedMitarbeiter.vorname} ${selectedMitarbeiter.nachname}`
                            : "Erfassen Sie eine neue Krankmeldung für einen Mitarbeiter"
                        }
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Link href="/krankmeldungen">
                        <Button variant="outline">Abbrechen</Button>
                    </Link>
                </div>
            </div>

            {/* Krankmeldungsformular */}
            <KrankmeldungForm
                mitarbeiter={mitarbeiter}
                userId={session.user.id}
                initialData={initialData}
                isEditing={false}
            />
        </div>
    );
}