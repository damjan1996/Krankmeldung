// components/ui/card.tsx

import * as React from "react"

import { cn } from "@/lib/utils"

/**
 * Card-Komponente
 *
 * Eine Container-Komponente für Inhalte im Kartenformat.
 * Bietet eine konsistente Gestaltung für Inhalte, die als separate Einheit dargestellt werden sollen.
 */
const Card = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
    <div
        ref={ref}
        className={cn(
            "rounded-lg border bg-card text-card-foreground shadow-sm",
            className
        )}
        {...props}
    />
))
Card.displayName = "Card"

/**
 * CardHeader-Komponente
 *
 * Die obere Sektion einer Karte, typischerweise für Titel und Beschreibung verwendet.
 */
const CardHeader = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
    <div
        ref={ref}
        className={cn("flex flex-col space-y-1.5 p-6", className)}
        {...props}
    />
))
CardHeader.displayName = "CardHeader"

/**
 * CardTitle-Komponente
 *
 * Der Haupttitel einer Karte, typischerweise innerhalb des CardHeader verwendet.
 */
const CardTitle = React.forwardRef<
    HTMLParagraphElement,
    React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
    <h3
        ref={ref}
        className={cn(
            "text-2xl font-semibold leading-none tracking-tight",
            className
        )}
        {...props}
    />
))
CardTitle.displayName = "CardTitle"

/**
 * CardDescription-Komponente
 *
 * Eine Beschreibungskomponente für die Karte, typischerweise unterhalb des CardTitle.
 */
const CardDescription = React.forwardRef<
    HTMLParagraphElement,
    React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
    <p
        ref={ref}
        className={cn("text-sm text-muted-foreground", className)}
        {...props}
    />
))
CardDescription.displayName = "CardDescription"

/**
 * CardContent-Komponente
 *
 * Der Hauptinhaltsbereich der Karte.
 */
const CardContent = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
    <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
))
CardContent.displayName = "CardContent"

/**
 * CardFooter-Komponente
 *
 * Die untere Sektion einer Karte, typischerweise für Aktionen oder zusätzliche Informationen.
 */
const CardFooter = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
    <div
        ref={ref}
        className={cn("flex items-center p-6 pt-0", className)}
        {...props}
    />
))
CardFooter.displayName = "CardFooter"

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }