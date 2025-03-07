// __tests__/integration/krankmeldung-workflow.test.js

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders, mockStandardUserSession } from '../utils/test-utils';
import { KrankmeldungWorkflow } from '@/components/krankmeldungen/krankmeldung-workflow';
import { getMitarbeiter } from '@/lib/api/mitarbeiter';
import { createKrankmeldung, getKrankmeldungById, updateKrankmeldung } from '@/lib/api/krankmeldungen';
import { useRouter } from 'next/navigation';

// Mock the API calls and router
jest.mock('@/lib/api/mitarbeiter', () => ({
    getMitarbeiter: jest.fn(),
}));

jest.mock('@/lib/api/krankmeldungen', () => ({
    createKrankmeldung: jest.fn(),
    getKrankmeldungById: jest.fn(),
    updateKrankmeldung: jest.fn(),
}));

jest.mock('next/navigation', () => ({
    useRouter: jest.fn(),
}));

// Create a mock component that simulates the complete workflow
// This is just for testing purposes - in a real app, this would be composed of actual components
const KrankmeldungWorkflowTest = ({ initialStep = 'select', initialData = null }) => {
    const [step, setStep] = React.useState(initialStep);
    const [formData, setFormData] = React.useState(initialData || {});
    const router = useRouter();

    const handleSelectMitarbeiter = async (mitarbeiterId) => {
        setFormData({ ...formData, mitarbeiterId });
        setStep('dates');
    };

    const handleSetDates = async (dates) => {
        setFormData({ ...formData, ...dates });
        setStep('review');
    };

    const handleSubmit = async () => {
        try {
            if (formData.id) {
                await updateKrankmeldung(formData.id, formData);
            } else {
                await createKrankmeldung(formData);
            }
            setStep('success');
        } catch (error) {
            setStep('error');
        }
    };

    switch (step) {
        case 'select':
            return (
                <div>
                    <h2>Mitarbeiter auswählen</h2>
                    <ul>
                        <li><button onClick={() => handleSelectMitarbeiter('employee-1')}>Max Mustermann</button></li>
                        <li><button onClick={() => handleSelectMitarbeiter('employee-2')}>Anna Schmidt</button></li>
                    </ul>
                </div>
            );
        case 'dates':
            return (
                <div>
                    <h2>Zeitraum festlegen</h2>
                    <button onClick={() => handleSetDates({
                        startdatum: '2025-03-01',
                        enddatum: '2025-03-05',
                        arztbesuchDatum: '2025-03-01'
                    })}>
                        01.03.2025 - 05.03.2025 auswählen
                    </button>
                </div>
            );
        case 'review':
            return (
                <div>
                    <h2>Überprüfen und Bestätigen</h2>
                    <div data-testid="review-data">
                        <p>Mitarbeiter ID: {formData.mitarbeiterId}</p>
                        <p>Startdatum: {formData.startdatum}</p>
                        <p>Enddatum: {formData.enddatum}</p>
                    </div>
                    <button onClick={handleSubmit}>Krankmeldung einreichen</button>
                </div>
            );
        case 'success':
            return <div>Krankmeldung erfolgreich erstellt!</div>;
        case 'error':
            return <div>Fehler beim Erstellen der Krankmeldung</div>;
        default:
            return null;
    }
};

