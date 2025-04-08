"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { format, differenceInDays } from "date-fns";
import { de } from "date-fns/locale";

import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardHeader,
} from "@/components/ui/card";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, UserRound, ExternalLink, CalendarClock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";

// Typendefinitionen
interface Mitarbeiter {
    id: string;
    vorname: string;
    nachname: string;
    personalnummer: string;
}

interface Krankmeldung {
    id: string;
    startdatum: string;
    enddatum: string;
    status: "aktiv" | "abgeschlossen" | "storniert";
    mitarbeiter: Mitarbeiter;
}

interface Counts {
    aktiv: number;
    abgeschlossen: number;
    storniert: number;
    total: number;
}

type StatusFilter = "aktiv" | "abgeschlossen" | "storniert" | "alle";

/**
 * Dashboard-Hauptseite mit Krankmeldungsübersicht
 */
export default function DashboardPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { toast } = useToast();

    const [isLoading, setIsLoading] = useState(true);
    const [krankmeldungen, setKrankmeldungen] = useState<Krankmeldung[]>([]);
    const [counts, setCounts] = useState<Counts>({
        aktiv: 0,
        abgeschlossen: 0,
        storniert: 0,
        total: 0
    });

    // Get status from URL (default: aktiv)
    const statusFilter = (searchParams.get("status") as StatusFilter) || "aktiv";

    // Function to update status filter and navigate
    const updateStatusFilter = (value: StatusFilter) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set("status", value);
        router.push(`/dashboard?${params.toString()}`);
    };

    // Fetch Krankmeldungen
    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);

            try {
                // Fetch Krankmeldungen mit Status-Filter
                const krankmeldungenResponse = await fetch(`/api/krankmeldungen?status=${statusFilter}`);
                if (!krankmeldungenResponse.ok) {
                    throw new Error("Fehler beim Laden der Krankmeldungen");
                }
                const krankmeldungenData = await krankmeldungenResponse.json();

                // Update state
                setKrankmeldungen(krankmeldungenData.krankmeldungen || krankmeldungenData.data || []);

                // Update counts
                setCounts({
                    aktiv: krankmeldungenData.counts?.aktiv || 0,
                    abgeschlossen: krankmeldungenData.counts?.abgeschlossen || 0,
                    storniert: krankmeldungenData.counts?.storniert || 0,
                    total: krankmeldungenData.counts?.total || krankmeldungenData.meta?.total || 0
                });
            } catch (error) {
                console.error("Fehler:", error);
                toast({
                    title: "Fehler",
                    description: "Daten konnten nicht geladen werden.",
                    variant: "destructive",
                });
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [statusFilter, toast]);

    // Status-Labels
    const getStatusLabel = (status: StatusFilter): string => {
        switch(status) {
            case "aktiv": return "Aktive";
            case "abgeschlossen": return "Abgeschlossene";
            case "storniert": return "Stornierte";
            default: return "Alle";
        }
    };

    // Eigene Rendering-Funktion für Krankmeldungen im ursprünglichen Design
    const renderKrankmeldungen = () => {
        if (isLoading) {
            return (
                <div className="flex items-center justify-center py-10">
                    <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                    <span className="ml-2">Lädt Krankmeldungen...</span>
                </div>
            );
        }

        if (krankmeldungen.length === 0) {
            return (
                <div className="flex flex-col items-center justify-center h-[200px] rounded-md border border-dashed p-8 text-center">
                    <CalendarClock className="h-10 w-10 text-muted-foreground mb-3" />
                    <p className="text-sm font-medium text-muted-foreground mb-1">
                        Keine aktiven Krankmeldungen vorhanden
                    </p>
                    <p className="text-xs text-muted-foreground">
                        Aktuell sind keine Mitarbeiter krankgemeldet
                    </p>
                </div>
            );
        }

        // Heutiges Datum für Berechnungen
        const today = new Date();

        return krankmeldungen.map((krankmeldung) => {
            // Formatiere Datum im deutschen Format
            const startDate = new Date(krankmeldung.startdatum);
            const endDate = new Date(krankmeldung.enddatum);

            // Berechne die Gesamtdauer der Krankmeldung in Tagen (+1, da inklusive Anfang und Ende)
            const totalDuration = differenceInDays(endDate, startDate) + 1;

            // Berechne, wie viele Tage bereits vergangen sind, wenn Krankmeldung bereits begonnen hat
            const daysPassed = startDate <= today
                ? Math.min(differenceInDays(today, startDate) + 1, totalDuration)
                : 0;

            // Fortschritt in Prozent berechnen
            const progressPercent = Math.round((daysPassed / totalDuration) * 100);

            return (
                <div
                    key={krankmeldung.id}
                    className="grid grid-cols-4 px-6 py-4 border-b hover:bg-muted/50"
                >
                    <div className="font-medium whitespace-nowrap">
                        <Link
                            href={`/mitarbeiter/${krankmeldung.mitarbeiter.id}`}
                            className="hover:underline inline-flex items-center"
                        >
                            <UserRound className="h-3.5 w-3.5 text-muted-foreground mr-1.5" />
                            {krankmeldung.mitarbeiter.vorname} {krankmeldung.mitarbeiter.nachname}
                        </Link>
                        <div className="text-xs text-muted-foreground">
                            {krankmeldung.mitarbeiter.personalnummer}
                        </div>
                    </div>
                    <div className="whitespace-nowrap">
                        <div>
                            {format(startDate, "dd.MM.yyyy", { locale: de })} - {format(endDate, "dd.MM.yyyy", { locale: de })}
                        </div>
                        {/* Fortschrittsbalken */}
                        <div className="w-full bg-muted h-1.5 rounded-full mt-1.5 overflow-hidden">
                            <div
                                className="bg-primary h-full rounded-full"
                                style={{ width: `${progressPercent}%` }}
                            />
                        </div>
                    </div>
                    <div className="text-right whitespace-nowrap">
                        {totalDuration} {totalDuration === 1 ? "Tag" : "Tage"}
                    </div>
                    <div className="flex justify-between items-center">
                        <Badge
                            variant={krankmeldung.status === "aktiv" ? "default" : "secondary"}
                            className="font-normal whitespace-nowrap ml-auto"
                        >
                            {krankmeldung.status}
                        </Badge>
                        <Button
                            variant="ghost"
                            size="icon"
                            asChild
                            className="ml-2"
                        >
                            <Link href={`/krankmeldungen/${krankmeldung.id}`}>
                                <ExternalLink className="h-4 w-4" />
                                <span className="sr-only">Details anzeigen</span>
                            </Link>
                        </Button>
                    </div>
                </div>
            );
        });
    };

    return (
        <div className="space-y-4">
            {/* Krankmeldungsübersicht */}
            <Card>
                <CardHeader className="pb-2">
                    <div>
                        <h2 className="text-xl font-semibold">
                            Krankmeldungen
                        </h2>
                    </div>
                </CardHeader>
                <CardContent className="p-4 pb-0">
                    {/* Filter-Bereich */}
                    <div className="flex items-center justify-between mb-4 border-b pb-4">
                        <div>
                            <p className="text-sm font-medium">
                                {statusFilter === "alle"
                                    ? "Alle Krankmeldungen werden angezeigt"
                                    : `${getStatusLabel(statusFilter)} Krankmeldungen werden angezeigt`}
                            </p>
                        </div>

                        {/* Status-Filter als Dropdown */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm" className="h-8">
                                    Status: {getStatusLabel(statusFilter)}
                                    <ChevronDown className="ml-2 h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                    onClick={() => updateStatusFilter("aktiv")}
                                    className={statusFilter === "aktiv" ? "bg-muted" : ""}
                                >
                                    Aktiv ({counts.aktiv})
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={() => updateStatusFilter("abgeschlossen")}
                                    className={statusFilter === "abgeschlossen" ? "bg-muted" : ""}
                                >
                                    Abgeschlossen ({counts.abgeschlossen})
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={() => updateStatusFilter("storniert")}
                                    className={statusFilter === "storniert" ? "bg-muted" : ""}
                                >
                                    Storniert ({counts.storniert})
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={() => updateStatusFilter("alle")}
                                    className={statusFilter === "alle" ? "bg-muted" : ""}
                                >
                                    Alle ({counts.total})
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>

                    {/* Container mit fixierten Spaltenüberschriften und ursprünglichem Design */}
                    <div className="relative border rounded-md overflow-hidden">
                        {/* Fixierte Spaltenüberschriften */}
                        <div className="absolute top-0 left-0 right-0 z-10 bg-background border-b">
                            <div className="grid grid-cols-4 px-6 py-3">
                                <div className="font-medium">Mitarbeiter</div>
                                <div className="font-medium">Zeitraum</div>
                                <div className="font-medium text-right">Dauer</div>
                                <div className="font-medium text-right">Status</div>
                            </div>
                        </div>

                        {/* Scrollbarer Inhalt */}
                        <div
                            className="overflow-auto"
                            style={{
                                maxHeight: 'calc(100vh - 320px)',
                                paddingTop: '41px' // Exakte Höhe des Headers
                            }}
                        >
                            {renderKrankmeldungen()}
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}