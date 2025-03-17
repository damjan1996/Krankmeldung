"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { KrankmeldungForm } from "@/components/krankmeldungen/krankmeldung-form";

interface Mitarbeiter {
    id: string;
    vorname: string;
    nachname: string;
    personalnummer: string;
}

interface NeueKrankmeldungClientProps {
    mitarbeiter: Mitarbeiter[];
    userId: string;
}

/**
 * Client Component: Verarbeitet Query-Parameter und rendert das Formular
 */
export function NeueKrankmeldungClient({ mitarbeiter, userId }: NeueKrankmeldungClientProps) {
    const searchParams = useSearchParams();
    const [mitarbeiterId, setMitarbeiterId] = useState("");
    const [selectedMitarbeiter, setSelectedMitarbeiter] = useState<Mitarbeiter | null>(null);

    // useEffect ist sicher für Client-Komponenten und ermöglicht den Zugriff auf searchParams
    useEffect(() => {
        // Mitarbeiter-ID aus der URL extrahieren
        const paramMitarbeiterId = searchParams.get("mitarbeiterId") || "";
        setMitarbeiterId(paramMitarbeiterId);

        // Ausgewählten Mitarbeiter finden
        if (paramMitarbeiterId) {
            const foundMitarbeiter = mitarbeiter.find(m => m.id === paramMitarbeiterId);
            setSelectedMitarbeiter(foundMitarbeiter || null);
        }
    }, [searchParams, mitarbeiter]);

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
                userId={userId}
                initialData={initialData}
                isEditing={false}
            />
        </div>
    );
}