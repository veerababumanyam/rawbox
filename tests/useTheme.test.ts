/**
 * Property-Based Tests for useTheme Hook
 * Feature: modern-color-system-implementation
 * 
 * These tests verify that the theme management system works correctly
 * across all possible theme states and transitions.
 */

import { renderHook, act } from '@testing-library/react';
import { useTheme, Theme } from '../hooks/useTheme';
import fc from 'fast-check';
import { vi } from 'vitest';

// Helper to get all CSS custom property values
const getAllColorTokenValues = (): Record<string, string> => {
    const root = document.documentElement;
    const computedStyle = getComputedStyle(root);
    const tokens: Record<string, string> = {};

    // List of all color tokens to check
    const colorTokens = [
        '--color-primary',
        '--color-primary-hover',
        '--color-accent',
        '--color-accent-hover',
        '--color-gold',
        '--color-gold-light',
        '--color-background',
        '--color-surface',
        '--color-surface-hover',
        '--color-text-primary',
        '--color-text-secondary',
        '--color-text-tertiary',
        '--color-border',
        '--color-border-focus',
        '--color-success',
        '--color-warning',
        '--color-error',
        '--color-info',
    ];

    colorTokens.forEach(token => {
        tokens[token] = computedStyle.getPropertyValue(token).trim();
    });

    return tokens;
};

describe('useTheme Hook - Property-Based Tests', () => {
    beforeEach(() => {
        // Clear localStorage before each test
        localStorage.clear();
        // Reset document theme
        document.documentElement.removeAttribute('data-theme');
    });

    /**
     * Property 2: Theme switching completeness
     * Validates: Requirements 1.2, 9.1
     * 
     * For any theme switch operation, all visible color tokens should update
     * to match the new theme without requiring page reload
     */
    it('should update all color tokens when theme switches', () => {
        fc.assert(
            fc.property(
                fc.constantFrom<Theme>('light', 'dark'),
                fc.constantFrom<Theme>('light', 'dark'),
                (fromTheme, toTheme) => {
                    const { result } = renderHook(() => useTheme());

                    // Set initial theme
                    act(() => {
                        result.current.setTheme(fromTheme);
                    });

                    // Get color token values before switch
                    const beforeValues = getAllColorTokenValues();

                    // Switch theme
                    act(() => {
                        result.current.setTheme(toTheme);
                    });

                    // Get color token values after switch
                    const afterValues = getAllColorTokenValues();

                    // If themes are different, values should change
                    if (fromTheme !== toTheme) {
                        // At least some tokens should have changed
                        const changedTokens = Object.keys(beforeValues).filter(
                            key => beforeValues[key] !== afterValues[key]
                        );
                        return changedTokens.length > 0;
                    }

                    // If themes are the same, values should not change
                    return JSON.stringify(beforeValues) === JSON.stringify(afterValues);
                }
            ),
            { numRuns: 100 }
        );
    });

    /**
     * Property 8: Theme persistence
     * Validates: Requirements 9.2, 9.3
     * 
     * For any theme selection, the choice should be persisted to localStorage
     * and restored on subsequent page loads
     */
    it('should persist theme to localStorage and restore on mount', () => {
        fc.assert(
            fc.property(
                fc.constantFrom<Theme>('light', 'dark', 'system'),
                (selectedTheme) => {
                    // First render: set theme
                    const { result: result1, unmount } = renderHook(() => useTheme());

                    act(() => {
                        result1.current.setTheme(selectedTheme);
                    });

                    // Verify it was saved to localStorage
                    const storedTheme = localStorage.getItem('RawBox-theme');
                    expect(storedTheme).toBe(selectedTheme);

                    // Unmount the hook
                    unmount();

                    // Second render: should restore from localStorage
                    const { result: result2 } = renderHook(() => useTheme());

                    // The restored theme should match what we saved
                    return result2.current.theme === selectedTheme;
                }
            ),
            { numRuns: 100 }
        );
    });

    /**
     * Additional test: Toggle theme functionality
     * Verifies that toggleTheme switches between light and dark correctly
     */
    it('should toggle between light and dark themes', () => {
        const { result } = renderHook(() => useTheme());

        // Set to light
        act(() => {
            result.current.setTheme('light');
        });
        expect(result.current.isDark).toBe(false);

        // Toggle to dark
        act(() => {
            result.current.toggleTheme();
        });
        expect(result.current.isDark).toBe(true);
        expect(result.current.theme).toBe('dark');

        // Toggle back to light
        act(() => {
            result.current.toggleTheme();
        });
        expect(result.current.isDark).toBe(false);
        expect(result.current.theme).toBe('light');
    });

    /**
     * Additional test: System theme detection
     * Verifies that system theme preference is respected
     */
    it('should respect system theme preference when theme is set to system', () => {
        // Mock matchMedia
        const mockMatchMedia = (matches: boolean) => {
            Object.defineProperty(window, 'matchMedia', {
                writable: true,
                value: vi.fn().mockImplementation(query => ({
                    matches,
                    media: query,
                    onchange: null,
                    addListener: vi.fn(),
                    removeListener: vi.fn(),
                    addEventListener: vi.fn(),
                    removeEventListener: vi.fn(),
                    dispatchEvent: vi.fn(),
                })),
            });
        };

        // Test with dark system preference
        mockMatchMedia(true);
        const { result: result1 } = renderHook(() => useTheme());
        act(() => {
            result1.current.setTheme('system');
        });
        expect(result1.current.isDark).toBe(true);

        // Test with light system preference
        mockMatchMedia(false);
        const { result: result2 } = renderHook(() => useTheme());
        act(() => {
            result2.current.setTheme('system');
        });
        expect(result2.current.isDark).toBe(false);
    });

    /**
     * Additional test: Data attribute application
     * Verifies that the data-theme attribute is correctly applied to the document
     */
    it('should apply data-theme attribute correctly', () => {
        const { result } = renderHook(() => useTheme());

        // Set to dark
        act(() => {
            result.current.setTheme('dark');
        });
        expect(document.documentElement.getAttribute('data-theme')).toBe('dark');

        // Set to light
        act(() => {
            result.current.setTheme('light');
        });
        expect(document.documentElement.getAttribute('data-theme')).toBeNull();
    });
});
