// __tests__/lib/hooks/use-krankmeldung.test.js

import { renderHook, waitFor } from '@testing-library/react';
import { useKrankmeldung } from '@/lib/hooks/use-krankmeldung';
import { getKrankmeldungById, updateKrankmeldung } from '@/lib/api/krankmeldungen';
import { act } from 'react-dom/test-utils';

// Mock API functions
jest.mock('@/lib/api/krankmeldungen', () => ({
    getKrankmeldungById: jest.fn(),
    updateKrankmeldung: jest.fn(),
}));

describe('useKrankmeldung hook', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('fetches krankmeldung data by ID', async () => {
        const mockKrankmeldung = {
            id: '123',
            mitarbeiterId: 'CF176328-64F7-47D1-932F-9EF7F22E516F',
            startdatum: '2025-03-01',
            enddatum: '2025-03-05',
            status: 'aktiv',
        };

        getKrankmeldungById.mockResolvedValueOnce({ data: mockKrankmeldung });

        const { result } = renderHook(() => useKrankmeldung('123'));

        // Initially, should be loading with no data
        expect(result.current.isLoading).toBe(true);
        expect(result.current.krankmeldung).toBeNull();

        // Wait for the data to load
        await waitFor(() => {
            expect(result.current.isLoading).toBe(false);
        });

        expect(result.current.krankmeldung).toEqual(mockKrankmeldung);
        expect(getKrankmeldungById).toHaveBeenCalledWith('123');
    });

    it('handles API errors correctly', async () => {
        getKrankmeldungById.mockRejectedValueOnce(new Error('API Error'));

        const { result } = renderHook(() => useKrankmeldung('123'));

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false);
        });

        expect(result.current.krankmeldung).toBeNull();
        expect(result.current.error).toBeTruthy();
    });

    it('updates krankmeldung status correctly', async () => {
        const mockKrankmeldung = {
            id: '123',
            mitarbeiterId: 'CF176328-64F7-47D1-932F-9EF7F22E516F',
            startdatum: '2025-03-01',
            enddatum: '2025-03-05',
            status: 'aktiv',
        };

        const updatedKrankmeldung = {
            ...mockKrankmeldung,
            status: 'abgeschlossen',
        };

        getKrankmeldungById.mockResolvedValueOnce({ data: mockKrankmeldung });
        updateKrankmeldung.mockResolvedValueOnce({ data: updatedKrankmeldung });

        const { result } = renderHook(() => useKrankmeldung('123'));

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false);
        });

        // Test the updateStatus function
        await act(async () => {
            await result.current.updateStatus('abgeschlossen');
        });

        expect(updateKrankmeldung).toHaveBeenCalledWith('123', { status: 'abgeschlossen' });

        // After the update, the hook should re-fetch
        expect(getKrankmeldungById).toHaveBeenCalledTimes(2);
    });

    it('handles update errors correctly', async () => {
        const mockKrankmeldung = {
            id: '123',
            mitarbeiterId: 'CF176328-64F7-47D1-932F-9EF7F22E516F',
            startdatum: '2025-03-01',
            enddatum: '2025-03-05',
            status: 'aktiv',
        };

        getKrankmeldungById.mockResolvedValueOnce({ data: mockKrankmeldung });
        updateKrankmeldung.mockRejectedValueOnce(new Error('Update Error'));

        const { result } = renderHook(() => useKrankmeldung('123'));

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false);
        });

        // Test the updateStatus function with error
        await act(async () => {
            try {
                await result.current.updateStatus('abgeschlossen');
            } catch (error) {
                // Expected error
            }
        });

        expect(updateKrankmeldung).toHaveBeenCalledWith('123', { status: 'abgeschlossen' });
        expect(result.current.error).toBeTruthy();
    });
});