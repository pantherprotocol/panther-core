module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    modulePaths: ['node_modules', '<rootDir>/src'],
    setupFiles: ['dotenv/config'],
    setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],
    transform: {
        '^.+\\.[t|j]sx?$': 'babel-jest',
    },
    transformIgnorePatterns: ['/node_modules/(?!(serialize-error)/)'],
    testEnvironment: 'jsdom',
    moduleNameMapper: {
        '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$':
            '<rootDir>/__mocks__/fileMock.js',
        '\\.(css|scss)$': '<rootDir>/__mocks__/styleMock.js',
    },
};
