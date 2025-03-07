// __tests__/app/api/krankmeldungen/route.test.js

import { GET, POST } from '@/app/api/krankmeldungen/route';
import prisma from '@/lib/prisma';
import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';

// Mock Next.js Auth
jest.mock('next-auth/next', () => ({
    getServerSession: jest.fn(),
}));

describe('/api/krankmeldungen route', () => {
    beforeEach(() => {
        jest.clearAllMocks();

        // Mock a standard authenticated session
        getServerSession.mockResolvedValue({
            user: {
                id: 'E7C22464-8461-4FAE-B204-AC5CA7ED8D8D',
                email: 'benutzer@gfu-krankmeldung.de',
                name: 'Standard Benutzer',
                istAdmin: false,
            },
        });
    });

    describe('GET handler', () => {
        it('returns all krankmeldungen', async () => {
            const mockKrankmeldungen = [
                { id: '1', startdatum: '2025-03-01' },
                { id: '2', startdatum: '2025-02-15' },
            ];

            prisma.krankmeldung.findMany.mockResolvedValueOnce(mockKrankmeldungen);

            const request = new NextRequest('http://localhost:3000/api/krankmeldungen');
            const response = await GET(request);
            const responseData = await response.json();

            expect(response.status).toBe(200);
            expect(responseData).toEqual({ data: mockKrankmeldungen });
            expect(prisma.krankmeldung.findMany).toHaveBeenCalled();
        });

        it('filters krankmeldungen by query parameters', async () => {
            const mockKrankmeldungen = [
                { id: '1', startdatum: '2025-03-01' },
            ];

            prisma.krankmeldung.findMany.mockResolvedValueOnce(mockKrankmeldungen);

            const url = new URL('http://localhost:3000/api/krankmeldungen');
            url.searchParams.append('mitarbeiterId', 'CF176328-64F7-47D1-932F-9EF7F22E516F');
            url.searchParams.append('status', 'aktiv');

            const request = new NextRequest(url);
            const response = await GET(request);

            expect(response.status).toBe(200);
            expect(prisma.krankmeldung.findMany).toHaveBeenCalledWith(expect.objectContaining({
                where: expect.objectContaining({
                    mitarbeiterId: 'CF176328-64F7-47D1-932F-9EF7F22E516F',
                    status: 'aktiv',
                }),
            }));
        });
    });

    describe('POST handler', () => {
        it('creates a new krankmeldung', async () => {
            const newKrankmeldung = {
                mitarbeiterId: 'CF176328-64F7-47D1-932F-9EF7F22E516F',
                startdatum: '2025-03-01',
                enddatum: '2025-03-05',
                notizen: 'Test Notizen',
            };

            const createdKrankmeldung = {
                id: 'new-id',
                ...newKrankmeldung,
                status: 'aktiv',
                erstelltVonId: 'E7C22464-8461-4FAE-B204-AC5CA7ED8D8D',
                erstelltAm: new Date().toISOString(),
            };

            prisma.krankmeldung.create.mockResolvedValueOnce(createdKrankmeldung);
            prisma.aenderungsLog.create.mockResolvedValueOnce({});

            const request = new NextRequest('http://localhost:3000/api/krankmeldungen', {
                method: 'POST',
                body: JSON.stringify(newKrankmeldung),
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            const response = await POST(request);
            const responseData = await response.json();

            expect(response.status).toBe(201);
            expect(responseData).toEqual({ data: createdKrankmeldung });
            expect(prisma.krankmeldung.create).toHaveBeenCalledWith(expect.objectContaining({
                data: expect.objectContaining({
                    mitarbeiterId: 'CF176328-64F7-47D1-932F-9EF7F22E516F',
                    startdatum: expect.any(Date),
                    enddatum: expect.any(Date),
                    notizen: 'Test Notizen',
                    status: 'aktiv',
                    erstelltVonId: 'E7C22464-8461-4FAE-B204-AC5CA7ED8D8D',
                }),
            }));
            expect(prisma.aenderungsLog.create).toHaveBeenCalled();
        });

        it('returns 400 for invalid data', async () => {
            const invalidKrankmeldung = {
                // Missing required fields
                mitarbeiterId: 'CF176328-64F7-47D1-932F-9EF7F22E516F',
                // No startdatum or enddatum
            };

            const request = new NextRequest('http://localhost:3000/api/krankmeldungen', {
                method: 'POST',
                body: JSON.stringify(invalidKrankmeldung),
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            const response = await POST(request);

            expect(response.status).toBe(400);
            expect(prisma.krankmeldung.create).not.toHaveBeenCalled();
        });

        it('returns 401 when not authenticated', async () => {
            getServerSession.mockResolvedValueOnce(null);

            const newKrankmeldung = {
                mitarbeiterId: 'CF176328-64F7-47D1-932F-9EF7F22E516F',
                startdatum: '2025-03-01',
                enddatum: '2025-03-05',
                notizen: 'Test Notizen',
            };

            const request = new NextRequest('http://localhost:3000/api/krankmeldungen', {
                method: 'POST',
                body: JSON.stringify(newKrankmeldung),
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            const response = await POST(request);

            expect(response.status).toBe(401);
            expect(prisma.krankmeldung.create).not.toHaveBeenCalled();
        });
    });
});