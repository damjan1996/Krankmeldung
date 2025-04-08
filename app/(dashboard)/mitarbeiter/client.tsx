"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
// Weitere Importe für die UI-Komponenten hier...
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

// Typdefinitionen für die Daten
interface Mitarbeiter {
    id: string;
    vorname: string;
    nachname: string;
    personalnummer: string;
    istAktiv: boolean;
    position: string | null;
}

interface MitarbeiterData {
    mitarbeiter: Mitarbeiter[];
    counts: {
        aktive: number;
        inaktive: number;
        gesamt: number;
    };
    user: {
        id: string;
        isAdmin: boolean;
    };
}

// Props für die Client-Komponente
interface MitarbeiterClientProps {
    mitarbeiter: Mitarbeiter[];
    counts: {
        aktive: number;
        inaktive: number;
        gesamt: number;
    };
    user: {
        id: string;
        isAdmin: boolean;
    };
}

/**
 * Client-Komponente für die Mitarbeiter-Übersicht
 * Akzeptiert Daten direkt über Props statt data-* Attribute
 */
export default function MitarbeiterClient({ mitarbeiter, counts, user }: MitarbeiterClientProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { toast } = useToast();

    // Status für die Komponente
    const [isLoading, setIsLoading] = useState(false);
    const [statusFilter, setStatusFilter] = useState<"aktiv" | "inaktiv" | "alle">(
        (searchParams.get("status") as "aktiv" | "inaktiv" | "alle") || "aktiv"
    );

    // Status-Filter aktualisieren und URL anpassen
    const updateStatusFilter = (value: "aktiv" | "inaktiv" | "alle") => {
        setStatusFilter(value);
        const params = new URLSearchParams(searchParams.toString());
        params.set("status", value);
        router.push(`/mitarbeiter?${params.toString()}`);
    };

    // Lade-Indikator anzeigen, wenn Daten noch nicht verfügbar sind
    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-10">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                <span className="ml-2">Lädt Mitarbeiterdaten...</span>
            </div>
        );
    }

    // Destrukturierung der Daten für einfacheren Zugriff
    const { isAdmin } = user;

    // Mitarbeiter nach Status filtern
    const filteredMitarbeiter = mitarbeiter.filter(ma =>
        statusFilter === "alle" ? true :
            statusFilter === "aktiv" ? ma.istAktiv :
                !ma.istAktiv
    );

    // Status-Labels für die UI
    const getStatusLabel = (status: "aktiv" | "inaktiv" | "alle"): string => {
        switch(status) {
            case "aktiv": return "Aktive";
            case "inaktiv": return "Inaktive";
            default: return "Alle";
        }
    };

    return (
        <div className="space-y-4">
            <Card>
                <CardHeader className="pb-2">
                    <div>
                        <h2 className="text-xl font-semibold">
                            Mitarbeiter
                        </h2>
                    </div>
                </CardHeader>
                <CardContent className="p-4 pb-0">
                    {/* Filter-Bereich */}
                    <div className="flex items-center justify-between mb-4 border-b pb-4">
                        <div>
                            <p className="text-sm font-medium">
                                {statusFilter === "alle"
                                    ? "Alle Mitarbeiter werden angezeigt"
                                    : `${getStatusLabel(statusFilter)} Mitarbeiter werden angezeigt`}
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
                                    Aktiv ({counts.aktive})
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={() => updateStatusFilter("inaktiv")}
                                    className={statusFilter === "inaktiv" ? "bg-muted" : ""}
                                >
                                    Inaktiv ({counts.inaktive})
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={() => updateStatusFilter("alle")}
                                    className={statusFilter === "alle" ? "bg-muted" : ""}
                                >
                                    Alle ({counts.gesamt})
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>

                    {/* Container mit fixierten Spaltenüberschriften */}
                    <div className="relative border rounded-md overflow-hidden">
                        {/* Fixierte Spaltenüberschriften */}
                        <div className="absolute top-0 left-0 right-0 z-10 bg-background border-b">
                            <div className="grid grid-cols-4 px-6 py-3">
                                <div className="font-medium">Name</div>
                                <div className="font-medium">Personalnummer</div>
                                <div className="font-medium">Position</div>
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
                            {filteredMitarbeiter.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-[200px] rounded-md border border-dashed p-8 text-center">
                                    <UserRound className="h-10 w-10 text-muted-foreground mb-3" />
                                    <p className="text-sm font-medium text-muted-foreground mb-1">
                                        Keine Mitarbeiter gefunden
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        Es wurden keine Mitarbeiter mit dem ausgewählten Filter gefunden
                                    </p>
                                </div>
                            ) : (
                                filteredMitarbeiter.map((ma) => (
                                    <div
                                        key={ma.id}
                                        className="grid grid-cols-4 px-6 py-4 border-b hover:bg-muted/50"
                                    >
                                        <div className="font-medium whitespace-nowrap">
                                            <Link
                                                href={`/mitarbeiter/${ma.id}`}
                                                className="hover:underline inline-flex items-center"
                                            >
                                                <UserRound className="h-3.5 w-3.5 text-muted-foreground mr-1.5" />
                                                {ma.vorname} {ma.nachname}
                                            </Link>
                                        </div>
                                        <div>{ma.personalnummer}</div>
                                        <div>{ma.position || '-'}</div>
                                        <div className="flex justify-end items-center">
                                            <Badge
                                                variant={ma.istAktiv ? "default" : "secondary"}
                                                className="font-normal whitespace-nowrap"
                                            >
                                                {ma.istAktiv ? 'Aktiv' : 'Inaktiv'}
                                            </Badge>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                asChild
                                                className="ml-2"
                                            >
                                                <Link href={`/mitarbeiter/${ma.id}`}>
                                                    <ExternalLink className="h-4 w-4" />
                                                    <span className="sr-only">Details anzeigen</span>
                                                </Link>
                                            </Button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}