"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { MitarbeiterDetailsClient } from "./client";

// Prüft, ob ein String eine gültige UUID ist
function isValidUUID(id: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(id);
}

interface MitarbeiterDetailsWrapperProps {
    mitarbeiterId: string; // Direkt die ID statt des serialisierten Objekts
    userId: string;
}

/**
 * Client-Wrapper, der die Parameter direkt als Props erhält
 * und dann die Daten lädt
 */
export function MitarbeiterDetailsWrapper({ mitarbeiterId, userId: _userId }: MitarbeiterDetailsWrapperProps) {
    const router = useRouter();
    const [mitarbeiter, setMitarbeiter] = useState<any>(null);
    const [krankmeldungen, setKrankmeldungen] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const loadData = async () => {
            try {
                setLoading(true);
                setError(null);

                // Validiere die Mitarbeiter-ID
                if (!mitarbeiterId || !isValidUUID(mitarbeiterId)) {
                    setError("Ungültige Mitarbeiter-ID");
                    setLoading(false);
                    return;
                }

                // Mitarbeiterdaten laden
                const mitarbeiterResponse = await fetch(
                    `/api/mitarbeiter/${mitarbeiterId}`
                );

                if (!mitarbeiterResponse.ok) {
                    if (mitarbeiterResponse.status === 404) {
                        router.push("/404");
                        return;
                    }
                    throw new Error("Fehler beim Laden des Mitarbeiters");
                }

                const mitarbeiterData = await mitarbeiterResponse.json();
                setMitarbeiter(mitarbeiterData);

                // Krankmeldungen des Mitarbeiters laden
                const krankmeldungenResponse = await fetch(
                    `/api/krankmeldungen?mitarbeiterId=${mitarbeiterData.id}`
                );

                if (!krankmeldungenResponse.ok) {
                    throw new Error("Fehler beim Laden der Krankmeldungen");
                }

                const krankmeldungenData = await krankmeldungenResponse.json();
                setKrankmeldungen(krankmeldungenData.krankmeldungen || []);
            } catch (err) {
                console.error("Fehler beim Laden der Daten:", err);
                setError(
                    err instanceof Error ? err.message : "Ein unerwarteter Fehler ist aufgetreten"
                );
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [mitarbeiterId, router]);

    // Ladeindikator anzeigen
    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
        );
    }

    // Fehlerbehandlung
    if (error) {
        return (
            <div className="p-4 bg-red-50 text-red-500 rounded-md">
                <h3 className="text-lg font-medium">Fehler beim Laden der Daten</h3>
                <p>{error}</p>
                <button
                    onClick={() => router.push("/mitarbeiter")}
                    className="mt-4 px-4 py-2 bg-red-100 text-red-600 rounded-md hover:bg-red-200"
                >
                    Zurück zur Übersicht
                </button>
            </div>
        );
    }

    // Wenn Daten geladen wurden, an die Client-Komponente übergeben
    if (mitarbeiter && krankmeldungen) {
        return (
            <MitarbeiterDetailsClient
                mitarbeiter={mitarbeiter}
                krankmeldungen={krankmeldungen}
            />
        );
    }

    // Sollte nicht erreicht werden, Fallback
    return null;
}