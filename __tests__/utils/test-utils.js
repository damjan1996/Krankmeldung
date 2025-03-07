// __tests__/utils/test-utils.js
import React from 'react';
import { render } from '@testing-library/react';
import { ThemeProvider } from '@/components/theme-provider';
import { SessionProvider } from '@/components/session-provider';
import { useSession } from 'next-auth/react';

// Mock session data
const standardUser = {
    user: {
        id: 'E7C22464-8461-4FAE-B204-AC5CA7ED8D8D',
        email: 'benutzer@gfu-krankmeldung.de',
        vorname: 'Standard',
        nachname: 'Benutzer',
        istAdmin: false,
    },
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
};

const adminUser = {
    user: {
        id: 'A453E325-FED8-40FF-856D-83E75A6A04B2',
        email: 'admin@gfu-krankmeldung.de',
        vorname: 'Admin',
        nachname: 'Benutzer',
        istAdmin: true,
    },
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
};

// Custom render with providers
export function renderWithProviders(ui, { session = null, ...options } = {}) {
    return render(
        <SessionProvider session={session}>
            <ThemeProvider>{ui}</ThemeProvider>
        </SessionProvider>,
        options
    );
}

// Mock authenticated session with standard user
export function mockStandardUserSession() {
    useSession.mockReturnValue({
        data: standardUser,
        status: 'authenticated',
        update: jest.fn(),
    });
}

// Mock authenticated session with admin user
export function mockAdminUserSession() {
    useSession.mockReturnValue({
        data: adminUser,
        status: 'authenticated',
        update: jest.fn(),
    });
}

// Mock unauthenticated session
export function mockUnauthenticatedSession() {
    useSession.mockReturnValue({
        data: null,
        status: 'unauthenticated',
        update: jest.fn(),
    });
}

// Helper to create mock krankmeldung data
export const createMockKrankmeldung = (overrides = {}) => ({
    id: '584C4F7C-003F-4625-937D-0439DDE9190A',
    mitarbeiterId: 'CF176328-64F7-47D1-932F-9EF7F22E516F',
    startdatum: '2025-01-24',
    enddatum: '2025-01-28',
    arztbesuchDatum: '2025-01-24',
    notizen: 'Knie-OP',
    status: 'aktiv',
    erstelltVonId: 'A453E325-FED8-40FF-856D-83E75A6A04B2',
    erstelltAm: '2025-03-04T14:10:01.990000',
    ...overrides,
});

// Helper to create mock mitarbeiter data
export const createMockMitarbeiter = (overrides = {}) => ({
    id: 'CF176328-64F7-47D1-932F-9EF7F22E516F',
    personalnummer: 'P1001',
    vorname: 'Max',
    nachname: 'Mustermann',
    position: 'Entwickler',
    istAktiv: true,
    erstelltAm: '2025-03-04T14:09:40.563333',
    ...overrides,
});