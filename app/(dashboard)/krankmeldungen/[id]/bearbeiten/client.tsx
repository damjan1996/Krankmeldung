"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { KrankmeldungForm } from "@/components/krankmeldungen/krankmeldung-form";

// Typen für die Props der Client-Komponente
interface KrankmeldungBearbeitenClientProps {
    krankmeldung: {
        id: string;
        mitarbeiter: {
            vorname: string;
            nachname: string;
        };
    };
    mitarbeiter: Array<{
        id: string;
        vorname: string;
        nachname: string;
        personalnummer: string;
    }>;
    initialData: {
        id: string;
        mitarbeiterId: string;
        startdatum: string; // Datum als ISO String (YYYY-MM-DD)
        enddatum: string; // Datum als ISO String (YYYY-MM-DD)
        arztbesuchDatum?: string; // Datum als ISO String (YYYY-MM-DD)
        notizen: string;
        status: "aktiv" | "abgeschlossen" | "storniert";
    };
    userId: string;
}

/**
 * Clientseitige Komponente für die Bearbeitungsseite
 * Rendert das UI und das Formular
 */
export default function KrankmeldungBearbeitenClient({
                                                         krankmeldung,
                                                         mitarbeiter,
                                                         initialData,
                                                         userId,
                                                     }: KrankmeldungBearbeitenClientProps) {
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
                    <Link href={`/krankmeldungen/${krankmeldung.id}`}>
                        <Button variant="outline">Abbrechen</Button>
                    </Link>
                </div>
            </div>

            {/* Krankmeldungsformular mit vorausgefüllten Daten */}
            <KrankmeldungForm
                mitarbeiter={mitarbeiter}
                userId={userId}
                initialData={initialData}
                isEditing={true}
            />
        </div>
    );
}