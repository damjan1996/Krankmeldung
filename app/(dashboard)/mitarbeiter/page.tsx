// app/(dashboard)/mitarbeiter/page.tsx

import { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MitarbeiterTabelle } from "@/components/mitarbeiter/mitarbeiter-tabelle";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export const metadata: Metadata = {
    title: "Mitarbeiter - GFU Krankmeldungssystem",
    description: "Übersicht aller Mitarbeiter im System",
};

/**
 * Übersichtsseite für Mitarbeiter
 * Zeigt eine Liste aller Mitarbeiter mit Filtermöglichkeiten an
 */
export default async function MitarbeiterPage({ searchParams }: any) {
    // Benutzer-Session für Zugriffsrechte prüfen
    const session = await getServerSession(authOptions);

    if (!session) {
        redirect("/login");
    }

    // Status-Filter aus Query-Parametern extrahieren (istAktiv)
    const { status, suche } = searchParams;
    const istAktiv = status !== "inaktiv"; // Default ist "aktiv"

    // Filter für Datenbankabfrage aufbauen
    const filter: any = { istAktiv };

    // Suchfilter hinzufügen, wenn vorhanden
    if (suche) {
        filter.OR = [
            { vorname: { contains: suche, mode: 'insensitive' } },
            { nachname: { contains: suche, mode: 'insensitive' } },
            { personalnummer: { contains: suche, mode: 'insensitive' } },
            { position: { contains: suche, mode: 'insensitive' } },
        ];
    }

    // Mitarbeiterdaten aus der Datenbank laden
    const mitarbeiter = await prisma.mitarbeiter.findMany({
        where: filter,
        orderBy: [
            { nachname: "asc" },
            { vorname: "asc" },
        ],
        include: {
            krankmeldungen: {
                where: { status: "aktiv" },
                select: { id: true },
            },
        },
    });

    // Mitarbeiterstatistiken laden
    const [aktiveCount, inaktiveCount, mitAktivenKrankmeldungenCount] = await Promise.all([
        prisma.mitarbeiter.count({ where: { istAktiv: true } }),
        prisma.mitarbeiter.count({ where: { istAktiv: false } }),
        prisma.mitarbeiter.count({
            where: {
                istAktiv: true,
                krankmeldungen: {
                    some: { status: "aktiv" }
                }
            }
        })
    ]);

    // Typensichere Konvertierung des Status
    type MitarbeiterStatus = "aktiv" | "inaktiv";

    // Daten für die Tabelle formatieren
    const formattedMitarbeiter = mitarbeiter.map((m) => {
        // Sicherstellen, dass der Status ein gültiger Wert ist
        const status: MitarbeiterStatus = m.istAktiv ? "aktiv" : "inaktiv";

        return {
            id: m.id,
            personalnummer: m.personalnummer,
            name: `${m.vorname} ${m.nachname}`,
            position: m.position || "-",
            status,
            aktiveKrankmeldungen: m.krankmeldungen.length,
        };
    });

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Mitarbeiter</h1>
                    <p className="text-muted-foreground">
                        Übersicht aller Mitarbeiter im System
                    </p>
                </div>
                {session.user.isAdmin && (
                    <Button>Neuer Mitarbeiter</Button>
                )}
            </div>

            {/* Statistikkarten */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Aktive Mitarbeiter</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{aktiveCount}</div>
                        <p className="text-xs text-muted-foreground">
                            Mitarbeiter mit aktivem Status
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Inaktive Mitarbeiter</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{inaktiveCount}</div>
                        <p className="text-xs text-muted-foreground">
                            Mitarbeiter mit inaktivem Status
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Aktuell Krank</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{mitAktivenKrankmeldungenCount}</div>
                        <p className="text-xs text-muted-foreground">
                            Mitarbeiter mit aktiver Krankmeldung
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Mitarbeitertabelle mit Tabs für Status-Filter */}
            <Card>
                <CardHeader>
                    <CardTitle>Mitarbeiterliste</CardTitle>
                    <CardDescription>
                        Übersicht aller {istAktiv ? "aktiven" : "inaktiven"} Mitarbeiter
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Tabs defaultValue={istAktiv ? "aktiv" : "inaktiv"} className="space-y-4">
                        <TabsList>
                            <TabsTrigger value="aktiv" asChild>
                                <Link href="/mitarbeiter">
                                    Aktiv ({aktiveCount})
                                </Link>
                            </TabsTrigger>
                            <TabsTrigger value="inaktiv" asChild>
                                <Link href="/mitarbeiter?status=inaktiv">
                                    Inaktiv ({inaktiveCount})
                                </Link>
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value={istAktiv ? "aktiv" : "inaktiv"}>
                            <MitarbeiterTabelle data={formattedMitarbeiter} />
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>
        </div>
    );
}