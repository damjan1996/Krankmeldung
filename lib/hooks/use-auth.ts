// lib/hooks/use-auth.ts

import { useState } from "react";
import { signIn } from "next-auth/react";

/**
 * Hook für die Authentifizierungslogik
 * Stellt gemeinsame Funktionen für Login-Formulare bereit
 */
export function useAuth() {
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    /**
     * Führt den Login-Prozess durch
     * @param email E-Mail-Adresse des Benutzers
     * @param password Passwort des Benutzers
     * @param callbackUrl Weiterleitungs-URL nach erfolgreicher Anmeldung
     * @param onSuccess Callback-Funktion bei erfolgreicher Anmeldung
     */
    async function handleLogin(
        email: string,
        password: string,
        callbackUrl: string,
        onSuccess: () => void
    ) {
        setIsLoading(true);
        setError(null);

        try {
            // NextAuth signIn aufrufen
            const result = await signIn("credentials", {
                email,
                password,
                redirect: false,
                callbackUrl,
            });

            setIsLoading(false);

            // Fehlerbehandlung bei fehlgeschlagener Anmeldung
            if (!result?.ok) {
                setError("Ungültige E-Mail-Adresse oder Passwort");
                return;
            }

            // Success-Callback ausführen
            onSuccess();
        } catch (error) {
            setIsLoading(false);
            setError("Ein unerwarteter Fehler ist aufgetreten. Bitte versuchen Sie es erneut.");
            console.error("Login error:", error);
        }
    }

    return {
        isLoading,
        error,
        handleLogin,
    };
}