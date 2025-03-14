// components/layout/site-header.tsx

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";

import { cn } from "@/lib/utils";
import { Button, buttonVariants } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuShortcut,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MainNav } from "@/components/layout/main-nav";
import { MobileNav } from "@/components/layout/mobile-nav";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import {
    Bell,
    CalendarPlus,
    Calendar,
    LogOut,
    Menu,
    Settings,
    // Removing unused import
    FileWarning,
    ArrowLeftRight,
    Globe,
    LifeBuoy,
    HelpCircle,
    Inbox
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { useToast } from "@/lib/hooks/use-toast";

/**
 * Interface für die SiteHeader Komponente
 */
interface SiteHeaderProps {
    showOnlyOnDashboardPages?: boolean;
    showMobileNav?: boolean;
    className?: string;
}

/**
 * Header-Komponente der Webseite
 * Enthält Navigation, Benutzermenü und Aktionen
 */
export function SiteHeader({
                               showOnlyOnDashboardPages = true,
                               showMobileNav = true,
                               className,
                           }: SiteHeaderProps) {
    const router = useRouter();
    const pathname = usePathname();
    const { data: session, status } = useSession();
    const { toast } = useToast();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
    const [activeNotifications, setActiveNotifications] = useState<number>(0);

    // Nur auf Dashboard-Seiten anzeigen (falls aktiviert)
    const isDashboardPage = showOnlyOnDashboardPages ?
        pathname.startsWith("/dashboard") ||
        pathname.startsWith("/krankmeldungen") ||
        pathname.startsWith("/mitarbeiter") ||
        pathname.startsWith("/berichte") ||
        pathname.startsWith("/admin")
        : true;

    // Nach Navigation das mobile Menü schließen
    useEffect(() => {
        if (isMobileMenuOpen) {
            setIsMobileMenuOpen(false);
        }
    }, [pathname, isMobileMenuOpen]);

    // Simuliere Benachrichtigungen (in einer echten App würden diese aus einer API geladen)
    useEffect(() => {
        // Beispiel: Simuliere neue Benachrichtigungen basierend auf der Benutzerrolle
        if (session?.user?.isAdmin) {
            setActiveNotifications(3);
        } else if (session?.user) {
            setActiveNotifications(1);
        }
    }, [session]);

    // Abmelden mit Toast-Benachrichtigung
    const handleSignOut = async () => {
        await signOut({ redirect: false });

        toast({
            title: "Erfolgreich abgemeldet",
            description: "Sie wurden erfolgreich vom System abgemeldet.",
        });

        router.push("/");
    };

    // Benutzer-Initialen für Avatar erstellen
    const getInitials = () => {
        if (!session?.user?.name) return "?";

        const nameParts = session.user.name.split(" ");
        if (nameParts.length >= 2) {
            return `${nameParts[0][0]}${nameParts[1][0]}`.toUpperCase();
        }
        return nameParts[0][0].toUpperCase();
    };

    if (showOnlyOnDashboardPages && !isDashboardPage) {
        return null;
    }

    // UI für nicht angemeldete Benutzer
    if (status === "unauthenticated") {
        return (
            <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
                <div className="container flex h-14 items-center justify-between">
                    <Link href="/" className="flex items-center space-x-2">
                        <span className="font-semibold text-lg">GFU Krankmeldungssystem</span>
                    </Link>
                    <Link href="/login" className={buttonVariants()}>
                        Anmelden
                    </Link>
                </div>
            </header>
        );
    }

    return (
        <header className={cn(
            "sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur",
            className
        )}>
            <div className="container flex h-14 items-center justify-between">
                <div className="flex items-center gap-4 md:gap-8">
                    {/* Mobile Menu Trigger */}
                    {showMobileNav && (
                        <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                            <SheetTrigger asChild>
                                <Button
                                    variant="ghost"
                                    className="mr-2 px-0 text-base hover:bg-transparent focus:ring-0 md:hidden"
                                >
                                    <Menu className="h-5 w-5" />
                                    <span className="sr-only">Navigation öffnen</span>
                                </Button>
                            </SheetTrigger>
                            <SheetContent side="left" className="pr-0 sm:max-w-xs">
                                <MobileNav />
                            </SheetContent>
                        </Sheet>
                    )}

                    {/* Logo & Main Navigation */}
                    <MainNav />
                </div>

                {/* Right Side: Notifications, Actions, Theme, User Menu */}
                <div className="flex items-center gap-2">
                    {/* Quick Action - New Krankmeldung */}
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 gap-1 hidden md:flex"
                        asChild
                    >
                        <Link href="/krankmeldungen/neu">
                            <CalendarPlus className="h-4 w-4" />
                            <span className="hidden lg:inline-block">Neue Krankmeldung</span>
                        </Link>
                    </Button>

                    {/* Notification Button */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="relative">
                                <Bell className="h-5 w-5" />
                                {activeNotifications > 0 && (
                                    <Badge
                                        variant="destructive"
                                        className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full p-0 text-xs"
                                    >
                                        {activeNotifications}
                                    </Badge>
                                )}
                                <span className="sr-only">Benachrichtigungen</span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-80" align="end">
                            <DropdownMenuLabel className="flex items-center justify-between">
                                Benachrichtigungen
                                <Badge variant="outline" className="ml-1 px-1 font-normal">
                                    {activeNotifications}
                                </Badge>
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <ScrollArea className="h-80">
                                {activeNotifications > 0 ? (
                                    <div className="flex flex-col gap-1 p-1">
                                        <DropdownMenuItem className="cursor-pointer flex flex-col items-start gap-1 p-2">
                                            <div className="flex items-center w-full justify-between mb-1">
                                                <div className="flex items-center">
                                                    <FileWarning className="h-5 w-5 text-yellow-500 mr-2" />
                                                    <span className="font-medium">Krankmeldung abgelaufen</span>
                                                </div>
                                                <span className="text-xs text-muted-foreground">Heute</span>
                                            </div>
                                            <p className="text-sm text-muted-foreground">
                                                Die Krankmeldung von Max Mustermann ist heute abgelaufen.
                                            </p>
                                        </DropdownMenuItem>

                                        {session?.user?.isAdmin && (
                                            <>
                                                <DropdownMenuItem className="cursor-pointer flex flex-col items-start gap-1 p-2">
                                                    <div className="flex items-center w-full justify-between mb-1">
                                                        <div className="flex items-center">
                                                            <ArrowLeftRight className="h-5 w-5 text-blue-500 mr-2" />
                                                            <span className="font-medium">Statusänderung</span>
                                                        </div>
                                                        <span className="text-xs text-muted-foreground">Gestern</span>
                                                    </div>
                                                    <p className="text-sm text-muted-foreground">
                                                        Maria Schmidt hat eine Krankmeldung als abgeschlossen markiert.
                                                    </p>
                                                </DropdownMenuItem>

                                                <DropdownMenuItem className="cursor-pointer flex flex-col items-start gap-1 p-2">
                                                    <div className="flex items-center w-full justify-between mb-1">
                                                        <div className="flex items-center">
                                                            <Calendar className="h-5 w-5 text-green-500 mr-2" />
                                                            <span className="font-medium">Neue Krankmeldung</span>
                                                        </div>
                                                        <span className="text-xs text-muted-foreground">Vor 2 Tagen</span>
                                                    </div>
                                                    <p className="text-sm text-muted-foreground">
                                                        Julian Weber hat eine neue Krankmeldung erstellt.
                                                    </p>
                                                </DropdownMenuItem>
                                            </>
                                        )}
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-40">
                                        <Inbox className="h-10 w-10 text-muted-foreground mb-2" />
                                        <p className="text-sm text-muted-foreground">
                                            Keine Benachrichtigungen vorhanden
                                        </p>
                                    </div>
                                )}
                            </ScrollArea>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem asChild className="cursor-pointer justify-center">
                                <Link href="/dashboard">
                                    Alle Benachrichtigungen anzeigen
                                </Link>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    {/* Theme Toggle */}
                    <ThemeToggle />

                    {/* User Menu */}
                    {session?.user && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild className="overflow-hidden">
                                <Button variant="ghost" size="icon" className="relative h-8 w-8 rounded-full">
                                    <Avatar className="h-8 w-8">
                                        <AvatarFallback className="bg-primary text-primary-foreground">
                                            {getInitials()}
                                        </AvatarFallback>
                                    </Avatar>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-56" align="end">
                                <DropdownMenuLabel>Mein Account</DropdownMenuLabel>

                                {/* User Info */}
                                <div className="flex flex-col space-y-1 p-2">
                                    <p className="text-sm font-medium leading-none">
                                        {session.user.name || session.user.email}
                                    </p>
                                    {session.user.email && (
                                        <p className="text-xs leading-none text-muted-foreground">
                                            {session.user.email}
                                        </p>
                                    )}
                                    {session.user.isAdmin && (
                                        <Badge variant="outline" className="mt-1 w-fit">
                                            Administrator
                                        </Badge>
                                    )}
                                </div>
                                <DropdownMenuSeparator />

                                {/* Common Actions */}
                                <DropdownMenuGroup>
                                    <DropdownMenuItem asChild>
                                        <Link href="/dashboard" className="cursor-pointer">
                                            <Globe className="mr-2 h-4 w-4" />
                                            <span>Dashboard</span>
                                        </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem asChild>
                                        <Link href="/krankmeldungen/neu" className="cursor-pointer">
                                            <CalendarPlus className="mr-2 h-4 w-4" />
                                            <span>Neue Krankmeldung</span>
                                        </Link>
                                    </DropdownMenuItem>
                                    {session.user.isAdmin && (
                                        <DropdownMenuItem asChild>
                                            <Link href="/dashboard" className="cursor-pointer">
                                                <Settings className="mr-2 h-4 w-4" />
                                                <span>Einstellungen</span>
                                            </Link>
                                        </DropdownMenuItem>
                                    )}
                                </DropdownMenuGroup>
                                <DropdownMenuSeparator />

                                {/* Help Section */}
                                <DropdownMenuGroup>
                                    <DropdownMenuItem asChild>
                                        <Link href="/dashboard" className="cursor-pointer">
                                            <HelpCircle className="mr-2 h-4 w-4" />
                                            <span>Hilfe & Dokumentation</span>
                                        </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem asChild>
                                        <Link href="/dashboard" className="cursor-pointer">
                                            <LifeBuoy className="mr-2 h-4 w-4" />
                                            <span>Support</span>
                                        </Link>
                                    </DropdownMenuItem>
                                </DropdownMenuGroup>
                                <DropdownMenuSeparator />

                                {/* Logout */}
                                <DropdownMenuItem
                                    onClick={handleSignOut}
                                    className="cursor-pointer text-destructive focus:text-destructive"
                                >
                                    <LogOut className="mr-2 h-4 w-4" />
                                    <span>Abmelden</span>
                                    <DropdownMenuShortcut>⇧⌘Q</DropdownMenuShortcut>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}
                </div>
            </div>
        </header>
    );
}