"use client"

import * as React from "react"
import * as PopoverPrimitive from "@radix-ui/react-popover"

import { cn } from "@/lib/utils"

/**
 * Popover Root Komponente
 * Basis-Container für alle Popover-Inhalte
 */
const Popover = PopoverPrimitive.Root

/**
 * Popover Trigger Komponente
 * Element, welches das Popover auslöst
 */
const PopoverTrigger = PopoverPrimitive.Trigger

/**
 * Popover Content Komponente
 * Inhalt des Popovers, wird angezeigt, wenn das Popover geöffnet ist
 */
const PopoverContent = React.forwardRef<
    React.ElementRef<typeof PopoverPrimitive.Content>,
    React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Content>
>(({ className, align = "center", sideOffset = 4, ...props }, ref) => (
    <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
            ref={ref}
            align={align}
            sideOffset={sideOffset}
            className={cn(
                "z-50 w-72 rounded-md border bg-popover p-4 text-popover-foreground shadow-md outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
                className
            )}
            {...props}
        />
    </PopoverPrimitive.Portal>
))
PopoverContent.displayName = PopoverPrimitive.Content.displayName

/**
 * Popover Close Komponente
 * Element innerhalb des Popovers, das es schließt, wenn es aktiviert wird
 */
const PopoverClose = PopoverPrimitive.Close

/**
 * Popover Arrow Komponente
 * Optional: Pfeil, der auf das Trigger-Element zeigt
 */
const PopoverArrow = PopoverPrimitive.Arrow

/**
 * Popover Anchor Komponente
 * Optional: Ermöglicht das Positionieren des Popovers relativ zu einem anderen Element als dem Trigger
 */
const PopoverAnchor = PopoverPrimitive.Anchor

export {
    Popover,
    PopoverTrigger,
    PopoverContent,
    PopoverClose,
    PopoverArrow,
    PopoverAnchor,
}