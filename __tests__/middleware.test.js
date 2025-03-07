// __tests__/middleware.test.js
import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import middleware from '@/middleware';
import { getToken } from 'next-auth/jwt';

// Mock next-auth library
jest.mock('next-auth/jwt', () => ({
    getToken: jest.fn(),
}));

describe('Authentication Middleware', () => {
    // Set up environment variables
    const originalEnv = process.env;

    beforeEach(() => {
        jest.resetAllMocks();
        process.env = { ...originalEnv };
        process.env.NEXTAUTH_URL = 'http://localhost:3000';
        process.env.NEXTAUTH_SECRET = 'gfu_krankmeldung_secret_key_2025';
    });

    afterEach(() => {
        process.env = originalEnv;
    });

    it('allows access to public routes without authentication', async () => {
        // Mock token as null to simulate no authentication
        getToken.mockResolvedValueOnce(null);

        // Create a mock request for a public route
        const request = new NextRequest(new URL('http://localhost:3000/login'));

        // Execute the middleware
        const response = await middleware(request);

        // Public routes should not redirect
        expect(response).toBeUndefined();
    });

    it('redirects to login for protected routes when not authenticated', async () => {
        // Mock token as null to simulate no authentication
        getToken.mockResolvedValueOnce(null);

        // Create a mock request for a protected route
        const request = new NextRequest(new URL('http://localhost:3000/dashboard'));

        // Mock the NextResponse.redirect function
        const mockRedirect = jest.spyOn(NextResponse, 'redirect');
        mockRedirect.mockImplementation((url) => ({ url }));

        // Execute the middleware
        await middleware(request);

        // Should redirect to login
        expect(mockRedirect).toHaveBeenCalledWith(expect.stringContaining('/login'));

        // Clean up mock
        mockRedirect.mockRestore();
    });

    it('allows access to protected routes when authenticated', async () => {
        // Mock token as valid to simulate authentication
        getToken.mockResolvedValueOnce({
            id: 'user-id',
            email: 'user@example.com',
            name: 'Test User',
        });

        // Create a mock request for a protected route
        const request = new NextRequest(new URL('http://localhost:3000/dashboard'));

        // Execute the middleware
        const response = await middleware(request);

        // Should allow access (not redirect)
        expect(response).toBeUndefined();
    });

    it('allows API routes access with valid token', async () => {
        // Mock token as valid
        getToken.mockResolvedValueOnce({
            id: 'user-id',
            email: 'user@example.com',
            name: 'Test User',
        });

        // Create a mock request for an API route
        const request = new NextRequest(new URL('http://localhost:3000/api/krankmeldungen'));

        // Execute the middleware
        const response = await middleware(request);

        // Should allow access
        expect(response).toBeUndefined();
    });

    it('restricts access to admin routes for non-admin users', async () => {
        // Mock token as valid but not admin
        getToken.mockResolvedValueOnce({
            id: 'user-id',
            email: 'user@example.com',
            name: 'Test User',
            istAdmin: false,
        });

        // Create a mock request for an admin route
        const request = new NextRequest(new URL('http://localhost:3000/admin'));

        // Mock the NextResponse.redirect function
        const mockRedirect = jest.spyOn(NextResponse, 'redirect');
        mockRedirect.mockImplementation((url) => ({ url }));

        // Execute the middleware
        await middleware(request);

        // Should redirect to dashboard
        expect(mockRedirect).toHaveBeenCalledWith(expect.stringContaining('/dashboard'));

        // Clean up mock
        mockRedirect.mockRestore();
    });

    it('allows access to admin routes for admin users', async () => {
        // Mock token as valid admin
        getToken.mockResolvedValueOnce({
            id: 'user-id',
            email: 'admin@example.com',
            name: 'Admin User',
            istAdmin: true,
        });

        // Create a mock request for an admin route
        const request = new NextRequest(new URL('http://localhost:3000/admin'));

        // Execute the middleware
        const response = await middleware(request);

        // Should allow access
        expect(response).toBeUndefined();
    });
});