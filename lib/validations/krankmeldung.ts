import * as z from 'zod';

// Basis-Schema ohne refine als Grundlage für andere Schemas
const baseKrankmeldungSchema = z.object({
    mitarbeiterId: z.string({
        required_error: 'Bitte wählen Sie einen Mitarbeiter aus',
    }),
    startdatum: z.string({
        required_error: 'Das Startdatum ist erforderlich',
    }).refine((val) => {
        try {
            return !isNaN(Date.parse(val));
        } catch (e) {
            return false;
        }
    }, {
        message: 'Ungültiges Datum',
    }),
    enddatum: z.string({
        required_error: 'Das Enddatum ist erforderlich',
    }).refine((val) => {
        try {
            return !isNaN(Date.parse(val));
        } catch (e) {
            return false;
        }
    }, {
        message: 'Ungültiges Datum',
    }),
    arztbesuchDatum: z.string().optional().refine((val) => {
        if (!val) return true;
        try {
            return !isNaN(Date.parse(val));
        } catch (e) {
            return false;
        }
    }, {
        message: 'Ungültiges Datum',
    }),
    notizen: z.string().optional(),
    status: z.enum(['aktiv', 'abgeschlossen', 'storniert']).default('aktiv'),
});

// Validator-Funktion für Start- und Enddatum
const validateDateRange = (data: any) => {
    if (!data.startdatum || !data.enddatum) return true;
    const start = new Date(data.startdatum);
    const end = new Date(data.enddatum);
    return start <= end;
};

// Schema for creating a new sick leave report
export const createKrankmeldungSchema = baseKrankmeldungSchema.refine(
    validateDateRange,
    {
        message: 'Das Enddatum muss nach dem Startdatum liegen',
        path: ['enddatum'],
    }
);

// Schema for updating an existing sick leave report
export const updateKrankmeldungSchema = baseKrankmeldungSchema.extend({
    id: z.string().optional(),
}).partial().refine(
    validateDateRange,
    {
        message: 'Das Enddatum muss nach dem Startdatum liegen',
        path: ['enddatum'],
    }
);

// Schema for filtering sick leave reports
export const filterKrankmeldungSchema = z.object({
    status: z.enum(['alle', 'aktiv', 'abgeschlossen', 'storniert']).default('alle'),
    mitarbeiterId: z.string().optional(),
    startAfter: z.string().optional().refine((val) => {
        if (!val) return true;
        try {
            return !isNaN(Date.parse(val));
        } catch (e) {
            return false;
        }
    }, {
        message: 'Ungültiges Datum',
    }),
    endBefore: z.string().optional().refine((val) => {
        if (!val) return true;
        try {
            return !isNaN(Date.parse(val));
        } catch (e) {
            return false;
        }
    }, {
        message: 'Ungültiges Datum',
    }),
    searchTerm: z.string().optional(),
});

// Type definitions for use with the schemas
export type CreateKrankmeldungInput = z.infer<typeof createKrankmeldungSchema>;
export type UpdateKrankmeldungInput = z.infer<typeof updateKrankmeldungSchema>;
export type FilterKrankmeldungInput = z.infer<typeof filterKrankmeldungSchema>;