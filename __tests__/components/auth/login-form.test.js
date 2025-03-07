// __tests__/components/auth/login-form.test.js

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LoginForm } from '@/components/auth/login-form';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';

// Mocking the useRouter return value
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
    useRouter: jest.fn(),
}));

describe('LoginForm', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        useRouter.mockReturnValue({ push: mockPush });
    });

    it('renders the login form correctly', () => {
        render(<LoginForm />);

        expect(screen.getByLabelText(/e-mail/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/passwort/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /anmelden/i })).toBeInTheDocument();
    });

    it('validates inputs correctly', async () => {
        const user = userEvent.setup();

        render(<LoginForm />);

        const emailInput = screen.getByLabelText(/e-mail/i);
        const passwordInput = screen.getByLabelText(/passwort/i);
        const submitButton = screen.getByRole('button', { name: /anmelden/i });

        // Try submitting with empty fields
        await user.click(submitButton);

        expect(await screen.findByText(/e-mail ist erforderlich/i)).toBeInTheDocument();
        expect(await screen.findByText(/passwort ist erforderlich/i)).toBeInTheDocument();

        // Try with invalid email
        await user.type(emailInput, 'invalid-email');
        await user.click(submitButton);

        expect(await screen.findByText(/ungültige e-mail-adresse/i)).toBeInTheDocument();

        // Fill valid data
        await user.clear(emailInput);
        await user.type(emailInput, 'benutzer@gfu-krankmeldung.de');
        await user.type(passwordInput, 'password123');
        await user.click(submitButton);

        // Check if signIn was called with correct data
        expect(signIn).toHaveBeenCalledWith('credentials', {
            email: 'benutzer@gfu-krankmeldung.de',
            password: 'password123',
            redirect: false,
        });
    });

    it('shows error message on failed login', async () => {
        const user = userEvent.setup();

        signIn.mockResolvedValueOnce({ ok: false, error: 'Invalid credentials' });

        render(<LoginForm />);

        const emailInput = screen.getByLabelText(/e-mail/i);
        const passwordInput = screen.getByLabelText(/passwort/i);
        const submitButton = screen.getByRole('button', { name: /anmelden/i });

        await user.type(emailInput, 'benutzer@gfu-krankmeldung.de');
        await user.type(passwordInput, 'wrong-password');
        await user.click(submitButton);

        expect(await screen.findByText(/ungültige anmeldedaten/i)).toBeInTheDocument();
    });

    it('redirects on successful login', async () => {
        const user = userEvent.setup();

        signIn.mockResolvedValueOnce({ ok: true });

        render(<LoginForm />);

        const emailInput = screen.getByLabelText(/e-mail/i);
        const passwordInput = screen.getByLabelText(/passwort/i);
        const submitButton = screen.getByRole('button', { name: /anmelden/i });

        await user.type(emailInput, 'benutzer@gfu-krankmeldung.de');
        await user.type(passwordInput, 'password123');
        await user.click(submitButton);

        await waitFor(() => {
            expect(mockPush).toHaveBeenCalledWith('/dashboard');
        });
    });
});