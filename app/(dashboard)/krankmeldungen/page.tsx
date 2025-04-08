"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { format } from "date-fns";
import { de } from "date-fns/locale";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { Search, CalendarPlus, CalendarClock, ExternalLink, ChevronDown } from "lucide-react";

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
    notizen?: string;
}

interface Counts {
    aktiv: number;
    abgeschlossen: number;
    storniert: number;
    total: number;
}

type StatusFilter = "aktiv" | "abgeschlossen" | "storniert" | "alle";
type ZeitraumFilter = "alle" | "aktuell" | "zukuenftig" | "vergangen" | "letzte30";

export default function KrankmeldungenPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { toast } = useToast();

    const [isLoading, setIsLoading] = useState(true);
    const [krankmeldungen, setKrankmeldungen] = useState<Krankmeldung[]>([]);
    const [suchbegriff, setSuchbegriff] = useState("");
    const [counts, setCounts] = useState<Counts>({
        aktiv: 0,
        abgeschlossen: 0,
        storniert: 0,
        total: 0
    });

    // Get current filter values from URL
    const statusFilter = (searchParams.get("status") as StatusFilter) || "aktiv";
    const zeitraumFilter = (searchParams.get("zeitraum") as ZeitraumFilter) || "alle";

    // Function to update status filter and navigate
    const updateStatusFilter = (value: StatusFilter) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set("status", value);
        router.push(`/krankmeldungen?${params.toString()}`);
    };

    // Function to update zeitraum filter and navigate
    const updateZeitraumFilter = (value: ZeitraumFilter) => {
        const params = new URLSearchParams(searchParams.toString());
        if (value === "alle") {
            params.delete("zeitraum");
        } else {
            params.set("zeitraum", value);
        }
        router.push(`/krankmeldungen?${params.toString()}`);
    };

    // Fetch Krankmeldungen with filters
    useEffect(() => {
        const fetchKrankmeldungen = async () => {
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

            try {
                // Fetch data with filters
                const response = await fetch(`/api/krankmeldungen?${params.toString()}`);
                if (!response.ok) {
                    throw new Error("Fehler beim Laden der Krankmeldungen");
                }

                const data = await response.json();

                // Update krankmeldungen array based on response structure
                setKrankmeldungen(data.krankmeldungen || data.data || []);

                // Update counts for tabs
                setCounts({
                    aktiv: data.counts?.aktiv || 0,
                    abgeschlossen: data.counts?.abgeschlossen || 0,
                    storniert: data.counts?.storniert || 0,
                    total: data.counts?.total || data.meta?.total || 0
                });
            } catch (error) {
                console.error("Fehler:", error);
                toast({
                    title: "Fehler",
                    description: "Krankmeldungen konnten nicht geladen werden.",
                    variant: "destructive",
                });
            } finally {
                setIsLoading(false);
            }
        };

        fetchKrankmeldungen();
    }, [statusFilter, zeitraumFilter, toast]);

    // Krankmeldungen basierend auf Suchbegriff filtern
    const filteredKrankmeldungen = krankmeldungen.filter(km => {
        if (!suchbegriff) return true;

        const searchLower = suchbegriff.toLowerCase();
        return (
            `${km.mitarbeiter.vorname} ${km.mitarbeiter.nachname}`.toLowerCase().includes(searchLower) ||
            km.mitarbeiter.personalnummer.toLowerCase().includes(searchLower) ||
            (km.notizen && km.notizen.toLowerCase().includes(searchLower))
        );
    });

    // Status-Labels für Dropdown
    const getStatusLabel = (status: StatusFilter): string => {
        switch(status) {
            case "aktiv": return "Aktive";
            case "abgeschlossen": return "Abgeschlossene";
            case "storniert": return "Stornierte";
            default: return "Alle";
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-semibold">Krankmeldungen</h1>
                    <p className="text-sm text-muted-foreground">
                        Übersicht und Verwaltung aller Krankmeldungen im System
                    </p>
                </div>
                <Link href="/krankmeldungen/neu">
                    <Button>
                        <CalendarPlus className="mr-2 h-4 w-4" />
                        Neue Krankmeldung
                    </Button>
                </Link>
            </div>

            {/* Hauptkarte mit Krankmeldungen */}
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle>Krankmeldungen</CardTitle>
                </CardHeader>
                <CardContent className="p-4 pb-0">
                    {/* Filter-Bereich */}
                    <div className="flex items-center justify-between mb-4 border-b pb-4">
                        <div>
                            <p className="text-sm font-medium">
                                {getStatusLabel(statusFilter)} Krankmeldungen werden angezeigt
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

                    {/* Zeitraum-Filter */}
                    <div className="flex flex-wrap gap-2 my-4">
                        <Button
                            variant={zeitraumFilter === "alle" ? "default" : "outline"}
                            size="sm"
                            onClick={() => updateZeitraumFilter("alle")}
                        >
                            Alle Zeiträume
                        </Button>
                        <Button
                            variant={zeitraumFilter === "aktuell" ? "default" : "outline"}
                            size="sm"
                            onClick={() => updateZeitraumFilter("aktuell")}
                        >
                            Aktuell
                        </Button>
                        <Button
                            variant={zeitraumFilter === "zukuenftig" ? "default" : "outline"}
                            size="sm"
                            onClick={() => updateZeitraumFilter("zukuenftig")}
                        >
                            Zukünftig
                        </Button>
                        <Button
                            variant={zeitraumFilter === "vergangen" ? "default" : "outline"}
                            size="sm"
                            onClick={() => updateZeitraumFilter("vergangen")}
                        >
                            Vergangen
                        </Button>
                        <Button
                            variant={zeitraumFilter === "letzte30" ? "default" : "outline"}
                            size="sm"
                            onClick={() => updateZeitraumFilter("letzte30")}
                        >
                            Letzte 30 Tage
                        </Button>
                    </div>

                    {/* Suchfeld */}
                    <div className="flex justify-between items-center my-4">
                        <div className="relative max-w-sm">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                type="search"
                                placeholder="Nach Mitarbeiter oder Personalnummer suchen..."
                                className="pl-8"
                                value={suchbegriff}
                                onChange={(e) => setSuchbegriff(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Container mit fixierten Spaltenüberschriften und scrollbarem Inhalt */}
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

                        {/* Scrollbarer Inhalt mit Padding-Top für den Header */}
                        <div
                            className="overflow-auto"
                            style={{
                                maxHeight: 'calc(100vh - 320px)',
                                paddingTop: '41px' // Exakte Höhe des Headers
                            }}
                        >
                            {isLoading ? (
                                <div className="flex items-center justify-center py-10">
                                    <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                                    <span className="ml-2">Lädt Krankmeldungen...</span>
                                </div>
                            ) : filteredKrankmeldungen.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-[200px] rounded-md border border-dashed p-8 text-center">
                                    <CalendarClock className="h-10 w-10 text-muted-foreground mb-3" />
                                    <p className="text-sm font-medium text-muted-foreground mb-1">
                                        Keine Krankmeldungen gefunden
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        {suchbegriff ? "Versuchen Sie es mit einem anderen Suchbegriff." : "Es sind keine Krankmeldungen mit den aktuellen Filterkriterien vorhanden."}
                                    </p>
                                </div>
                            ) : (
                                // Krankmeldungsliste
                                filteredKrankmeldungen.map((krankmeldung) => {
                                    const startDate = new Date(krankmeldung.startdatum);
                                    const endDate = new Date(krankmeldung.enddatum);
                                    const durationInDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24) + 1);

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
                                                    {krankmeldung.mitarbeiter.vorname} {krankmeldung.mitarbeiter.nachname}
                                                </Link>
                                                <div className="text-xs text-muted-foreground">
                                                    {krankmeldung.mitarbeiter.personalnummer}
                                                </div>
                                            </div>
                                            <div className="whitespace-nowrap">
                                                {format(startDate, "dd.MM.yyyy", { locale: de })} - {format(endDate, "dd.MM.yyyy", { locale: de })}
                                            </div>
                                            <div className="text-right whitespace-nowrap">
                                                {durationInDays} {durationInDays === 1 ? "Tag" : "Tage"}
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
                                })
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}