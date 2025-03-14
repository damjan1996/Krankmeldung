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
     * Führt den Login-Prozess durch mit direkter Weiterleitung
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
            // Einfacher Ansatz mit direkter Weiterleitung
            signIn("credentials", {
                email,
                password,
                callbackUrl: callbackUrl,
                redirect: true
            });

            // Dieser Code wird nur erreicht, wenn die Weiterleitung fehlschlägt
            // Wir fügen einen Fallback hinzu, falls die automatische Weiterleitung nicht funktioniert
            setTimeout(() => {
                setIsLoading(false);
                window.location.href = callbackUrl;
            }, 2000);

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