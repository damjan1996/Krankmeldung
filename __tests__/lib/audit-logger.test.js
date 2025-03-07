// __tests__/lib/audit-logger.test.js

import { createAuditLog } from '@/lib/audit-logger';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { NextRequest } from 'next/server';

// Mock Next.js Auth
jest.mock('next-auth/next', () => ({
    getServerSession: jest.fn(),
}));

// Mock Prisma should already be set up in jest.setup.js

describe('Audit Logging functionality', () => {
    const mockRequest = new NextRequest('http://localhost:3000/api/krankmeldungen', {
        headers: {
            'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
            'x-forwarded-for': '192.168.1.1',
        },
    });

    beforeEach(() => {
        jest.clearAllMocks();

        // Mock authenticated session
        getServerSession.mockResolvedValue({
            user: {
                id: 'E7C22464-8461-4FAE-B204-AC5CA7ED8D8D',
                email: 'benutzer@gfu-krankmeldung.de',
                name: 'Standard Benutzer',
            },
        });
    });

    it('creates an audit log entry for INSERT action', async () => {
        const tableName = 'Krankmeldung';
        const recordId = '123';
        const action = 'INSERT';
        const newValues = {
            mitarbeiterId: 'employee-1',
            startdatum: '2025-03-01',
            enddatum: '2025-03-05',
        };

        await createAuditLog(tableName, recordId, action, null, newValues, mockRequest);

        expect(prisma.aenderungsLog.create).toHaveBeenCalledWith({
            data: expect.objectContaining({
                tabellenname: tableName,
                datensatzId: recordId,
                aktion: action,
                alteWerte: null,
                neueWerte: JSON.stringify(newValues),
                benutzerId: 'E7C22464-8461-4FAE-B204-AC5CA7ED8D8D',
                benutzerAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
                ipAdresse: '192.168.1.1',
            }),
        });
    });

    it('creates an audit log entry for UPDATE action with old and new values', async () => {
        const tableName = 'Krankmeldung';
        const recordId = '123';
        const action = 'UPDATE';
        const oldValues = {
            status: 'aktiv',
            notizen: 'Old notes',
        };
        const newValues = {
            status: 'abgeschlossen',
            notizen: 'Updated notes',
        };

        await createAuditLog(tableName, recordId, action, oldValues, newValues, mockRequest);

        expect(prisma.aenderungsLog.create).toHaveBeenCalledWith({
            data: expect.objectContaining({
                tabellenname: tableName,
                datensatzId: recordId,
                aktion: action,
                alteWerte: JSON.stringify(oldValues),
                neueWerte: JSON.stringify(newValues),
                benutzerId: 'E7C22464-8461-4FAE-B204-AC5CA7ED8D8D',
            }),
        });
    });

    it('handles missing session gracefully', async () => {
        // Mock no session
        getServerSession.mockResolvedValueOnce(null);

        const tableName = 'Krankmeldung';
        const recordId = '123';
        const action = 'DELETE';

        await createAuditLog(tableName, recordId, action, { id: '123' }, null, mockRequest);

        expect(prisma.aenderungsLog.create).toHaveBeenCalledWith({
            data: expect.objectContaining({
                tabellenname: tableName,
                datensatzId: recordId,
                aktion: action,
                benutzerId: 'system', // Or however you handle this case
            }),
        });
    });

    it('handles missing request gracefully', async () => {
        const tableName = 'Krankmeldung';
        const recordId = '123';
        const action = 'INSERT';
        const newValues = { id: '123' };

        // Call without request object
        await createAuditLog(tableName, recordId, action, null, newValues);

        expect(prisma.aenderungsLog.create).toHaveBeenCalledWith({
            data: expect.objectContaining({
                tabellenname: tableName,
                datensatzId: recordId,
                aktion: action,
                neueWerte: JSON.stringify(newValues),
                benutzerId: 'E7C22464-8461-4FAE-B204-AC5CA7ED8D8D',
                benutzerAgent: null, // Should handle missing user agent
                ipAdresse: null, // Should handle missing IP
            }),
        });
    });

    it('catches and logs database errors', async () => {
        const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

        // Make the database call fail
        prisma.aenderungsLog.create.mockRejectedValueOnce(new Error('Database error'));

        const tableName = 'Krankmeldung';
        const recordId = '123';
        const action = 'INSERT';

        await createAuditLog(tableName, recordId, action, null, { id: '123' }, mockRequest);

        // Should have caught the error and logged it
        expect(consoleErrorSpy).toHaveBeenCalled();

        consoleErrorSpy.mockRestore();
    });
});