// components/dashboard/krankmeldung-status-card.tsx

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { FileCheck, FileWarning, Users } from "lucide-react";

/**
 * Props für die KrankmeldungStatusCard-Komponente
 */
interface KrankmeldungStatusCardProps {
    title: string;
    value: number;
    description: string;
    icon?: "active" | "completed" | "users" | null;
    trend?: {
        value: number;
        isPositive: boolean;
        label: string;
    } | null;
    actionLink?: string;
    actionLabel?: string;
    className?: string;
}

/**
 * Komponente zur Anzeige von Statistikkarten auf dem Dashboard
 */
export function KrankmeldungStatusCard({
                                           title,
                                           value,
                                           description,
                                           icon = null,
                                           trend = null,
                                           actionLink,
                                           actionLabel,
                                           className,
                                       }: KrankmeldungStatusCardProps) {
    // Icon basierend auf Typ auswählen
    let IconComponent;
    switch (icon) {
        case "active":
            IconComponent = <FileWarning className="h-5 w-5 text-blue-500" />;
            break;
        case "completed":
            IconComponent = <FileCheck className="h-5 w-5 text-green-500" />;
            break;
        case "users":
            IconComponent = <Users className="h-5 w-5 text-orange-500" />;
            break;
        default:
            IconComponent = null;
    }

    return (
        <Card className={cn("overflow-hidden", className)}>
            <CardContent className="p-6">
                <div className="flex flex-col space-y-2">
                    {/* Header mit Icon und Titel */}
                    <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-muted-foreground">
                            {title}
                        </p>
                        {IconComponent}
                    </div>

                    {/* Hauptwert */}
                    <div className="flex items-baseline space-x-2">
                        <p className="text-3xl font-bold">{value}</p>

                        {/* Trend anzeigen, wenn verfügbar */}
                        {trend && (
                            <span
                                className={cn(
                                    "text-xs font-medium inline-flex items-center",
                                    trend.isPositive ? "text-green-600" : "text-red-600"
                                )}
                            >
                {trend.isPositive ? "+" : "-"}{trend.value}%
                <span className="ml-1 text-muted-foreground">
                  {trend.label}
                </span>
              </span>
                        )}
                    </div>

                    {/* Beschreibung */}
                    <p className="text-xs text-muted-foreground">
                        {description}
                    </p>

                    {/* Action-Link anzeigen, wenn verfügbar */}
                    {actionLink && actionLabel && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="mt-2 -ml-3 h-8 w-fit"
                            asChild
                        >
                            <Link href={actionLink}>
                                {actionLabel}
                            </Link>
                        </Button>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}