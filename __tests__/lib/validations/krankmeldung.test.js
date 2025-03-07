// __tests__/lib/validations/krankmeldung.test.js

import { z } from 'zod';
import { krankmeldungSchema } from '@/lib/validations/krankmeldung';

// Assuming we have a validation schema like this:
// export const krankmeldungSchema = z.object({
//   mitarbeiterId: z.string().uuid(),
//   startdatum: z.date(),
//   enddatum: z.date(),
//   arztbesuchDatum: z.date().optional(),
//   notizen: z.string().optional(),
// })
// .refine(data => data.enddatum >= data.startdatum, {
//   message: "Enddatum kann nicht vor dem Startdatum liegen",
//   path: ["enddatum"]
// });

describe('Krankmeldung validation schema', () => {
    test('valid krankmeldung data passes validation', () => {
        const validData = {
            mitarbeiterId: 'CF176328-64F7-47D1-932F-9EF7F22E516F',
            startdatum: new Date('2025-03-01'),
            enddatum: new Date('2025-03-05'),
            arztbesuchDatum: new Date('2025-03-01'),
            notizen: 'Test Notizen',
        };

        const result = krankmeldungSchema.safeParse(validData);
        expect(result.success).toBe(true);
    });

    test('missing required fields fail validation', () => {
        const invalidData = {
            mitarbeiterId: 'CF176328-64F7-47D1-932F-9EF7F22E516F',
            // Missing startdatum and enddatum
            arztbesuchDatum: new Date('2025-03-01'),
            notizen: 'Test Notizen',
        };

        const result = krankmeldungSchema.safeParse(invalidData);
        expect(result.success).toBe(false);

        if (!result.success) {
            const formattedErrors = result.error.format();
            expect(formattedErrors.startdatum).toBeDefined();
            expect(formattedErrors.enddatum).toBeDefined();
        }
    });

    test('end date before start date fails validation', () => {
        const invalidData = {
            mitarbeiterId: 'CF176328-64F7-47D1-932F-9EF7F22E516F',
            startdatum: new Date('2025-03-05'),
            enddatum: new Date('2025-03-01'), // Earlier than startdatum
            arztbesuchDatum: new Date('2025-03-01'),
            notizen: 'Test Notizen',
        };

        const result = krankmeldungSchema.safeParse(invalidData);
        expect(result.success).toBe(false);

        if (!result.success) {
            const formattedErrors = result.error.format();
            expect(formattedErrors.enddatum).toBeDefined();
        }
    });

    test('invalid UUID format for mitarbeiterId fails validation', () => {
        const invalidData = {
            mitarbeiterId: 'not-a-uuid',
            startdatum: new Date('2025-03-01'),
            enddatum: new Date('2025-03-05'),
            arztbesuchDatum: new Date('2025-03-01'),
            notizen: 'Test Notizen',
        };

        const result = krankmeldungSchema.safeParse(invalidData);
        expect(result.success).toBe(false);

        if (!result.success) {
            const formattedErrors = result.error.format();
            expect(formattedErrors.mitarbeiterId).toBeDefined();
        }
    });

    test('optional fields can be omitted', () => {
        const validData = {
            mitarbeiterId: 'CF176328-64F7-47D1-932F-9EF7F22E516F',
            startdatum: new Date('2025-03-01'),
            enddatum: new Date('2025-03-05'),
            // No arztbesuchDatum or notizen
        };

        const result = krankmeldungSchema.safeParse(validData);
        expect(result.success).toBe(true);
    });
});