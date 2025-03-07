// app/loading.tsx

import { Skeleton } from "@/components/ui/skeleton";

/**
 * Globale Loading-Komponente
 * Wird während des Seitenwechsels oder beim initialen Laden angezeigt
 */
export default function Loading() {
    return (
        <div className="container flex h-screen w-screen flex-col items-center justify-center">
            <div className="mx-auto flex w-full flex-col items-center space-y-8 max-w-xl">
                {/* Skelett für den Header */}
                <div className="flex flex-col items-center space-y-2 w-full">
                    <Skeleton className="h-8 w-2/3 rounded-md" />
                    <Skeleton className="h-4 w-1/2 rounded-md" />
                </div>

                {/* Skelett für Inhaltskarten */}
                <div className="w-full space-y-4">
                    <Skeleton className="h-48 w-full rounded-lg" />

                    <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                        <Skeleton className="h-32 w-full rounded-lg" />
                        <Skeleton className="h-32 w-full rounded-lg" />
                    </div>

                    <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
                        <Skeleton className="h-24 w-full rounded-lg" />
                        <Skeleton className="h-24 w-full rounded-lg" />
                        <Skeleton className="h-24 w-full rounded-lg" />
                    </div>
                </div>

                {/* Ladetext */}
                <div className="flex flex-col items-center space-y-2">
                    <div className="flex space-x-2 items-center">
                        <div className="h-4 w-4 rounded-full bg-primary animate-pulse" />
                        <div className="h-4 w-4 rounded-full bg-primary animate-pulse delay-100" />
                        <div className="h-4 w-4 rounded-full bg-primary animate-pulse delay-200" />
                    </div>
                    <p className="text-sm text-muted-foreground">
                        Seite wird geladen...
                    </p>
                </div>
            </div>
        </div>
    );
}