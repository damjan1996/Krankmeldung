// components/krankmeldungen/krankmeldung-form.tsx

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format, addDays, isAfter, isBefore, isEqual, isWeekend, differenceInDays } from "date-fns";
import { de } from "date-fns/locale";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
// Ungenutzter Import entfernt: Input
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
import { cn } from "@/lib/utils";
import {
    CalendarIcon,
    Loader2,
    Check,
    AlertCircle,
    Info
} from "lucide-react";
import { useToast } from "@/lib/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
 */
interface KrankmeldungData {
    id?: string;
    mitarbeiterId: string;
    startdatum: Date;
    enddatum: Date;
    arztbesuchDatum?: Date | null;
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
    arztbesuchDatum: z.date().nullable().optional(),
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
        (isAfter(data.arztbesuchDatum, data.startdatum) || isEqual(data.arztbesuchDatum, data.startdatum)) &&
        (isBefore(data.arztbesuchDatum, data.enddatum) || isEqual(data.arztbesuchDatum, data.enddatum))
    );
}, {
    message: "Das Arztbesuchsdatum muss im Zeitraum der Krankmeldung liegen",
    path: ["arztbesuchDatum"],
});

type FormValues = z.infer<typeof formSchema>;

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

    // Standard-Werte für neue Krankmeldung
    const getDefaultValues = (): Partial<FormValues> => {
        const today = new Date();

        if (initialData) {
            return {
                ...initialData,
                startdatum: new Date(initialData.startdatum),
                enddatum: new Date(initialData.enddatum),
                arztbesuchDatum: initialData.arztbesuchDatum
                    ? new Date(initialData.arztbesuchDatum)
                    : null,
            };
        }

        return {
            mitarbeiterId: "",
            startdatum: today,
            enddatum: addDays(today, 7), // Standard: 1 Woche Krankmeldung
            arztbesuchDatum: today, // Standard: Arztbesuch am ersten Tag
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

    // Ungenutzte Funktion für Datumsprüfungen entfernt

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
                // Statt throw direkt eine Meldung anzeigen
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
                // Zurück zur Übersicht navigieren
                router.push("/krankmeldungen");
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

    // Berechne die Anzahl der Tage zwischen Start- und Enddatum für die Dauer-Anzeige
    const calculateDuration = () => {
        if (!currentValues.startdatum || !currentValues.enddatum) return null;
        return differenceInDays(currentValues.enddatum, currentValues.startdatum) + 1;
    };

    return (
        <>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    {/* Mitarbeiter-Auswahl */}
                    <FormField
                        control={form.control}
                        name="mitarbeiterId"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Mitarbeiter</FormLabel>
                                <Select
                                    onValueChange={field.onChange}
                                    defaultValue={field.value}
                                    disabled={isSubmitting || (isEditing && initialData?.id !== undefined)}
                                >
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Mitarbeiter auswählen" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {mitarbeiter.map((m) => (
                                            <SelectItem key={m.id} value={m.id}>
                                                {m.vorname} {m.nachname} ({m.personalnummer})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FormDescription>
                                    Wählen Sie den Mitarbeiter aus, für den die Krankmeldung erfasst werden soll.
                                </FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    {/* Zeitraum */}
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
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
                                                    variant={"outline"}
                                                    className={cn(
                                                        "w-full pl-3 text-left font-normal",
                                                        !field.value && "text-muted-foreground"
                                                    )}
                                                    disabled={isSubmitting}
                                                >
                                                    {field.value ? (
                                                        format(field.value, "EEEE, dd. MMMM yyyy", { locale: de })
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
                                                weekStartsOn={1} // Woche beginnt Montag
                                                locale={de}
                                                modifiers={{
                                                    weekend: (date) => isWeekend(date),
                                                }}
                                                modifiersStyles={{
                                                    weekend: { color: "#9ca3af" }
                                                }}
                                            />
                                        </PopoverContent>
                                    </Popover>
                                    <FormDescription>
                                        Der erste Tag der Krankmeldung.
                                        {currentValues.startdatum && isWeekend(currentValues.startdatum) && (
                                            <Alert variant="warning" className="mt-2">
                                                <AlertCircle className="h-4 w-4" />
                                                <AlertTitle>Hinweis</AlertTitle>
                                                <AlertDescription>
                                                    Das gewählte Startdatum fällt auf ein Wochenende.
                                                </AlertDescription>
                                            </Alert>
                                        )}
                                    </FormDescription>
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
                                                    variant={"outline"}
                                                    className={cn(
                                                        "w-full pl-3 text-left font-normal",
                                                        !field.value && "text-muted-foreground"
                                                    )}
                                                    disabled={isSubmitting}
                                                >
                                                    {field.value ? (
                                                        format(field.value, "EEEE, dd. MMMM yyyy", { locale: de })
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
                                                weekStartsOn={1} // Woche beginnt Montag
                                                locale={de}
                                                modifiers={{
                                                    weekend: (date) => isWeekend(date),
                                                }}
                                                modifiersStyles={{
                                                    weekend: { color: "#9ca3af" }
                                                }}
                                            />
                                        </PopoverContent>
                                    </Popover>
                                    <FormDescription>
                                        Der letzte Tag der Krankmeldung.
                                        {currentValues.enddatum && isWeekend(currentValues.enddatum) && (
                                            <Alert variant="warning" className="mt-2">
                                                <AlertCircle className="h-4 w-4" />
                                                <AlertTitle>Hinweis</AlertTitle>
                                                <AlertDescription>
                                                    Das gewählte Enddatum fällt auf ein Wochenende.
                                                </AlertDescription>
                                            </Alert>
                                        )}
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>

                    {/* Arztbesuchsdatum */}
                    <FormField
                        control={form.control}
                        name="arztbesuchDatum"
                        render={({ field }) => (
                            <FormItem className="flex flex-col">
                                <FormLabel>Datum des Arztbesuchs (optional)</FormLabel>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <FormControl>
                                            <Button
                                                variant={"outline"}
                                                className={cn(
                                                    "w-full pl-3 text-left font-normal",
                                                    !field.value && "text-muted-foreground"
                                                )}
                                                disabled={isSubmitting}
                                            >
                                                {field.value ? (
                                                    format(field.value, "EEEE, dd. MMMM yyyy", { locale: de })
                                                ) : (
                                                    <span>Datum auswählen (optional)</span>
                                                )}
                                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                            </Button>
                                        </FormControl>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <div className="p-2 border-b">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="text-xs w-full justify-start font-normal"
                                                onClick={() => field.onChange(null)}
                                            >
                                                <Info className="mr-2 h-3.5 w-3.5" />
                                                Kein Arztbesuch
                                            </Button>
                                        </div>
                                        <Calendar
                                            mode="single"
                                            selected={field.value ?? undefined}
                                            onSelect={field.onChange}
                                            disabled={(_date) => isSubmitting}
                                            initialFocus
                                            weekStartsOn={1}
                                            locale={de}
                                        />
                                    </PopoverContent>
                                </Popover>
                                <FormDescription>
                                    Das Datum, an dem der Arztbesuch stattgefunden hat.
                                </FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    {/* Notizen */}
                    <FormField
                        control={form.control}
                        name="notizen"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Notizen (optional)</FormLabel>
                                <FormControl>
                                    <Textarea
                                        placeholder="Fügen Sie hier zusätzliche Informationen ein..."
                                        className="resize-y min-h-[100px]"
                                        {...field}
                                        value={field.value || ""}
                                        onChange={(e) => field.onChange(e.target.value || null)}
                                        disabled={isSubmitting}
                                    />
                                </FormControl>
                                <FormDescription>
                                    Zusätzliche Informationen zur Krankmeldung.
                                </FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    {/* Status (nur bei Bearbeitung) */}
                    {isEditing && (
                        <FormField
                            control={form.control}
                            name="status"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Status</FormLabel>
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
                                    <FormDescription>
                                        Der aktuelle Status der Krankmeldung.
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    )}

                    {/* Dauer-Anzeige */}
                    {currentValues.startdatum && currentValues.enddatum && (
                        <Alert>
                            <Info className="h-4 w-4" />
                            <AlertTitle>Dauer der Krankmeldung</AlertTitle>
                            <AlertDescription>
                                {format(currentValues.startdatum, "dd.MM.yyyy", { locale: de })} bis {format(currentValues.enddatum, "dd.MM.yyyy", { locale: de })}: {" "}
                                <strong>
                                    {calculateDuration()} Tage
                                </strong>
                            </AlertDescription>
                        </Alert>
                    )}

                    {/* Form-Buttons */}
                    <div className="flex justify-end space-x-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleCancel}
                            disabled={isSubmitting}
                        >
                            Abbrechen
                        </Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {isSubmitting
                                ? "Wird gespeichert..."
                                : isEditing
                                    ? "Aktualisieren"
                                    : "Speichern"}
                        </Button>
                    </div>
                </form>
            </Form>

            {/* Bestätigungsdialog beim Abbrechen */}
            <AlertDialog open={isCancelDialogOpen} onOpenChange={setIsCancelDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Änderungen verwerfen?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Sie haben ungespeicherte Änderungen. Möchten Sie wirklich abbrechen?
                            Alle vorgenommenen Änderungen gehen verloren.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Zurück zum Formular</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => router.back()}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            <Check className="mr-2 h-4 w-4" />
                            Änderungen verwerfen
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}