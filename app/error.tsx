"use client";

import { useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Home, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Error({
                                  error,
                                  reset,
                              }: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // Fehler für Debugging-Zwecke in der Konsole ausgeben
        console.error(error);
    }, [error]);

    return (
        <div className="flex min-h-screen flex-col bg-background">
            <div className="flex-1 flex items-center justify-center">
                <div className="container flex flex-col items-center justify-center space-y-6 px-4 md:px-6 py-8 text-center">
                    <div className="space-y-2">
                        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
                            Es ist ein Fehler aufgetreten
                        </h1>
                        <p className="max-w-[600px] text-muted-foreground md:text-xl/relaxed">
                            Beim Laden dieser Seite ist ein Fehler aufgetreten.
                            Bitte versuchen Sie es erneut oder kehren Sie zur Startseite zurück.
                        </p>
                    </div>
                    <div className="flex flex-col gap-3 sm:flex-row">
                        <Button onClick={() => reset()} variant="default">
                            <RefreshCw className="mr-2 h-4 w-4" />
                            Erneut versuchen
                        </Button>
                        <Button asChild>
                            <Link href="/">
                                <Home className="mr-2 h-4 w-4" />
                                Zur Startseite
                            </Link>
                        </Button>
                        <Button variant="outline" asChild>
                            <Link href="/dashboard">
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Zum Dashboard
                            </Link>
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}