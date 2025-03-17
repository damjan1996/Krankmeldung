import { PrismaClient } from '@prisma/client';

// PrismaClient ist eine schwere Instanz mit Verbindungspooling,
// daher verwenden wir in der Entwicklung ein globales Singleton
// https://www.prisma.io/docs/guides/performance-and-optimization/connection-management

// Cache-Typdefinition für globalen Scope
interface CacheEntry {
    data: any;
    expiry: number;
}

// Type-safe global typing
declare global {
    // eslint-disable-next-line no-var
    var prisma: PrismaClient | undefined;
    // eslint-disable-next-line no-var
    var __prismaCache: Map<string, CacheEntry> | undefined;
}

// Erstellen einer neuen PrismaClient-Instanz oder Nutzung der bestehenden
export const prisma = global.prisma || new PrismaClient({
    log: ['error'],
    // Erweiterte Verbindungsoptionen für bessere Performance
    datasources: {
        db: {
            url: process.env.DATABASE_URL,
        },
    },
});

// Initialisiere oder verwende bestehenden Cache
const cache = global.__prismaCache || new Map<string, CacheEntry>();

// Wenn wir nicht in Produktion sind, setzen wir prisma in den globalen Scope
if (process.env.NODE_ENV !== 'production') {
    global.prisma = prisma;
    global.__prismaCache = cache;
}

// Warm-up der Datenbank-Verbindung beim Start
const warmupConnection = async (): Promise<void> => {
    try {
        await prisma.$queryRaw`SELECT 1`;
        // eslint-disable-next-line no-console
        console.log('Database connection warmed up');
    } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Failed to warm up database connection:', error);
    }
};

// Führe Warmup nur serverseitig aus
if (typeof window === 'undefined') {
    // Use void to explicitly ignore the promise
    void warmupConnection();
}

// Hilfsfunktion für gecachte Datenabfragen
export async function fetchWithCache<T>(
    key: string,
    fetchFn: () => Promise<T>,
    ttl = 30000 // Default TTL: 30 Sekunden
): Promise<T> {
    // Prüfen, ob Cache deaktiviert ist (z.B. im Testmodus)
    if (process.env.DISABLE_CACHE === 'true') {
        return fetchFn();
    }

    const cacheEntry = cache.get(key);

    // Cache-Hit: Daten aus Cache zurückgeben, wenn nicht abgelaufen
    if (cacheEntry && cacheEntry.expiry > Date.now()) {
        return cacheEntry.data as T;
    }

    // Cache-Miss oder abgelaufen: Frische Daten abrufen
    const data = await fetchFn();

    // Daten im Cache speichern
    cache.set(key, {
        data,
        expiry: Date.now() + ttl
    });

    return data;
}

// Marking unused functions with underscore prefix
// Default-Export für Kompatibilität mit existierenden Imports
export default prisma;