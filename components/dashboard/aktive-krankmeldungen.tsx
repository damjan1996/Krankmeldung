// components/dashboard/aktive-krankmeldungen.tsx

"use client";

import Link from "next/link";
import { format, differenceInDays } from "date-fns";
import { de } from "date-fns/locale";

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CalendarClock, ExternalLink, UserRound } from "lucide-react";

/**
 * Interface für einen Mitarbeiter in der Krankmeldung
 */
interface Mitarbeiter {
    id: string;
    vorname: string;
    nachname: string;
    personalnummer: string;
}

/**
 * Interface für eine Krankmeldung
 */
interface Krankmeldung {
    id: string;
    startdatum: Date;
    enddatum: Date;
    status: string;
    mitarbeiter: Mitarbeiter;
}

/**
 * Props für die AktiveKrankmeldungen-Komponente
 */
interface AktiveKrankmeldungenProps {
    krankmeldungen: Krankmeldung[];
    limit?: number;
    isLoading?: boolean;
    hideHeader?: boolean;
}

/**
 * Komponente zur Anzeige von aktiven Krankmeldungen
 * Wird im Dashboard verwendet, um die neuesten aktiven Krankmeldungen anzuzeigen
 */
export function AktiveKrankmeldungen({
                                         krankmeldungen,
                                         limit = 5,
                                         isLoading = false,
                                         hideHeader = false
                                     }: AktiveKrankmeldungenProps) {
    // Loading State
    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-10">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                <span className="ml-2">Lädt Krankmeldungen...</span>
            </div>
        );
    }

    // Keine Krankmeldungen vorhanden - Leere State anzeigen
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

    // Krankmeldungen auf das Limit begrenzen
    const displayedKrankmeldungen = limit ? krankmeldungen.slice(0, limit) : krankmeldungen;

    // Heutiges Datum für Berechnungen
    const today = new Date();

    // Wenn header versteckt werden soll, nur die Tabellenzeilen zurückgeben
    if (hideHeader) {
        return (
            <div className="space-y-1">
                {displayedKrankmeldungen.map((krankmeldung) => {
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
                })}

                {/* Weitere Krankmeldungen anzeigen, wenn limitiert und mehr vorhanden sind */}
                {limit && krankmeldungen.length > limit && (
                    <div className="flex justify-end">
                        <Button
                            variant="link"
                            size="sm"
                            className="text-xs"
                            asChild
                        >
                            <Link href="/krankmeldungen?status=aktiv">
                                {krankmeldungen.length - limit} weitere Krankmeldungen anzeigen
                            </Link>
                        </Button>
                    </div>
                )}
            </div>
        );
    }

    // Vollständige Tabelle mit Header zurückgeben
    return (
        <div className="space-y-1">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Mitarbeiter</TableHead>
                        <TableHead>Zeitraum</TableHead>
                        <TableHead className="text-right whitespace-nowrap">Dauer</TableHead>
                        <TableHead className="text-right">Status</TableHead>
                        <TableHead className="w-[60px]"></TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {displayedKrankmeldungen.map((krankmeldung) => {
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
                            <TableRow key={krankmeldung.id}>
                                <TableCell className="font-medium whitespace-nowrap">
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
                                </TableCell>
                                <TableCell className="whitespace-nowrap">
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
                                </TableCell>
                                <TableCell className="text-right whitespace-nowrap">
                                    {totalDuration} {totalDuration === 1 ? "Tag" : "Tage"}
                                </TableCell>
                                <TableCell className="text-right">
                                    <Badge
                                        variant={krankmeldung.status === "aktiv" ? "default" : "secondary"}
                                        className="font-normal whitespace-nowrap"
                                    >
                                        {krankmeldung.status}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        asChild
                                    >
                                        <Link href={`/krankmeldungen/${krankmeldung.id}`}>
                                            <ExternalLink className="h-4 w-4" />
                                            <span className="sr-only">Details anzeigen</span>
                                        </Link>
                                    </Button>
                                </TableCell>
                            </TableRow>
                        );
                    })}
                </TableBody>
            </Table>

            {/* Weitere Krankmeldungen anzeigen, wenn limitiert und mehr vorhanden sind */}
            {limit && krankmeldungen.length > limit && (
                <div className="flex justify-end">
                    <Button
                        variant="link"
                        size="sm"
                        className="text-xs"
                        asChild
                    >
                        <Link href="/krankmeldungen?status=aktiv">
                            {krankmeldungen.length - limit} weitere Krankmeldungen anzeigen
                        </Link>
                    </Button>
                </div>
            )}
        </div>
    );
}

// Stellen Sie sicher, dass diese Komponente auch als default export verfügbar ist
export default AktiveKrankmeldungen;