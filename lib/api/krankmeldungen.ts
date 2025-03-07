import {
    CreateKrankmeldungInput,
    UpdateKrankmeldungInput,
    FilterKrankmeldungInput
} from '../validations/krankmeldung';

// Type for Krankmeldung including relationships
export interface Krankmeldung {
    id: string;
    mitarbeiterId: string;
    startdatum: string;
    enddatum: string;
    arztbesuchDatum?: string | null;
    notizen?: string | null;
    status: 'aktiv' | 'abgeschlossen' | 'storniert';
    erstelltVonId: string;
    erstelltAm: string;
    aktualisiertAm?: string | null;
    aktualisiertVonId?: string | null;
    mitarbeiter?: {
        id: string;
        personalnummer: string;
        vorname: string;
        nachname: string;
        position?: string | null;
    };
    erstelltVon?: {
        id: string;
        email: string;
        vorname?: string | null;
        nachname?: string | null;
    };
    aktualisiertVon?: {
        id: string;
        email: string;
        vorname?: string | null;
        nachname?: string | null;
    } | null;
}

/**
 * Fetch all sick leave reports with optional filtering
 */
export async function getKrankmeldungen(
    filter?: FilterKrankmeldungInput
): Promise<Krankmeldung[]> {
    try {
        // Build query parameters
        const params = new URLSearchParams();

        if (filter) {
            if (filter.status && filter.status !== 'alle') {
                params.append('status', filter.status);
            }

            if (filter.mitarbeiterId) {
                params.append('mitarbeiterId', filter.mitarbeiterId);
            }

            if (filter.startAfter) {
                params.append('startAfter', filter.startAfter);
            }

            if (filter.endBefore) {
                params.append('endBefore', filter.endBefore);
            }

            if (filter.searchTerm) {
                params.append('searchTerm', filter.searchTerm);
            }
        }

        const queryString = params.toString() ? `?${params.toString()}` : '';
        const response = await fetch(`/api/krankmeldungen${queryString}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error(`Error fetching sick leave reports: ${response.statusText}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Failed to fetch sick leave reports:', error);
        throw error;
    }
}

/**
 * Fetch a single sick leave report by ID
 */
export async function getKrankmeldungById(id: string): Promise<Krankmeldung> {
    try {
        const response = await fetch(`/api/krankmeldungen/${id}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error(`Error fetching sick leave report: ${response.statusText}`);
        }

        return await response.json();
    } catch (error) {
        console.error(`Failed to fetch sick leave report with ID ${id}:`, error);
        throw error;
    }
}

/**
 * Create a new sick leave report
 */
export async function createKrankmeldung(
    data: CreateKrankmeldungInput
): Promise<Krankmeldung> {
    try {
        const response = await fetch('/api/krankmeldungen', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => null);
            throw new Error(
                errorData?.error || `Error creating sick leave report: ${response.statusText}`
            );
        }

        return await response.json();
    } catch (error) {
        console.error('Failed to create sick leave report:', error);
        throw error;
    }
}

/**
 * Update an existing sick leave report
 */
export async function updateKrankmeldung(
    id: string,
    data: UpdateKrankmeldungInput
): Promise<Krankmeldung> {
    try {
        const response = await fetch(`/api/krankmeldungen/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => null);
            throw new Error(
                errorData?.error || `Error updating sick leave report: ${response.statusText}`
            );
        }

        return await response.json();
    } catch (error) {
        console.error(`Failed to update sick leave report with ID ${id}:`, error);
        throw error;
    }
}

/**
 * Change the status of a sick leave report
 */
export async function changeKrankmeldungStatus(
    id: string,
    status: 'aktiv' | 'abgeschlossen' | 'storniert'
): Promise<Krankmeldung> {
    try {
        return await updateKrankmeldung(id, { status });
    } catch (error) {
        console.error(`Failed to change status of sick leave report with ID ${id}:`, error);
        throw error;
    }
}

/**
 * Get statistics for sick leave reports
 */
export async function getKrankmeldungenStatistics() {
    try {
        const response = await fetch('/api/berichte/krankmeldungen', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error(`Error fetching sick leave statistics: ${response.statusText}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Failed to fetch sick leave statistics:', error);
        throw error;
    }
}