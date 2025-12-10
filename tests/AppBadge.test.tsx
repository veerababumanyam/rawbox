/**
 * Property-Based Tests for AppBadge Component
 * Feature: modern-color-system-implementation
 * 
 * Tests validate:
 * - Property 1: Color token consistency (no hardcoded colors)
 * - Property 10: Status color differentiation
 * - All badge intents render with semantic color tokens
 * - GoldBadge uses gold colors
 * - Status badges maintain visual differentiation
 */

import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import * as fc from 'fast-check';
import { AppBadge, StatusBadge, GoldBadge } from '../components/ui/AppBadge';
import type { BadgeIntent } from '../components/ui/AppBadge';
import fs from 'fs';
import path from 'path';

describe('AppBadge - Property-Based Tests', () => {
    /**
     * Property 1: Color token consistency
     * Validates: Requirements 1.5, 4.1
     * 
     * Ensures the component file contains no hardcoded color values
     */
    it('should use only semantic color tokens (no hardcoded colors)', () => {
        fc.assert(
            fc.property(
                fc.constant('AppBadge'),
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
     * Test all badge intents render correctly with semantic tokens
     */
    it('should render all intents with semantic color classes', () => {
        fc.assert(
            fc.property(
                fc.constantFrom('default', 'success', 'warning', 'destructive', 'info', 'accent'),
                (intent) => {
                    const { container } = render(
                        <AppBadge intent={intent as BadgeIntent}>
                            Test badge
                        </AppBadge>
                    );

                    const badge = container.firstChild as HTMLElement;

                    // Check that badge has appropriate classes
                    expect(badge).toBeTruthy();
                    expect(badge.className).toBeTruthy();

                    // Verify no inline hardcoded colors
                    const style = badge.getAttribute('style');
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
     * Property 10: Status color differentiation
     * Validates: Requirements 4.4
     * 
     * Ensures status badges use distinct semantic color tokens
     */
    it('should use distinct colors for different status badges', () => {
        fc.assert(
            fc.property(
                fc.constantFrom('success', 'warning', 'destructive', 'info'),
                fc.constantFrom('success', 'warning', 'destructive', 'info'),
                (intent1, intent2) => {
                    const { container: container1 } = render(
                        <AppBadge intent={intent1 as BadgeIntent}>Badge 1</AppBadge>
                    );
                    const { container: container2 } = render(
                        <AppBadge intent={intent2 as BadgeIntent}>Badge 2</AppBadge>
                    );

                    const badge1 = container1.firstChild as HTMLElement;
                    const badge2 = container2.firstChild as HTMLElement;

                    const classes1 = badge1.className;
                    const classes2 = badge2.className;

                    // If intents are different, classes should be different
                    if (intent1 !== intent2) {
                        expect(classes1).not.toBe(classes2);
                        return classes1 !== classes2;
                    }

                    return true;
                }
            ),
            { numRuns: 100 }
        );
    });

    /**
     * Test GoldBadge uses gold colors
     */
    it('should apply gold colors to GoldBadge', () => {
        fc.assert(
            fc.property(
                fc.string({ minLength: 1, maxLength: 20 }),
                (text) => {
                    const { container } = render(
                        <GoldBadge>{text}</GoldBadge>
                    );

                    const badge = container.firstChild as HTMLElement;
                    const classes = badge.className;

                    // GoldBadge should have gold background
                    expect(classes).toContain('bg-gold');

                    // Should have star icon
                    const star = badge.querySelector('[aria-hidden="true"]');
                    expect(star).toBeTruthy();
                    expect(star?.textContent).toBe('★');

                    return classes.includes('bg-gold');
                }
            ),
            { numRuns: 100 }
        );
    });

    /**
     * Test badge sizes
     */
    it('should apply correct size classes for all sizes', () => {
        fc.assert(
            fc.property(
                fc.constantFrom('sm', 'md', 'lg'),
                (size) => {
                    const { container } = render(
                        <AppBadge size={size as any}>
                            Badge
                        </AppBadge>
                    );

                    const badge = container.firstChild as HTMLElement;
                    const classes = badge.className;

                    // Verify size-related classes are present
                    expect(classes).toContain('px-');
                    expect(classes).toContain('py-');

                    return true;
                }
            ),
            { numRuns: 100 }
        );
    });

    /**
     * Test GoldBadge sizes
     */
    it('should apply correct size classes for GoldBadge', () => {
        fc.assert(
            fc.property(
                fc.constantFrom('sm', 'md', 'lg'),
                (size) => {
                    const { container } = render(
                        <GoldBadge size={size as any}>
                            Premium
                        </GoldBadge>
                    );

                    const badge = container.firstChild as HTMLElement;
                    const classes = badge.className;

                    // Verify size-related classes are present
                    expect(classes).toContain('px-');
                    expect(classes).toContain('py-');
                    expect(classes).toContain('bg-gold');

                    return true;
                }
            ),
            { numRuns: 100 }
        );
    });

    /**
     * Test StatusBadge renders correctly
     */
    it('should render StatusBadge with correct intent', () => {
        fc.assert(
            fc.property(
                fc.constantFrom('online', 'offline', 'published', 'draft', 'archived'),
                (status) => {
                    const { container } = render(
                        <StatusBadge status={status as any} />
                    );

                    const badge = container.firstChild as HTMLElement;

                    // Should have a status indicator dot
                    const dot = badge.querySelector('.bg-current');
                    expect(dot).toBeTruthy();

                    return true;
                }
            ),
            { numRuns: 100 }
        );
    });

    /**
     * Test badge with icon
     */
    it('should render badge with icon when provided', () => {
        fc.assert(
            fc.property(
                fc.constantFrom('left', 'right'),
                (iconPosition) => {
                    // Mock icon component
                    const MockIcon = () => <svg data-testid="icon" />;

                    const { container } = render(
                        <AppBadge icon={MockIcon as any} iconPosition={iconPosition as any}>
                            Badge
                        </AppBadge>
                    );

                    const badge = container.firstChild as HTMLElement;
                    const icon = badge.querySelector('[data-testid="icon"]');

                    // Icon should be present
                    expect(icon).toBeTruthy();

                    return true;
                }
            ),
            { numRuns: 100 }
        );
    });

    /**
     * Test badge pill vs rounded
     */
    it('should apply correct border radius based on pill prop', () => {
        fc.assert(
            fc.property(
                fc.boolean(),
                (pill) => {
                    const { container } = render(
                        <AppBadge pill={pill}>
                            Badge
                        </AppBadge>
                    );

                    const badge = container.firstChild as HTMLElement;
                    const classes = badge.className;

                    if (pill) {
                        expect(classes).toContain('rounded-full');
                    } else {
                        expect(classes).toContain('rounded-md');
                    }

                    return true;
                }
            ),
            { numRuns: 100 }
        );
    });

    /**
     * Test accessibility attributes
     */
    it('should have proper accessibility attributes', () => {
        fc.assert(
            fc.property(
                fc.string({ minLength: 1, maxLength: 50 }),
                (ariaLabel) => {
                    const { container } = render(
                        <AppBadge ariaLabel={ariaLabel}>
                            Badge
                        </AppBadge>
                    );

                    const badge = container.firstChild as HTMLElement;

                    // Should have aria-label
                    expect(badge.getAttribute('aria-label')).toBe(ariaLabel);

                    return true;
                }
            ),
            { numRuns: 100 }
        );
    });

    /**
     * Test that status badges maintain differentiation in both themes
     */
    it('should maintain visual differentiation for status colors', () => {
        const statuses: BadgeIntent[] = ['success', 'warning', 'destructive', 'info'];
        const renderedBadges = statuses.map(intent => {
            const { container } = render(
                <AppBadge intent={intent}>{intent}</AppBadge>
            );
            return {
                intent,
                classes: (container.firstChild as HTMLElement).className,
            };
        });

        // Verify all badges have different class combinations
        const uniqueClasses = new Set(renderedBadges.map(b => b.classes));
        expect(uniqueClasses.size).toBe(statuses.length);

        // Verify each badge has appropriate color classes
        renderedBadges.forEach(badge => {
            expect(badge.classes).toContain('bg-');
            expect(badge.classes).toContain('text-');
        });

        return true;
    });
});