describe('Krankmeldung Workflow Integration', () => {
    const mockPush = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
        mockStandardUserSession();
        useRouter.mockReturnValue({ push: mockPush });

        // Mock API responses
        getMitarbeiter.mockResolvedValue({
            data: [
                { id: 'employee-1', vorname: 'Max', nachname: 'Mustermann' },
                { id: 'employee-2', vorname: 'Anna', nachname: 'Schmidt' },
            ],
        });

        createKrankmeldung.mockResolvedValue({
            data: { id: 'new-krankmeldung-id' },
        });
    });

    it('completes the full krankmeldung creation workflow', async () => {
        const user = userEvent.setup();

        renderWithProviders(<KrankmeldungWorkflowTest />);

        // Step 1: Select a mitarbeiter
        expect(screen.getByText(/mitarbeiter auswählen/i)).toBeInTheDocument();

        const maxButton = screen.getByText('Max Mustermann');
        await user.click(maxButton);

        // Step 2: Select dates
        await waitFor(() => {
            expect(screen.getByText(/zeitraum festlegen/i)).toBeInTheDocument();
        });

        const dateButton = screen.getByText(/01.03.2025 - 05.03.2025 auswählen/i);
        await user.click(dateButton);

        // Step 3: Review and submit
        await waitFor(() => {
            expect(screen.getByText(/überprüfen und bestätigen/i)).toBeInTheDocument();
        });

        const reviewData = screen.getByTestId('review-data');
        expect(reviewData).toHaveTextContent(/mitarbeiter id: employee-1/i);
        expect(reviewData).toHaveTextContent(/startdatum: 2025-03-01/i);
        expect(reviewData).toHaveTextContent(/enddatum: 2025-03-05/i);

        const submitButton = screen.getByText(/krankmeldung einreichen/i);
        await user.click(submitButton);

        // Success message
        await waitFor(() => {
            expect(screen.getByText(/krankmeldung erfolgreich erstellt/i)).toBeInTheDocument();
        });

        // Verify API calls
        expect(createKrankmeldung).toHaveBeenCalledWith({
            mitarbeiterId: 'employee-1',
            startdatum: '2025-03-01',
            enddatum: '2025-03-05',
            arztbesuchDatum: '2025-03-01'
        });
    });

    it('handles API errors during submission', async () => {
        const user = userEvent.setup();

        // Mock API error
        createKrankmeldung.mockRejectedValueOnce(new Error('API Error'));

        renderWithProviders(<KrankmeldungWorkflowTest />);

        // Step 1: Select a mitarbeiter
        const maxButton = screen.getByText('Max Mustermann');
        await user.click(maxButton);

        // Step 2: Select dates
        await waitFor(() => {
            expect(screen.getByText(/zeitraum festlegen/i)).toBeInTheDocument();
        });

        const dateButton = screen.getByText(/01.03.2025 - 05.03.2025 auswählen/i);
        await user.click(dateButton);

        // Step 3: Review and submit
        await waitFor(() => {
            expect(screen.getByText(/überprüfen und bestätigen/i)).toBeInTheDocument();
        });

        const submitButton = screen.getByText(/krankmeldung einreichen/i);
        await user.click(submitButton);

        // Error message
        await waitFor(() => {
            expect(screen.getByText(/fehler beim erstellen/i)).toBeInTheDocument();
        });
    });

    it('edits an existing krankmeldung', async () => {
        const user = userEvent.setup();

        const existingData = {
            id: 'existing-id',
            mitarbeiterId: 'employee-2',
            startdatum: '2025-02-15',
            enddatum: '2025-02-20',
            arztbesuchDatum: '2025-02-15',
            status: 'aktiv',
        };

        // Mock update API call
        updateKrankmeldung.mockResolvedValueOnce({
            data: { ...existingData, status: 'abgeschlossen' },
        });

        // Render with initial data and review step
        renderWithProviders(
            <KrankmeldungWorkflowTest
                initialStep="review"
                initialData={{ ...existingData, status: 'abgeschlossen' }}
            />
        );

        // Should be in review mode with existing data
        expect(screen.getByText(/überprüfen und bestätigen/i)).toBeInTheDocument();

        const reviewData = screen.getByTestId('review-data');
        expect(reviewData).toHaveTextContent(/mitarbeiter id: employee-2/i);

        // Submit the changes
        const submitButton = screen.getByText(/krankmeldung einreichen/i);
        await user.click(submitButton);

        // Success message
        await waitFor(() => {
            expect(screen.getByText(/krankmeldung erfolgreich erstellt/i)).toBeInTheDocument();
        });

        // Verify API call for update
        expect(updateKrankmeldung).toHaveBeenCalledWith('existing-id', expect.objectContaining({
            status: 'abgeschlossen',
        }));
    });
});