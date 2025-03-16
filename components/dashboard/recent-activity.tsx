// components/dashboard/recent-activity.tsx

"use client";

import { useEffect, useReducer } from "react";
import Link from "next/link";
import { formatDistanceToNow, format } from "date-fns";
import { de } from "date-fns/locale";
import {
    Activity as ActivityIcon,
    FileCheck,
    FilePlus2,
    FilePen,
    FileX2,
    User,
    UserCheck,
    UserX
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

/**
 * Interface für einen Benutzer
 */
interface Benutzer {
    vorname: string | null;
    nachname: string | null;
    email: string;
}

/**
 * Interface für eine Aktivität
 */
interface ActivityItem {
    id: string;
    aktion: string;
    tabellenname: string;
    datensatzId: string;
    erstelltAm: Date;
    benutzer: Benutzer;
    alteWerte?: string | null;
    neueWerte?: string | null;
}

/**
 * Props für die RecentActivity-Komponente
 */
interface RecentActivityProps {
    activities: ActivityItem[];
    maxHeight?: number;
    showHeader?: boolean;
}

/**
 * Interface für formatierte Aktionsinformationen
 */
interface FormattedAction {
    icon: JSX.Element;
    text: string;
}

/**
 * Interface für Änderungswerte
 */
interface WerteObject {
    status?: string;
    [key: string]: any;
}

/**
 * Komponente zur Anzeige der letzten Aktivitäten im System
 */
export function RecentActivity({
                                   activities,
                                   maxHeight = 350,
                                   showHeader = false
                               }: RecentActivityProps) {
    // Für periodisches Re-Rendering mit useReducer (empfohlener Ansatz)
    const [, forceUpdate] = useReducer(x => x + 1, 0);

    // Regelmäßiges Update für relative Zeitangaben
    useEffect(() => {
        const interval = setInterval(() => {
            forceUpdate();
        }, 60000); // Jede Minute aktualisieren

        return () => clearInterval(interval);
    }, []);

    /**
     * Formatiert die Aktion für eine lesbarere Anzeige
     */
    const formatAction = (action: string, table: string, alteWerte: WerteObject | null, neueWerte: WerteObject | null): FormattedAction => {
        const tableMap: Record<string, string> = {
            "Krankmeldung": "Krankmeldung",
            "Mitarbeiter": "Mitarbeiter",
            "Benutzer": "Benutzer",
        };

        // Icon und Text basierend auf Aktion und Tabelle bestimmen
        let icon;
        let text;

        const tableName = tableMap[table] || table;

        if (action === "INSERT") {
            text = `${tableName} erstellt`;
            if (table === "Krankmeldung") {
                icon = <FilePlus2 className="h-4 w-4 text-green-600" />;
            } else if (table === "Mitarbeiter") {
                icon = <UserCheck className="h-4 w-4 text-green-600" />;
            } else {
                icon = <FilePlus2 className="h-4 w-4 text-green-600" />;
            }
        } else if (action === "UPDATE") {
            text = `${tableName} aktualisiert`;

            // Prüfen, ob es eine Statusänderung gab (besonders für Krankmeldungen)
            if (
                table === "Krankmeldung" &&
                alteWerte &&
                neueWerte &&
                alteWerte.status !== neueWerte.status
            ) {
                if (neueWerte.status === "abgeschlossen") {
                    text = `${tableName} abgeschlossen`;
                    icon = <FileCheck className="h-4 w-4 text-blue-600" />;
                } else if (neueWerte.status === "storniert") {
                    text = `${tableName} storniert`;
                    icon = <FileX2 className="h-4 w-4 text-red-600" />;
                } else {
                    icon = <FilePen className="h-4 w-4 text-amber-600" />;
                }
            } else {
                icon = <FilePen className="h-4 w-4 text-amber-600" />;
            }
        } else if (action === "DELETE") {
            text = `${tableName} gelöscht`;
            if (table === "Mitarbeiter") {
                icon = <UserX className="h-4 w-4 text-red-600" />;
            } else {
                icon = <FileX2 className="h-4 w-4 text-red-600" />;
            }
        } else if (action === "LOGIN") {
            text = "Benutzer angemeldet";
            icon = <User className="h-4 w-4 text-blue-600" />;
        } else {
            text = `${action} ${tableName}`;
            icon = <ActivityIcon className="h-4 w-4 text-gray-600" />;
        }

        return { icon, text };
    };

    /**
     * Formatiert einen Benutzernamen
     */
    const formatUserName = (user: Benutzer) => {
        if (user.vorname && user.nachname) {
            return `${user.vorname} ${user.nachname}`;
        }
        return user.email;
    };

    /**
     * Erstellt einen relativen Zeitstempel (z.B. "vor 5 Minuten")
     */
    const getRelativeTime = (date: Date) => {
        return formatDistanceToNow(new Date(date), {
            addSuffix: true,
            locale: de
        });
    };

    // Keine Aktivitäten vorhanden - Leere State anzeigen
    if (activities.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-[200px] rounded-md border border-dashed p-8 text-center">
                <ActivityIcon className="h-10 w-10 text-muted-foreground mb-3" />
                <p className="text-sm font-medium text-muted-foreground mb-1">
                    Keine Aktivitäten vorhanden
                </p>
                <p className="text-xs text-muted-foreground">
                    Es wurden noch keine Aktionen im System durchgeführt
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-4 h-full">
            {/* Optional: Header */}
            {showHeader && (
                <>
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-medium">Aktivitäten</h3>
                        <Button variant="ghost" size="sm">
                            Alle anzeigen
                        </Button>
                    </div>
                    <Separator />
                </>
            )}

            {/* Aktivitätenliste mit Scrollbereich */}
            <ScrollArea
                className={cn(
                    "pr-4 h-full",
                    maxHeight !== undefined && `max-h-[${maxHeight}px]`
                )}
            >
                <div className="space-y-3">
                    {activities.map((activity) => {
                        // Alte und neue Werte parsen
                        const alteWerte = activity.alteWerte ? JSON.parse(activity.alteWerte) : null;
                        const neueWerte = activity.neueWerte ? JSON.parse(activity.neueWerte) : null;

                        // Aktion formatieren
                        const { icon, text } = formatAction(
                            activity.aktion,
                            activity.tabellenname,
                            alteWerte,
                            neueWerte
                        );

                        // Ziel-URL bestimmen (falls möglich)
                        let targetUrl = "#";
                        if (activity.tabellenname === "Krankmeldung") {
                            targetUrl = `/krankmeldungen/${activity.datensatzId}`;
                        } else if (activity.tabellenname === "Mitarbeiter") {
                            targetUrl = `/mitarbeiter/${activity.datensatzId}`;
                        }

                        return (
                            <div
                                key={activity.id}
                                className="flex items-start gap-4 rounded-md border p-3 transition-colors hover:bg-muted/50"
                            >
                                {/* Icon für die Aktivität */}
                                <div className="mt-0.5">
                                    {icon}
                                </div>

                                {/* Aktivitätsdetails */}
                                <div className="flex-1 space-y-1">
                                    <div className="flex items-center justify-between">
                                        <p className="text-sm font-medium whitespace-nowrap">
                                            {text}
                                        </p>
                                        <time
                                            dateTime={new Date(activity.erstelltAm).toISOString()}
                                            className="text-xs text-muted-foreground whitespace-nowrap ml-2"
                                            title={format(new Date(activity.erstelltAm), "dd.MM.yyyy HH:mm:ss", { locale: de })}
                                        >
                                            {getRelativeTime(new Date(activity.erstelltAm))}
                                        </time>
                                    </div>

                                    <p className="text-xs text-muted-foreground">
                                        Durch {formatUserName(activity.benutzer)}
                                    </p>

                                    {/* Statusänderung bei Krankmeldungen anzeigen */}
                                    {activity.tabellenname === "Krankmeldung" &&
                                        activity.aktion === "UPDATE" &&
                                        alteWerte &&
                                        neueWerte &&
                                        alteWerte.status !== neueWerte.status && (
                                            <p className="text-xs">
                                                Status: <span className="line-through">{alteWerte.status}</span> → {neueWerte.status}
                                            </p>
                                        )}

                                    {/* Link zum Datensatz */}
                                    <div className="pt-1">
                                        <Button
                                            variant="link"
                                            size="sm"
                                            className="h-6 px-0 text-xs"
                                            asChild
                                        >
                                            <Link href={targetUrl}>
                                                Details anzeigen
                                            </Link>
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </ScrollArea>
        </div>
    );
}