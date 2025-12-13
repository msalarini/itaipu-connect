import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColorScheme } from 'react-native';
import { colors as defaultColors, darkColors, lightColors } from '../theme';

type Theme = 'light' | 'dark';
type ThemeColors = typeof darkColors;

interface ThemeContextData {
    theme: Theme;
    colors: ThemeColors;
    toggleTheme: () => void;
    setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextData>({} as ThemeContextData);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const systemScheme = useColorScheme();
    const [theme, setThemeState] = useState<Theme>('dark'); // Default to dark

    useEffect(() => {
        loadTheme();
    }, []);

    const loadTheme = async () => {
        try {
            const savedTheme = await AsyncStorage.getItem('@itaipu_connect:theme');
            if (savedTheme) {
                setThemeState(savedTheme as Theme);
            } else if (systemScheme) {
                // Optional: Follow system preference by default
                // setThemeState(systemScheme);
            }
        } catch (error) {
            console.error('Failed to load theme:', error);
        }
    };

    const toggleTheme = async () => {
        const newTheme = theme === 'light' ? 'dark' : 'light';
        setThemeState(newTheme);
        try {
            await AsyncStorage.setItem('@itaipu_connect:theme', newTheme);
        } catch (error) {
            console.error('Failed to save theme:', error);
        }
    };

    const setTheme = async (newTheme: Theme) => {
        setThemeState(newTheme);
        try {
            await AsyncStorage.setItem('@itaipu_connect:theme', newTheme);
        } catch (error) {
            console.error('Failed to save theme:', error);
        }
    };

    const colors = theme === 'light' ? lightColors : darkColors;

    return (
        <ThemeContext.Provider value={{ theme, colors, toggleTheme, setTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => useContext(ThemeContext);
