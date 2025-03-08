import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "./prisma";

export const authOptions: NextAuthOptions = {
    // Geheimschlüssel für die Codierung der JWT-Tokens
    secret: process.env.NEXTAUTH_SECRET,

    // Konfiguration der Seiten-URLs
    pages: {
        signIn: "/login",
        error: "/login",
    },

    // Session-Konfiguration: JWT statt Datenbank-Sessions
    session: {
        strategy: "jwt",
        maxAge: 24 * 60 * 60, // 24 Stunden
    },

    // Authentifizierungsanbieter
    providers: [
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Passwort", type: "password" }
            },

            // Authentifizierungslogik
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    return null;
                }

                try {
                    // Benutzer anhand der E-Mail-Adresse finden
                    const user = await prisma.benutzer.findUnique({
                        where: { email: credentials.email }
                    });

                    // Prüfen, ob Benutzer existiert und Passwort übereinstimmt
                    // Hinweis: In einer Produktionsumgebung sollte immer Passwort-Hashing verwendet werden!
                    if (!user || user.password !== credentials.password) {
                        return null;
                    }

                    // Benutzerinformationen zurückgeben, die in das JWT-Token aufgenommen werden
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

    // JWT-Konfiguration: Anpassen der Token-Inhalte
    callbacks: {
        // Hinzufügen von benutzerdefinierten Eigenschaften zum JWT
        jwt: async ({ token, user }) => {
            if (user) {
                token.id = user.id;
                token.email = user.email;
                token.name = user.name;
                token.isAdmin = user.isAdmin;
            }
            return token;
        },

        // Hinzufügen von benutzerdefinierten Eigenschaften zur Session
        session: async ({ session, token }) => {
            if (token) {
                session.user.id = token.id as string;
                session.user.email = token.email as string;
                session.user.name = token.name as string;
                session.user.isAdmin = token.isAdmin as boolean;
            }
            return session;
        },
    },
};