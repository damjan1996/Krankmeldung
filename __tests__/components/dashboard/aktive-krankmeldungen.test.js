// __tests__/components/dashboard/aktive-krankmeldungen.test.js

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { AktiveKrankmeldungen } from '@/components/dashboard/aktive-krankmeldungen';
import { getKrankmeldungen } from '@/lib/api/krankmeldungen';
import { renderWithProviders, mockStandardUserSession } from '../../utils/test-utils';

// Mock API functions
jest.mock('@/lib/api/krankmeldungen', () => ({
    getKrankmeldungen: jest.fn(),
}));

describe('AktiveKrankmeldungen', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockStandardUserSession();
    });

    it('renders loading state initially', () => {
        // Return a promise that doesn't resolve immediately to simulate loading
        getKrankmeldungen.mockReturnValueOnce(new Promise(() => {}));

        renderWithProviders(<AktiveKrankmeldungen />);

        expect(screen.getByText(/lädt aktive krankmeldungen.../i)).toBeInTheDocument();
    });

    it('renders active krankmeldungen correctly', async () => {
        const mockKrankmeldungen = {
            data: [
                {
                    id: '1',
                    mitarbeiterId: 'employee-1',
                    mitarbeiter: {
                        id: 'employee-1',
                        vorname: 'Max',
                        nachname: 'Mustermann',
                        position: 'Entwickler',
                    },
                    startdatum: '2025-03-01',
                    enddatum: '2025-03-05',
                    status: 'aktiv',
                },
                {
                    id: '2',
                    mitarbeiterId: 'employee-2',
                    mitarbeiter: {
                        id: 'employee-2',
                        vorname: 'Anna',
                        nachname: 'Schmidt',
                        position: 'Marketing',
                    },
                    startdatum: '2025-03-10',
                    enddatum: '2025-03-15',
                    status: 'aktiv',
                },
            ],
        };

        getKrankmeldungen.mockResolvedValueOnce(mockKrankmeldungen);

        renderWithProviders(<AktiveKrankmeldungen />);

        // Wait for loading to complete
        await waitFor(() => {
            expect(screen.queryByText(/lädt aktive krankmeldungen.../i)).not.toBeInTheDocument();
        });

        // Check if both krankmeldungen are rendered
        expect(screen.getByText(/max mustermann/i)).toBeInTheDocument();
        expect(screen.getByText(/anna schmidt/i)).toBeInTheDocument();

        // Check if the date ranges are displayed
        expect(screen.getByText(/01.03.2025 - 05.03.2025/i)).toBeInTheDocument();
        expect(screen.getByText(/10.03.2025 - 15.03.2025/i)).toBeInTheDocument();

        // Verify API was called with correct parameters
        expect(getKrankmeldungen).toHaveBeenCalledWith({ status: 'aktiv' });
    });

    it('renders message when no active krankmeldungen exist', async () => {
        // Mock empty response
        getKrankmeldungen.mockResolvedValueOnce({ data: [] });

        renderWithProviders(<AktiveKrankmeldungen />);

        // Wait for loading to complete
        await waitFor(() => {
            expect(screen.queryByText(/lädt aktive krankmeldungen.../i)).not.toBeInTheDocument();
        });

        // Check for no data message
        expect(screen.getByText(/keine aktiven krankmeldungen/i)).toBeInTheDocument();
    });

    it('handles API errors gracefully', async () => {
        // Simulate API error
        getKrankmeldungen.mockRejectedValueOnce(new Error('API Error'));

        renderWithProviders(<AktiveKrankmeldungen />);

        // Wait for error to be displayed
        await waitFor(() => {
            expect(screen.queryByText(/lädt aktive krankmeldungen.../i)).not.toBeInTheDocument();
        });

        // Check for error message
        expect(screen.getByText(/fehler beim laden der krankmeldungen/i)).toBeInTheDocument();
    });

    it('limits display to the specified number of items', async () => {
        // Create more items than the limit
        const mockKrankmeldungen = {
            data: Array(10).fill(0).map((_, index) => ({
                id: `id-${index}`,
                mitarbeiterId: `employee-${index}`,
                mitarbeiter: {
                    id: `employee-${index}`,
                    vorname: `Vorname${index}`,
                    nachname: `Nachname${index}`,
                    position: 'Position',
                },
                startdatum: '2025-03-01',
                enddatum: '2025-03-05',
                status: 'aktiv',
            })),
        };

        getKrankmeldungen.mockResolvedValueOnce(mockKrankmeldungen);

        // Render with limit of 5
        renderWithProviders(<AktiveKrankmeldungen limit={5} />);

        await waitFor(() => {
            expect(screen.queryByText(/lädt aktive krankmeldungen.../i)).not.toBeInTheDocument();
        });

        // Should only show 5 items
        const viewAllLink = screen.getByText(/alle anzeigen/i);
        expect(viewAllLink).toBeInTheDocument();

        // Count the actual items rendered (should be 5)
        const items = screen.getAllByText(/vorname\d+ nachname\d+/i);
        expect(items.length).toBe(5);
    });
});