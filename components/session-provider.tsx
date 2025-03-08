'use client';

import { SessionProvider } from "next-auth/react";
import { ReactNode } from "react";

type Props = {
    children: ReactNode;
}

export function AuthProvider({ children }: Props) {
    return (
        <SessionProvider refetchInterval={5 * 60} refetchOnWindowFocus={true}>
            {children}
        </SessionProvider>
    );
}