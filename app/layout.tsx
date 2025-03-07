import React from "react";
import { Inter } from "next/font/google";
import { AuthProvider } from "@/components/session-provider";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/toaster";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

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
                defaultTheme="system"
                enableSystem
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