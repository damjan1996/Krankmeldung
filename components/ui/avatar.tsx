// components/ui/avatar.tsx

"use client"

import * as React from "react"
import * as AvatarPrimitive from "@radix-ui/react-avatar"

import { cn } from "@/lib/utils"

/**
 * Avatar-Komponente
 *
 * Eine Komponente, die ein Bild repräsentiert, das einen Benutzer oder eine Entität darstellt.
 * Basiert auf Radix UI Avatar-Primitive.
 */
const Avatar = React.forwardRef<
    React.ElementRef<typeof AvatarPrimitive.Root>,
    React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root>
>(({ className, ...props }, ref) => (
    <AvatarPrimitive.Root
        ref={ref}
        className={cn(
            "relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full",
            className
        )}
        {...props}
    />
))
Avatar.displayName = AvatarPrimitive.Root.displayName

/**
 * AvatarImage-Komponente
 *
 * Zeigt ein Bild innerhalb eines Avatars an.
 * Unterstützt automatisches Fallback zu AvatarFallback, wenn das Bild nicht geladen werden kann.
 */
const AvatarImage = React.forwardRef<
    React.ElementRef<typeof AvatarPrimitive.Image>,
    React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Image>
>(({ className, ...props }, ref) => (
    <AvatarPrimitive.Image
        ref={ref}
        className={cn("aspect-square h-full w-full", className)}
        {...props}
    />
))
AvatarImage.displayName = AvatarPrimitive.Image.displayName

/**
 * AvatarFallback-Komponente
 *
 * Wird angezeigt, wenn das Avatar-Bild nicht geladen werden kann oder kein Bild angegeben ist.
 * Typischerweise zeigt es Initialen oder ein generisches Benutzersymbol an.
 */
const AvatarFallback = React.forwardRef<
    React.ElementRef<typeof AvatarPrimitive.Fallback>,
    React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Fallback>
>(({ className, ...props }, ref) => (
    <AvatarPrimitive.Fallback
        ref={ref}
        className={cn(
            "flex h-full w-full items-center justify-center rounded-full bg-muted",
            className
        )}
        {...props}
    />
))
AvatarFallback.displayName = AvatarPrimitive.Fallback.displayName

export { Avatar, AvatarImage, AvatarFallback }