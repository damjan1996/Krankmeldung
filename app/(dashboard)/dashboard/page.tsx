// app/(dashboard)/dashboard/page.tsx

import { Metadata } from "next";
import Link from "next/link";
import { getServerSession } from "next-auth/next";

import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { AktiveKrankmeldungen } from "@/components/dashboard/aktive-krankmeldungen";
import { RecentActivity } from "@/components/dashboard/recent-activity";
import { WelcomeBanner } from "@/components/dashboard/welcome-banner";
import { KrankmeldungStatusCard } from "@/components/dashboard/krankmeldung-status-card";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export const metadata: Metadata = {
    title: "Dashboard - GFU Krankmeldungssystem",
    description: "Übersicht und wichtige Kennzahlen",
};

/**
 * Dashboard-Hauptseite
 * Zeigt eine Übersicht mit Kennzahlen, aktiven Krankmeldungen und kürzlichen Aktivitäten
 */
export default async function DashboardPage() {
    // Benutzer-Session für personalisierte Anzeige laden
    const session = await getServerSession(authOptions);

    // Dashboard-Daten aus der Datenbank laden
    const [
        aktiveKrankmeldungenCount,
        abgeschlosseneKrankmeldungenCount,
        mitarbeiterCount,
        aktiveKrankmeldungen,
        recentActivity
    ] = await Promise.all([
        // Anzahl aktive Krankmeldungen
        prisma.krankmeldung.count({
            where: { status: "aktiv" },
        }),

        // Anzahl abgeschlossene Krankmeldungen
        prisma.krankmeldung.count({
            where: { status: "abgeschlossen" },
        }),

        // Anzahl aktiver Mitarbeiter
        prisma.mitarbeiter.count({
            where: { istAktiv: true },
        }),

        // Details der neuesten aktiven Krankmeldungen
        prisma.krankmeldung.findMany({
            where: { status: "aktiv" },
            orderBy: { startdatum: "desc" },
            take: 5, // Begrenze auf 5 Einträge für die Übersicht
            include: {
                mitarbeiter: {
                    select: {
                        vorname: true,
                        nachname: true,
                        personalnummer: true,
                    },
                },
            },
        }),

        // Kürzliche Aktivitäten im System
        prisma.aenderungsLog.findMany({
            orderBy: { erstelltAm: "desc" },
            take: 5, // Begrenze auf 5 Einträge für die Übersicht
            include: {
                benutzer: {
                    select: {
                        vorname: true,
                        nachname: true,
                        email: true,
                    },
                },
            },
        })
    ]);

    return (
        <div className="flex flex-col gap-6">
            {/* Willkommensbanner mit Benutzername */}
            <WelcomeBanner userName={session?.user?.name || "Benutzer"} />

            {/* Kennzahlenkarten */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <KrankmeldungStatusCard
                    title="Aktive Krankmeldungen"
                    value={aktiveKrankmeldungenCount}
                    description="Aktuell laufende Krankmeldungen"
                    className="bg-blue-50"
                />
                <KrankmeldungStatusCard
                    title="Abgeschlossene Krankmeldungen"
                    value={abgeschlosseneKrankmeldungenCount}
                    description="Bereits beendete Krankmeldungen"
                    className="bg-green-50"
                />
                <KrankmeldungStatusCard
                    title="Aktive Mitarbeiter"
                    value={mitarbeiterCount}
                    description="Anzahl aktiver Mitarbeiter"
                    className="bg-orange-50"
                />
            </div>

            {/* Detailbereiche: Aktive Krankmeldungen und Aktivitäten */}
            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle>Aktive Krankmeldungen</CardTitle>
                        <CardDescription>
                            Die neuesten laufenden Krankmeldungen im Überblick
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <AktiveKrankmeldungen krankmeldungen={aktiveKrankmeldungen} />
                        <div className="mt-4 flex justify-end">
                            <Link href="/krankmeldungen">
                                <Button variant="outline">Alle Krankmeldungen</Button>
                            </Link>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle>Letzte Aktivitäten</CardTitle>
                        <CardDescription>
                            Die neuesten Änderungen im System
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <RecentActivity activities={recentActivity} />
                    </CardContent>
                </Card>
            </div>

            {/* Schnellzugriff auf wichtige Funktionen */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle>Schnellzugriff</CardTitle>
                    <CardDescription>
                        Direkte Links zu den wichtigsten Funktionen
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-4">
                    <Link href="/krankmeldungen/neu">
                        <Button>Neue Krankmeldung</Button>
                    </Link>
                    <Link href="/krankmeldungen">
                        <Button variant="outline">Krankmeldungen verwalten</Button>
                    </Link>
                    <Link href="/mitarbeiter">
                        <Button variant="outline">Mitarbeiter anzeigen</Button>
                    </Link>
                </CardContent>
            </Card>
        </div>
    );
}