// components/ui/textarea.tsx

import * as React from "react"

import { cn } from "@/lib/utils"

/**
 * TextareaProps
 *
 * Erweitert die HTML TextArea Eigenschaften ohne zusätzliche spezifische Props.
 */
export interface TextareaProps
    extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

/**
 * Textarea-Komponente
 *
 * Eine anpassbare Mehrzeilen-Texteingabekomponente.
 * Bietet konsistente Stilisierung und Benutzerfreundlichkeit für Mehrzeilentexteingaben.
 */
const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
    ({ className, ...props }, ref) => {
        return (
            <textarea
                className={cn(
                    "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
                    className
                )}
                ref={ref}
                {...props}
            />
        )
    }
)
Textarea.displayName = "Textarea"

export { Textarea }