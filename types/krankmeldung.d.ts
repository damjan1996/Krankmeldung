/**
 * Type definitions for the Krankmeldung (sick leave) module
 */

import { BaseFilterOptions } from './index';

// Krankmeldung status options
export type KrankmeldungStatus = 'aktiv' | 'abgeschlossen' | 'storniert' | 'alle';

// Base Krankmeldung type without relationships
export interface KrankmeldungBase {
    id: string;
    mitarbeiterId: string;
    startdatum: string; // ISO date string
    enddatum: string; // ISO date string
    arztbesuchDatum?: string | null; // ISO date string
    notizen?: string | null;
    status: 'aktiv' | 'abgeschlossen' | 'storniert';
    erstelltVonId: string;
    erstelltAm: string; // ISO datetime string
    aktualisiertAm?: string | null; // ISO datetime string
    aktualisiertVonId?: string | null;
}

// Extended Krankmeldung type with relationships
export interface Krankmeldung extends KrankmeldungBase {
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

// Create Krankmeldung input
export interface CreateKrankmeldungInput {
    mitarbeiterId: string;
    startdatum: string; // ISO date string
    enddatum: string; // ISO date string
    arztbesuchDatum?: string | null; // ISO date string
    notizen?: string | null;
    status?: 'aktiv' | 'abgeschlossen' | 'storniert';
}

// Update Krankmeldung input
export interface UpdateKrankmeldungInput {
    mitarbeiterId?: string;
    startdatum?: string; // ISO date string
    enddatum?: string; // ISO date string
    arztbesuchDatum?: string | null; // ISO date string
    notizen?: string | null;
    status?: 'aktiv' | 'abgeschlossen' | 'storniert';
}

// Krankmeldung filter options
export interface KrankmeldungFilterOptions extends BaseFilterOptions {
    status?: KrankmeldungStatus;
    mitarbeiterId?: string;
    startAfter?: string; // ISO date string
    endBefore?: string; // ISO date string
}

// Krankmeldung statistics
export interface KrankmeldungStatistics {
    total: number;
    aktiv: number;
    abgeschlossen: number;
    storniert: number;
    durchschnittlicheDauer: number;
    proMitarbeiter: {
        mitarbeiterId: string;
        mitarbeiterName: string;
        anzahl: number;
    }[];
    proMonat: {
        monat: string;
        anzahl: number;
    }[];
}