// lib/auth.ts
import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "./prisma";

// Stelle sicher, dass ein Secret existiert
if (!process.env.NEXTAUTH_SECRET) {
    console.error("WARNUNG: NEXTAUTH_SECRET ist nicht definiert");
}

export const authOptions: NextAuthOptions = {
    providers: [
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Passwort", type: "password" }
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    return null;
                }

                try {
                    const user = await prisma.benutzer.findFirst({
                        where: {
                            email: credentials.email
                        }
                    });

                    if (!user || user.password !== credentials.password) {
                        return null;
                    }

                    return {
                        id: user.id,
                        email: user.email,
                        name: `${user.vorname || ''} ${user.nachname || ''}`.trim(),
                        isAdmin: user.istAdmin,
                    };
                } catch (error) {
                    console.error("Fehler bei der Authentifizierung:", error);
                    return null;
                }
            }
        })
    ],
    session: {
        strategy: "jwt",
        maxAge: 24 * 60 * 60, // 24 Stunden
    },
    secret: process.env.NEXTAUTH_SECRET,
    pages: {
        signIn: "/login",
        error: "/login",
    },
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id;
                token.isAdmin = user.isAdmin;
            }
            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                session.user.id = token.id as string;
                session.user.isAdmin = token.isAdmin as boolean;
            }
            return session;
        }
    },
    debug: process.env.NODE_ENV === "development",
};