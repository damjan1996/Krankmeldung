// __tests__/app/dashboard/page.test.js

import React from 'react';
import { render, screen } from '@testing-library/react';
import DashboardPage from '@/app/dashboard/page';
import { renderWithProviders, mockStandardUserSession } from '../../utils/test-utils';
import { getKrankmeldungen } from '@/lib/api/krankmeldungen';
import { getMitarbeiter } from '@/lib/api/mitarbeiter';

// Mock the API calls
jest.mock('@/lib/api/krankmeldungen', () => ({
    getKrankmeldungen: jest.fn(),
}));

jest.mock('@/lib/api/mitarbeiter', () => ({
    getMitarbeiter: jest.fn(),
}));

// Mock the components used in the dashboard
jest.mock('@/components/dashboard/welcome-banner', () => ({
    WelcomeBanner: () => <div data-testid="welcome-banner">Welcome Banner</div>,
}));

jest.mock('@/components/dashboard/aktive-krankmeldungen', () => ({
    AktiveKrankmeldungen: ({ limit }) => (
        <div data-testid="aktive-krankmeldungen">
            Aktive Krankmeldungen (Limit: {limit})
        </div>
    ),
}));

jest.mock('@/components/dashboard/krankmeldung-status-card', () => ({
    KrankmeldungStatusCard: () => <div data-testid="krankmeldung-status-card">Status Card</div>,
}));

jest.mock('@/components/dashboard/recent-activity', () => ({
    RecentActivity: ({ limit }) => (
        <div data-testid="recent-activity">
            Recent Activity (Limit: {limit})
        </div>
    ),
}));

describe('Dashboard Page', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockStandardUserSession();

        // Mock API responses
        getKrankmeldungen.mockResolvedValue({
            data: [
                // Mock krankmeldungen
            ],
        });

        getMitarbeiter.mockResolvedValue({
            data: [
                // Mock mitarbeiter
            ],
        });
    });

    it('renders dashboard components correctly', async () => {
        renderWithProviders(<DashboardPage />);

        // Check if all dashboard components are rendered
        expect(screen.getByTestId('welcome-banner')).toBeInTheDocument();
        expect(screen.getByTestId('aktive-krankmeldungen')).toBeInTheDocument();
        expect(screen.getByTestId('krankmeldung-status-card')).toBeInTheDocument();
        expect(screen.getByTestId('recent-activity')).toBeInTheDocument();

        // Check if limits are passed to components correctly
        expect(screen.getByText(/aktive krankmeldungen \(limit: 5\)/i)).toBeInTheDocument();
        expect(screen.getByText(/recent activity \(limit: 10\)/i)).toBeInTheDocument();
    });

    it('has correct heading structure', async () => {
        renderWithProviders(<DashboardPage />);

        // Check for main dashboard heading
        const mainHeading = screen.getByRole('heading', { level: 1 });
        expect(mainHeading).toHaveTextContent(/dashboard/i);

        // Check for section headings
        const sectionHeadings = screen.getAllByRole('heading', { level: 2 });
        expect(sectionHeadings.length).toBeGreaterThanOrEqual(2); // At least 2 section headings

        // Check for specific section titles
        expect(screen.getByText(/aktuelle übersicht/i)).toBeInTheDocument();
        expect(screen.getByText(/letzte aktivitäten/i)).toBeInTheDocument();
    });

    it('has responsive layout with grid structure', async () => {
        const { container } = renderWithProviders(<DashboardPage />);

        // Check for grid layout classes
        const gridElements = container.querySelectorAll('.grid');
        expect(gridElements.length).toBeGreaterThan(0);

        // Check for responsive gap classes
        const gapElements = container.querySelectorAll('[class*="gap-"]');
        expect(gapElements.length).toBeGreaterThan(0);
    });

    it('includes links to related sections', async () => {
        renderWithProviders(<DashboardPage />);

        // Check for navigation links
        const allLinks = screen.getAllByRole('link');

        // Should have links to krankmeldungen and mitarbeiter sections
        const krankmeldungenLink = allLinks.find(link =>
            link.textContent.toLowerCase().includes('krankmeldungen') ||
            link.getAttribute('href')?.includes('/krankmeldungen')
        );

        const mitarbeiterLink = allLinks.find(link =>
            link.textContent.toLowerCase().includes('mitarbeiter') ||
            link.getAttribute('href')?.includes('/mitarbeiter')
        );

        expect(krankmeldungenLink).toBeDefined();
        expect(mitarbeiterLink).toBeDefined();
    });
});