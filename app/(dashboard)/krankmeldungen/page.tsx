"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { format } from "date-fns";
import { de } from "date-fns/locale";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { KrankmeldungenTabelle } from "@/components/krankmeldungen/krankmeldungen-tabelle";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";

export default function KrankmeldungenPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { toast } = useToast();

    const [isLoading, setIsLoading] = useState(true);
    const [krankmeldungen, setKrankmeldungen] = useState<any[]>([]);
    const [counts, setCounts] = useState({
        aktiv: 0,
        abgeschlossen: 0,
        storniert: 0,
        total: 0
    });

    // Get current filter values from URL
    const statusFilter = searchParams.get("status") || "alle";
    const zeitraumFilter = searchParams.get("zeitraum") || "alle";

    // Function to update filters and navigate
    const updateFilters = (key: string, value: string) => {
        const params = new URLSearchParams(searchParams.toString());
        if (value === "alle") {
            params.delete(key);
        } else {
            params.set(key, value);
        }
        router.push(`/krankmeldungen?${params.toString()}`);
    };

    // Fetch Krankmeldungen with filters
    useEffect(() => {
        // Declare fetchKrankmeldungen without async to avoid the Promise warning
        const fetchKrankmeldungen = () => {
            setIsLoading(true);

            // Build query parameters
            const params = new URLSearchParams();
            if (statusFilter !== "alle") {
                params.append("status", statusFilter);
            }

            // Handle zeitraum filter
            if (zeitraumFilter !== "alle") {
                const today = new Date();

                if (zeitraumFilter === "aktuell") {
                    params.append("startDate", today.toISOString().split('T')[0]);
                    params.append("endDate", today.toISOString().split('T')[0]);
                } else if (zeitraumFilter === "zukuenftig") {
                    const tomorrow = new Date(today);
                    tomorrow.setDate(tomorrow.getDate() + 1);
                    params.append("startDate", tomorrow.toISOString().split('T')[0]);
                } else if (zeitraumFilter === "vergangen") {
                    const yesterday = new Date(today);
                    yesterday.setDate(yesterday.getDate() - 1);
                    params.append("endDate", yesterday.toISOString().split('T')[0]);
                } else if (zeitraumFilter === "letzte30") {
                    const thirtyDaysAgo = new Date(today);
                    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                    params.append("startDate", thirtyDaysAgo.toISOString().split('T')[0]);
                    params.append("endDate", today.toISOString().split('T')[0]);
                }
            }

            // Fetch data with filters
            fetch(`/api/krankmeldungen?${params.toString()}`)
                .then(response => {
                    if (!response.ok) {
                        // Instead of throwing an error within the promise chain, we reject it
                        return Promise.reject("Fehler beim Laden der Krankmeldungen");
                    }
                    return response.json();
                })
                .then(data => {
                    // Update krankmeldungen array based on response structure
                    setKrankmeldungen(data.krankmeldungen || data.data || []);

                    // Update counts for tabs
                    setCounts({
                        aktiv: data.counts?.aktiv || 0,
                        abgeschlossen: data.counts?.abgeschlossen || 0,
                        storniert: data.counts?.storniert || 0,
                        total: data.counts?.total || data.meta?.total || 0
                    });
                })
                .catch(error => {
                    console.error("Fehler:", error);
                    toast({
                        title: "Fehler",
                        description: "Krankmeldungen konnten nicht geladen werden.",
                        variant: "destructive",
                    });
                })
                .finally(() => {
                    setIsLoading(false);
                });
        };

        fetchKrankmeldungen();
    }, [statusFilter, zeitraumFilter, toast]);

    // Format data for the table
    const formattedKrankmeldungen = krankmeldungen.map((krankmeldung) => ({
        id: krankmeldung.id,
        mitarbeiter: `${krankmeldung.mitarbeiter.vorname} ${krankmeldung.mitarbeiter.nachname}`,
        personalnummer: krankmeldung.mitarbeiter.personalnummer,
        startdatum: format(new Date(krankmeldung.startdatum), "dd.MM.yyyy", { locale: de }),
        enddatum: format(new Date(krankmeldung.enddatum), "dd.MM.yyyy", { locale: de }),
        dauer: Math.ceil(
            (new Date(krankmeldung.enddatum).getTime() - new Date(krankmeldung.startdatum).getTime())
            / (1000 * 60 * 60 * 24) + 1
        ),
        status: krankmeldung.status,
        erstelltVon: krankmeldung.erstelltVon?.vorname && krankmeldung.erstelltVon?.nachname
            ? `${krankmeldung.erstelltVon.vorname} ${krankmeldung.erstelltVon.nachname}`
            : krankmeldung.erstelltVon?.email || "-",
        erstelltAm: format(new Date(krankmeldung.erstelltAm), "dd.MM.yyyy HH:mm", { locale: de }),
    }));

    // Get descriptive text for current filters
    const getStatusText = () => {
        switch (statusFilter) {
            case "aktiv": return "Aktive Krankmeldungen";
            case "abgeschlossen": return "Abgeschlossene Krankmeldungen";
            case "storniert": return "Stornierte Krankmeldungen";
            default: return "Alle Krankmeldungen";
        }
    };

    const getZeitraumText = () => {
        switch (zeitraumFilter) {
            case "aktuell": return "Aktuelle Krankmeldungen";
            case "zukuenftig": return "Zukünftige Krankmeldungen";
            case "vergangen": return "Vergangene Krankmeldungen";
            case "letzte30": return "Letzte 30 Tage";
            default: return "Alle Zeiträume";
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Krankmeldungen</h1>
                    <p className="text-muted-foreground">
                        Übersicht und Verwaltung aller Krankmeldungen im System
                    </p>
                </div>
                <Link href="/krankmeldungen/neu">
                    <Button>Neue Krankmeldung</Button>
                </Link>
            </div>

            {/* Status-Tabs */}
            <Tabs value={statusFilter} onValueChange={(value) => updateFilters("status", value)} className="space-y-4">
                <TabsList>
                    <TabsTrigger value="alle">
                        Alle
                    </TabsTrigger>
                    <TabsTrigger value="aktiv">
                        Aktiv ({counts.aktiv})
                    </TabsTrigger>
                    <TabsTrigger value="abgeschlossen">
                        Abgeschlossen ({counts.abgeschlossen})
                    </TabsTrigger>
                    <TabsTrigger value="storniert">
                        Storniert ({counts.storniert})
                    </TabsTrigger>
                </TabsList>

                {/* Zeitraum-Filter */}
                <div className="flex flex-wrap gap-2 my-4">
                    <Button
                        variant={zeitraumFilter === "alle" ? "default" : "outline"}
                        size="sm"
                        onClick={() => updateFilters("zeitraum", "alle")}
                    >
                        Alle Zeiträume
                    </Button>
                    <Button
                        variant={zeitraumFilter === "aktuell" ? "default" : "outline"}
                        size="sm"
                        onClick={() => updateFilters("zeitraum", "aktuell")}
                    >
                        Aktuell
                    </Button>
                    <Button
                        variant={zeitraumFilter === "zukuenftig" ? "default" : "outline"}
                        size="sm"
                        onClick={() => updateFilters("zeitraum", "zukuenftig")}
                    >
                        Zukünftig
                    </Button>
                    <Button
                        variant={zeitraumFilter === "vergangen" ? "default" : "outline"}
                        size="sm"
                        onClick={() => updateFilters("zeitraum", "vergangen")}
                    >
                        Vergangen
                    </Button>
                    <Button
                        variant={zeitraumFilter === "letzte30" ? "default" : "outline"}
                        size="sm"
                        onClick={() => updateFilters("zeitraum", "letzte30")}
                    >
                        Letzte 30 Tage
                    </Button>
                </div>

                {/* Tabelle mit Daten */}
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle>
                            {getStatusText()}
                        </CardTitle>
                        <CardDescription>
                            {getZeitraumText()} • {formattedKrankmeldungen.length} Einträge gefunden
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <KrankmeldungenTabelle
                            data={formattedKrankmeldungen}
                            isLoading={isLoading}
                        />
                    </CardContent>
                </Card>
            </Tabs>
        </div>
    );
}