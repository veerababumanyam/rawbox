/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./index.tsx",
        "./App.tsx",
        "./components/**/*.{js,ts,jsx,tsx}",
        "./services/**/*.{js,ts,jsx,tsx}",
        "./utils/**/*.{js,ts,jsx,tsx}",
        "./hooks/**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: ['class', '[data-theme="dark"]'],
    theme: {
        extend: {
            colors: {
                /* Primary Colors */
                primary: {
                    DEFAULT: 'var(--color-primary)',
                    hover: 'var(--color-primary-hover)',
                },

                /* Accent Colors */
                accent: {
                    DEFAULT: 'var(--color-accent)',
                    hover: 'var(--color-accent-hover)',
                    light: 'var(--color-accent-light)',
                    dark: 'var(--color-accent-dark)',
                },

                /* Gold Premium Colors */
                gold: {
                    DEFAULT: 'var(--color-gold)',
                    light: 'var(--color-gold-light)',
                },

                /* Background Colors */
                background: 'var(--color-background)',
                surface: {
                    DEFAULT: 'var(--color-surface)',
                    hover: 'var(--color-surface-hover)',
                },
                card: 'var(--color-card)',

                /* Text Colors */
                foreground: 'var(--color-foreground)',
                'text-primary': 'var(--color-text-primary)',
                'text-secondary': 'var(--color-text-secondary)',
                'text-tertiary': 'var(--color-text-tertiary)',

                /* Secondary Colors (legacy) */
                secondary: {
                    DEFAULT: 'var(--color-surface)',
                    foreground: 'var(--color-secondary-foreground)',
                },

                /* Muted Colors */
                muted: {
                    DEFAULT: 'var(--color-muted)',
                    foreground: 'var(--color-muted-foreground)',
                },

                /* Border Colors */
                border: {
                    DEFAULT: 'var(--color-border)',
                    focus: 'var(--color-border-focus)',
                },
                ring: 'var(--color-ring)',

                /* Status Colors */
                destructive: {
                    DEFAULT: 'var(--color-destructive)',
                    foreground: 'var(--color-destructive-foreground)',
                    soft: 'var(--color-destructive-soft)',
                },
                success: {
                    DEFAULT: 'var(--color-success)',
                    soft: 'var(--color-success-soft)',
                },
                warning: {
                    DEFAULT: 'var(--color-warning)',
                    soft: 'var(--color-warning-soft)',
                },
                info: {
                    DEFAULT: 'var(--color-info)',
                    soft: 'var(--color-info-soft)',
                },
                error: 'var(--color-error)',
            },
            /* Typography */
            fontFamily: {
                sans: ['Inter', 'system-ui', 'sans-serif'],
                serif: ['Playfair Display', 'Georgia', 'serif'],
                mono: ['Roboto Mono', 'monospace'],
            },
        }
    },
    plugins: [],
}
