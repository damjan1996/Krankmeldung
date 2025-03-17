// app/(dashboard)/krankmeldungen/[id]/bearbeiten/page.tsx

import { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";

import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import KrankmeldungBearbeitenClient from "./client";

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

    // Krankmeldungs-ID aus den URL-Parametern extrahieren (mit await)
    const paramsObj = await params;
    const id = paramsObj.id;

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

        // Krankmeldungsdaten für das Formular aufbereiten und Datumsformate für die Client-Komponente korrigieren
        const initialData = {
            id: krankmeldung.id,
            mitarbeiterId: krankmeldung.mitarbeiterId,
            startdatum: krankmeldung.startdatum.toISOString().split('T')[0], // Konvertieren zu YYYY-MM-DD String
            enddatum: krankmeldung.enddatum.toISOString().split('T')[0], // Konvertieren zu YYYY-MM-DD String
            arztbesuchDatum: krankmeldung.arztbesuchDatum ?
                krankmeldung.arztbesuchDatum.toISOString().split('T')[0] : undefined, // Konvertieren zu YYYY-MM-DD String wenn vorhanden
            notizen: krankmeldung.notizen || "",
            status: validStatus,
        };

        // Daten an die Client-Komponente übergeben
        return (
            <KrankmeldungBearbeitenClient
                krankmeldung={krankmeldung}
                mitarbeiter={mitarbeiter}
                initialData={initialData}
                userId={session.user.id}
            />
        );
    } catch (error) {
        console.error("Fehler beim Laden der Krankmeldung:", error);
        notFound();
    }
}