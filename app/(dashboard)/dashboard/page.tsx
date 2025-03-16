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
        <div className="flex flex-col h-[calc(100vh-9rem)] overflow-hidden">
            {/* Willkommensbanner mit Benutzername */}
            <WelcomeBanner
                userName={session?.user?.name || "Benutzer"}
                krankmeldungCount={aktiveKrankmeldungenCount}
            />

            {/* Kennzahlenkarten */}
            <div className="grid gap-4 md:grid-cols-3 mt-4">
                <KrankmeldungStatusCard
                    title="Aktive Krankmeldungen"
                    value={aktiveKrankmeldungenCount}
                    description="Aktuell laufende Krankmeldungen"
                    icon="active"
                />
                <KrankmeldungStatusCard
                    title="Abgeschlossene Krankmeldungen"
                    value={abgeschlosseneKrankmeldungenCount}
                    description="Bereits beendete Krankmeldungen"
                    icon="completed"
                />
                <KrankmeldungStatusCard
                    title="Aktive Mitarbeiter"
                    value={mitarbeiterCount}
                    description="Anzahl aktiver Mitarbeiter"
                    icon="users"
                />
            </div>

            {/* Detailbereiche: Aktive Krankmeldungen und Aktivitäten */}
            <div className="grid gap-4 md:grid-cols-2 mt-4 flex-1 min-h-0">
                <Card className="flex flex-col overflow-hidden">
                    <CardHeader className="pb-2">
                        <CardTitle>Aktive Krankmeldungen</CardTitle>
                        <CardDescription>
                            Die neuesten laufenden Krankmeldungen im Überblick
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 overflow-auto pb-2">
                        <AktiveKrankmeldungen krankmeldungen={aktiveKrankmeldungen} />
                    </CardContent>
                    <div className="px-6 pb-4 pt-1 mt-auto">
                        <Link href="/krankmeldungen">
                            <Button variant="outline" size="sm" className="w-full">Alle Krankmeldungen</Button>
                        </Link>
                    </div>
                </Card>

                <Card className="flex flex-col overflow-hidden">
                    <CardHeader className="pb-2">
                        <CardTitle>Letzte Aktivitäten</CardTitle>
                        <CardDescription>
                            Die neuesten Änderungen im System
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 overflow-auto pb-2">
                        <RecentActivity activities={recentActivity} maxHeight={undefined} />
                    </CardContent>
                </Card>
            </div>

            {/* Schnellzugriff auf wichtige Funktionen */}
            <Card className="mt-4">
                <CardHeader className="py-2">
                    <CardTitle>Schnellzugriff</CardTitle>
                </CardHeader>
                <CardContent className="flex gap-4 pb-4">
                    <Link href="/krankmeldungen/neu">
                        <Button size="sm">Neue Krankmeldung</Button>
                    </Link>
                    <Link href="/krankmeldungen">
                        <Button variant="outline" size="sm">Krankmeldungen verwalten</Button>
                    </Link>
                    <Link href="/mitarbeiter">
                        <Button variant="outline" size="sm">Mitarbeiter anzeigen</Button>
                    </Link>
                </CardContent>
            </Card>
        </div>
    );
}