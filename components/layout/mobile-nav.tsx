"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";

import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { Menu, X } from "lucide-react";

/**
 * Interface für die MobileNav Komponente
 */
interface MobileNavProps {
    items?: {
        title: string;
        href: string;
        description?: string;
        disabled?: boolean;
        external?: boolean;
    }[];
    children?: React.ReactNode;
    className?: string;
}

/**
 * Mobile Navigationskomponente
 * Bietet ein aus der Seite herausschiebendes Menü für mobile Geräte
 */
export function MobileNav({ items, children, className }: MobileNavProps) {
    const pathname = usePathname();
    const { data: session } = useSession();
    const [open, setOpen] = React.useState(false);

    // Standard-Navigationspunkte
    const defaultItems = [
        {
            title: "Dashboard",
            href: "/dashboard",
            description: "Übersicht über aktuelle Krankmeldungen und Statistiken",
            disabled: false,
            external: false,
        },
        {
            title: "Krankmeldungen",
            href: "/krankmeldungen",
            description: "Verwaltung aller Krankmeldungen",
            disabled: false,
            external: false,
        },
        {
            title: "Mitarbeiter",
            href: "/mitarbeiter",
            description: "Übersicht und Verwaltung der Mitarbeiter",
            disabled: false,
            external: false,
        },
    ];

    // Admin-Navigationspunkt (nur für Administratoren)
    if (session?.user?.isAdmin) {
        defaultItems.push({
            title: "Administration",
            href: "/admin",
            description: "Verwaltungsoptionen für Administratoren",
            disabled: false,
            external: false,
        });
    }

    // Navigationspunkte die angezeigt werden sollen (entweder die übergebenen oder die Standard-Punkte)
    const navItems = items || defaultItems;

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <Button
                    variant="ghost"
                    className={cn("md:hidden", className)}
                    aria-label="Mobile Navigation öffnen"
                >
                    <Menu className="h-5 w-5" />
                    <span className="sr-only">Menü öffnen</span>
                </Button>
            </SheetTrigger>
            <SheetContent side="left" className="px-0">
                <SheetHeader className="px-4 border-b pb-4">
                    <SheetTitle className="flex justify-between items-center">
                        <span>Navigation</span>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setOpen(false)}
                            aria-label="Mobile Navigation schließen"
                        >
                            <X className="h-5 w-5" />
                            <span className="sr-only">Schließen</span>
                        </Button>
                    </SheetTitle>
                </SheetHeader>
                <ScrollArea className="h-[calc(100vh-8rem)] pb-10">
                    <div className="flex flex-col py-2">
                        {navItems.map((item, index) => (
                            <Link
                                key={index}
                                href={item.disabled ?? false ? "#" : item.href}
                                className={cn(
                                    "flex items-center py-3 px-4 text-sm font-medium transition-colors hover:bg-accent",
                                    item.href === pathname
                                        ? "bg-accent text-accent-foreground"
                                        : "text-muted-foreground",
                                    (item.disabled ?? false) && "cursor-not-allowed opacity-80"
                                )}
                                onClick={() => setOpen(false)}
                                target={item.external ?? false ? "_blank" : undefined}
                                rel={item.external ?? false ? "noopener noreferrer" : undefined}
                            >
                                {item.title}
                                {item.description && (
                                    <span className="ml-2 text-xs text-muted-foreground hidden sm:inline-block">
                    {item.description}
                  </span>
                                )}
                            </Link>
                        ))}
                    </div>
                    {children && (
                        <>
                            <div className="border-t px-4 py-4">
                                <div className="flex flex-col gap-4">{children}</div>
                            </div>
                        </>
                    )}
                </ScrollArea>
            </SheetContent>
        </Sheet>
    );
}