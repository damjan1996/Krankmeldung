// app/(dashboard)/krankmeldungen/[id]/page.tsx

import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import prisma from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";

// Define metadata directly without using generateMetadata function
export const metadata: Metadata = {
    title: "Krankmeldung Details - GFU Krankmeldungssystem",
    description: "Detailansicht einer Krankmeldung",
};

// Using any type to bypass TypeScript errors
export default async function KrankmeldungPage({ params }: any) {
    const id = params.id;

    function formatUserName(user: any) {
        if (user.vorname && user.nachname) {
            return `${user.vorname} ${user.nachname}`;
        }
        return user.email;
    }

    try {
        const krankmeldung = await prisma.krankmeldung.findUnique({
            where: { id },
            include: {
                mitarbeiter: true,
                erstelltVon: {
                    select: {
                        id: true,
                        email: true,
                        vorname: true,
                        nachname: true,
                    },
                },
                aktualisiertVon: {
                    select: {
                        id: true,
                        email: true,
                        vorname: true,
                        nachname: true,
                    },
                },
            },
        });

        if (!krankmeldung) {
            notFound();
        }

        const aenderungsLogs = await prisma.aenderungsLog.findMany({
            where: {
                datensatzId: id,
                tabellenname: "Krankmeldung"
            },
            orderBy: { erstelltAm: "desc" },
            include: {
                benutzer: {
                    select: {
                        vorname: true,
                        nachname: true,
                        email: true,
                    },
                },
            },
        });

        let statusClassName = "bg-gray-100 text-gray-800";
        if (krankmeldung.status === "aktiv") {
            statusClassName = "bg-blue-100 text-blue-800";
        } else if (krankmeldung.status === "abgeschlossen") {
            statusClassName = "bg-green-100 text-green-800";
        } else if (krankmeldung.status === "storniert") {
            statusClassName = "bg-red-100 text-red-800";
        }

        return (
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Krankmeldung: Details</h1>
                        <p className="text-muted-foreground">
                            Krankmeldung für {krankmeldung.mitarbeiter.vorname} {krankmeldung.mitarbeiter.nachname}
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Link href="/krankmeldungen">
                            <Button variant="outline">Zurück zur Übersicht</Button>
                        </Link>
                        <Link href={`/krankmeldungen/${id}/bearbeiten`}>
                            <Button>Bearbeiten</Button>
                        </Link>
                    </div>
                </div>

                {/* Hauptkarte mit Krankmeldungsdetails */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                            <span>Krankmeldung #{krankmeldung.id.substring(0, 8).toUpperCase()}</span>
                            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusClassName}`}>
                {krankmeldung.status}
              </span>
                        </CardTitle>
                        <CardDescription>
                            Erstellt am {format(new Date(krankmeldung.erstelltAm), "dd.MM.yyyy HH:mm", { locale: de })}
                            {" "}von {formatUserName(krankmeldung.erstelltVon)}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* Mitarbeiterdaten */}
                        <div className="rounded-md border p-4">
                            <h3 className="font-medium mb-2">Mitarbeiter</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Name</p>
                                    <p>
                                        {krankmeldung.mitarbeiter.vorname} {krankmeldung.mitarbeiter.nachname}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Personalnummer</p>
                                    <p>{krankmeldung.mitarbeiter.personalnummer}</p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Position</p>
                                    <p>{krankmeldung.mitarbeiter.position || "-"}</p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Status</p>
                                    <p>{krankmeldung.mitarbeiter.istAktiv ? "Aktiv" : "Inaktiv"}</p>
                                </div>
                            </div>
                            <div className="mt-2">
                                <Link href={`/mitarbeiter/${krankmeldung.mitarbeiterId}`}>
                                    <Button variant="link" className="h-auto p-0">Mitarbeiterprofil anzeigen</Button>
                                </Link>
                            </div>
                        </div>

                        {/* Krankmeldungszeitraum */}
                        <div className="rounded-md border p-4">
                            <h3 className="font-medium mb-2">Zeitraum</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Startdatum</p>
                                    <p>{format(new Date(krankmeldung.startdatum), "dd.MM.yyyy", { locale: de })}</p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Enddatum</p>
                                    <p>{format(new Date(krankmeldung.enddatum), "dd.MM.yyyy", { locale: de })}</p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Dauer</p>
                                    <p>
                                        {Math.ceil(
                                            (new Date(krankmeldung.enddatum).getTime() - new Date(krankmeldung.startdatum).getTime())
                                            / (1000 * 60 * 60 * 24) + 1
                                        )} Tage
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Arztbesuch</p>
                                    <p>
                                        {krankmeldung.arztbesuchDatum
                                            ? format(new Date(krankmeldung.arztbesuchDatum), "dd.MM.yyyy", { locale: de })
                                            : "-"}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Notizen */}
                        {krankmeldung.notizen && (
                            <div className="rounded-md border p-4">
                                <h3 className="font-medium mb-2">Notizen</h3>
                                <p className="whitespace-pre-line">{krankmeldung.notizen}</p>
                            </div>
                        )}

                        {/* Änderungsstatus */}
                        <div className="rounded-md border p-4">
                            <h3 className="font-medium mb-2">Status</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Aktueller Status</p>
                                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusClassName}`}>
                    {krankmeldung.status}
                  </span>
                                </div>
                                {krankmeldung.aktualisiertAm && (
                                    <>
                                        <div>
                                            <p className="text-sm font-medium text-muted-foreground">Letzte Aktualisierung</p>
                                            <p>{format(new Date(krankmeldung.aktualisiertAm), "dd.MM.yyyy HH:mm", { locale: de })}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-muted-foreground">Aktualisiert von</p>
                                            <p>{krankmeldung.aktualisiertVon ? formatUserName(krankmeldung.aktualisiertVon) : "-"}</p>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Änderungshistorie */}
                {aenderungsLogs.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Änderungshistorie</CardTitle>
                            <CardDescription>
                                Chronologische Übersicht aller Änderungen an dieser Krankmeldung
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {aenderungsLogs.map((log: any) => {
                                    const alteWerte = log.alteWerte ? JSON.parse(log.alteWerte) : {};
                                    const neueWerte = log.neueWerte ? JSON.parse(log.neueWerte) : {};

                                    return (
                                        <div key={log.id} className="rounded-md border p-4">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <h4 className="font-medium">
                                                        {log.aktion === "INSERT" && "Krankmeldung erstellt"}
                                                        {log.aktion === "UPDATE" && "Krankmeldung aktualisiert"}
                                                        {log.aktion === "DELETE" && "Krankmeldung gelöscht"}
                                                    </h4>
                                                    <p className="text-sm text-muted-foreground">
                                                        {format(new Date(log.erstelltAm), "dd.MM.yyyy HH:mm", { locale: de })} von {formatUserName(log.benutzer)}
                                                    </p>
                                                </div>
                                                {log.aktion === "UPDATE" && (
                                                    <div>
                                                        {alteWerte.status && neueWerte.status && alteWerte.status !== neueWerte.status && (
                                                            <div className="text-sm">
                                                                Status: <span className="line-through">{alteWerte.status}</span> → {neueWerte.status}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        );
    } catch (error) {
        console.error("Fehler beim Laden der Krankmeldungsdetails:", error);
        notFound();
    }
}