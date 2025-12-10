/**
 * Color manipulation utilities for branding and theming
 */

/**
 * Adjusts a hex color by a specified amount (lightens or darkens)
 * @param hex - Hex color string (with or without #)
 * @param amount - Amount to adjust (-255 to 255). Positive lightens, negative darkens
 * @returns Adjusted hex color string
 * 
 * @example
 * adjustColor('#ff0000', 50)  // Lightens red
 * adjustColor('#ff0000', -50) // Darkens red
 */
export const adjustColor = (hex: string, amount: number): string => {
    let usePound = false;

    if (hex[0] === "#") {
        hex = hex.slice(1);
        usePound = true;
    }

    const num = parseInt(hex, 16);

    // Extract RGB components and adjust with bounds checking
    const r = Math.max(0, Math.min(255, (num >> 16) + amount));
    const g = Math.max(0, Math.min(255, ((num >> 8) & 0x00FF) + amount));
    const b = Math.max(0, Math.min(255, (num & 0x0000FF) + amount));

    // Recombine and format as hex
    const result = (b | (g << 8) | (r << 16)).toString(16).padStart(6, '0');

    return (usePound ? "#" : "") + result;
};

/**
 * Applies branding colors to CSS custom properties
 * @param primaryColor - Primary brand color in hex format
 */
export const applyBrandingColors = (primaryColor: string): void => {
    if (!primaryColor) return;

    const root = document.documentElement;
    root.style.setProperty('--color-accent-main', primaryColor);
    root.style.setProperty('--color-accent-dark', adjustColor(primaryColor, -20));
    root.style.setProperty('--color-accent-light', adjustColor(primaryColor, 180));
    root.style.setProperty('--color-accent-hover', adjustColor(primaryColor, -10));
    root.style.setProperty('--color-ring', primaryColor);
};

/**
 * Color adjustment constants for consistent theming
 */
export const COLOR_ADJUSTMENTS = {
    HOVER: -10,
    DARK: -20,
    LIGHT_BACKGROUND: 180,
    RING: 0
} as const;

/**
 * Gets theme-specific CSS custom properties
 * @param theme - Theme mode
 * @returns Object with CSS custom property values
 */
export const getThemeStyles = (theme: 'light' | 'dark' | 'auto'): Record<string, string> => {
    if (theme === 'dark') {
        return {
            '--color-background': '#0f172a',
            '--color-surface': '#1e293b',
            '--color-primary': '#f8fafc',
            '--color-secondary': '#94a3b8',
            '--color-muted': '#64748b',
            '--color-muted-foreground': '#94a3b8',
            '--color-card': '#1e293b',
            '--color-border': '#334155'
        };
    }

    if (theme === 'light') {
        return {
            '--color-background': '#f8fafc',
            '--color-surface': '#ffffff',
            '--color-primary': '#0f172a',
            '--color-secondary': '#475569',
            '--color-muted': '#94a3b8',
            '--color-muted-foreground': '#64748b',
            '--color-card': '#ffffff',
            '--color-border': '#e2e8f0'
        };
    }

    // Auto theme uses default CSS variables
    return {};
};
