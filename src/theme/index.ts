import { MD3LightTheme as DefaultTheme } from 'react-native-paper';

export type AppTheme = typeof DefaultTheme & {
    colors: typeof DefaultTheme.colors;
};

export type ThemeName = 'green' | 'pink' | 'blue';

export const pastelGreenTheme: AppTheme = {
    ...DefaultTheme,
    colors: {
        ...DefaultTheme.colors,

        // Brand
        primary: '#2F7D5A',        // deep mint/fern (better nav contrast)
        onPrimary: '#FFFFFF',
        primaryContainer: '#D9F2E6',
        onPrimaryContainer: '#0F3D2C',

        // Accent
        secondary: '#6FB59A',
        onSecondary: '#0B2A1F',
        secondaryContainer: '#E6FAF1',
        onSecondaryContainer: '#0F3D2C',

        // Surfaces
        background: '#E8F5E9',     // user green bg
        surface: '#FFFFFF',
        surfaceVariant: '#C8E6C9', // cards/sections tint (distinct from background)
        onSurface: '#1B1B1F',
        onSurfaceVariant: '#33413B',

        // Helpful defaults to improve “separation”
        outline: '#2F7D5A', // Match primary color for better visibility
    },
};

export const pastelPinkTheme: AppTheme = {
    ...DefaultTheme,
    colors: {
        ...DefaultTheme.colors,

        // Brand
        primary: '#C94B73',        // rose (stronger than pastel for nav/buttons)
        onPrimary: '#FFFFFF',
        primaryContainer: '#FFD9E2',
        onPrimaryContainer: '#4B0F24',

        // Accent
        secondary: '#E07A9B',
        onSecondary: '#3B0D1C',
        secondaryContainer: '#FFE9EF',
        onSecondaryContainer: '#4B0F24',

        // Surfaces (make it pink, NOT peach/yellow)
        background: '#fac9daff',     // very light blush
        surface: '#FFFFFF',
        surfaceVariant: '#ffc0d5ff', // soft pink panels
        onSurface: '#1B1B1F',
        onSurfaceVariant: '#4A2F38',

        outline: '#C94B73', // Match primary color
    },
};

export const pastelBlueTheme: AppTheme = {
    ...DefaultTheme,
    colors: {
        ...DefaultTheme.colors,

        // Brand
        primary: '#2B6CB0',        // calm blue (good contrast on light UI)
        onPrimary: '#FFFFFF',
        primaryContainer: '#D6ECFF',
        onPrimaryContainer: '#0D2A44',

        // Accent
        secondary: '#5AA6D6',
        onSecondary: '#082433',
        secondaryContainer: '#E4F4FF',
        onSecondaryContainer: '#0D2A44',

        // Surfaces (make it blue, NOT lavender)
        background: '#dbebfaff',     // near-white with blue hint
        surface: '#FFFFFF',
        surfaceVariant: '#B3D9FF', // light blue-gray panels
        onSurface: '#1B1B1F',
        onSurfaceVariant: '#2F3E4D',

        outline: '#2B6CB0', // Match primary color
    },
};

export const themes: Record<ThemeName, AppTheme> = {
    green: pastelGreenTheme,
    pink: pastelPinkTheme,
    blue: pastelBlueTheme,
};