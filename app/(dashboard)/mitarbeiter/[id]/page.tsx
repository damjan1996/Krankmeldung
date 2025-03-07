// app/(dashboard)/mitarbeiter/[id]/page.tsx

import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
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
import prisma from "@/lib/prisma";

export const metadata: Metadata = {
    title: "Mitarbeiter Details - GFU Krankmeldungssystem",
    description: "Detailansicht eines Mitarbeiters und seiner Krankenhistorie",
};

/**
 * Detailseite für einen Mitarbeiter
 * Zeigt Mitarbeiterinformationen und Krankmeldungshistorie
 */
export default async function MitarbeiterDetailsPage({ params }: any) {
    // Mitarbeiter-ID aus den URL-Parametern extrahieren
    const { id } = params;

    try {
        // Mitarbeiterdaten aus der Datenbank laden
        const mitarbeiter = await prisma.mitarbeiter.findUnique({
            where: { id },
        });

        // Wenn kein Mitarbeiter gefunden wurde, 404-Seite anzeigen
        if (!mitarbeiter) {
            notFound();
        }

        // Alle Krankmeldungen des Mitarbeiters laden
        const alleKrankmeldungen = await prisma.krankmeldung.findMany({
            where: { mitarbeiterId: id },
            orderBy: { startdatum: "desc" },
            include: {
                erstelltVon: {
                    select: {
                        vorname: true,
                        nachname: true,
                        email: true,
                    },
                },
            },
        });

        // Krankmeldungen nach Status filtern
        const aktiveKrankmeldungen = alleKrankmeldungen.filter(k => k.status === "aktiv");
        const abgeschlosseneKrankmeldungen = alleKrankmeldungen.filter(k => k.status === "abgeschlossen");
        const stornierteKrankmeldungen = alleKrankmeldungen.filter(k => k.status === "storniert");

        // Formatierte Daten für die Tabelle
        const formatKrankmeldungen = (krankmeldungen: any[]) => {
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
        const krankmeldungsStats = {
            total: alleKrankmeldungen.length,
            aktiv: aktiveKrankmeldungen.length,
            abgeschlossen: abgeschlosseneKrankmeldungen.length,
            storniert: stornierteKrankmeldungen.length,
            kranktage: alleKrankmeldungen
                .filter(k => k.status !== "storniert")
                .reduce((sum, k) => {
                    const dauer = Math.ceil(
                        (new Date(k.enddatum).getTime() - new Date(k.startdatum).getTime())
                        / (1000 * 60 * 60 * 24) + 1
                    );
                    return sum + dauer;
                }, 0),
        };

        // Daten für alle Tabellen vorbereiten
        const alleKrankmeldungenData = formatKrankmeldungen(alleKrankmeldungen);
        const aktiveKrankmeldungenData = formatKrankmeldungen(aktiveKrankmeldungen);
        const abgeschlosseneKrankmeldungenData = formatKrankmeldungen(abgeschlosseneKrankmeldungen);
        const stornierteKrankmeldungenData = formatKrankmeldungen(stornierteKrankmeldungen);

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
                        <Link href={`/krankmeldungen/neu?mitarbeiterId=${id}`}>
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
    } catch (error) {
        console.error("Fehler beim Laden der Mitarbeiterdetails:", error);
        notFound();
    }
}