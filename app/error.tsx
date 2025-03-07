// app/error.tsx

"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

/**
 * Props für die Error-Komponente
 */
interface ErrorProps {
    error: Error & { digest?: string };
    reset: () => void;
}

/**
 * Globale Error-Komponente
 * Zeigt Fehler im Frontend an und ermöglicht das Zurücksetzen/Neu-Versuchen
 */
export default function Error({ error, reset }: ErrorProps) {
    // Fehler in der Konsole protokollieren
    useEffect(() => {
        console.error("Anwendungsfehler:", error);
    }, [error]);

    return (
        <div className="flex min-h-screen flex-col items-center justify-center">
            <Card className="mx-auto max-w-md">
                <CardHeader className="text-center">
                    <CardTitle className="text-2xl">Ein Fehler ist aufgetreten</CardTitle>
                    <CardDescription>
                        Wir entschuldigen uns für die Unannehmlichkeiten
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="rounded-md bg-red-50 p-4">
                        <div className="flex">
                            <div className="flex-shrink-0">
                                <svg
                                    className="h-5 w-5 text-red-400"
                                    xmlns="http://www.w3.org/2000/svg"
                                    viewBox="0 0 20 20"
                                    fill="currentColor"
                                    aria-hidden="true"
                                >
                                    <path
                                        fillRule="evenodd"
                                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                                        clipRule="evenodd"
                                    />
                                </svg>
                            </div>
                            <div className="ml-3">
                                <h3 className="text-sm font-medium text-red-800">Fehlermeldung</h3>
                                <div className="mt-2 text-sm text-red-700">
                                    <p>{error.message || "Unbekannter Fehler"}</p>
                                    {error.digest && (
                                        <p className="mt-1 text-xs text-gray-500">
                                            Referenz-ID: {error.digest}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    <p className="text-sm text-gray-600">
                        Bitte versuchen Sie es erneut oder kontaktieren Sie den Support,
                        falls das Problem weiterhin besteht.
                    </p>
                </CardContent>
                <CardFooter className="flex justify-center space-x-4">
                    <Button
                        variant="default"
                        onClick={() => reset()}
                    >
                        Erneut versuchen
                    </Button>
                    <Link href="/dashboard">
                        <Button variant="outline">
                            Zurück zum Dashboard
                        </Button>
                    </Link>
                </CardFooter>
            </Card>
        </div>
    );
}