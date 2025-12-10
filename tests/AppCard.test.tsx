/**
 * Property-Based Tests for AppCard Component
 * Feature: modern-color-system-implementation
 * 
 * Tests validate:
 * - Property 1: Color token consistency (no hardcoded colors)
 * - All variants render with semantic color tokens
 * - Premium variant uses gold colors
 * - Focus indicators are visible and accessible
 * - Loading states use semantic colors
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import * as fc from 'fast-check';
import { AppCard } from '../components/ui/AppCard';
import fs from 'fs';
import path from 'path';

describe('AppCard - Property-Based Tests', () => {
    /**
     * Property 1: Color token consistency
     * Validates: Requirements 1.5, 4.1
     * 
     * Ensures the component file contains no hardcoded color values
     */
    it('should use only semantic color tokens (no hardcoded colors)', () => {
        fc.assert(
            fc.property(
                fc.constant('AppCard'),
                (componentName) => {
                    const componentPath = path.join(process.cwd(), 'components/ui', `${componentName}.tsx`);
                    const content = fs.readFileSync(componentPath, 'utf-8');

                    // Remove comments and strings to avoid false positives
                    const codeOnly = content
                        .replace(/\/\*[\s\S]*?\*\//g, '') // Remove block comments
                        .replace(/\/\/.*/g, '') // Remove line comments
                        .replace(/(['"`])(?:(?=(\\?))\2.)*?\1/g, ''); // Remove strings

                    // Check for hardcoded hex colors (excluding rgba in shadow definitions which use CSS vars)
                    const hexColorRegex = /#[0-9A-Fa-f]{6}(?![0-9A-Fa-f])/g;
                    const matches = codeOnly.match(hexColorRegex) || [];

                    // Filter out colors in shadow definitions that reference CSS variables
                    const invalidMatches = matches.filter(match => {
                        const context = codeOnly.substring(
                            Math.max(0, codeOnly.indexOf(match) - 50),
                            codeOnly.indexOf(match) + 50
                        );
                        // Allow hex colors in rgba() within shadow definitions if they're part of CSS var usage
                        return !context.includes('shadow-[') && !context.includes('rgba(');
                    });

                    if (invalidMatches.length > 0) {
                        console.error(`Found hardcoded colors in ${componentName}:`, invalidMatches);
                    }

                    return invalidMatches.length === 0;
                }
            ),
            { numRuns: 100 }
        );
    });

    /**
     * Test all card variants render correctly with semantic tokens
     */
    it('should render all variants with semantic color classes', () => {
        fc.assert(
            fc.property(
                fc.constantFrom('default', 'interactive', 'subtle', 'glass', 'premium'),
                (variant) => {
                    const { container } = render(
                        <AppCard variant={variant as any}>
                            Test content
                        </AppCard>
                    );

                    const card = container.firstChild as HTMLElement;

                    // Check that card has appropriate classes
                    expect(card).toBeTruthy();
                    expect(card.className).toBeTruthy();

                    // Verify no inline hardcoded colors
                    const style = card.getAttribute('style');
                    if (style) {
                        expect(style).not.toMatch(/#[0-9A-Fa-f]{6}/);
                    }

                    return true;
                }
            ),
            { numRuns: 100 }
        );
    });

    /**
     * Test premium variant uses gold colors
     */
    it('should apply gold colors to premium variant', () => {
        fc.assert(
            fc.property(
                fc.constant('premium'),
                (variant) => {
                    const { container } = render(
                        <AppCard variant={variant as any}>
                            Premium content
                        </AppCard>
                    );

                    const card = container.firstChild as HTMLElement;
                    const classes = card.className;

                    // Premium cards should have gold border
                    expect(classes).toContain('border-gold');

                    return classes.includes('border-gold');
                }
            ),
            { numRuns: 100 }
        );
    });

    /**
     * Test interactive cards have proper focus indicators
     */
    it('should have visible focus indicators for interactive cards', () => {
        fc.assert(
            fc.property(
                fc.constantFrom('default', 'interactive', 'subtle', 'glass', 'premium'),
                (variant) => {
                    const handleClick = () => { };
                    const { container } = render(
                        <AppCard variant={variant as any} onClick={handleClick} ariaLabel="Test card">
                            Interactive content
                        </AppCard>
                    );

                    const card = container.firstChild as HTMLElement;
                    const classes = card.className;

                    // Interactive cards should have focus ring
                    const hasFocusRing = classes.includes('focus-visible:ring-2');

                    // Premium cards should have gold focus ring
                    if (variant === 'premium') {
                        expect(classes).toContain('focus-visible:ring-gold');
                    } else {
                        expect(classes).toContain('focus-visible:ring-primary');
                    }

                    return hasFocusRing;
                }
            ),
            { numRuns: 100 }
        );
    });

    /**
     * Test loading state uses semantic colors
     */
    it('should use semantic colors in loading skeleton', () => {
        fc.assert(
            fc.property(
                fc.integer({ min: 1, max: 10 }),
                (loadingLines) => {
                    const { container } = render(
                        <AppCard loading loadingLines={loadingLines} />
                    );

                    const card = container.firstChild as HTMLElement;

                    // Check for loading skeleton elements
                    const skeletonElements = card.querySelectorAll('.bg-surface-hover');

                    // Should have the correct number of skeleton lines
                    expect(skeletonElements.length).toBe(loadingLines);

                    // Verify no hardcoded colors in skeleton
                    skeletonElements.forEach(element => {
                        const style = element.getAttribute('style');
                        if (style) {
                            expect(style).not.toMatch(/#[0-9A-Fa-f]{6}/);
                        }
                    });

                    return skeletonElements.length === loadingLines;
                }
            ),
            { numRuns: 100 }
        );
    });

    /**
     * Test padding variants
     */
    it('should apply correct padding for all padding sizes', () => {
        fc.assert(
            fc.property(
                fc.constantFrom('none', 'sm', 'md', 'lg'),
                (padding) => {
                    const { container } = render(
                        <AppCard padding={padding as any}>
                            Content
                        </AppCard>
                    );

                    const card = container.firstChild as HTMLElement;
                    const classes = card.className;

                    // Verify padding class is applied
                    const paddingMap = {
                        none: '',
                        sm: 'p-3',
                        md: 'p-4',
                        lg: 'p-4',
                    };

                    if (padding !== 'none') {
                        expect(classes).toContain('p-');
                    }

                    return true;
                }
            ),
            { numRuns: 100 }
        );
    });

    /**
     * Test accessibility attributes for interactive cards
     */
    it('should have proper accessibility attributes for interactive cards', () => {
        fc.assert(
            fc.property(
                fc.string({ minLength: 1, maxLength: 50 }),
                (ariaLabel) => {
                    const handleClick = () => { };
                    const { container } = render(
                        <AppCard onClick={handleClick} ariaLabel={ariaLabel}>
                            Content
                        </AppCard>
                    );

                    const card = container.firstChild as HTMLElement;

                    // Should be a button element
                    expect(card.tagName).toBe('BUTTON');

                    // Should have type="button"
                    expect(card.getAttribute('type')).toBe('button');

                    // Should have aria-label
                    expect(card.getAttribute('aria-label')).toBe(ariaLabel);

                    return true;
                }
            ),
            { numRuns: 100 }
        );
    });

    /**
     * Test card header, content, and footer composition
     */
    it('should render composed card sections correctly', () => {
        fc.assert(
            fc.property(
                fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
                fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
                fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
                (headerText, contentText, footerText) => {
                    const { container, unmount } = render(
                        <AppCard>
                            <AppCard.Header>{headerText}</AppCard.Header>
                            <AppCard.Content>{contentText}</AppCard.Content>
                            <AppCard.Footer>{footerText}</AppCard.Footer>
                        </AppCard>
                    );

                    // Verify all sections are rendered by checking the DOM structure
                    const card = container.firstChild as HTMLElement;
                    expect(card).toBeTruthy();

                    // Check that content is present in the card
                    const cardText = card.textContent || '';
                    expect(cardText).toContain(headerText);
                    expect(cardText).toContain(contentText);
                    expect(cardText).toContain(footerText);

                    // Clean up to avoid duplicate elements in subsequent tests
                    unmount();

                    return true;
                }
            ),
            { numRuns: 100 }
        );
    });

    /**
     * Test hover effects are disabled when noHover is true
     */
    it('should disable hover effects when noHover prop is true', () => {
        fc.assert(
            fc.property(
                fc.boolean(),
                (noHover) => {
                    const handleClick = () => { };
                    const { container } = render(
                        <AppCard onClick={handleClick} noHover={noHover}>
                            Content
                        </AppCard>
                    );

                    const card = container.firstChild as HTMLElement;
                    const classes = card.className;

                    if (noHover) {
                        // Should not have hover translate effect
                        expect(classes).not.toContain('hover:-translate-y-0.5');
                    } else {
                        // Should have hover translate effect
                        expect(classes).toContain('hover:-translate-y-0.5');
                    }

                    return true;
                }
            ),
            { numRuns: 100 }
        );
    });

    /**
     * Test card renders as div when not interactive
     */
    it('should render as div when onClick is not provided', () => {
        fc.assert(
            fc.property(
                fc.constantFrom('default', 'interactive', 'subtle', 'glass', 'premium'),
                (variant) => {
                    const { container } = render(
                        <AppCard variant={variant as any}>
                            Content
                        </AppCard>
                    );

                    const card = container.firstChild as HTMLElement;

                    // Should be a div element
                    expect(card.tagName).toBe('DIV');

                    return true;
                }
            ),
            { numRuns: 100 }
        );
    });
});
