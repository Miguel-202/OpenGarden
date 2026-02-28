jest.mock('expo-crypto', () => ({
    randomUUID: () => 'mock-uuid-' + Math.random().toString(36).substring(7),
}));

jest.mock('expo-notifications', () => ({
    scheduleNotificationAsync: jest.fn(),
    cancelScheduledNotificationAsync: jest.fn(),
}));
