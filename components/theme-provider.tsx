"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import { type ThemeProviderProps } from "next-themes/dist/types";

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
    // Konfiguriere die Anwendung, um immer das helle Theme zu verwenden
    const defaultProps = {
        defaultTheme: "light",
        enableSystem: false,
        forcedTheme: "light", // Das Theme wird erzwungen und kann nicht geändert werden
        disableTransitionOnChange: false,
        ...props
    };

    return (
        <NextThemesProvider {...defaultProps}>
            {children}
        </NextThemesProvider>
    );
}