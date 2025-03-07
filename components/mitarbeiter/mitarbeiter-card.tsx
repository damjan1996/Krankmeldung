// components/mitarbeiter/mitarbeiter-card.tsx

import Link from "next/link";
import { format } from "date-fns";
import { de } from "date-fns/locale";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
    CalendarClock,
    CalendarPlus,
    // Removed unused imports
    ExternalLink,
    Mail,
    Phone,
    User
} from "lucide-react";

/**
 * Interface für die Krankmeldungen
 */
interface KrankmeldungInfo {
    id: string;
    startdatum: Date | string;
    enddatum: Date | string;
    status: string;
}

/**
 * Interface für Mitarbeiterdaten
 */
interface MitarbeiterData {
    id: string;
    personalnummer: string;
    vorname: string;
    nachname: string;
    position?: string | null;
    istAktiv: boolean;
    erstelltAm: Date | string;
    aktualisiertAm?: Date | string | null;
    abteilung?: string | null;
    email?: string | null;
    telefon?: string | null;
    krankmeldungen?: KrankmeldungInfo[];
}

/**
 * Props für die MitarbeiterCard Komponente
 */
interface MitarbeiterCardProps {
    mitarbeiter: MitarbeiterData;
    variant?: "default" | "compact" | "profile";
    showActions?: boolean;
    showKrankmeldungen?: boolean;
    maxKrankmeldungen?: number;
    className?: string;
}

/**
 * Komponente zur Anzeige einer Mitarbeiterkarte
 * @export
 */
