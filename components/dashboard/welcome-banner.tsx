// components/dashboard/welcome-banner.tsx

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, CalendarPlus } from "lucide-react";

/**
 * Props für die WelcomeBanner-Komponente
 */
interface WelcomeBannerProps {
    userName: string;
    krankmeldungCount?: number;
    showCreateButton?: boolean;
    // className wird entfernt, da es nicht verwendet wird
}

/**
 * Willkommensbanner-Komponente für das Dashboard
 */
export function WelcomeBanner({
                                  userName,
                                  krankmeldungCount,
                                  showCreateButton = true,
                                  // _className entfernt
                              }: WelcomeBannerProps) {
    // State für dynamische Begrüßung basierend auf Tageszeit
    const [greeting, setGreeting] = useState("Guten Tag");

    // Aktuelle Tageszeit ermitteln
    useEffect(() => {
        const updateGreeting = () => {
            const date = new Date();
            const hours = date.getHours();

            if (hours < 12) {
                setGreeting("Guten Morgen");
            } else if (hours < 18) {
                setGreeting("Guten Tag");
            } else {
                setGreeting("Guten Abend");
            }
        };

        updateGreeting();

        // Timer für regelmäßige Updates (falls der Benutzer die Seite lange geöffnet hat)
        const interval = setInterval(updateGreeting, 60 * 60 * 1000); // Stündliches Update

        return () => clearInterval(interval);
    }, []);

    // Benutzernamen extrahieren (nur den Vornamen, falls verfügbar)
    const firstName = userName.split(' ')[0];

    return (
        <Card className="bg-primary text-primary-foreground">
            <CardContent className="p-6">
                <div className="flex flex-col space-y-3 sm:space-y-0 sm:flex-row sm:items-center sm:justify-between">
                    <div className="space-y-1">
                        <h1 className="text-2xl font-bold">
                            {greeting}, {firstName}!
                        </h1>
                        <p className="text-primary-foreground/90 text-sm sm:text-base">
                            Willkommen im GFU Krankmeldungssystem
                            {krankmeldungCount !== undefined && (
                                <>. Es gibt derzeit <strong>{krankmeldungCount}</strong> aktive Krankmeldung{krankmeldungCount !== 1 && "en"}</>
                            )}
                        </p>
                    </div>

                    {showCreateButton && (
                        <div className="flex">
                            <Button
                                variant="secondary"
                                size="sm"
                                className="gap-1 sm:gap-2"
                                asChild
                            >
                                <Link href="/krankmeldungen/neu">
                                    <CalendarPlus className="h-4 w-4" />
                                    <span>Neue Krankmeldung</span>
                                    <ArrowRight className="h-4 w-4" />
                                </Link>
                            </Button>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}