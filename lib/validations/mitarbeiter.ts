import * as z from 'zod';

// Schema for creating a new employee
export const createMitarbeiterSchema = z.object({
    personalnummer: z.string({
        required_error: 'Die Personalnummer ist erforderlich',
    }).min(3, {
        message: 'Die Personalnummer muss mindestens 3 Zeichen lang sein',
    }),
    vorname: z.string({
        required_error: 'Der Vorname ist erforderlich',
    }).min(2, {
        message: 'Der Vorname muss mindestens 2 Zeichen lang sein',
    }),
    nachname: z.string({
        required_error: 'Der Nachname ist erforderlich',
    }).min(2, {
        message: 'Der Nachname muss mindestens 2 Zeichen lang sein',
    }),
    position: z.string().optional(),
    istAktiv: z.boolean().default(true),
});

// Schema for updating an existing employee
export const updateMitarbeiterSchema = createMitarbeiterSchema.extend({
    id: z.string().optional(),
}).partial();

// Schema for filtering employees
export const filterMitarbeiterSchema = z.object({
    istAktiv: z.enum(['alle', 'aktiv', 'inaktiv']).default('aktiv'),
    searchTerm: z.string().optional(),
});

// Type definitions for use with the schemas
export type CreateMitarbeiterInput = z.infer<typeof createMitarbeiterSchema>;
export type UpdateMitarbeiterInput = z.infer<typeof updateMitarbeiterSchema>;
export type FilterMitarbeiterInput = z.infer<typeof filterMitarbeiterSchema>;