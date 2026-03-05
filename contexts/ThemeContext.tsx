import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from './AuthContext';
import { colorScheme } from 'nativewind';


type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
    theme: Theme;
    isDark: boolean;
    setTheme: (theme: Theme) => void;
    resolvedTheme: 'light' | 'dark';
    isHydrated: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const systemColorScheme = useColorScheme();
    const { user } = useAuth();
    const [theme, setThemeState] = useState<Theme>('system');
    const [isHydrated, setIsHydrated] = useState(false);


    // Initialize theme from user profile or fallback to system
    useEffect(() => {
        const initTheme = async () => {
            if (user?.theme) {
                setThemeState(user.theme);
                setIsHydrated(true);
            } else {
                await loadThemePreference();
            }
        };
        initTheme();
    }, [user?.theme]);

    const resolvedTheme = theme === 'system' ? (systemColorScheme || 'light') : theme;
    const isDark = resolvedTheme === 'dark';

    // Sync with NativeWind
    useEffect(() => {
        colorScheme.set(resolvedTheme);
    }, [resolvedTheme]);

    const loadThemePreference = async () => {
        try {
            const savedTheme = await AsyncStorage.getItem('theme_preference');
            if (savedTheme && ['light', 'dark', 'system'].includes(savedTheme)) {
                setThemeState(savedTheme as Theme);
            }
        } catch (error) {
            console.error('Failed to load theme preference:', error);
        } finally {
            setIsHydrated(true);
        }
    };

    const setTheme = async (newTheme: Theme) => {
        try {
            setThemeState(newTheme);
            await AsyncStorage.setItem('theme_preference', newTheme);
        } catch (error) {
            console.error('Failed to save theme preference:', error);
        }
    };

    return (
        <ThemeContext.Provider value={{ theme, isDark, setTheme, resolvedTheme, isHydrated }}>
            {children}
        </ThemeContext.Provider>
    );
}

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};
