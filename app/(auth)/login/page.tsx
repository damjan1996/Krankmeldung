// app/(auth)/login/page.tsx

import { Metadata } from "next";
import Link from "next/link";
import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";

import { LoginForm } from "@/components/auth/login-form";
import { authOptions } from "@/lib/auth";

export const metadata: Metadata = {
    title: "Login - GFU Krankmeldungssystem",
    description: "Melden Sie sich am GFU Krankmeldungssystem an",
};

/**
 * Login-Seite Komponente
 * Zeigt das Anmeldeformular an und prüft, ob der Benutzer bereits angemeldet ist
 */
export default async function LoginPage() {
    // Prüfen, ob der Benutzer bereits angemeldet ist
    const session = await getServerSession(authOptions);

    // Wenn bereits angemeldet, zum Dashboard weiterleiten
    if (session) {
        redirect("/dashboard");
    }

    return (
        <div className="container flex h-screen w-screen flex-col items-center justify-center overflow-hidden">
            <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
                <div className="flex flex-col space-y-2 text-center">
                    <h1 className="text-2xl font-semibold tracking-tight">
                        GFU Krankmeldungssystem
                    </h1>
                </div>

                {/* Login-Formular-Komponente einbinden */}
                <LoginForm />

                <p className="px-8 text-center text-sm text-muted-foreground">
                    <Link
                        href="/"
                        className="hover:text-brand underline underline-offset-4"
                    >
                        Zurück zur Startseite
                    </Link>
                </p>
            </div>
        </div>
    );
}