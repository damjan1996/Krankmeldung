// app/page.tsx

import Link from "next/link";
import { getServerSession } from "next-auth/next";
import { ArrowRight, CheckCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { authOptions } from "@/lib/auth";

/**
 * Startseite der Anwendung
 * Zeigt eine einfache Landingpage mit Anmelde-/Dashboard-Optionen
 */
export default async function HomePage() {
    // Benutzer-Session für personalisierte Anzeige laden
    const session = await getServerSession(authOptions);

    return (
        <div className="flex min-h-screen flex-col">
            {/* Header/Navigation */}
            <header className="container z-40 bg-background">
                <div className="flex h-20 items-center justify-between py-6">
                    <div className="flex gap-6 md:gap-10">
                        <Link href="/" className="flex items-center space-x-2">
                            {/* Optional: Logo */}
                            {/* <Image src="/images/logo.svg" alt="GFU Logo" width={32} height={32} /> */}
                            <span className="hidden font-bold sm:inline-block">
                GFU Krankmeldungssystem
              </span>
                        </Link>
                    </div>
                    <nav>
                        {session ? (
                            <Link href="/dashboard">
                                <Button>Dashboard</Button>
                            </Link>
                        ) : (
                            <Link href="/login">
                                <Button>Anmelden</Button>
                            </Link>
                        )}
                    </nav>
                </div>
            </header>

            {/* Hauptinhalt */}
            <main className="flex-1">
                {/* Hero-Sektion */}
                <section className="space-y-6 pb-8 pt-6 md:pb-12 md:pt-10 lg:py-32">
                    <div className="container flex max-w-[64rem] flex-col items-center gap-4 text-center">
                        <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl md:text-6xl">
                            GFU Krankmeldungssystem
                        </h1>
                        <p className="max-w-[42rem] leading-normal text-muted-foreground sm:text-xl sm:leading-8">
                            Einfache und effiziente Verwaltung von Krankmeldungen für Ihr Unternehmen.
                            Behalten Sie den Überblick über Abwesenheiten mit unserem übersichtlichen System.
                        </p>
                        <div className="space-x-4">
                            {session ? (
                                <Link href="/dashboard">
                                    <Button size="lg" className="gap-1">
                                        Zum Dashboard
                                        <ArrowRight className="h-4 w-4" />
                                    </Button>
                                </Link>
                            ) : (
                                <Link href="/login">
                                    <Button size="lg">Anmelden</Button>
                                </Link>
                            )}
                        </div>
                    </div>
                </section>

                {/* Features-Sektion */}
                <section className="container space-y-6 py-8 md:py-12 lg:py-24">
                    <div className="mx-auto flex max-w-[58rem] flex-col items-center space-y-4 text-center">
                        <h2 className="text-3xl font-bold leading-[1.1] sm:text-3xl md:text-5xl">
                            Merkmale
                        </h2>
                        <p className="max-w-[85%] leading-normal text-muted-foreground sm:text-lg sm:leading-7">
                            Unser Krankmeldungssystem bietet alle Funktionen, die Sie für eine effiziente
                            Verwaltung von Abwesenheiten im Unternehmen benötigen.
                        </p>
                    </div>
                    <div className="mx-auto grid justify-center gap-4 sm:grid-cols-2 md:max-w-[64rem] md:grid-cols-3">
                        <div className="relative overflow-hidden rounded-lg border bg-background p-2">
                            <div className="flex h-[180px] flex-col justify-between rounded-md p-6">
                                <CheckCircle className="h-6 w-6 text-primary" />
                                <div className="space-y-2">
                                    <h3 className="font-bold">Effiziente Erfassung</h3>
                                    <p className="text-sm text-muted-foreground">
                                        Schnelle und einfache Erfassung von Krankmeldungen für alle Mitarbeiter.
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="relative overflow-hidden rounded-lg border bg-background p-2">
                            <div className="flex h-[180px] flex-col justify-between rounded-md p-6">
                                <CheckCircle className="h-6 w-6 text-primary" />
                                <div className="space-y-2">
                                    <h3 className="font-bold">Übersichtliche Verwaltung</h3>
                                    <p className="text-sm text-muted-foreground">
                                        Behalten Sie den Überblick über alle aktuellen und abgeschlossenen Krankmeldungen.
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="relative overflow-hidden rounded-lg border bg-background p-2">
                            <div className="flex h-[180px] flex-col justify-between rounded-md p-6">
                                <CheckCircle className="h-6 w-6 text-primary" />
                                <div className="space-y-2">
                                    <h3 className="font-bold">Zentraler Zugriff</h3>
                                    <p className="text-sm text-muted-foreground">
                                        Abteilungsübergreifender Zugriff auf Krankmeldungsdaten für berechtigte Benutzer.
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="relative overflow-hidden rounded-lg border bg-background p-2">
                            <div className="flex h-[180px] flex-col justify-between rounded-md p-6">
                                <CheckCircle className="h-6 w-6 text-primary" />
                                <div className="space-y-2">
                                    <h3 className="font-bold">Transparente Statusverfolgung</h3>
                                    <p className="text-sm text-muted-foreground">
                                        Verfolgen Sie den Status jeder Krankmeldung von aktiv bis abgeschlossen.
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="relative overflow-hidden rounded-lg border bg-background p-2">
                            <div className="flex h-[180px] flex-col justify-between rounded-md p-6">
                                <CheckCircle className="h-6 w-6 text-primary" />
                                <div className="space-y-2">
                                    <h3 className="font-bold">Mitarbeiterverwaltung</h3>
                                    <p className="text-sm text-muted-foreground">
                                        Einfache Verwaltung der Mitarbeiterdaten und deren Krankenhistorie.
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="relative overflow-hidden rounded-lg border bg-background p-2">
                            <div className="flex h-[180px] flex-col justify-between rounded-md p-6">
                                <CheckCircle className="h-6 w-6 text-primary" />
                                <div className="space-y-2">
                                    <h3 className="font-bold">Audit Trail</h3>
                                    <p className="text-sm text-muted-foreground">
                                        Volle Nachverfolgbarkeit aller Änderungen im System für maximale Transparenz.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Anmelde-CTA */}
                <section className="container py-8 md:py-12 lg:py-24">
                    <div className="mx-auto max-w-[58rem]">
                        <div className="rounded-lg bg-secondary p-8">
                            <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
                                <div className="max-w-[32rem] flex-1 space-y-2">
                                    <h3 className="text-xl font-bold sm:text-2xl">
                                        Bereit für ein effizientes Krankmeldungsmanagement?
                                    </h3>
                                    <p className="text-muted-foreground">
                                        Melden Sie sich jetzt an und beginnen Sie mit der einfachen Verwaltung von Krankmeldungen.
                                    </p>
                                </div>
                                <div className="flex flex-col gap-2 min-w-[150px]">
                                    {session ? (
                                        <Button size="lg" className="w-full" asChild>
                                            <Link href="/dashboard">Zum Dashboard</Link>
                                        </Button>
                                    ) : (
                                        <Button size="lg" className="w-full" asChild>
                                            <Link href="/login">Anmelden</Link>
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </main>
            {/* Footer */}
            <footer className="border-t py-6 md:py-0">
                <div className="container flex flex-col items-center justify-between gap-4 md:h-24 md:flex-row">
                    <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
                        &copy; {new Date().getFullYear()} GFU Krankmeldungssystem. Alle Rechte vorbehalten.
                    </p>
                </div>
            </footer>
        </div>
    );
}