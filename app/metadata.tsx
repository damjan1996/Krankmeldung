import { Metadata } from 'next';

// Metadata für die Anwendung
export const metadata: Metadata = {
    title: {
        default: 'GFU Krankmeldungssystem',
        template: '%s | GFU Krankmeldungssystem',
    },
    description: 'System zur Erfassung und Verwaltung von Krankmeldungen',
    icons: {
        icon: '/icon.png',
        shortcut: '/icon.png',
        apple: '/icon.png',
    },
};