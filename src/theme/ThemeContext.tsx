import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppTheme, themes, ThemeName } from './';

const THEME_STORAGE_KEY = '@open_garden_theme';

type ThemeContextType = {
    theme: AppTheme;
    themeName: ThemeName;
    setTheme: (name: ThemeName) => Promise<void>;
};

const ThemeContext = createContext<ThemeContextType>({
    theme: themes.green,
    themeName: 'green',
    setTheme: async () => { },
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [themeName, setThemeNameState] = useState<ThemeName>('green');

    useEffect(() => {
        AsyncStorage.getItem(THEME_STORAGE_KEY).then(saved => {
            if (saved && (saved === 'green' || saved === 'pink' || saved === 'blue')) {
                setThemeNameState(saved);
            }
        }).catch(console.error);
    }, []);

    const setTheme = async (name: ThemeName) => {
        setThemeNameState(name);
        await AsyncStorage.setItem(THEME_STORAGE_KEY, name).catch(console.error);
    };

    return (
        <ThemeContext.Provider value={{ theme: themes[themeName], themeName, setTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}

export const useAppTheme = () => useContext(ThemeContext);
