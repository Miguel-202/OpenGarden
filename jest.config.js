module.exports = {
    preset: 'jest-expo',
    transformIgnorePatterns: [
        'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg|drizzle-orm|date-fns)'
    ],
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
        'expo-crypto': '<rootDir>/src/__mocks__/expo-crypto.ts',
    },
    setupFilesAfterFramework: undefined,
    setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],
};
