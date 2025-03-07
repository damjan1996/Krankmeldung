import "next-auth";
import "next-auth/jwt";

// Type extensions for Next-Auth
declare module "next-auth" {
    /**
     * Extends the built-in session types
     */
    interface Session {
        user: {
            id: string;
            email: string;
            name: string;
            isAdmin: boolean;
        };
    }

    /**
     * Extends the built-in user types
     */
    interface User {
        id: string;
        email: string;
        name?: string;
        isAdmin: boolean;
    }
}

declare module "next-auth/jwt" {
    /**
     * Extends the built-in JWT types
     */
    interface JWT {
        id: string;
        email: string;
        name?: string;
        isAdmin: boolean;
    }
}