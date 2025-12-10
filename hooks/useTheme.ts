import { useState, useEffect } from 'react';

// Constants
const THEME_STORAGE_KEY = 'RawBox-theme';
const THEME_DARK = 'dark';
const THEME_LIGHT = 'light';
const THEME_SYSTEM = 'system';

// Types
export type Theme = 'light' | 'dark' | 'system';

export interface UseThemeReturn {
    theme: Theme;
    isDark: boolean;
    setTheme: (theme: Theme) => void;
    toggleTheme: () => void;
}

/**
 * Custom hook for theme management
 * Supports light, dark, and system preference themes
 * Persists theme choice to localStorage
 */
export const useTheme = (): UseThemeReturn => {
    const [theme, setThemeState] = useState<Theme>(THEME_SYSTEM);
    const [isDark, setIsDark] = useState(false);

    // Get system preference
    const getSystemTheme = (): 'light' | 'dark' => {
        if (typeof window === 'undefined' || !window.matchMedia) {
            return THEME_LIGHT;
        }
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? THEME_DARK : THEME_LIGHT;
    };

    // Get stored theme from localStorage
    const getStoredTheme = (): Theme => {
        try {
            const stored = localStorage.getItem(THEME_STORAGE_KEY);
            if (stored === THEME_LIGHT || stored === THEME_DARK || stored === THEME_SYSTEM) {
                return stored;
            }
        } catch (error) {
            console.warn('Failed to read theme from localStorage:', error);
        }
        return THEME_SYSTEM;
    };

    // Apply theme to document
    const applyTheme = (themeToApply: Theme) => {
        const effectiveTheme = themeToApply === THEME_SYSTEM ? getSystemTheme() : themeToApply;
        const shouldBeDark = effectiveTheme === THEME_DARK;

        setIsDark(shouldBeDark);

        if (shouldBeDark) {
            document.documentElement.setAttribute('data-theme', THEME_DARK);
        } else {
            document.documentElement.removeAttribute('data-theme');
        }
    };

    // Initialize theme on mount
    useEffect(() => {
        const storedTheme = getStoredTheme();
        setThemeState(storedTheme);
        applyTheme(storedTheme);
    }, []);

    // Listen for system theme changes
    useEffect(() => {
        if (theme !== THEME_SYSTEM) return;

        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

        const handleChange = () => {
            applyTheme(THEME_SYSTEM);
        };

        // Modern browsers
        if (mediaQuery.addEventListener) {
            mediaQuery.addEventListener('change', handleChange);
            return () => mediaQuery.removeEventListener('change', handleChange);
        }
        // Legacy browsers
        else if (mediaQuery.addListener) {
            mediaQuery.addListener(handleChange);
            return () => mediaQuery.removeListener(handleChange);
        }
    }, [theme]);

    // Set theme function
    const setTheme = (newTheme: Theme) => {
        setThemeState(newTheme);
        applyTheme(newTheme);

        try {
            localStorage.setItem(THEME_STORAGE_KEY, newTheme);
        } catch (error) {
            console.warn('Failed to save theme to localStorage:', error);
        }
    };

    // Toggle between light and dark (ignores system)
    const toggleTheme = () => {
        const newTheme = isDark ? THEME_LIGHT : THEME_DARK;
        setTheme(newTheme);
    };

    return { theme, isDark, setTheme, toggleTheme };
};
