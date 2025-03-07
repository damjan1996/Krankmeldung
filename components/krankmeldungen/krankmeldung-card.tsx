// components/krankmeldungen/krankmeldung-card.tsx

import Link from "next/link";
import { format, differenceInDays } from "date-fns";
import { de } from "date-fns/locale";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarRange, Edit2, FilePen, FileText, User } from "lucide-react";

/**
 * Interface für Mitarbeiter in der Krankmeldungskarte
 */
interface MitarbeiterInfo {
    id: string;
    vorname: string;
    nachname: string;
    personalnummer: string;
}

/**
 * Interface für erstellt/aktualisiert von Benutzer
 */
interface BenutzerInfo {
    id: string;
    vorname: string | null;
    nachname: string | null;
    email: string;
}

/**
 * Interface für Krankmeldungsdaten
 */
interface KrankmeldungData {
    id: string;
    mitarbeiterId: string;
    mitarbeiter: MitarbeiterInfo;
    startdatum: Date | string;
    enddatum: Date | string;
    arztbesuchDatum?: Date | string | null;
    notizen?: string | null;
    status: "aktiv" | "abgeschlossen" | "storniert";
    erstelltVon: BenutzerInfo;
    erstelltAm: Date | string;
    aktualisiertVon?: BenutzerInfo | null;
    aktualisiertAm?: Date | string | null;
}

/**
 * Props für die KrankmeldungCard-Komponente
 */
interface KrankmeldungCardProps {
    krankmeldung: KrankmeldungData;
    variant?: "default" | "compact";
    showActions?: boolean;
    className?: string;
}

/**
 * Komponente zur Anzeige einer Krankmeldung als Karte
 */
