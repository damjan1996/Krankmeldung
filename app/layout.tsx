// app/layout.tsx
import { AuthProvider } from "@/components/session-provider";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/toaster";

import "./globals.css";

export default function RootLayout({
                                       children,
                                   }: {
    children: React.ReactNode;
}) {
    return (
        <html lang="de" suppressHydrationWarning>
        <head />
        <body suppressHydrationWarning>
        <AuthProvider>
            <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
                {children}
                <Toaster />
            </ThemeProvider>
        </AuthProvider>
        </body>
        </html>
    );
}