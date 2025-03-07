// __tests__/lib/api/krankmeldungen.test.js
import {
    getKrankmeldungen,
    getKrankmeldungById,
    createKrankmeldung,
    updateKrankmeldung
} from '@/lib/api/krankmeldungen';

describe('Krankmeldungen API functions', () => {
    beforeEach(() => {
        fetch.resetMocks();
    });

    test('getKrankmeldungen fetches krankmeldungen correctly', async () => {
        const mockData = {
            data: [
                { id: '123', startdatum: '2025-03-01' },
                { id: '456', startdatum: '2025-03-15' }
            ]
        };

        fetch.mockResponseOnce(JSON.stringify(mockData));

        const result = await getKrankmeldungen();

        expect(result).toEqual(mockData);
        expect(fetch).toHaveBeenCalledWith('/api/krankmeldungen', expect.any(Object));
    });

    test('getKrankmeldungById fetches a single krankmeldung correctly', async () => {
        const mockData = {
            data: { id: '123', startdatum: '2025-03-01' }
        };

        fetch.mockResponseOnce(JSON.stringify(mockData));

        const result = await getKrankmeldungById('123');

        expect(result).toEqual(mockData);
        expect(fetch).toHaveBeenCalledWith('/api/krankmeldungen/123', expect.any(Object));
    });

    test('createKrankmeldung posts new krankmeldung data correctly', async () => {
        const newKrankmeldung = {
            mitarbeiterId: 'CF176328-64F7-47D1-932F-9EF7F22E516F',
            startdatum: '2025-03-01',
            enddatum: '2025-03-05',
            notizen: 'Test Notizen',
        };

        const mockResponse = {
            data: {
                id: 'new-id',
                ...newKrankmeldung,
                status: 'aktiv',
            }
        };

        fetch.mockResponseOnce(JSON.stringify(mockResponse), { status: 201 });

        const result = await createKrankmeldung(newKrankmeldung);

        expect(result).toEqual(mockResponse);
        expect(fetch).toHaveBeenCalledWith('/api/krankmeldungen', {
            method: 'POST',
            headers: expect.objectContaining({
                'Content-Type': 'application/json'
            }),
            body: JSON.stringify(newKrankmeldung)
        });
    });

    test('updateKrankmeldung updates krankmeldung data correctly', async () => {
        const updatedData = {
            status: 'abgeschlossen',
            notizen: 'Updated Notizen',
        };

        const mockResponse = {
            data: {
                id: '123',
                mitarbeiterId: 'CF176328-64F7-47D1-932F-9EF7F22E516F',
                startdatum: '2025-03-01',
                enddatum: '2025-03-05',
                ...updatedData,
            }
        };

        fetch.mockResponseOnce(JSON.stringify(mockResponse));

        const result = await updateKrankmeldung('123', updatedData);

        expect(result).toEqual(mockResponse);
        expect(fetch).toHaveBeenCalledWith('/api/krankmeldungen/123', {
            method: 'PUT',
            headers: expect.objectContaining({
                'Content-Type': 'application/json'
            }),
            body: JSON.stringify(updatedData)
        });
    });

    test('handles API errors correctly', async () => {
        fetch.mockRejectOnce(new Error('Network Error'));

        await expect(getKrankmeldungen()).rejects.toThrow('Network Error');
    });
});