// components/krankmeldungen/krankmeldung-form.tsx

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { format, addDays, isAfter, isBefore, isEqual, differenceInDays } from "date-fns";
import { de } from "date-fns/locale";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    Card,
    CardContent,
    CardHeader,
} from "@/components/ui/card";
import {
    CalendarIcon,
    Loader2,
    Info,
    Search,
    User,
    X,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

/**
 * Definiere die Mitarbeiter-Datenstruktur
 */
interface Mitarbeiter {
    id: string;
    vorname: string;
    nachname: string;
    personalnummer: string;
}

/**
 * Definiere die Daten für bestehende Krankmeldungen (optional)
 * Unterstützt sowohl String- als auch Date-Formate für die Kompatibilität
 */
interface KrankmeldungData {
    id?: string;
    mitarbeiterId: string;
    startdatum: string | Date;
    enddatum: string | Date;
    arztbesuchDatum?: string | Date | null;
    notizen?: string | null;
    status: "aktiv" | "abgeschlossen" | "storniert";
}

/**
 * Props für das Formular
 */
interface KrankmeldungFormProps {
    mitarbeiter: Mitarbeiter[];
    userId: string;
    initialData?: KrankmeldungData;
    isEditing?: boolean;
    onSuccess?: () => void;
}

/**
 * Zod-Schema für die Form-Validierung mit erweiterten Datumsvalidierungen
 */
const formSchema = z.object({
    mitarbeiterId: z.string({
        required_error: "Bitte wählen Sie einen Mitarbeiter aus",
    }),
    startdatum: z.date({
        required_error: "Bitte wählen Sie ein Startdatum",
    }),
    enddatum: z.date({
        required_error: "Bitte wählen Sie ein Enddatum",
    }),
    arztbesuchDatum: z.date({
        required_error: "Bitte wählen Sie ein Arztbesuchsdatum",
    }),
    notizen: z.string().max(1000, "Notizen dürfen maximal 1000 Zeichen enthalten").nullable().optional(),
    status: z.enum(["aktiv", "abgeschlossen", "storniert"], {
        required_error: "Bitte wählen Sie einen Status",
    }),
}).refine(data => {
    // Endatum darf nicht vor Startdatum liegen
    return isAfter(data.enddatum, data.startdatum) || isEqual(data.enddatum, data.startdatum);
}, {
    message: "Das Enddatum muss nach oder gleich dem Startdatum sein",
    path: ["enddatum"],
}).refine(data => {
    // Arztbesuch-Datum muss im Zeitraum der Krankmeldung liegen (falls angegeben)
    if (!data.arztbesuchDatum) return true;

    return (
        // Arztbesuch >= Startdatum
        (isEqual(data.arztbesuchDatum, data.startdatum) || isAfter(data.arztbesuchDatum, data.startdatum)) &&
        // Arztbesuch <= Enddatum
        (isEqual(data.arztbesuchDatum, data.enddatum) || isBefore(data.arztbesuchDatum, data.enddatum))
    );
}, {
    message: "Das Arztbesuchsdatum muss im Zeitraum der Krankmeldung liegen",
    path: ["arztbesuchDatum"],
});

type FormValues = z.infer<typeof formSchema>;

/**
 * Hilfsfunktion zur Konvertierung von String oder Date in ein Date-Objekt
 */
function ensureDate(date: string | Date | undefined | null): Date {
    if (!date) return new Date();
    if (date instanceof Date) return date;
    return new Date(date);
}

/**
 * Formular-Komponente für die Erstellung und Bearbeitung von Krankmeldungen
 */
export function KrankmeldungForm({
                                     mitarbeiter,
                                     userId,
                                     initialData,
                                     isEditing = false,
                                     onSuccess,
                                 }: KrankmeldungFormProps) {
    const router = useRouter();
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
    const [showMitarbeiterSearch, setShowMitarbeiterSearch] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedMitarbeiter, setSelectedMitarbeiter] = useState<Mitarbeiter | null>(null);

    // Standard-Werte für neue Krankmeldung
    const getDefaultValues = (): Partial<FormValues> => {
        const today = new Date();

        if (initialData) {
            // Stelle sicher, dass alle Datumswerte korrekte Date-Objekte sind
            const startDate = ensureDate(initialData.startdatum);
            const endDate = ensureDate(initialData.enddatum);
            const doctorDate = initialData.arztbesuchDatum ? ensureDate(initialData.arztbesuchDatum) : startDate;

            return {
                mitarbeiterId: initialData.mitarbeiterId,
                startdatum: startDate,
                enddatum: endDate,
                arztbesuchDatum: doctorDate,
                notizen: initialData.notizen || "",
                status: initialData.status || "aktiv",
            };
        }

        return {
            mitarbeiterId: "",
            startdatum: today,
            enddatum: addDays(today, 7),
            arztbesuchDatum: today, // Gleicher Wert wie Startdatum
            notizen: "",
            status: "aktiv",
        };
    };

    // Form-Hook initialisieren
    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: getDefaultValues(),
    });

    // Werte aus dem Formular
    const currentValues = form.watch();

    // Effekt zum Setzen des ausgewählten Mitarbeiters
    useEffect(() => {
        if (currentValues.mitarbeiterId) {
            const foundMitarbeiter = mitarbeiter.find(m => m.id === currentValues.mitarbeiterId);
            if (foundMitarbeiter) {
                setSelectedMitarbeiter(foundMitarbeiter);
            }
        }
    }, [currentValues.mitarbeiterId, mitarbeiter]);

    // Effekt, der Arztbesuchsdatum auf Startdatum setzt, wenn Startdatum geändert wird
    useEffect(() => {
        if (currentValues.startdatum && !form.formState.dirtyFields.arztbesuchDatum) {
            form.setValue("arztbesuchDatum", currentValues.startdatum);
        }
    }, [currentValues.startdatum, form]);

    // Gefilterte Mitarbeiterliste basierend auf Suchbegriff
    const filteredMitarbeiter = mitarbeiter.filter(m => {
        if (!searchTerm) return true;

        const searchLower = searchTerm.toLowerCase();
        return (
            m.vorname.toLowerCase().includes(searchLower) ||
            m.nachname.toLowerCase().includes(searchLower) ||
            m.personalnummer.toLowerCase().includes(searchLower) ||
            `${m.vorname} ${m.nachname}`.toLowerCase().includes(searchLower)
        );
    });

    /**
     * Form-Daten absenden
     */
    async function onSubmit(values: FormValues) {
        setIsSubmitting(true);

        try {
            // Request-URL und Methode basierend auf Edit/Create
            const url = isEditing && initialData?.id
                ? `/api/krankmeldungen/${initialData.id}`
                : "/api/krankmeldungen";

            const method = isEditing ? "PUT" : "POST";

            // Daten formatieren
            const requestData = {
                ...values,
                startdatum: format(values.startdatum, "yyyy-MM-dd"),
                enddatum: format(values.enddatum, "yyyy-MM-dd"),
                arztbesuchDatum: values.arztbesuchDatum
                    ? format(values.arztbesuchDatum, "yyyy-MM-dd")
                    : null,
                erstelltVonId: userId,
                aktualisiertVonId: isEditing ? userId : undefined
            };

            // API-Anfrage senden
            const response = await fetch(url, {
                method,
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(requestData),
            });

            // Fehlerbehandlung
            if (!response.ok) {
                const errorData = await response.json();
                toast({
                    title: "Fehler",
                    description: errorData.error || "Ein Fehler ist aufgetreten",
                    variant: "destructive",
                });
                setIsSubmitting(false);
                return;
            }

            // Erfolgsreaktion - response wird nicht mehr gespeichert
            await response.json();

            toast({
                title: isEditing
                    ? "Krankmeldung aktualisiert"
                    : "Krankmeldung erstellt",
                description: isEditing
                    ? "Die Änderungen wurden erfolgreich gespeichert."
                    : "Die Krankmeldung wurde erfolgreich erstellt.",
                variant: "default",
            });

            // Erfolgs-Callback oder Weiterleitung
            if (onSuccess) {
                onSuccess();
            } else {
                // Bei Bearbeitung zur Detailseite navigieren, sonst zur Übersicht
                if (isEditing && initialData?.id) {
                    router.push(`/krankmeldungen/${initialData.id}`);
                } else {
                    router.push("/krankmeldungen");
                }
                router.refresh();
            }
        } catch (error) {
            console.error("Fehler beim Speichern der Krankmeldung:", error);

            toast({
                title: "Fehler",
                description: error instanceof Error ? error.message : "Ein unerwarteter Fehler ist aufgetreten",
                variant: "destructive",
            });
        } finally {
            setIsSubmitting(false);
        }
    }

    /**
     * Formular abbrechen mit Dialog
     */
    const handleCancel = () => {
        // Prüfen, ob das Formular geändert wurde
        if (form.formState.isDirty) {
            setIsCancelDialogOpen(true);
        } else {
            router.back();
        }
    };

    // Mitarbeiter auswählen und Popover schließen
    const handleSelectMitarbeiter = (mitarbeiter: Mitarbeiter) => {
        form.setValue("mitarbeiterId", mitarbeiter.id);
        setSelectedMitarbeiter(mitarbeiter);
        setShowMitarbeiterSearch(false);
        setSearchTerm("");
    };

    // Mitarbeiterauswahl zurücksetzen
    const handleResetMitarbeiter = () => {
        form.setValue("mitarbeiterId", "");
        setSelectedMitarbeiter(null);
    };

    // Berechne die Anzahl der Tage zwischen Start- und Enddatum für die Dauer-Anzeige
    const calculateDuration = () => {
        if (!currentValues.startdatum || !currentValues.enddatum) return null;
        return differenceInDays(currentValues.enddatum, currentValues.startdatum) + 1;
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
                <Card className="space-y-6 pt-0">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-xl font-semibold">Neue Krankmeldung</h2>
                                <p className="text-sm text-muted-foreground">
                                    Erfassen Sie eine neue Krankmeldung für einen Mitarbeiter
                                </p>
                            </div>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleCancel}
                                disabled={isSubmitting}
                            >
                                Abbrechen
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                        {/* Mitarbeiter-Auswahl */}
                        <div className="mb-6">
                            <h3 className="text-lg font-medium mb-2">Mitarbeiter</h3>
                            <FormField
                                control={form.control}
                                name="mitarbeiterId"
                                render={({ field }) => (
                                    <FormItem className="w-full">
                                        <div className="relative w-full">
                                            {selectedMitarbeiter ? (
                                                <div className="flex items-center justify-between px-4 border rounded-md w-full h-10 text-sm font-medium">
                                                    <div className="flex items-center gap-2 truncate">
                                                        <User className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                                                        <span className="truncate">
                                                            {selectedMitarbeiter.vorname} {selectedMitarbeiter.nachname}
                                                        </span>
                                                        <span className="text-xs text-muted-foreground">
                                                            ({selectedMitarbeiter.personalnummer})
                                                        </span>
                                                    </div>
                                                    {!isEditing && (
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="sm"
                                                            className="flex-shrink-0 h-8 w-8 p-0"
                                                            disabled={isSubmitting || (isEditing && initialData?.id !== undefined)}
                                                            onClick={handleResetMitarbeiter}
                                                        >
                                                            <X className="h-4 w-4" />
                                                        </Button>
                                                    )}
                                                </div>
                                            ) : (
                                                <Popover
                                                    open={showMitarbeiterSearch}
                                                    onOpenChange={setShowMitarbeiterSearch}
                                                >
                                                    <PopoverTrigger asChild>
                                                        <FormControl>
                                                            <Button
                                                                variant="outline"
                                                                role="combobox"
                                                                className="w-full justify-between h-10 font-normal text-sm"
                                                                disabled={isSubmitting || (isEditing && initialData?.id !== undefined)}
                                                            >
                                                                <span className="flex items-center gap-2">
                                                                    <User className="h-4 w-4 text-muted-foreground" />
                                                                    Mitarbeiter auswählen
                                                                </span>
                                                                <Search className="h-4 w-4 text-muted-foreground ml-2" />
                                                            </Button>
                                                        </FormControl>
                                                    </PopoverTrigger>
                                                    <PopoverContent className="w-[400px] p-0" align="start" side="bottom">
                                                        <div className="p-2 border-b">
                                                            <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-muted">
                                                                <Search className="h-4 w-4 text-muted-foreground" />
                                                                <Input
                                                                    placeholder="Suche nach Namen oder Personalnummer..."
                                                                    value={searchTerm}
                                                                    onChange={(e) => setSearchTerm(e.target.value)}
                                                                    className="h-8 bg-transparent border-none focus-visible:ring-0 focus-visible:ring-offset-0"
                                                                />
                                                                {searchTerm && (
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        onClick={() => setSearchTerm("")}
                                                                        className="h-6 w-6 p-0"
                                                                    >
                                                                        <X className="h-4 w-4" />
                                                                    </Button>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <div className="max-h-[250px] overflow-y-auto">
                                                            {filteredMitarbeiter.length === 0 ? (
                                                                <div className="py-6 text-center text-sm text-muted-foreground">
                                                                    Keine Mitarbeiter gefunden
                                                                </div>
                                                            ) : (
                                                                <ul className="py-2">
                                                                    {filteredMitarbeiter.map((m) => (
                                                                        <li
                                                                            key={m.id}
                                                                            className="px-3 py-2 text-sm cursor-pointer hover:bg-muted flex items-center justify-between"
                                                                            onClick={() => handleSelectMitarbeiter(m)}
                                                                        >
                                                                            <div className="flex items-center gap-2">
                                                                                <User className="h-4 w-4 text-muted-foreground" />
                                                                                <span className="font-medium">{m.vorname} {m.nachname}</span>
                                                                            </div>
                                                                            <span className="text-muted-foreground">{m.personalnummer}</span>
                                                                        </li>
                                                                    ))}
                                                                </ul>
                                                            )}
                                                        </div>
                                                    </PopoverContent>
                                                </Popover>
                                            )}
                                            <input
                                                type="hidden"
                                                {...field}
                                            />
                                        </div>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        {/* Trennlinie */}
                        <div className="border-b my-6"></div>

                        {/* Zeitraum der Krankmeldung */}
                        <div className="mb-6">
                            <h3 className="text-lg font-medium mb-2">Zeitraum der Krankmeldung</h3>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                {/* Startdatum */}
                                <FormField
                                    control={form.control}
                                    name="startdatum"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-col">
                                            <FormLabel>Startdatum</FormLabel>
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <FormControl>
                                                        <Button
                                                            variant="outline"
                                                            className="w-full pl-3 text-left font-normal h-10"
                                                            disabled={isSubmitting}
                                                        >
                                                            {field.value ? (
                                                                format(field.value, "dd.MM.yyyy", { locale: de })
                                                            ) : (
                                                                <span>Datum auswählen</span>
                                                            )}
                                                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                        </Button>
                                                    </FormControl>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-auto p-0" align="start">
                                                    <Calendar
                                                        mode="single"
                                                        selected={field.value}
                                                        onSelect={field.onChange}
                                                        disabled={isSubmitting}
                                                        initialFocus
                                                        weekStartsOn={1}
                                                        locale={de}
                                                    />
                                                </PopoverContent>
                                            </Popover>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                {/* Enddatum */}
                                <FormField
                                    control={form.control}
                                    name="enddatum"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-col">
                                            <FormLabel>Enddatum</FormLabel>
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <FormControl>
                                                        <Button
                                                            variant="outline"
                                                            className="w-full pl-3 text-left font-normal h-10"
                                                            disabled={isSubmitting}
                                                        >
                                                            {field.value ? (
                                                                format(field.value, "dd.MM.yyyy", { locale: de })
                                                            ) : (
                                                                <span>Datum auswählen</span>
                                                            )}
                                                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                        </Button>
                                                    </FormControl>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-auto p-0" align="start">
                                                    <Calendar
                                                        mode="single"
                                                        selected={field.value}
                                                        onSelect={field.onChange}
                                                        disabled={(_date) =>
                                                            isSubmitting ||
                                                            (currentValues.startdatum && isBefore(_date, currentValues.startdatum))
                                                        }
                                                        initialFocus
                                                        weekStartsOn={1}
                                                        locale={de}
                                                    />
                                                </PopoverContent>
                                            </Popover>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                {/* Arztbesuchsdatum */}
                                <FormField
                                    control={form.control}
                                    name="arztbesuchDatum"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-col">
                                            <FormLabel>Arztbesuchsdatum</FormLabel>
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <FormControl>
                                                        <Button
                                                            variant="outline"
                                                            className="w-full pl-3 text-left font-normal h-10"
                                                            disabled={isSubmitting}
                                                        >
                                                            {field.value ? (
                                                                format(field.value, "dd.MM.yyyy", { locale: de })
                                                            ) : (
                                                                <span>Datum auswählen</span>
                                                            )}
                                                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                        </Button>
                                                    </FormControl>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-auto p-0" align="start">
                                                    <Calendar
                                                        mode="single"
                                                        selected={field.value}
                                                        onSelect={field.onChange}
                                                        disabled={isSubmitting}
                                                        initialFocus
                                                        weekStartsOn={1}
                                                        locale={de}
                                                        defaultMonth={currentValues.startdatum}
                                                    />
                                                </PopoverContent>
                                            </Popover>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            {/* Dauer-Anzeige */}
                            {currentValues.startdatum && currentValues.enddatum && calculateDuration() && (
                                <Alert className="bg-muted/50">
                                    <Info className="h-4 w-4" />
                                    <AlertTitle>Dauer der Krankmeldung</AlertTitle>
                                    <AlertDescription>
                                        Der Mitarbeiter ist für {calculateDuration()} {calculateDuration() === 1 ? "Tag" : "Tage"} krankgemeldet.
                                    </AlertDescription>
                                </Alert>
                            )}
                        </div>

                        {/* Trennlinie */}
                        <div className="border-b my-6"></div>

                        {/* Notizen */}
                        <div className="mb-6">
                            <h3 className="text-lg font-medium mb-2">Notizen</h3>

                            <FormField
                                control={form.control}
                                name="notizen"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormControl>
                                            <Textarea
                                                placeholder="Zusätzliche Informationen zur Krankmeldung..."
                                                className="resize-y min-h-[100px]"
                                                {...field}
                                                value={field.value || ""}
                                                onChange={(e) => field.onChange(e.target.value || null)}
                                                disabled={isSubmitting}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        {/* Status (nur bei Bearbeitung) */}
                        {isEditing && (
                            <>
                                <div className="border-b my-6"></div>
                                <div className="mb-6">
                                    <h3 className="text-lg font-medium mb-2">Status</h3>
                                    <p className="text-sm text-muted-foreground mb-4">
                                        Aktueller Status der Krankmeldung
                                    </p>

                                    <FormField
                                        control={form.control}
                                        name="status"
                                        render={({ field }) => (
                                            <FormItem>
                                                <Select
                                                    onValueChange={field.onChange}
                                                    defaultValue={field.value}
                                                    disabled={isSubmitting}
                                                >
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Status auswählen" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        <SelectItem value="aktiv">Aktiv</SelectItem>
                                                        <SelectItem value="abgeschlossen">Abgeschlossen</SelectItem>
                                                        <SelectItem value="storniert">Storniert</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </>
                        )}

                        {/* Form-Buttons */}
                        <div className="flex justify-end pt-4">
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {isSubmitting
                                    ? "Speichert..."
                                    : isEditing ? "Änderungen speichern" : "Krankmeldung erstellen"}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </form>

            {/* Bestätigungsdialog beim Abbrechen */}
            <AlertDialog open={isCancelDialogOpen} onOpenChange={setIsCancelDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Änderungen verwerfen?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Sie haben ungespeicherte Änderungen. Möchten Sie wirklich abbrechen?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Zurück</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => router.back()}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            Verwerfen
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </Form>
    );
}