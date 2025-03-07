// components/layout/site-footer.tsx

"use client";

import * as React from "react";
import { HTMLAttributes } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Heart, Info } from "lucide-react";

/**
 * Interface für die SiteFooter Komponente
 */
interface SiteFooterProps extends HTMLAttributes<HTMLElement> {
    showVersionInfo?: boolean;
    showOnlyOnMainPages?: boolean;
}

/**
 * Footer-Komponente der Webseite
 * Zeigt Copyright-Information und Links an
 * @export
 */
function SiteFooter({
                        className,
                        showVersionInfo = true,
                        showOnlyOnMainPages = true,
                        ...props
                    }: SiteFooterProps) {
    const pathname = usePathname();

    // Nur auf bestimmten Seiten anzeigen (falls aktiviert)
    if (showOnlyOnMainPages) {
        const isMainPage =
            pathname === "/" ||
            pathname === "/dashboard" ||
            pathname === "/mitarbeiter" ||
            pathname === "/krankmeldungen";

        // Auf Detailseiten oder Formularseiten nicht anzeigen
        if (!isMainPage) {
            return null;
        }
    }

    // Version aus den Umgebungsvariablen oder Fallback
    const appVersion = process.env.NEXT_PUBLIC_APP_VERSION || "1.0.0";

    return (
        <footer className={cn(
            "border-t bg-background",
            className
        )} {...props}>
            <div className="container flex flex-col items-center justify-between gap-4 py-6 md:h-16 md:flex-row md:py-0">
                {/* Copyright und Version */}
                <div className="flex flex-col items-center gap-4 md:flex-row">
                    <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
                        &copy; {new Date().getFullYear()} GFU Krankmeldungssystem. Alle Rechte vorbehalten.
                    </p>

                    {/* Version Info (optional) */}
                    {showVersionInfo && (
                        <p className="text-center text-sm text-muted-foreground md:text-left">
                            <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors">
                                Version {appVersion}
                            </span>
                        </p>
                    )}
                </div>

                {/* Footer Links und Aktionen */}
                <div className="flex flex-wrap items-center gap-2">
                    <Button variant="ghost" size="sm" asChild className="h-8 text-xs">
                        <Link href="#">Datenschutz</Link>
                    </Button>

                    <Button variant="ghost" size="sm" asChild className="h-8 text-xs">
                        <Link href="#">Impressum</Link>
                    </Button>

                    <Button variant="ghost" size="sm" className="h-8 text-xs gap-1">
                        <Info className="h-3.5 w-3.5" />
                        <span>Hilfe</span>
                    </Button>

                    <span className="text-sm text-muted-foreground px-1">•</span>

                    <p className="text-xs text-muted-foreground flex items-center">
                        Mit <Heart className="h-3 w-3 mx-1 text-red-500" /> erstellt
                    </p>
                </div>
            </div>
        </footer>
    );
}

export default SiteFooter;