/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    collectCoverage: true,
    testMatch: ['**/__tests__/**/*.[t]s?(x)', '**/?(*.)+(spec|test).[t]s?(x)'],
    testPathIgnorePatterns: ['<rootDir>/lib'],
    watchPathIgnorePatterns: [
        '<rootDir>/src/triad-merkle-tree/__tests__/data',
        '<rootDir>/lib',
    ],
};
