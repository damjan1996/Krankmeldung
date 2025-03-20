// app/page.tsx
import { redirect } from 'next/navigation';

/**
 * Startseite der Anwendung
 * Leitet automatisch zur Login-Seite weiter
 */
export default function HomePage() {
    redirect('/login');
}