// app/(dashboard)/krankmeldungen/[id]/bearbeiten/page.tsx

import { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";

import { Button } from "@/components/ui/button";
import { KrankmeldungForm } from "@/components/krankmeldungen/krankmeldung-form";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export const metadata: Metadata = {
    title: "Krankmeldung bearbeiten - GFU Krankmeldungssystem",
    description: "Bestehende Krankmeldung bearbeiten",
};

/**
 * Seite zum Bearbeiten einer bestehenden Krankmeldung
 * Lädt die Krankmeldungsdaten und stellt ein Formular zum Bearbeiten bereit
 */
export default async function KrankmeldungBearbeitenPage({ params }: any) {
    // Benutzer-Session für Zugriffsrechte prüfen
    const session = await getServerSession(authOptions);

    if (!session) {
        redirect("/login");
    }

    // Krankmeldungs-ID aus den URL-Parametern extrahieren
    const { id } = params;

    try {
        // Krankmeldungsdaten aus der Datenbank laden
        const krankmeldung = await prisma.krankmeldung.findUnique({
            where: { id },
            include: {
                mitarbeiter: true,
            },
        });

        // Wenn keine Krankmeldung gefunden wurde, 404-Seite anzeigen
        if (!krankmeldung) {
            notFound();
        }

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

        // Status-Typ validieren und umwandeln
        const validStatus = ["aktiv", "abgeschlossen", "storniert"].includes(krankmeldung.status)
            ? krankmeldung.status as "aktiv" | "abgeschlossen" | "storniert"
            : "aktiv"; // Fallback, falls ungültiger Status

        // Krankmeldungsdaten für das Formular aufbereiten
        const initialData = {
            id: krankmeldung.id,
            mitarbeiterId: krankmeldung.mitarbeiterId,
            startdatum: krankmeldung.startdatum,
            enddatum: krankmeldung.enddatum,
            arztbesuchDatum: krankmeldung.arztbesuchDatum || undefined,
            notizen: krankmeldung.notizen || "",
            status: validStatus,
        };

        return (
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Krankmeldung bearbeiten</h1>
                        <p className="text-muted-foreground">
                            Aktualisieren Sie die Daten der Krankmeldung für {krankmeldung.mitarbeiter.vorname} {krankmeldung.mitarbeiter.nachname}
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Link href={`/krankmeldungen/${id}`}>
                            <Button variant="outline">Abbrechen</Button>
                        </Link>
                    </div>
                </div>

                {/* Krankmeldungsformular mit vorausgefüllten Daten */}
                <KrankmeldungForm
                    mitarbeiter={mitarbeiter}
                    userId={session.user.id}
                    initialData={initialData}
                    isEditing={true}
                />
            </div>
        );
    } catch (error) {
        console.error("Fehler beim Laden der Krankmeldung:", error);
        notFound();
    }
}