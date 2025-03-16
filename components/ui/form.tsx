// components/ui/form.tsx

import * as React from "react"
import * as LabelPrimitive from "@radix-ui/react-label"
import { Slot } from "@radix-ui/react-slot"
import {
    Controller,
    ControllerProps,
    FieldPath,
    FieldValues,
    FormProvider,
    useFormContext,
} from "react-hook-form"

import { cn } from "@/lib/utils"
import { Label } from "@/components/ui/label"

/**
 * Form-Komponente
 *
 * Ein Wrapper um react-hook-form's FormProvider, der den Formularkontext bereitstellt.
 */
const Form = FormProvider

/**
 * FormFieldContext
 *
 * React Context zum Verfolgen des aktuellen Feldnamens innerhalb eines FormFields.
 */
const FormFieldContext = React.createContext<{ name: string }>({ name: "" })

/**
 * FormField-Komponente
 *
 * Stellt einen Wrapper für ein Formularfeld bereit, der den Formularkontext und den Namen des Feldes verwaltet.
 */
const FormField = <
    TFieldValues extends FieldValues = FieldValues,
    TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
>({
      ...props
  }: ControllerProps<TFieldValues, TName>) => {
    return (
        <FormFieldContext.Provider value={{ name: props.name }}>
            <Controller {...props} />
        </FormFieldContext.Provider>
    )
}

/**
 * useFormField-Hook
 *
 * Custom Hook, der den aktuellen Feldkontext und Formularkontext kombiniert.
 * Gibt Zugriff auf den Feldnamen, Feldstatus und Formularkontext.
 */
const useFormField = () => {
    const fieldContext = React.useContext(FormFieldContext)
    const itemContext = React.useContext(FormItemContext)
    const { getFieldState, formState } = useFormContext()

    const fieldState = getFieldState(fieldContext.name, formState)

    if (!fieldContext) {
        throw new Error("useFormField sollte innerhalb von <FormField> verwendet werden")
    }

    const { id } = itemContext

    return {
        id,
        name: fieldContext.name,
        formItemId: `${id}-form-item`,
        formDescriptionId: `${id}-form-item-description`,
        formMessageId: `${id}-form-item-message`,
        ...fieldState,
    }
}

/**
 * FormItemContext
 *
 * React Context zum Verfolgen der ID eines Formularelements.
 */
const FormItemContext = React.createContext<{ id: string }>({ id: "" })

/**
 * FormItem-Komponente
 *
 * Container für ein Formularelement, der eine eindeutige ID für das Element bereitstellt.
 */
const FormItem = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
    const id = React.useId()

    return (
        <FormItemContext.Provider value={{ id }}>
            <div ref={ref} className={cn("space-y-2", className)} {...props} />
        </FormItemContext.Provider>
    )
})
FormItem.displayName = "FormItem"

/**
 * FormLabel-Komponente
 *
 * Label für ein Formularelement, das optional einen Fehler-Styling anzeigen kann.
 */
const FormLabel = React.forwardRef<
    React.ElementRef<typeof LabelPrimitive.Root>,
    React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root>
>(({ className, ...props }, ref) => {
    const { error, formItemId } = useFormField()

    return (
        <Label
            ref={ref}
            className={cn(error && "text-destructive", className)}
            htmlFor={formItemId}
            {...props}
        />
    )
})
FormLabel.displayName = "FormLabel"

/**
 * FormControl-Komponente
 *
 * Wrapper um ein Formularelement, der die notwendigen ARIA-Attribute für Barrierefreiheit hinzufügt.
 */
const FormControl = React.forwardRef<
    React.ElementRef<typeof Slot>,
    React.ComponentPropsWithoutRef<typeof Slot>
>(({ ...props }, ref) => {
    const { error, formItemId, formDescriptionId, formMessageId } = useFormField()

    return (
        <Slot
            ref={ref}
            id={formItemId}
            aria-describedby={
                !error
                    ? `${formDescriptionId}`
                    : `${formDescriptionId} ${formMessageId}`
            }
            aria-invalid={!!error}
            {...props}
        />
    )
})
FormControl.displayName = "FormControl"

/**
 * FormDescription-Komponente
 *
 * Beschreibungstext für ein Formularelement, der zusätzliche Informationen bereitstellt.
 * Geändert von <p> zu <div>, um HTML-Nestingprobleme zu vermeiden
 */
const FormDescription = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
    const { formDescriptionId } = useFormField()

    return (
        <div
            ref={ref}
            id={formDescriptionId}
            className={cn("text-sm text-muted-foreground", className)}
            {...props}
        />
    )
})
FormDescription.displayName = "FormDescription"

/**
 * FormMessage-Komponente
 *
 * Zeigt eine Fehlermeldung für ein Formularfeld an, wenn ein Fehler vorliegt.
 */
const FormMessage = React.forwardRef<
    HTMLParagraphElement,
    React.HTMLAttributes<HTMLParagraphElement>
>(({ className, children, ...props }, ref) => {
    const { error, formMessageId } = useFormField()
    const body = error ? String(error?.message) : children

    if (!body) {
        return null
    }

    return (
        <p
            ref={ref}
            id={formMessageId}
            className={cn("text-sm font-medium text-destructive", className)}
            {...props}
        >
            {body}
        </p>
    )
})
FormMessage.displayName = "FormMessage"

export {
    useFormField,
    Form,
    FormItem,
    FormLabel,
    FormControl,
    FormDescription,
    FormMessage,
    FormField,
}