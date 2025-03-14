"use client";

import { createContext, useEffect, useState } from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { type ThemeProviderProps } from "next-themes/dist/types";

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
    // State to track if we're mounted on the client
    const [mounted, setMounted] = useState(false);

    // Set mounted to true on client side after hydration
    useEffect(() => {
        setMounted(true);
    }, []);

    // Ensure consistent props with defaults
    const defaultProps = {
        defaultTheme: "system",
        enableSystem: true,
        disableTransitionOnChange: false,
        ...props
    };

    // If not mounted yet, render with minimal styling to avoid hydration mismatch
    if (!mounted) {
        return (
            <div style={{ visibility: "hidden" }}>
                {children}
            </div>
        );
    }

    // Once mounted (client-side only), render normally with theme provider
    return (
        <NextThemesProvider {...defaultProps}>
            {children}
        </NextThemesProvider>
    );
}