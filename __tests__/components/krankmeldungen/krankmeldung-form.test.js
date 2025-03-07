// __tests__/components/krankmeldungen/krankmeldung-form.test.js

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { KrankmeldungForm } from '@/components/krankmeldungen/krankmeldung-form';
import { createKrankmeldung, updateKrankmeldung } from '@/lib/api/krankmeldungen';
import { useRouter } from 'next/navigation';
import { createMockMitarbeiter } from '../../utils/test-utils';

// Mock API functions and useRouter
jest.mock('@/lib/api/krankmeldungen', () => ({
    createKrankmeldung: jest.fn(),
    updateKrankmeldung: jest.fn(),
}));

jest.mock('next/navigation', () => ({
    useRouter: jest.fn(),
}));

describe('KrankmeldungForm', () => {
    const mockMitarbeiter = [
        createMockMitarbeiter({ id: '1', personalnummer: 'P1001', vorname: 'Max', nachname: 'Mustermann' }),
        createMockMitarbeiter({ id: '2', personalnummer: 'P1002', vorname: 'Anna', nachname: 'Schmidt' }),
    ];

    const mockPush = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
        useRouter.mockReturnValue({ push: mockPush });
    });

    it('renders the form correctly for creating a new krankmeldung', () => {
        render(<KrankmeldungForm mitarbeiter={mockMitarbeiter} />);

        expect(screen.getByLabelText(/mitarbeiter/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/startdatum/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/enddatum/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/arztbesuch/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/notizen/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /speichern/i })).toBeInTheDocument();
    });

    it('populates form with existing data when editing', () => {
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const existingKrankmeldung = {
            id: '123',
            mitarbeiterId: '1',
            startdatum: today.toISOString().split('T')[0],
            enddatum: tomorrow.toISOString().split('T')[0],
            arztbesuchDatum: today.toISOString().split('T')[0],
            notizen: 'Test Notizen',
            status: 'aktiv',
        };

        render(
            <KrankmeldungForm
                mitarbeiter={mockMitarbeiter}
                initialData={existingKrankmeldung}
            />
        );

        // Check if form is populated with existing data
        expect(screen.getByText('Max Mustermann')).toBeInTheDocument();
        expect(screen.getByDisplayValue('Test Notizen')).toBeInTheDocument();
    });

    it('submits the form correctly for a new krankmeldung', async () => {
        const user = userEvent.setup();

        createKrankmeldung.mockResolvedValueOnce({ data: { id: 'new-id' } });

        render(<KrankmeldungForm mitarbeiter={mockMitarbeiter} />);

        // Fill the form
        // Note: Date inputs and selects are complex to test with userEvent
        // This is a simplified version

        // For a real test, you'd need to mock the date pickers and select component
        const mitarbeiterSelect = screen.getByLabelText(/mitarbeiter/i);
        const notizenInput = screen.getByLabelText(/notizen/i);

        await user.selectOptions(mitarbeiterSelect, ['1']);
        await user.type(notizenInput, 'New Test Notizen');

        // Submit the form
        const saveButton = screen.getByRole('button', { name: /speichern/i });
        await user.click(saveButton);

        await waitFor(() => {
            expect(createKrankmeldung).toHaveBeenCalled();
            expect(mockPush).toHaveBeenCalledWith('/krankmeldungen/new-id');
        });
    });

    it('submits the form correctly when updating an existing krankmeldung', async () => {
        const user = userEvent.setup();

        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const existingKrankmeldung = {
            id: '123',
            mitarbeiterId: '1',
            startdatum: today.toISOString().split('T')[0],
            enddatum: tomorrow.toISOString().split('T')[0],
            arztbesuchDatum: today.toISOString().split('T')[0],
            notizen: 'Test Notizen',
            status: 'aktiv',
        };

        updateKrankmeldung.mockResolvedValueOnce({
            data: { id: '123', notizen: 'Updated Notizen' }
        });

        render(
            <KrankmeldungForm
                mitarbeiter={mockMitarbeiter}
                initialData={existingKrankmeldung}
            />
        );

        // Update the notizen field
        const notizenInput = screen.getByLabelText(/notizen/i);
        await user.clear(notizenInput);
        await user.type(notizenInput, 'Updated Notizen');

        // Submit the form
        const saveButton = screen.getByRole('button', { name: /speichern/i });
        await user.click(saveButton);

        await waitFor(() => {
            expect(updateKrankmeldung).toHaveBeenCalledWith('123', expect.any(Object));
            expect(mockPush).toHaveBeenCalledWith('/krankmeldungen/123');
        });
    });

    it('displays error messages for invalid inputs', async () => {
        const user = userEvent.setup();

        render(<KrankmeldungForm mitarbeiter={mockMitarbeiter} />);

        // Submit without filling required fields
        const saveButton = screen.getByRole('button', { name: /speichern/i });
        await user.click(saveButton);

        // Check for validation error messages
        expect(await screen.findByText(/mitarbeiter ist erforderlich/i)).toBeInTheDocument();
        expect(await screen.findByText(/startdatum ist erforderlich/i)).toBeInTheDocument();
        expect(await screen.findByText(/enddatum ist erforderlich/i)).toBeInTheDocument();
    });
});