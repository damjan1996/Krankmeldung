import {
    CreateMitarbeiterInput,
    UpdateMitarbeiterInput,
    FilterMitarbeiterInput
} from '../validations/mitarbeiter';

// Type for Mitarbeiter including relationships
export interface Mitarbeiter {
    id: string;
    personalnummer: string;
    vorname: string;
    nachname: string;
    position?: string | null;
    istAktiv: boolean;
    erstelltAm: string;
    aktualisiertAm?: string | null;
    krankmeldungen?: {
        id: string;
        startdatum: string;
        enddatum: string;
        status: string;
    }[];
    _count?: {
        krankmeldungen: number;
    };
}

/**
 * Fetch all employees with optional filtering
 */
export async function getMitarbeiter(
    filter?: FilterMitarbeiterInput
): Promise<Mitarbeiter[]> {
    try {
        // Build query parameters
        const params = new URLSearchParams();

        if (filter) {
            if (filter.istAktiv && filter.istAktiv !== 'alle') {
                params.append('istAktiv', filter.istAktiv === 'aktiv' ? 'true' : 'false');
            }

            if (filter.searchTerm) {
                params.append('searchTerm', filter.searchTerm);
            }
        }

        const queryString = params.toString() ? `?${params.toString()}` : '';
        const response = await fetch(`/api/mitarbeiter${queryString}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error(`Error fetching employees: ${response.statusText}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Failed to fetch employees:', error);
        throw error;
    }
}

/**
 * Fetch a single employee by ID
 */
export async function getMitarbeiterById(id: string): Promise<Mitarbeiter> {
    try {
        const response = await fetch(`/api/mitarbeiter/${id}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error(`Error fetching employee: ${response.statusText}`);
        }

        return await response.json();
    } catch (error) {
        console.error(`Failed to fetch employee with ID ${id}:`, error);
        throw error;
    }
}

/**
 * Create a new employee
 */
export async function createMitarbeiter(
    data: CreateMitarbeiterInput
): Promise<Mitarbeiter> {
    try {
        const response = await fetch('/api/mitarbeiter', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => null);
            throw new Error(
                errorData?.error || `Error creating employee: ${response.statusText}`
            );
        }

        return await response.json();
    } catch (error) {
        console.error('Failed to create employee:', error);
        throw error;
    }
}

/**
 * Update an existing employee
 */
export async function updateMitarbeiter(
    id: string,
    data: UpdateMitarbeiterInput
): Promise<Mitarbeiter> {
    try {
        const response = await fetch(`/api/mitarbeiter/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => null);
            throw new Error(
                errorData?.error || `Error updating employee: ${response.statusText}`
            );
        }

        return await response.json();
    } catch (error) {
        console.error(`Failed to update employee with ID ${id}:`, error);
        throw error;
    }
}

/**
 * Toggle employee active status
 */
export async function toggleMitarbeiterStatus(
    id: string,
    isActive: boolean
): Promise<Mitarbeiter> {
    try {
        return await updateMitarbeiter(id, { istAktiv: isActive });
    } catch (error) {
        console.error(`Failed to toggle status of employee with ID ${id}:`, error);
        throw error;
    }
}

/**
 * Get statistics for employees
 */
export async function getMitarbeiterStatistics() {
    try {
        const response = await fetch('/api/berichte/mitarbeiter', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error(`Error fetching employee statistics: ${response.statusText}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Failed to fetch employee statistics:', error);
        throw error;
    }
}