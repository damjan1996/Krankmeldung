// components/layout/main-nav.tsx

"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Menu } from "lucide-react";

/**
 * Interface für die MainNav Komponente
 */
interface MainNavProps {
    items?: {
        title: string;
        href: string;
        description?: string;
        disabled?: boolean;
        external?: boolean;
    }[];
    // _showMobileMenu Parameter entfernt, da er nicht verwendet wird
    onMobileMenuToggle?: () => void;
    className?: string;
}

/**
 * Hauptnavigationskomponente
 * Zeigt die primären Navigationspunkte in der oberen Leiste an
 */
export function MainNav({
                            items,
                            onMobileMenuToggle,
                            className,
                        }: MainNavProps) {
    const pathname = usePathname();
    const { data: session } = useSession();

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
        <div className={cn("flex gap-6 md:gap-10", className)}>
            {/* Mobile Menu Toggle */}
            {onMobileMenuToggle && (
                <Button
                    variant="ghost"
                    onClick={onMobileMenuToggle}
                    className="md:hidden"
                    aria-label="Toggle mobile menu"
                >
                    <Menu className="h-5 w-5" />
                    <span className="sr-only">Toggle menu</span>
                </Button>
            )}

            {/* Logo/Brand */}
            <Link href="/" className="hidden items-center space-x-2 md:flex">
        <span className="hidden font-bold sm:inline-block">
          GFU Krankmeldungssystem
        </span>
            </Link>

            {/* Desktop Navigation Menu */}
            <nav className="hidden gap-6 md:flex">
                {navItems.map((item, index) => (
                    <Link
                        key={index}
                        href={item.disabled ? "#" : item.href}
                        className={cn(
                            "flex items-center text-sm font-medium transition-colors hover:text-primary",
                            item.href === pathname
                                ? "text-foreground"
                                : "text-muted-foreground",
                            item.disabled && "cursor-not-allowed opacity-80"
                        )}
                        target={item.external ?? false ? "_blank" : undefined}
                        rel={item.external ?? false ? "noopener noreferrer" : undefined}
                    >
                        {item.title}
                    </Link>
                ))}
            </nav>

            {/* Mobile Navigation Menu (Dropdown) */}
            <DropdownMenu>
                <DropdownMenuTrigger asChild className="md:hidden">
                    <Button variant="ghost" className="px-0 text-base hover:bg-transparent focus:ring-0">
                        <span className="font-bold">Menü</span>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                    align="start"
                    sideOffset={24}
                    alignOffset={4}
                    className="w-[200px] overflow-scroll"
                >
                    <DropdownMenuLabel>Navigation</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {navItems.map((item, index) => (
                        <DropdownMenuItem
                            key={index}
                            asChild={!item.disabled}
                            disabled={item.disabled ?? false}
                        >
                            {!item.disabled ? (
                                <Link href={item.href}>{item.title}</Link>
                            ) : (
                                item.title
                            )}
                        </DropdownMenuItem>
                    ))}
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );
}