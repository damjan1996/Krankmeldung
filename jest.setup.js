// jest.setup.js
import '@testing-library/jest-dom';
import { TextEncoder, TextDecoder } from 'util';
import fetchMock from 'jest-fetch-mock';

// Polyfill für TextEncoder/TextDecoder in Node.js
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Fetch Mock aktivieren
fetchMock.enableMocks();

// Mock next/navigation
jest.mock('next/navigation', () => ({
    useRouter: jest.fn(() => ({
        push: jest.fn(),
        replace: jest.fn(),
        back: jest.fn(),
        forward: jest.fn(),
        refresh: jest.fn(),
        prefetch: jest.fn(),
        pathname: '/',
        query: {},
    })),
    usePathname: jest.fn(() => '/'),
    useSearchParams: jest.fn(() => new URLSearchParams()),
}));

// Mock NextAuth
jest.mock('next-auth/react', () => {
    const originalModule = jest.requireActual('next-auth/react');
    return {
        __esModule: true,
        ...originalModule,
        useSession: jest.fn(() => ({
            data: null,
            status: 'unauthenticated',
            update: jest.fn(),
        })),
        signIn: jest.fn(),
        signOut: jest.fn(),
        getSession: jest.fn(),
    };
});

// Mock Prisma Client
jest.mock('@/lib/prisma', () => ({
    __esModule: true,
    default: {
        benutzer: {
            findUnique: jest.fn(),
            findMany: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
        },
        mitarbeiter: {
            findUnique: jest.fn(),
            findMany: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
        },
        krankmeldung: {
            findUnique: jest.fn(),
            findMany: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
        },
        aenderungsLog: {
            create: jest.fn(),
            findMany: jest.fn(),
        },
        $transaction: jest.fn((callback) => callback()),
    },
}));