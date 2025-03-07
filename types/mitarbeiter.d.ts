/**
 * Type definitions for the Mitarbeiter (employee) module
 */

import { BaseFilterOptions } from './index';
import { KrankmeldungBase } from './krankmeldung';

// Mitarbeiter active status options
export type MitarbeiterStatus = 'aktiv' | 'inaktiv' | 'alle';

// Base Mitarbeiter type without relationships
export interface MitarbeiterBase {
    id: string;
    personalnummer: string;
    vorname: string;
    nachname: string;
    position?: string | null;
    istAktiv: boolean;
    erstelltAm: string; // ISO datetime string
    aktualisiertAm?: string | null; // ISO datetime string
}

// Extended Mitarbeiter type with relationships
export interface Mitarbeiter extends MitarbeiterBase {
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

// Detailed Mitarbeiter type with full krankmeldung data
export interface MitarbeiterDetailed extends MitarbeiterBase {
    krankmeldungen?: KrankmeldungBase[];
    _count?: {
        krankmeldungen: number;
    };
}

// Create Mitarbeiter input
export interface CreateMitarbeiterInput {
    personalnummer: string;
    vorname: string;
    nachname: string;
    position?: string | null;
    istAktiv?: boolean;
}

// Update Mitarbeiter input
export interface UpdateMitarbeiterInput {
    personalnummer?: string;
    vorname?: string;
    nachname?: string;
    position?: string | null;
    istAktiv?: boolean;
}

// Mitarbeiter filter options
export interface MitarbeiterFilterOptions extends BaseFilterOptions {
    istAktiv?: MitarbeiterStatus;
}

// Mitarbeiter statistics
export interface MitarbeiterStatistics {
    total: number;
    aktiv: number;
    inaktiv: number;
    mitKrankmeldungen: number;
    ohneKrankmeldungen: number;
    topKrankmeldungen: {
        mitarbeiterId: string;
        mitarbeiterName: string;
        anzahl: number;
    }[];
}