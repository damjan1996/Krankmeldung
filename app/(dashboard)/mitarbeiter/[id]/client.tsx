"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { de } from "date-fns/locale";

import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { KrankmeldungenTabelle } from "@/components/krankmeldungen/krankmeldungen-tabelle";

// Typen für Mitarbeiter und Krankmeldungen
interface Mitarbeiter {
    id: string;
    personalnummer: string;
    vorname: string;
    nachname: string;
    position: string | null;
    istAktiv: boolean;
    erstelltAm: Date;
    aktualisiertAm: Date | null;
}

interface ErstelltVon {
    vorname: string | null;
    nachname: string | null;
    email: string;
}

interface Krankmeldung {
    id: string;
    mitarbeiterId: string;
    startdatum: Date;
    enddatum: Date;
    status: "aktiv" | "abgeschlossen" | "storniert";
    erstelltVon: ErstelltVon;
    erstelltAm: Date;
    [key: string]: any; // Für sonstige Eigenschaften
}

// Interface übereinstimmend mit KrankmeldungenTabelle-Datenstruktur
interface KrankmeldungenTabelleDaten {
    id: string;
    mitarbeiter: string;
    personalnummer: string;
    startdatum: string;
    enddatum: string;
    dauer: number;
    status: "aktiv" | "abgeschlossen" | "storniert";
    erstelltVon: string;
    erstelltAm: string;
}

interface MitarbeiterDetailsClientProps {
    mitarbeiter: Mitarbeiter;
    krankmeldungen: any[]; // Verwende any[], da wir später eine Typumwandlung vornehmen
}

/**
 * Client Component für die Mitarbeiterdetailseite
 * Zeigt Mitarbeiterinformationen und Krankmeldungshistorie
 */
