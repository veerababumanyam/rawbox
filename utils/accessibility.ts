/**
 * Accessibility Utilities
 * 
 * Provides helper functions for WCAG 2.1 AA compliance
 */

/**
 * Calculate relative RawBoxnce of a color
 * Used for contrast ratio calculations
 */
function getRawBoxnce(r: number, g: number, b: number): number {
    const [rs, gs, bs] = [r, g, b].map(c => {
        const val = c / 255;
        return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * Calculate contrast ratio between two colors
 * @param color1 - First color in hex format (e.g., '#ffffff')
 * @param color2 - Second color in hex format (e.g., '#000000')
 * @returns Contrast ratio (1-21)
 */
export function getContrastRatio(color1: string, color2: string): number {
    const hex1 = color1.replace('#', '');
    const hex2 = color2.replace('#', '');

    const r1 = parseInt(hex1.substring(0, 2), 16);
    const g1 = parseInt(hex1.substring(2, 4), 16);
    const b1 = parseInt(hex1.substring(4, 6), 16);

    const r2 = parseInt(hex2.substring(0, 2), 16);
    const g2 = parseInt(hex2.substring(2, 4), 16);
    const b2 = parseInt(hex2.substring(4, 6), 16);

    const lum1 = getRawBoxnce(r1, g1, b1);
    const lum2 = getRawBoxnce(r2, g2, b2);

    const lighter = Math.max(lum1, lum2);
    const darker = Math.min(lum1, lum2);

    return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Check if contrast ratio meets WCAG AA standards
 * @param ratio - Contrast ratio to check
 * @param level - 'normal' for normal text (4.5:1), 'large' for large text (3:1), 'ui' for UI components (3:1)
 * @returns true if contrast meets WCAG AA standards
 */
export function meetsWCAGAA(ratio: number, level: 'normal' | 'large' | 'ui' = 'normal'): boolean {
    const minimumRatios = {
        normal: 4.5,
        large: 3,
        ui: 3,
    };

    return ratio >= minimumRatios[level];
}

/**
 * Validate color contrast between foreground and background
 * @param foreground - Foreground color in hex format
 * @param background - Background color in hex format
 * @param level - Text size level
 * @returns Object with ratio and whether it passes WCAG AA
 */
export function validateContrast(
    foreground: string,
    background: string,
    level: 'normal' | 'large' | 'ui' = 'normal'
): { ratio: number; passes: boolean; level: string } {
    const ratio = getContrastRatio(foreground, background);
    const passes = meetsWCAGAA(ratio, level);

    return {
        ratio: Math.round(ratio * 100) / 100,
        passes,
        level,
    };
}

/**
 * Trap focus within an element (for modals, dialogs)
 * @param element - The element to trap focus within
 * @returns Cleanup function to remove event listener
 */
export function trapFocus(element: HTMLElement): () => void {
    const focusableElements = element.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleTab = (e: KeyboardEvent) => {
        if (e.key !== 'Tab') return;

        if (e.shiftKey && document.activeElement === firstElement) {
            e.preventDefault();
            lastElement?.focus();
        } else if (!e.shiftKey && document.activeElement === lastElement) {
            e.preventDefault();
            firstElement?.focus();
        }
    };

    element.addEventListener('keydown', handleTab);

    // Focus first element
    firstElement?.focus();

    // Return cleanup function
    return () => {
        element.removeEventListener('keydown', handleTab);
    };
}

/**
 * Restore focus to a previously focused element
 * @param element - The element to restore focus to
 */
export function restoreFocus(element: HTMLElement | null): void {
    if (element && typeof element.focus === 'function') {
        // Use setTimeout to ensure focus happens after any transitions
        setTimeout(() => {
            element.focus();
        }, 0);
    }
}

/**
 * Announce a message to screen readers
 * @param message - The message to announce
 * @param priority - 'polite' (default) or 'assertive' for urgent messages
 * @param timeout - How long to keep the announcement in DOM (default 1000ms)
 */
export function announceToScreenReader(
    message: string,
    priority: 'polite' | 'assertive' = 'polite',
    timeout: number = 1000
): void {
    const announcement = document.createElement('div');
    announcement.setAttribute('role', priority === 'assertive' ? 'alert' : 'status');
    announcement.setAttribute('aria-live', priority);
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = message;

    document.body.appendChild(announcement);

    setTimeout(() => {
        document.body.removeChild(announcement);
    }, timeout);
}

/**
 * Check if an element is visible and focusable
 * @param element - The element to check
 * @returns true if element is visible and focusable
 */
export function isFocusable(element: HTMLElement): boolean {
    if (element.offsetParent === null) return false;
    if (element.hasAttribute('disabled')) return false;
    if (element.getAttribute('aria-hidden') === 'true') return false;

    const tabindex = element.getAttribute('tabindex');
    if (tabindex === '-1') return false;

    return true;
}

/**
 * Get all focusable elements within a container
 * @param container - The container element
 * @returns Array of focusable elements
 */
export function getFocusableElements(container: HTMLElement): HTMLElement[] {
    const elements = container.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    return Array.from(elements).filter(isFocusable);
}

/**
 * Check if touch target meets minimum size requirements (44x44px)
 * @param element - The element to check
 * @returns true if element meets minimum touch target size
 */
export function meetsTouchTargetSize(element: HTMLElement): boolean {
    const rect = element.getBoundingClientRect();
    return rect.width >= 44 && rect.height >= 44;
}

/**
 * Add visually hidden class to element (for screen reader only content)
 * This is a utility to ensure consistent implementation
 */
export const srOnlyStyles = {
    position: 'absolute' as const,
    width: '1px',
    height: '1px',
    padding: '0',
    margin: '-1px',
    overflow: 'hidden',
    clip: 'rect(0, 0, 0, 0)',
    whiteSpace: 'nowrap' as const,
    borderWidth: '0',
};

/**
 * Generate a unique ID for accessibility attributes
 * @param prefix - Optional prefix for the ID
 * @returns Unique ID string
 */
let idCounter = 0;
export function generateA11yId(prefix: string = 'a11y'): string {
    idCounter += 1;
    return `${prefix}-${idCounter}-${Date.now()}`;
}
