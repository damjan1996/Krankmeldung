// components/layout/sidebar-nav.tsx

"use client";

import * as React from "react";
import { HTMLAttributes } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";

import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
    BarChart3,
    CalendarClock,
    CalendarPlus,
    FileEdit,
    Home,
    ListChecks,
    Settings,
    User,
    Users
} from "lucide-react";

/**
 * Interface für die SidebarNav Komponente
 */
interface SidebarNavProps extends HTMLAttributes<HTMLElement> {
    items?: {
        title: string;
        href: string;
        icon?: React.ReactNode;
        disabled?: boolean;
    }[];
    showIcons?: boolean;
}

/**
 * Seitennavigationskomponente
 * Zeigt die Navigationslinks in der Seitenleiste an
 */
export function SidebarNav({
                               className,
                               items,
                               showIcons = true,
                               ...props
                           }: SidebarNavProps) {
    const pathname = usePathname();
    const { data: session } = useSession();

    // Standard-Navigationspunkte mit Icons
    const defaultItems = [
        {
            title: "Dashboard",
            href: "/dashboard",
            icon: <Home className="mr-2 h-4 w-4" />,
            disabled: false,
        },
        {
            title: "Krankmeldungen",
            href: "/krankmeldungen",
            icon: <ListChecks className="mr-2 h-4 w-4" />,
            disabled: false,
        },
        {
            title: "Neue Krankmeldung",
            href: "/krankmeldungen/neu",
            icon: <CalendarPlus className="mr-2 h-4 w-4" />,
            disabled: false,
        },
        {
            title: "Aktive Krankmeldungen",
            href: "/krankmeldungen?status=aktiv",
            icon: <CalendarClock className="mr-2 h-4 w-4" />,
            disabled: false,
        },
        {
            title: "Mitarbeiter",
            href: "/mitarbeiter",
            icon: <Users className="mr-2 h-4 w-4" />,
            disabled: false,
        },
        // Bericht-Sektion, nur wenn vorhanden oder Benutzer ein Admin ist
        ...(session?.user?.isAdmin ? [
            {
                title: "Berichte",
                href: "/berichte",
                icon: <BarChart3 className="mr-2 h-4 w-4" />,
                disabled: false,
            }
        ] : []),
    ];

    // Admin-Navigationspunkt (nur für Administratoren)
    if (session?.user?.isAdmin) {
        defaultItems.push({
            title: "Administration",
            href: "/admin",
            icon: <Settings className="mr-2 h-4 w-4" />,
            disabled: false,
        });
    }

    // Navigationspunkte die angezeigt werden sollen (entweder die übergebenen oder die Standard-Punkte)
    const navItems = items || defaultItems;

    return (
        <ScrollArea className="h-full py-4">
            <nav
                className={cn("grid items-start gap-2", className)}
                {...props}
            >
                {navItems.map((item, index) => {
                    // Aktiven Zustand prüfen (exakte Übereinstimmung oder beginnt mit dem Pfad)
                    const isActive =
                        pathname === item.href ||
                        // Für verschachtelte Routen wie /krankmeldungen/neu
                        (pathname.startsWith(item.href) && item.href !== "/");

                    // Für spezielle Status-Filter-Links
                    const isStatusActive =
                        item.href.includes("status=") &&
                        pathname.startsWith(item.href.split("?")[0]) &&
                        pathname.includes(item.href.split("?")[1]);

                    return (
                        <Link
                            key={index}
                            href={item.disabled ?? false ? "#" : item.href}
                            className={cn(
                                buttonVariants({ variant: "ghost" }),
                                isActive || isStatusActive
                                    ? "bg-muted hover:bg-muted"
                                    : "hover:bg-transparent hover:underline",
                                "justify-start",
                                (item.disabled ?? false) && "cursor-not-allowed opacity-80",
                            )}
                        >
                            {showIcons && item.icon}
                            {item.title}
                        </Link>
                    );
                })}
            </nav>

            {/* Kontextspezifische zusätzliche Links basierend auf dem aktuellen Pfad */}
            {pathname.startsWith("/mitarbeiter") && pathname !== "/mitarbeiter" && (
                <>
                    <Separator className="my-4" />
                    <div className="grid gap-1 px-2">
                        <p className="text-xs font-medium text-muted-foreground mb-1">
                            Mitarbeiter-Aktionen
                        </p>
                        <nav className="grid gap-1">
                            <Link
                                href="/krankmeldungen/neu"
                                className={cn(
                                    buttonVariants({ variant: "ghost", size: "sm" }),
                                    "justify-start h-8"
                                )}
                            >
                                <CalendarPlus className="mr-2 h-3.5 w-3.5" />
                                Krankmeldung erstellen
                            </Link>
                            <Link
                                href="/mitarbeiter"
                                className={cn(
                                    buttonVariants({ variant: "ghost", size: "sm" }),
                                    "justify-start h-8"
                                )}
                            >
                                <User className="mr-2 h-3.5 w-3.5" />
                                Alle Mitarbeiter
                            </Link>
                        </nav>
                    </div>
                </>
            )}

            {pathname.startsWith("/krankmeldungen") && pathname.includes("/bearbeiten") && (
                <>
                    <Separator className="my-4" />
                    <div className="grid gap-1 px-2">
                        <p className="text-xs font-medium text-muted-foreground mb-1">
                            Bearbeitung
                        </p>
                        <nav className="grid gap-1">
                            <Link
                                href={pathname.replace("/bearbeiten", "")}
                                className={cn(
                                    buttonVariants({ variant: "ghost", size: "sm" }),
                                    "justify-start h-8"
                                )}
                            >
                                <FileEdit className="mr-2 h-3.5 w-3.5" />
                                Zurück zur Detailansicht
                            </Link>
                        </nav>
                    </div>
                </>
            )}
        </ScrollArea>
    );
}