export function MitarbeiterDetailsClient({
                                             mitarbeiter,
                                             krankmeldungen
                                         }: MitarbeiterDetailsClientProps) {
    // State für gefilterte Krankmeldungsdaten
    const [alleKrankmeldungenData, setAlleKrankmeldungenData] = useState<KrankmeldungenTabelleDaten[]>([]);
    const [aktiveKrankmeldungenData, setAktiveKrankmeldungenData] = useState<KrankmeldungenTabelleDaten[]>([]);
    const [abgeschlosseneKrankmeldungenData, setAbgeschlosseneKrankmeldungenData] = useState<KrankmeldungenTabelleDaten[]>([]);
    const [stornierteKrankmeldungenData, setStornierteKrankmeldungenData] = useState<KrankmeldungenTabelleDaten[]>([]);
    const [krankmeldungsStats, setKrankmeldungsStats] = useState({
        total: 0,
        aktiv: 0,
        abgeschlossen: 0,
        storniert: 0,
        kranktage: 0
    });

    // Daten verarbeiten, wenn sie sich ändern
    useEffect(() => {
        // Sicherstellen, dass die Krankmeldungen den korrekten Statustyp haben
        const typedKrankmeldungen = krankmeldungen.map(km => {
            // Stellen Sie sicher, dass der Status einer der erlaubten Werte ist
            const status = ["aktiv", "abgeschlossen", "storniert"].includes(km.status)
                ? km.status as "aktiv" | "abgeschlossen" | "storniert"
                : "aktiv"; // Fallback zu "aktiv", falls unbekannter Status

            return { ...km, status };
        }) as Krankmeldung[];

        // Krankmeldungen nach Status filtern
        const aktive = typedKrankmeldungen.filter(k => k.status === "aktiv");
        const abgeschlossene = typedKrankmeldungen.filter(k => k.status === "abgeschlossen");
        const stornierte = typedKrankmeldungen.filter(k => k.status === "storniert");

        // Formatierte Daten für die Tabelle
        const formatKrankmeldungen = (krankmeldungen: Krankmeldung[]): KrankmeldungenTabelleDaten[] => {
            return krankmeldungen.map((krankmeldung) => ({
                id: krankmeldung.id,
                mitarbeiter: `${mitarbeiter.vorname} ${mitarbeiter.nachname}`,
                personalnummer: mitarbeiter.personalnummer,
                startdatum: format(new Date(krankmeldung.startdatum), "dd.MM.yyyy", { locale: de }),
                enddatum: format(new Date(krankmeldung.enddatum), "dd.MM.yyyy", { locale: de }),
                dauer: Math.ceil(
                    (new Date(krankmeldung.enddatum).getTime() - new Date(krankmeldung.startdatum).getTime())
                    / (1000 * 60 * 60 * 24) + 1
                ),
                status: krankmeldung.status,
                erstelltVon: krankmeldung.erstelltVon.vorname && krankmeldung.erstelltVon.nachname
                    ? `${krankmeldung.erstelltVon.vorname} ${krankmeldung.erstelltVon.nachname}`
                    : krankmeldung.erstelltVon.email,
                erstelltAm: format(new Date(krankmeldung.erstelltAm), "dd.MM.yyyy HH:mm", { locale: de }),
            }));
        };

        // Krankmeldungsstatistiken berechnen
        const stats = {
            total: typedKrankmeldungen.length,
            aktiv: aktive.length,
            abgeschlossen: abgeschlossene.length,
            storniert: stornierte.length,
            kranktage: typedKrankmeldungen
                .filter(k => k.status !== "storniert")
                .reduce((sum, k) => {
                    const dauer = Math.ceil(
                        (new Date(k.enddatum).getTime() - new Date(k.startdatum).getTime())
                        / (1000 * 60 * 60 * 24) + 1
                    );
                    return sum + dauer;
                }, 0),
        };

        // States aktualisieren
        setAlleKrankmeldungenData(formatKrankmeldungen(typedKrankmeldungen));
        setAktiveKrankmeldungenData(formatKrankmeldungen(aktive));
        setAbgeschlosseneKrankmeldungenData(formatKrankmeldungen(abgeschlossene));
        setStornierteKrankmeldungenData(formatKrankmeldungen(stornierte));
        setKrankmeldungsStats(stats);
    }, [mitarbeiter, krankmeldungen]);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Mitarbeiter: Details</h1>
                    <p className="text-muted-foreground">
                        Detailansicht und Krankenhistorie
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Link href="/mitarbeiter">
                        <Button variant="outline">Zurück zur Übersicht</Button>
                    </Link>
                    <Link href={`/krankmeldungen/neu?mitarbeiterId=${mitarbeiter.id}`}>
                        <Button>Neue Krankmeldung</Button>
                    </Link>
                </div>
            </div>

            {/* Mitarbeiterdetails */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                        <span>{mitarbeiter.vorname} {mitarbeiter.nachname}</span>
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            mitarbeiter.istAktiv ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                        }`}>
                            {mitarbeiter.istAktiv ? "Aktiv" : "Inaktiv"}
                        </span>
                    </CardTitle>
                    <CardDescription>
                        Personalnummer: {mitarbeiter.personalnummer}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Position</p>
                            <p>{mitarbeiter.position || "-"}</p>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Status</p>
                            <p>{mitarbeiter.istAktiv ? "Aktiv" : "Inaktiv"}</p>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Angelegt am</p>
                            <p>{format(new Date(mitarbeiter.erstelltAm), "dd.MM.yyyy", { locale: de })}</p>
                        </div>
                        {mitarbeiter.aktualisiertAm && (
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Zuletzt aktualisiert</p>
                                <p>{format(new Date(mitarbeiter.aktualisiertAm), "dd.MM.yyyy", { locale: de })}</p>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Krankmeldungsstatistiken */}
            <Card>
                <CardHeader>
                    <CardTitle>Krankmeldungsstatistik</CardTitle>
                    <CardDescription>
                        Übersicht der Krankmeldungen des Mitarbeiters
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="p-4 bg-blue-50 rounded-md">
                            <p className="text-sm font-medium text-muted-foreground">Aktive Krankmeldungen</p>
                            <p className="text-2xl font-bold">{krankmeldungsStats.aktiv}</p>
                        </div>
                        <div className="p-4 bg-green-50 rounded-md">
                            <p className="text-sm font-medium text-muted-foreground">Abgeschlossene</p>
                            <p className="text-2xl font-bold">{krankmeldungsStats.abgeschlossen}</p>
                        </div>
                        <div className="p-4 bg-red-50 rounded-md">
                            <p className="text-sm font-medium text-muted-foreground">Stornierte</p>
                            <p className="text-2xl font-bold">{krankmeldungsStats.storniert}</p>
                        </div>
                        <div className="p-4 bg-orange-50 rounded-md">
                            <p className="text-sm font-medium text-muted-foreground">Gesamte Kranktage</p>
                            <p className="text-2xl font-bold">{krankmeldungsStats.kranktage}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Krankmeldungstabellen */}
            <Card>
                <CardHeader>
                    <CardTitle>Krankmeldungshistorie</CardTitle>
                    <CardDescription>
                        Alle Krankmeldungen des Mitarbeiters
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Tabs defaultValue="alle">
                        <TabsList>
                            <TabsTrigger value="alle">
                                Alle ({krankmeldungsStats.total})
                            </TabsTrigger>
                            <TabsTrigger value="aktiv">
                                Aktiv ({krankmeldungsStats.aktiv})
                            </TabsTrigger>
                            <TabsTrigger value="abgeschlossen">
                                Abgeschlossen ({krankmeldungsStats.abgeschlossen})
                            </TabsTrigger>
                            <TabsTrigger value="storniert">
                                Storniert ({krankmeldungsStats.storniert})
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="alle" className="mt-4">
                            <KrankmeldungenTabelle data={alleKrankmeldungenData} />
                        </TabsContent>

                        <TabsContent value="aktiv" className="mt-4">
                            {aktiveKrankmeldungenData.length > 0 ? (
                                <KrankmeldungenTabelle data={aktiveKrankmeldungenData} />
                            ) : (
                                <div className="flex h-40 items-center justify-center rounded-md border border-dashed">
                                    <p className="text-muted-foreground">
                                        Keine aktiven Krankmeldungen vorhanden
                                    </p>
                                </div>
                            )}
                        </TabsContent>

                        <TabsContent value="abgeschlossen" className="mt-4">
                            {abgeschlosseneKrankmeldungenData.length > 0 ? (
                                <KrankmeldungenTabelle data={abgeschlosseneKrankmeldungenData} />
                            ) : (
                                <div className="flex h-40 items-center justify-center rounded-md border border-dashed">
                                    <p className="text-muted-foreground">
                                        Keine abgeschlossenen Krankmeldungen vorhanden
                                    </p>
                                </div>
                            )}
                        </TabsContent>

                        <TabsContent value="storniert" className="mt-4">
                            {stornierteKrankmeldungenData.length > 0 ? (
                                <KrankmeldungenTabelle data={stornierteKrankmeldungenData} />
                            ) : (
                                <div className="flex h-40 items-center justify-center rounded-md border border-dashed">
                                    <p className="text-muted-foreground">
                                        Keine stornierten Krankmeldungen vorhanden
                                    </p>
                                </div>
                            )}
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>
        </div>
    );
}