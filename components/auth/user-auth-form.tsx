// components/auth/user-auth-form.tsx

"use client";

import React, { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/lib/hooks/use-toast";
import { cn } from "@/lib/utils";
import { AlertCircle, Loader2 } from "lucide-react";

/**
 * Schema für die Formularvalidierung
 */
const formSchema = z.object({
    email: z
        .string()
        .min(1, { message: "E-Mail darf nicht leer sein" })
        .email({ message: "Ungültige E-Mail-Adresse" }),
    password: z
        .string()
        .min(1, { message: "Passwort darf nicht leer sein" }),
});

/**
 * Typen für die Props der Komponente
 */
interface UserAuthFormProps extends React.HTMLAttributes<HTMLDivElement> {}

/**
 * Typen für die Formulardaten
 */
type FormData = z.infer<typeof formSchema>;

/**
 * Benutzer-Authentifizierungs-Formular
 * Flexible Komponente für Anmeldeformulare mit verschiedenen Styling-Optionen
 */
export default function UserAuthForm({ className, ...props }: UserAuthFormProps) {
    const router = useRouter();
    const { toast } = useToast();
    const searchParams = useSearchParams();
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    // Rücksprungadresse nach erfolgreicher Anmeldung
    const callbackUrl = searchParams?.get("callbackUrl") || "/dashboard";

    // React Hook Form mit Zod-Validierung
    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<FormData>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            email: "",
            password: "",
        },
    });

    /**
     * Formular absenden und Anmeldeprozess starten
     */
    async function onSubmit(data: FormData) {
        setIsLoading(true);
        setError(null);

        try {
            // NextAuth signIn aufrufen
            const result = await signIn("credentials", {
                email: data.email,
                password: data.password,
                redirect: false,
                callbackUrl,
            });

            setIsLoading(false);

            // Fehlerbehandlung bei fehlgeschlagener Anmeldung
            if (!result?.ok) {
                setError("Ungültige E-Mail-Adresse oder Passwort");
                return;
            }

            // Erfolgsmeldung anzeigen
            toast({
                title: "Erfolgreich angemeldet",
                description: "Sie werden zum Dashboard weitergeleitet...",
                variant: "default",
            });

            // Zur Zielseite weiterleiten
            router.push(callbackUrl);
            router.refresh();
        } catch (error) {
            setIsLoading(false);
            setError("Ein unerwarteter Fehler ist aufgetreten. Bitte versuchen Sie es erneut.");
            console.error("Login error:", error);
        }
    }

    // Handler für Demo-Button-Klicks
    const handleDemoLogin = async (email: string, password: string) => {
        await onSubmit({
            email,
            password
        });
    };

    return (
        <div className={cn("grid gap-6", className)} {...props}>
            {/* Fehlermeldung anzeigen (falls vorhanden) */}
            {error && (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Fehler</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            {/* Anmeldeformular */}
            <form onSubmit={handleSubmit(onSubmit)}>
                <div className="grid gap-4">
                    {/* E-Mail-Feld */}
                    <div className="grid gap-2">
                        <Label
                            htmlFor="email"
                            className={cn(errors.email && "text-destructive")}
                        >
                            E-Mail
                        </Label>
                        <Input
                            id="email"
                            type="email"
                            placeholder="name@beispiel.de"
                            autoCapitalize="none"
                            autoComplete="email"
                            autoCorrect="off"
                            disabled={isLoading}
                            {...register("email")}
                            className={cn(errors.email && "border-destructive")}
                        />
                        {errors.email && (
                            <p className="text-sm font-medium text-destructive">
                                {errors.email.message}
                            </p>
                        )}
                    </div>

                    {/* Passwort-Feld */}
                    <div className="grid gap-2">
                        <Label
                            htmlFor="password"
                            className={cn(errors.password && "text-destructive")}
                        >
                            Passwort
                        </Label>
                        <Input
                            id="password"
                            type="password"
                            placeholder="********"
                            autoComplete="current-password"
                            disabled={isLoading}
                            {...register("password")}
                            className={cn(errors.password && "border-destructive")}
                        />
                        {errors.password && (
                            <p className="text-sm font-medium text-destructive">
                                {errors.password.message}
                            </p>
                        )}
                    </div>

                    {/* Anmelde-Button */}
                    <Button type="submit" disabled={isLoading}>
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {isLoading ? "Anmeldung läuft..." : "Anmelden"}
                    </Button>
                </div>
            </form>

            {/* Trennlinie zwischen Login und alternativen Anmeldeoptionen */}
            <div className="relative">
                <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">
            Demo-Zugangsdaten
          </span>
                </div>
            </div>

            {/* Demo-Zugangsdaten */}
            <div className="grid gap-2 text-sm text-muted-foreground">
                <div className="flex items-center justify-between border p-3 rounded-md">
                    <div>
                        <p className="font-medium">Standard-Benutzer</p>
                        <p>benutzer@gfu-krankmeldung.de / password123</p>
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        disabled={isLoading}
                        onClick={() => handleDemoLogin("benutzer@gfu-krankmeldung.de", "password123")}
                    >
                        Benutzen
                    </Button>
                </div>
                <div className="flex items-center justify-between border p-3 rounded-md">
                    <div>
                        <p className="font-medium">Administrator</p>
                        <p>admin@gfu-krankmeldung.de / admin123</p>
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        disabled={isLoading}
                        onClick={() => handleDemoLogin("admin@gfu-krankmeldung.de", "admin123")}
                    >
                        Benutzen
                    </Button>
                </div>
            </div>
        </div>
    );
}