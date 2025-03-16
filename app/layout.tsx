import React from "react";
import { Inter } from "next/font/google";
import { AuthProvider } from "@/components/session-provider";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/toaster";
import './globals.css';

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata = {
    title: 'GFU Krankmeldungssystem',
    description: 'System zur Erfassung und Verwaltung von Krankmeldungen',
}

export default function RootLayout({
                                       children,
                                   }: {
    children: React.ReactNode;
}) {
    return (
        <html lang="de" suppressHydrationWarning>
        <body className={`font-sans ${inter.variable}`} suppressHydrationWarning>
        <AuthProvider>
            <ThemeProvider
                attribute="class"
                defaultTheme="light"
                enableSystem={false}
                forcedTheme="light"
                disableTransitionOnChange
            >
                {children}
                <Toaster />
            </ThemeProvider>
        </AuthProvider>
        </body>
        </html>
    );
}