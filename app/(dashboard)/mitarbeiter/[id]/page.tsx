// app/(dashboard)/mitarbeiter/[id]/page.tsx

import { Metadata } from "next";
import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";

import { authOptions } from "@/lib/auth";
import { MitarbeiterDetailsWrapper } from "./wrapper";

export const metadata: Metadata = {
    title: "Mitarbeiter Details - GFU Krankmeldungssystem",
    description: "Detailansicht eines Mitarbeiters und seiner Krankenhistorie",
};

/**
 * Server Component für die Mitarbeiterdetailseite
 * Diese Komponente prüft die Authentifizierung und übergibt die ID korrekt mit await
 */
export default async function MitarbeiterDetailsPage({ params }: any) {
    // Benutzer-Session für Zugriffsrechte prüfen
    const session = await getServerSession(authOptions);

    if (!session) {
        redirect("/login");
    }

    // Auf das params-Objekt warten, bevor auf die ID zugegriffen wird
    const paramsObj = await params;
    const mitarbeiterId = paramsObj.id;

    // Nur die ID übergeben statt des serialisierten Objekts
    return <MitarbeiterDetailsWrapper mitarbeiterId={mitarbeiterId} userId={session.user.id} />;
}