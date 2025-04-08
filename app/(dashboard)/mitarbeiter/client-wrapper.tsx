"use client";

import dynamic from "next/dynamic";
import { Suspense } from "react";

// Client-Komponente dynamisch importieren
const MitarbeiterClient = dynamic(() => import("./client"), { ssr: false });

// Definiere Typen für die Daten
type Mitarbeiter = {
    id: string;
    vorname: string;
    nachname: string;
    personalnummer: string;
    istAktiv: boolean;
    position: string | null;
};

type MitarbeiterData = {
    mitarbeiter: Mitarbeiter[];
    counts: {
        aktive: number;
        inaktive: number;
        gesamt: number;
    };
    user: {
        id: string;
        isAdmin: boolean;
    };
};

interface MitarbeiterClientWrapperProps {
    data: MitarbeiterData;
}

/**
 * Client-Wrapper-Komponente für die dynamische Einbindung der MitarbeiterClient-Komponente
 * Diese Komponente dient als Brücke zwischen Server- und Client-Komponenten
 */
export default function MitarbeiterClientWrapper({ data }: MitarbeiterClientWrapperProps) {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center py-10">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                <span className="ml-2">Lädt Mitarbeiterdaten...</span>
            </div>
        }>
            <MitarbeiterClient
                mitarbeiter={data.mitarbeiter}
                counts={data.counts}
                user={data.user}
            />
        </Suspense>
    );
}