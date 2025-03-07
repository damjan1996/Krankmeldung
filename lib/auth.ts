import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import prisma from './prisma';

export const authOptions: NextAuthOptions = {
    providers: [
        CredentialsProvider({
            name: 'Credentials',
            credentials: {
                email: { label: 'Email', type: 'text' },
                password: { label: 'Passwort', type: 'password' },
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    return null;
                }

                const user = await prisma.benutzer.findUnique({
                    where: {
                        email: credentials.email,
                    },
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
            },
        }),
    ],
    callbacks: {
        jwt: async ({ token, user }) => {
            if (user) {
                token.id = user.id;
                token.email = user.email;
                token.name = user.name;
                token.isAdmin = (user as any).isAdmin;
            }
            return token;
        },
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
    pages: {
        signIn: '/login',
    },
    session: {
        strategy: 'jwt',
        maxAge: 60 * 60 * 24, // 24 hours
    },
    secret: process.env.NEXTAUTH_SECRET,
};

// Type extensions for Next-Auth
declare module 'next-auth' {
    interface User {
        id: string;
        email: string;
        name?: string;
        isAdmin: boolean;
    }

    interface Session {
        user: User;
    }
}

declare module 'next-auth/jwt' {
    interface JWT {
        id: string;
        email: string;
        name?: string;
        isAdmin: boolean;
    }
}