/**
 * Global type definitions for the GFU Krankmeldungssystem
 */

// Common response type for API calls
export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
}

// Common pagination type
export interface PaginatedResponse<T> {
    data: T[];
    meta: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}

// Common filter options
export interface BaseFilterOptions {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    searchTerm?: string;
}

// Toast notification options
export interface ToastOptions {
    title?: string;
    description?: string;
    variant?: 'default' | 'destructive';
    duration?: number;
}

// Audit log types
export interface AuditLogEntry {
    id: string;
    tabellenname: string;
    datensatzId: string;
    aktion: string;
    alteWerte: string | null;
    neueWerte: string | null;
    benutzerId: string;
    benutzerAgent: string | null;
    ipAdresse: string | null;
    erstelltAm: string;
    benutzer?: {
        email: string;
        vorname: string | null;
        nachname: string | null;
    };
}

// Generic user information
export interface UserInfo {
    id: string;
    email: string;
    name: string;
    isAdmin: boolean;
}

// Error with status code
export interface AppError extends Error {
    statusCode?: number;
}

// Application statistics
export interface AppStatistics {
    aktivKrankmeldungen: number;
    abgeschlosseneKrankmeldungen: number;
    stornierteKrankmeldungen: number;
    aktiveMitarbeiter: number;
    inaktiveMitarbeiter: number;
    krankmeldungenProMonat: {
        monat: string;
        anzahl: number;
    }[];
}