export default function KrankmeldungCard({
                                             krankmeldung,
                                             variant = "default",
                                             showActions = true,
                                             className,
                                         }: KrankmeldungCardProps) {
    // Datumsformatierung und -konvertierung
    const startDate = new Date(krankmeldung.startdatum);
    const endDate = new Date(krankmeldung.enddatum);
    const arztbesuchDate = krankmeldung.arztbesuchDatum
        ? new Date(krankmeldung.arztbesuchDatum)
        : null;

    // Dauer in Tagen berechnen (+1 da inklusive Start- und Enddatum)
    const duration = differenceInDays(endDate, startDate) + 1;

    // Status-Badge-Variante bestimmen
    let statusVariant: "default" | "success" | "destructive" | "outline";

    // Direkt den korrekten Wert zuweisen, statt mit redundantem Default zu initialisieren
    switch (krankmeldung.status) {
        case "aktiv":
            statusVariant = "default";
            break;
        case "abgeschlossen":
            statusVariant = "success";
            break;
        case "storniert":
            statusVariant = "destructive";
            break;
        default:
            statusVariant = "outline";
    }

    // Formatierung des Benutzernamens
    const formatUserName = (user: BenutzerInfo | null | undefined) => {
        if (!user) return "-";
        return user.vorname && user.nachname
            ? `${user.vorname} ${user.nachname}`
            : user.email;
    };

    return (
        <Card className={cn(
            variant === "compact" ? "border-l-4" : "",
            variant === "compact" && krankmeldung.status === "aktiv" ? "border-l-blue-500" : "",
            variant === "compact" && krankmeldung.status === "abgeschlossen" ? "border-l-green-500" : "",
            variant === "compact" && krankmeldung.status === "storniert" ? "border-l-red-500" : "",
            className
        )}>
            <CardHeader className={cn(
                "flex flex-row items-start justify-between",
                variant === "compact" ? "px-4 py-3 pb-2" : ""
            )}>
                <div className="space-y-1">
                    <CardTitle className={cn(
                        "flex items-center gap-2",
                        variant === "compact" ? "text-base" : ""
                    )}>
                        <User className="h-4 w-4 text-muted-foreground" />
                        {krankmeldung.mitarbeiter.vorname} {krankmeldung.mitarbeiter.nachname}
                        <span className="text-xs font-normal text-muted-foreground">
              ({krankmeldung.mitarbeiter.personalnummer})
            </span>
                    </CardTitle>

                    {variant !== "compact" && (
                        <div className="text-sm text-muted-foreground flex items-center gap-1">
                            <CalendarRange className="h-3.5 w-3.5" />
                            <span>
                {format(startDate, "dd.MM.yyyy", { locale: de })} – {format(endDate, "dd.MM.yyyy", { locale: de })}
              </span>
                            <span className="px-1.5">•</span>
                            <span>{duration} {duration === 1 ? "Tag" : "Tage"}</span>
                        </div>
                    )}
                </div>

                <Badge variant={statusVariant}>
                    {krankmeldung.status}
                </Badge>
            </CardHeader>

            <CardContent className={cn(
                variant === "compact" ? "px-4 pt-0 pb-3" : ""
            )}>
                {variant === "compact" ? (
                    <div className="space-y-2">
                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                            <CalendarRange className="h-3.5 w-3.5" />
                            <span>
                {format(startDate, "dd.MM.yyyy", { locale: de })} – {format(endDate, "dd.MM.yyyy", { locale: de })}
              </span>
                            <span className="px-1">•</span>
                            <span>{duration} {duration === 1 ? "Tag" : "Tage"}</span>
                        </div>

                        {showActions && (
                            <div className="flex items-center gap-2 pt-1">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 px-2 text-xs"
                                    asChild
                                >
                                    <Link href={`/krankmeldungen/${krankmeldung.id}`}>
                                        <FileText className="h-3.5 w-3.5 mr-1" />
                                        Details
                                    </Link>
                                </Button>

                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 px-2 text-xs"
                                    asChild
                                >
                                    <Link href={`/krankmeldungen/${krankmeldung.id}/bearbeiten`}>
                                        <Edit2 className="h-3.5 w-3.5 mr-1" />
                                        Bearbeiten
                                    </Link>
                                </Button>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="space-y-4">
                        {/* Krankmeldungsdetails */}
                        <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                            <div>
                                <p className="text-xs font-medium text-muted-foreground">Startdatum</p>
                                <p className="text-sm">
                                    {format(startDate, "EEEE, dd. MMMM yyyy", { locale: de })}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs font-medium text-muted-foreground">Enddatum</p>
                                <p className="text-sm">
                                    {format(endDate, "EEEE, dd. MMMM yyyy", { locale: de })}
                                </p>
                            </div>

                            <div>
                                <p className="text-xs font-medium text-muted-foreground">Arztbesuch</p>
                                <p className="text-sm">
                                    {arztbesuchDate
                                        ? format(arztbesuchDate, "dd.MM.yyyy", { locale: de })
                                        : "Nicht angegeben"}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs font-medium text-muted-foreground">Zeitraum</p>
                                <p className="text-sm">{duration} {duration === 1 ? "Tag" : "Tage"}</p>
                            </div>
                        </div>

                        {/* Notizen (falls vorhanden) */}
                        {krankmeldung.notizen && (
                            <div>
                                <p className="text-xs font-medium text-muted-foreground mb-1">Notizen</p>
                                <p className="text-sm bg-muted p-2 rounded-md">
                                    {krankmeldung.notizen}
                                </p>
                            </div>
                        )}

                        {/* Metadaten (erstellt/aktualisiert) */}
                        <div className="border-t pt-3 text-xs text-muted-foreground space-y-1">
                            <div className="flex items-center justify-between">
                                <span>Erstellt von</span>
                                <span>{formatUserName(krankmeldung.erstelltVon)}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span>Erstellt am</span>
                                <span>
                  {format(new Date(krankmeldung.erstelltAm), "dd.MM.yyyy HH:mm", { locale: de })}
                </span>
                            </div>

                            {krankmeldung.aktualisiertAm && (
                                <>
                                    <div className="flex items-center justify-between">
                                        <span>Aktualisiert von</span>
                                        <span>{formatUserName(krankmeldung.aktualisiertVon)}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span>Aktualisiert am</span>
                                        <span>
                      {format(new Date(krankmeldung.aktualisiertAm), "dd.MM.yyyy HH:mm", { locale: de })}
                    </span>
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Aktionsbuttons */}
                        {showActions && (
                            <div className="flex items-center justify-end gap-2 pt-2">
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    asChild
                                >
                                    <Link href={`/krankmeldungen/${krankmeldung.id}`}>
                                        <FileText className="h-4 w-4 mr-1" />
                                        Details
                                    </Link>
                                </Button>

                                <Button
                                    variant="default"
                                    size="sm"
                                    asChild
                                >
                                    <Link href={`/krankmeldungen/${krankmeldung.id}/bearbeiten`}>
                                        <FilePen className="h-4 w-4 mr-1" />
                                        Bearbeiten
                                    </Link>
                                </Button>
                            </div>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}