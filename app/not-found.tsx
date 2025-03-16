import Link from "next/link";
import { ArrowLeft, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
    return (
        <div className="flex min-h-screen flex-col bg-background">
            <div className="flex-1 flex items-center justify-center">
                <div className="container flex flex-col items-center justify-center space-y-6 px-4 md:px-6 py-8 text-center">
                    <div className="space-y-2">
                        <h1 className="text-6xl font-bold tracking-tighter sm:text-7xl">404</h1>
                        <h2 className="text-3xl font-bold tracking-tight">Seite nicht gefunden</h2>
                        <p className="max-w-[600px] text-muted-foreground md:text-xl/relaxed">
                            Die angeforderte Seite konnte nicht gefunden werden.
                            Bitte überprüfen Sie die URL oder kehren Sie zur Startseite zurück.
                        </p>
                    </div>
                    <div className="flex flex-col gap-3 sm:flex-row">
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