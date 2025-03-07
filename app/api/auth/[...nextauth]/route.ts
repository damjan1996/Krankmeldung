// app/api/auth/[...nextauth]/route.ts

import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";

// Handler für API-Route erstellen
const handler = NextAuth(authOptions);

// Nur die GET und POST Handler exportieren, keine anderen Werte oder Objekte
export { handler as GET, handler as POST };