function MitarbeiterCard({
                             mitarbeiter,
                             variant = "default",
                             showActions = true,
                             showKrankmeldungen = true,
                             maxKrankmeldungen = 3,
                             className,
                         }: MitarbeiterCardProps) {
    // Aktive Krankmeldungen ermitteln und begrenzen
    const aktiveKrankmeldungen = mitarbeiter.krankmeldungen
        ? mitarbeiter.krankmeldungen
            .filter(k => k.status === "aktiv")
            .sort((a, b) => new Date(b.startdatum).getTime() - new Date(a.startdatum).getTime())
            .slice(0, maxKrankmeldungen)
        : [];

    const hasActiveKrankmeldungen = aktiveKrankmeldungen.length > 0;

    // Variable Klassennamen je nach Variante
    const cardClassName = cn(
        variant === "compact" ? "border-l-4" : "",
        variant === "compact" && mitarbeiter.istAktiv ? "border-l-green-500" : "",
        variant === "compact" && !mitarbeiter.istAktiv ? "border-l-red-500" : "",
        className
    );

    // Formatierung von Daten je nach Variante
    const getFormattedDate = (date: Date | string) => {
        if (!date) return "-";

        if (variant === "compact") {
            return format(new Date(date), "dd.MM.yyyy", { locale: de });
        }

        return format(new Date(date), "dd. MMMM yyyy", { locale: de });
    };

    return (
        <Card className={cardClassName}>
            <CardHeader className={cn(
                "flex flex-row items-start justify-between",
                variant === "compact" ? "px-4 py-3 pb-2" : ""
            )}>
                <div className="space-y-1">
                    <CardTitle className={cn(
                        "flex items-center gap-2",
                        variant === "compact" ? "text-base" : "text-xl"
                    )}>
                        <User className="h-4 w-4 text-muted-foreground" />
                        {mitarbeiter.vorname} {mitarbeiter.nachname}
                        <span className="text-xs font-normal text-muted-foreground">
              ({mitarbeiter.personalnummer})
            </span>
                    </CardTitle>

                    {/* Position (in allen Varianten) */}
                    <p className="text-sm text-muted-foreground">
                        {mitarbeiter.position || "Keine Position angegeben"}
                    </p>
                </div>

                {/* Status-Badge */}
                <Badge variant={mitarbeiter.istAktiv ? "default" : "destructive"}>
                    {mitarbeiter.istAktiv ? "Aktiv" : "Inaktiv"}
                </Badge>
            </CardHeader>

            <CardContent className={cn(
                variant === "compact" ? "px-4 pt-0 pb-3" : ""
            )}>
                {variant === "compact" ? (
                    <div className="space-y-2">
                        {/* Kompakte Infos */}
                        {hasActiveKrankmeldungen && (
                            <div className="mt-1">
                                <Badge variant="secondary" className="gap-1">
                                    <CalendarClock className="h-3 w-3" />
                                    <span>
                    {aktiveKrankmeldungen.length} aktive Krankmeldung{aktiveKrankmeldungen.length !== 1 && "en"}
                  </span>
                                </Badge>
                            </div>
                        )}

                        {/* Aktionsbuttons in kompakter Variante */}
                        {showActions && (
                            <div className="flex gap-2 flex-wrap mt-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-7 px-2 text-xs gap-1"
                                    asChild
                                >
                                    <Link href={`/mitarbeiter/${mitarbeiter.id}`}>
                                        <User className="h-3.5 w-3.5" />
                                        <span>Profil</span>
                                    </Link>
                                </Button>

                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-7 px-2 text-xs gap-1"
                                    asChild
                                >
                                    <Link href={`/krankmeldungen/neu?mitarbeiterId=${mitarbeiter.id}`}>
                                        <CalendarPlus className="h-3.5 w-3.5" />
                                        <span>Krankmeldung</span>
                                    </Link>
                                </Button>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="space-y-4">
                        {/* Ausführliche Mitarbeiter-Informationen */}
                        <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                            <div>
                                <p className="text-xs font-medium text-muted-foreground">Personalnummer</p>
                                <p className="text-sm">{mitarbeiter.personalnummer}</p>
                            </div>
                            <div>
                                <p className="text-xs font-medium text-muted-foreground">Status</p>
                                <p className="text-sm">
                                    <Badge variant={mitarbeiter.istAktiv ? "outline" : "destructive"} className="mt-0.5">
                                        {mitarbeiter.istAktiv ? "Aktiv" : "Inaktiv"}
                                    </Badge>
                                </p>
                            </div>

                            <div>
                                <p className="text-xs font-medium text-muted-foreground">Position</p>
                                <p className="text-sm">{mitarbeiter.position || "-"}</p>
                            </div>
                            <div>
                                <p className="text-xs font-medium text-muted-foreground">Abteilung</p>
                                <p className="text-sm">{mitarbeiter.abteilung || "-"}</p>
                            </div>
                        </div>

                        {/* Kontaktinformationen (wenn vorhanden) */}
                        {(mitarbeiter.email || mitarbeiter.telefon) && (
                            <>
                                <Separator />
                                <div className="space-y-2">
                                    <p className="text-xs font-medium text-muted-foreground">Kontaktdaten</p>
                                    {mitarbeiter.email && (
                                        <div className="flex items-center gap-2">
                                            <Mail className="h-4 w-4 text-muted-foreground" />
                                            <a
                                                href={`mailto:${mitarbeiter.email}`}
                                                className="text-sm hover:underline"
                                            >
                                                {mitarbeiter.email}
                                            </a>
                                        </div>
                                    )}
                                    {mitarbeiter.telefon && (
                                        <div className="flex items-center gap-2">
                                            <Phone className="h-4 w-4 text-muted-foreground" />
                                            <a
                                                href={`tel:${mitarbeiter.telefon}`}
                                                className="text-sm hover:underline"
                                            >
                                                {mitarbeiter.telefon}
                                            </a>
                                        </div>
                                    )}
                                </div>
                            </>
                        )}

                        {/* Aktive Krankmeldungen */}
                        {showKrankmeldungen && (
                            <>
                                <Separator />
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <p className="text-xs font-medium text-muted-foreground">
                                            Aktive Krankmeldungen
                                        </p>
                                        {hasActiveKrankmeldungen && mitarbeiter.krankmeldungen && aktiveKrankmeldungen.length < mitarbeiter.krankmeldungen.length && (
                                            <Badge variant="outline" className="text-xs font-normal">
                                                {aktiveKrankmeldungen.length}/{mitarbeiter.krankmeldungen.filter(k => k.status === "aktiv").length}
                                            </Badge>
                                        )}
                                    </div>

                                    {hasActiveKrankmeldungen ? (
                                        <div className="space-y-2">
                                            {aktiveKrankmeldungen.map((krankmeldung, index) => (
                                                <div
                                                    key={krankmeldung.id}
                                                    className={cn(
                                                        "text-sm p-2 rounded-md border",
                                                        index === 0 ? "bg-muted/50" : ""
                                                    )}
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-1.5">
                                                            <CalendarClock className="h-3.5 w-3.5 text-muted-foreground" />
                                                            <span>
                                {getFormattedDate(krankmeldung.startdatum)} - {getFormattedDate(krankmeldung.enddatum)}
                              </span>
                                                        </div>
                                                        <Link
                                                            href={`/krankmeldungen/${krankmeldung.id}`}
                                                            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                                                        >
                                                            <ExternalLink className="h-3 w-3" />
                                                        </Link>
                                                    </div>
                                                </div>
                                            ))}

                                            {/* Mehr anzeigen Link, wenn weitere Krankmeldungen vorhanden sind */}
                                            {mitarbeiter.krankmeldungen &&
                                                mitarbeiter.krankmeldungen.filter(k => k.status === "aktiv").length > maxKrankmeldungen && (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="w-full text-xs h-7 mt-1"
                                                        asChild
                                                    >
                                                        <Link href={`/mitarbeiter/${mitarbeiter.id}?tab=krankmeldungen`}>
                                                            {mitarbeiter.krankmeldungen.filter(k => k.status === "aktiv").length - maxKrankmeldungen} weitere anzeigen...
                                                        </Link>
                                                    </Button>
                                                )}
                                        </div>
                                    ) : (
                                        <div className="text-sm text-center p-2 rounded-md border border-dashed">
                                            Keine aktiven Krankmeldungen
                                        </div>
                                    )}
                                </div>
                            </>
                        )}

                        {/* Metadaten (erstellt/aktualisiert) - nur in der Profile-Variante */}
                        {variant === "profile" && (
                            <>
                                <Separator />
                                <div className="text-xs text-muted-foreground space-y-1">
                                    <div className="flex items-center justify-between">
                                        <span>Erstellt am</span>
                                        <span>{getFormattedDate(mitarbeiter.erstelltAm)}</span>
                                    </div>

                                    {mitarbeiter.aktualisiertAm && (
                                        <div className="flex items-center justify-between">
                                            <span>Aktualisiert am</span>
                                            <span>{getFormattedDate(mitarbeiter.aktualisiertAm)}</span>
                                        </div>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                )}
            </CardContent>

            {/* Aktionsbuttons (in der Standardvariante am unteren Rand) */}
            {showActions && variant !== "compact" && (
                <CardFooter className={cn(
                    "flex justify-end gap-2 pt-0",
                    variant === "profile" ? "pt-2" : ""
                )}>
                    <Button
                        variant="outline"
                        size="sm"
                        asChild
                    >
                        <Link href={`/mitarbeiter/${mitarbeiter.id}`}>
                            <User className="mr-1 h-4 w-4" />
                            <span>Profil anzeigen</span>
                        </Link>
                    </Button>

                    <Button
                        variant={!hasActiveKrankmeldungen ? "default" : "outline"}
                        size="sm"
                        asChild
                    >
                        <Link href={`/krankmeldungen/neu?mitarbeiterId=${mitarbeiter.id}`}>
                            <CalendarPlus className="mr-1 h-4 w-4" />
                            <span>Krankmeldung erstellen</span>
                        </Link>
                    </Button>
                </CardFooter>
            )}
        </Card>
    );
}

export default MitarbeiterCard;