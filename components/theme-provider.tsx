"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import { type ThemeProviderProps } from "next-themes/dist/types";

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
    // Stelle sicher, dass ein defaultTheme gesetzt ist für konsistentes Server/Client-Rendering
    const defaultProps = {
        defaultTheme: "system",
        enableSystem: true,
        disableTransitionOnChange: false,
        ...props
    };

    return (
        <NextThemesProvider {...defaultProps}>
            {children}
        </NextThemesProvider>
    );
}