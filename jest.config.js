// jest.config.js
const nextJest = require('next/jest');

const createJestConfig = nextJest({
    dir: './',
});

const customJestConfig = {
    setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
    testEnvironment: 'jest-environment-jsdom',
    moduleNameMapper: {
        '^@/components/(.*)$': '<rootDir>/components/$1',
        '^@/lib/(.*)$': '<rootDir>/lib/$1',
        '^@/app/(.*)$': '<rootDir>/app/$1',
        '^@/types/(.*)$': '<rootDir>/types/$1',
    },
    testPathIgnorePatterns: [
        '<rootDir>/node_modules/',
        '<rootDir>/.next/',
        '<rootDir>/prisma/',
        '<rootDir>/scripts/',
    ],
    collectCoverageFrom: [
        'app/**/*.{js,jsx,ts,tsx}',
        'components/**/*.{js,jsx,ts,tsx}',
        'lib/**/*.{js,jsx,ts,tsx}',
        '!**/*.d.ts',
        '!**/node_modules/**',
    ],
    coverageThreshold: {
        global: {
            statements: 70,
            branches: 70,
            functions: 70,
            lines: 70,
        },
    },
    // Füge Node.js-Globals wie TextEncoder hinzu
    globals: {
        TextEncoder: require('util').TextEncoder,
        TextDecoder: require('util').TextDecoder,
    },
};

module.exports = createJestConfig(customJestConfig);