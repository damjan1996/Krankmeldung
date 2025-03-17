"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { MitarbeiterTabelle } from "@/components/mitarbeiter/mitarbeiter-tabelle";
import { useToast } from "@/components/ui/use-toast";

// Interface für die Mitarbeiterdaten-API-Rückgabe
interface MitarbeiterAPIData {
    id: string;
    personalnummer: string;
    vorname: string;
    nachname: string;
    position: string | null;
    istAktiv: boolean;
    _count?: {
        krankmeldungen: number;
    };
}

// Interface für die formatierten Tabellendaten
interface MitarbeiterTabelleDaten {
    id: string;
    personalnummer: string;
    name: string;
    vorname: string;
    nachname: string;
    position: string;
    istAktiv: boolean;
    status: "aktiv" | "inaktiv";
    aktiveKrankmeldungen: number;
}

interface MitarbeiterClientProps {
    userId: string;
    isAdmin: boolean;
    aktiveCount: number;
    inaktiveCount: number;
    totalCount: number;
}

/**
 * Client-Komponente für die Mitarbeiterübersicht
 * Verarbeitet URL-Parameter und rendert die Tabelle
 */
export function MitarbeiterClient({
                                      userId: _userId,
                                      isAdmin,
                                      aktiveCount: _aktiveCount,
                                      inaktiveCount: _inaktiveCount,
                                      totalCount: _totalCount
                                  }: MitarbeiterClientProps) {
    const _router = useRouter();
    const searchParams = useSearchParams();
    const { toast } = useToast();

    // Lokaler Zustand für Daten und Ladezustand
    const [isLoading, setIsLoading] = useState(true);
    const [mitarbeiterData, setMitarbeiterData] = useState<MitarbeiterTabelleDaten[]>([]);
    const [_filteredCount, setFilteredCount] = useState(0);

    // Status- und Suchfilter aus URL-Parametern extrahieren
    const status = searchParams.get('status') || 'aktiv';
    const suche = searchParams.get('suche') || '';

    // Daten laden, wenn URL-Parameter sich ändern
    useEffect(() => {
        const fetchMitarbeiter = async () => {
            setIsLoading(true);

            try {
                // API-URL mit Filtern erstellen
                const params = new URLSearchParams();

                // Filter für aktive/inaktive Mitarbeiter
                const istAktiv = status !== 'inaktiv';
                params.append('aktiv', String(istAktiv));

                // Suchfilter hinzufügen
                if (suche) {
                    params.append('suche', suche);
                }

                // Daten abrufen
                const response = await fetch(`/api/mitarbeiter?${params.toString()}`);

                if (!response.ok) {
                    throw new Error('Fehler beim Laden der Mitarbeiter');
                }

                const data = await response.json();

                // Daten formatieren mit korrekter Typprüfung
                const formattedData: MitarbeiterTabelleDaten[] = (data.data || []).map((ma: MitarbeiterAPIData) => ({
                    id: ma.id,
                    personalnummer: ma.personalnummer,
                    name: `${ma.vorname} ${ma.nachname}`,
                    vorname: ma.vorname,
                    nachname: ma.nachname,
                    position: ma.position || "-",
                    istAktiv: ma.istAktiv,
                    status: ma.istAktiv ? "aktiv" : "inaktiv" as "aktiv" | "inaktiv",
                    aktiveKrankmeldungen: ma._count?.krankmeldungen || 0
                }));

                setMitarbeiterData(formattedData);
                setFilteredCount(data.meta?.count || formattedData.length);
            } catch (error) {
                console.error('Fehler beim Laden der Mitarbeiter:', error);
                toast({
                    title: 'Fehler',
                    description: 'Mitarbeiter konnten nicht geladen werden',
                    variant: 'destructive'
                });

                // Standardwerte setzen im Fehlerfall
                setMitarbeiterData([]);
                setFilteredCount(0);
            } finally {
                setIsLoading(false);
            }
        };

        fetchMitarbeiter();
    }, [searchParams, toast, status, suche]);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Mitarbeiter</h1>
                    <p className="text-muted-foreground">
                        Verwalten Sie Mitarbeiter und deren Krankmeldungen
                    </p>
                </div>
                {isAdmin && (
                    <Link href="/mitarbeiter/neu">
                        <Button>Neuer Mitarbeiter</Button>
                    </Link>
                )}
            </div>

            {/* Mitarbeitertabelle mit Daten */}
            <MitarbeiterTabelle
                data={mitarbeiterData}
                showActions={true}
                showPagination={true}
                defaultPageSize={10}
                isLoading={isLoading}
            />
        </div>
    );
}