import { PrismaClient } from '@prisma/client';

// PrismaClient ist eine schwere Instanz mit Verbindungspooling,
// daher verwenden wir in der Entwicklung ein globales Singleton
// https://www.prisma.io/docs/guides/performance-and-optimization/connection-management

// Diese Variable existiert nur während der Entwicklung im globalen Scope
declare global {
    // eslint-disable-next-line no-var
    var prisma: PrismaClient | undefined;
}

// Erstellen einer neuen PrismaClient-Instanz oder Nutzung der bestehenden
export const prisma = globalThis.prisma || new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

// Wenn wir nicht in Produktion sind, setzen wir prisma in den globalen Scope
if (process.env.NODE_ENV !== 'production') {
    globalThis.prisma = prisma;
}

// Prisma Client Fehlerbehandlung
prisma.$use(async (params, next) => {
    try {
        return await next(params);
    } catch (error) {
        console.error(`Prisma Error in ${params.model}.${params.action}:`, error);
        throw error;
    }
});

// Hilfsfunktion zum sicheren Abrufen von Daten mit Try-Catch
export async function fetchData<T>(
    fetchFn: () => Promise<T>,
    defaultValue: T,
    errorMessage: string = 'Fehler beim Datenabruf'
): Promise<T> {
    try {
        return await fetchFn();
    } catch (error) {
        console.error(`${errorMessage}:`, error);
        // In einer Produktionsumgebung würden wir hier eventuell noch eine Fehlerprotokollierung hinzufügen
        return defaultValue;
    }
}

// Default-Export für Kompatibilität mit existierenden Imports
export default prisma;