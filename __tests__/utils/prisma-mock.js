// __tests__/utils/prisma-mock.js

import prisma from '@/lib/prisma';

/**
 * Mock implementation for findMany with filtering capabilities
 * @param {Object} mockData Array of mock data objects to return
 * @returns {Function} Mock implementation function
 */
export function mockPrismaFindMany(mockData) {
    return jest.fn().mockImplementation(({ where = {} } = {}) => {
        // If no filter is provided, return all data
        if (!where || Object.keys(where).length === 0) {
            return Promise.resolve(mockData);
        }

        // Apply filters
        const filteredData = mockData.filter(item => {
            return Object.entries(where).every(([key, value]) => {
                // Handle different types of filters (equals, contains, etc.)
                if (typeof value === 'object' && value !== null) {
                    // Handle complex filters like contains, equals, in, etc.
                    const [operator, operand] = Object.entries(value)[0];

                    switch (operator) {
                        case 'equals':
                            return item[key] === operand;
                        case 'contains':
                            return String(item[key]).includes(operand);
                        case 'in':
                            return operand.includes(item[key]);
                        case 'gte':
                            return item[key] >= operand;
                        case 'lte':
                            return item[key] <= operand;
                        // Add more operators as needed
                        default:
                            return true;
                    }
                }

                // Simple equality check
                return item[key] === value;
            });
        });

        return Promise.resolve(filteredData);
    });
}

/**
 * Mock implementation for findUnique
 * @param {Object} mockData Object to return or array to search in
 * @returns {Function} Mock implementation function
 */
export function mockPrismaFindUnique(mockData) {
    return jest.fn().mockImplementation(({ where = {} } = {}) => {
        // If mockData is not an array, just return it
        if (!Array.isArray(mockData)) {
            return Promise.resolve(mockData);
        }

        // Find the item in the array that matches all criteria
        const foundItem = mockData.find(item => {
            return Object.entries(where).every(([key, value]) => item[key] === value);
        });

        return Promise.resolve(foundItem || null);
    });
}

/**
 * Mock implementation for create
 * @param {Function} transformFn Optional function to transform the input data
 * @returns {Function} Mock implementation function
 */
export function mockPrismaCreate(transformFn = data => data) {
    return jest.fn().mockImplementation(({ data }) => {
        const transformedData = transformFn(data);
        return Promise.resolve({
            id: 'mock-id',
            ...transformedData,
            createdAt: new Date(),
        });
    });
}

/**
 * Mock implementation for update
 * @param {Object} existingData Existing data to merge with updates
 * @returns {Function} Mock implementation function
 */
export function mockPrismaUpdate(existingData = {}) {
    return jest.fn().mockImplementation(({ where, data }) => {
        return Promise.resolve({
            ...existingData,
            ...data,
            id: where?.id || existingData.id || 'mock-id',
            updatedAt: new Date(),
        });
    });
}

/**
 * Set up mocks for a Prisma entity (e.g., krankmeldung, mitarbeiter)
 * @param {string} entity Name of the Prisma entity
 * @param {Object} options Configuration options
 * @returns {Object} Mock implementations
 */
export function setupPrismaMocks(entity, options = {}) {
    const {
        findManyData = [],
        findUniqueData = null,
        createTransform = data => data,
        updateExistingData = {},
    } = options;

    prisma[entity].findMany = mockPrismaFindMany(findManyData);
    prisma[entity].findUnique = mockPrismaFindUnique(findUniqueData);
    prisma[entity].create = mockPrismaCreate(createTransform);
    prisma[entity].update = mockPrismaUpdate(updateExistingData);
    prisma[entity].delete = jest.fn().mockResolvedValue({ id: 'mock-id' });

    return {
        findMany: prisma[entity].findMany,
        findUnique: prisma[entity].findUnique,
        create: prisma[entity].create,
        update: prisma[entity].update,
        delete: prisma[entity].delete,
    };
}

/**
 * Reset all Prisma mocks
 */
export function resetPrismaMocks() {
    jest.resetAllMocks();
}