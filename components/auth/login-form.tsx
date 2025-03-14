// components/auth/login-form.tsx

"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/lib/hooks/use-toast";
import { cn } from "@/lib/utils";
import { AlertCircle, Loader2 } from "lucide-react";
import { useAuth } from "@/lib/hooks/use-auth";

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
 * Typen für die Formulardaten
 */
type FormData = z.infer<typeof formSchema>;

/**
 * Login-Formular-Komponente
 * Ermöglicht die Anmeldung am System mit E-Mail und Passwort
 */
export function LoginForm() {
    const router = useRouter();
    const { toast } = useToast();
    const searchParams = useSearchParams();

    // Gemeinsame Auth-Logik aus dem Hook verwenden
    const {
        isLoading,
        error,
        handleLogin
    } = useAuth();

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
        await handleLogin(data.email, data.password, callbackUrl, () => {
            // Erfolgsmeldung anzeigen
            toast({
                title: "Erfolgreich angemeldet",
                description: "Sie werden zum Dashboard weitergeleitet...",
                variant: "default",
            });

            // Zur Zielseite weiterleiten
            router.push(callbackUrl);
            router.refresh();
        });
    }

    return (
        <Card className="w-full">
            <CardHeader className="space-y-1">
                <CardTitle className="text-2xl font-semibold">Anmelden</CardTitle>
                <CardDescription>
                    Geben Sie Ihre Anmeldedaten ein, um auf das Krankmeldungssystem zuzugreifen
                </CardDescription>
            </CardHeader>

            <form onSubmit={handleSubmit(onSubmit)}>
                <CardContent className="space-y-4">
                    {/* Fehlermeldung anzeigen (falls vorhanden) */}
                    {error && (
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>Fehler</AlertTitle>
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    {/* E-Mail-Feld */}
                    <div className="space-y-2">
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
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <Label
                                htmlFor="password"
                                className={cn(errors.password && "text-destructive")}
                            >
                                Passwort
                            </Label>
                        </div>
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

                    {/* Hilfstext mit Demo-Zugangsdaten */}
                    <div className="text-sm text-muted-foreground">
                        <p>Demo-Zugangsdaten:</p>
                        <ul className="list-disc pl-4 mt-1 space-y-1">
                            <li>Benutzer: <span className="font-mono">benutzer@gfu-krankmeldung.de</span> / <span className="font-mono">password123</span></li>
                            <li>Admin: <span className="font-mono">admin@gfu-krankmeldung.de</span> / <span className="font-mono">admin123</span></li>
                        </ul>
                    </div>
                </CardContent>

                <CardFooter>
                    <Button
                        type="submit"
                        className="w-full"
                        disabled={isLoading}
                    >
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {isLoading ? "Anmeldung läuft..." : "Anmelden"}
                    </Button>
                </CardFooter>
            </form>
        </Card>
    );
}