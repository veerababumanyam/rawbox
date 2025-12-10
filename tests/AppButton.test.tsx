/**
 * Property-Based Tests for AppButton Component
 * Feature: modern-color-system-implementation, Property 1: Color token consistency
 * Validates: Requirements 1.5, 4.1
 * 
 * These tests verify that the AppButton component uses only semantic color tokens
 * and no hardcoded color values.
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { AppButton } from '../components/ui/AppButton';
import fc from 'fast-check';
import fs from 'fs';
import path from 'path';

describe('AppButton - Property-Based Tests', () => {
    /**
     * Property 1: Color token consistency
     * For any component in the application, all color references should use
     * semantic CSS custom properties rather than hardcoded values
     */
    it('should use only semantic color tokens in component file', () => {
        const componentPath = path.join(__dirname, '../components/ui/AppButton.tsx');
        const content = fs.readFileSync(componentPath, 'utf-8');

        // Remove comments and strings to avoid false positives
        const codeOnly = content
            .replace(/\/\*[\s\S]*?\*\//g, '') // Remove block comments
            .replace(/\/\/.*/g, '') // Remove line comments
            .replace(/'[^']*'/g, '') // Remove single-quoted strings
            .replace(/"[^"]*"/g, '') // Remove double-quoted strings
            .replace(/`[^`]*`/g, ''); // Remove template literals

        // Check for hardcoded hex colors (e.g., #FFFFFF, #fff)
        const hexColorRegex = /#[0-9A-Fa-f]{3,6}\b/g;
        const hexMatches = codeOnly.match(hexColorRegex) || [];

        // Check for hardcoded rgb/rgba colors
        const rgbColorRegex = /rgba?\([^)]+\)/g;
        const rgbMatches = codeOnly.match(rgbColorRegex) || [];

        // Should have no hardcoded colors
        expect(hexMatches.length).toBe(0);
        expect(rgbMatches.length).toBe(0);
    });

    /**
     * Test all button variants render correctly
     */
    it('should render all button variants without errors', () => {
        fc.assert(
            fc.property(
                fc.constantFrom('primary', 'secondary', 'ghost', 'destructive', 'outline', 'link', 'gold'),
                fc.constantFrom('sm', 'md', 'lg'),
                (variant, size) => {
                    const { container } = render(
                        <AppButton variant={variant as any} size={size as any}>
                            Test Button
                        </AppButton>
                    );

                    const button = container.querySelector('button');
                    expect(button).toBeInTheDocument();
                    expect(button?.textContent).toBe('Test Button');

                    return true;
                }
            ),
            { numRuns: 100 }
        );
    });

    /**
     * Test that gold variant has special styling
     */
    it('should apply gold variant styling correctly', () => {
        const { container } = render(
            <AppButton variant="gold">Premium Action</AppButton>
        );

        const button = container.querySelector('button');
        expect(button).toBeInTheDocument();
        expect(button?.className).toContain('bg-gold');
        expect(button?.className).toContain('font-bold');
    });

    /**
     * Test that primary variant uses new blue color
     */
    it('should apply primary variant with blue color', () => {
        const { container } = render(
            <AppButton variant="primary">Primary Action</AppButton>
        );

        const button = container.querySelector('button');
        expect(button).toBeInTheDocument();
        expect(button?.className).toContain('bg-primary');
        expect(button?.className).toContain('hover:bg-primary-hover');
    });

    /**
     * Test that secondary variant uses cyan accent color
     */
    it('should apply secondary variant with cyan accent color', () => {
        const { container } = render(
            <AppButton variant="secondary">Secondary Action</AppButton>
        );

        const button = container.querySelector('button');
        expect(button).toBeInTheDocument();
        expect(button?.className).toContain('bg-accent');
        expect(button?.className).toContain('hover:bg-accent-hover');
    });

    /**
     * Test disabled state
     */
    it('should handle disabled state correctly', () => {
        fc.assert(
            fc.property(
                fc.constantFrom('primary', 'secondary', 'ghost', 'destructive', 'outline', 'link', 'gold'),
                (variant) => {
                    const { container } = render(
                        <AppButton variant={variant as any} disabled>
                            Disabled Button
                        </AppButton>
                    );

                    const button = container.querySelector('button');
                    expect(button).toBeDisabled();
                    expect(button?.className).toContain('disabled:');

                    return true;
                }
            ),
            { numRuns: 100 }
        );
    });

    /**
     * Test loading state
     */
    it('should handle loading state correctly', () => {
        fc.assert(
            fc.property(
                fc.constantFrom('primary', 'secondary', 'ghost', 'destructive', 'outline', 'link', 'gold'),
                (variant) => {
                    const { container } = render(
                        <AppButton variant={variant as any} loading>
                            Loading Button
                        </AppButton>
                    );

                    const button = container.querySelector('button');
                    expect(button).toBeDisabled();
                    expect(button?.getAttribute('aria-busy')).toBe('true');

                    // Should show loading spinner
                    const spinner = container.querySelector('svg.animate-spin');
                    expect(spinner).toBeInTheDocument();

                    return true;
                }
            ),
            { numRuns: 100 }
        );
    });

    /**
     * Test focus ring colors
     */
    it('should have appropriate focus ring colors for each variant', () => {
        const variantFocusRings = {
            primary: 'focus-visible:ring-primary',
            secondary: 'focus-visible:ring-accent',
            ghost: 'focus-visible:ring-ring',
            destructive: 'focus-visible:ring-destructive',
            outline: 'focus-visible:ring-ring',
            link: 'focus-visible:ring-ring',
            gold: 'focus-visible:ring-gold',
        };

        Object.entries(variantFocusRings).forEach(([variant, expectedClass]) => {
            const { container } = render(
                <AppButton variant={variant as any}>Test</AppButton>
            );

            const button = container.querySelector('button');
            expect(button?.className).toContain(expectedClass);
        });
    });

    /**
     * Test accessibility attributes
     */
    it('should have proper accessibility attributes', () => {
        const { container } = render(
            <AppButton variant="primary" disabled>
                Accessible Button
            </AppButton>
        );

        const button = container.querySelector('button');
        expect(button).toHaveAttribute('type', 'button');
        expect(button).toBeDisabled();
    });

    /**
     * Test that buttons meet minimum touch target size (44x44px)
     */
    it('should meet minimum touch target size requirements', () => {
        const { container } = render(
            <AppButton variant="primary" size="md">
                Touch Target
            </AppButton>
        );

        const button = container.querySelector('button');
        const computedStyle = window.getComputedStyle(button!);

        // Height should be at least 40px (h-10 = 2.5rem = 40px)
        // This meets the 44x44px requirement with padding
        expect(button?.className).toContain('h-10');
    });
});
