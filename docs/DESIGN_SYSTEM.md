# RawBox Design System Documentation

## Overview

The RawBox Design System provides a comprehensive set of design tokens, components, and patterns to ensure consistency across the photography platform. Built on semantic color tokens and accessibility-first principles, the system supports light/dark themes and meets WCAG 2.1 AA standards.

## Table of Contents

1. [Color System](#color-system)
2. [Typography](#typography)
3. [Spacing](#spacing)
4. [Components](#components)
5. [Accessibility](#accessibility)
6. [Responsive Design](#responsive-design)

---

## Color System

### Semantic Color Tokens

All colors are defined as CSS custom properties in `index.html`. Never use hardcoded color values.

#### Background Colors

```css
--color-background    /* Main app background */
--color-surface       /* Card and container backgrounds */
--color-card          /* Elevated card backgrounds */
```

**Usage:**
```tsx
<div className="bg-background">
<div className="bg-surface">
<div className="bg-card">
```

#### Text Colors

```css
--color-foreground            /* Primary text color */
--color-secondary-foreground  /* Secondary text */
--color-muted-foreground      /* Muted/disabled text */
```

**Usage:**
```tsx
<p className="text-foreground">
<p className="text-secondary-foreground">
<p className="text-muted-foreground">
```

#### Border Colors

```css
--color-border  /* Default border color */
--color-ring    /* Focus ring color */
```

**Usage:**
```tsx
<div className="border border-border">
<button className="focus-visible:ring-2 focus-visible:ring-ring">
```

#### Interactive Colors

```css
--color-accent        /* Primary brand color */
--color-accent-hover  /* Hover state for accent */
--color-accent-light  /* Light accent background */
--color-accent-dark   /* Dark accent variant */
```

**Usage:**
```tsx
<button className="bg-accent hover:bg-accent-hover">
<div className="bg-accent-light">
```

#### Status Colors

```css
--color-destructive           /* Error/delete actions */
--color-destructive-foreground /* Text on destructive bg */
--color-destructive-soft      /* Light destructive bg */
--color-success               /* Success states */
--color-success-soft          /* Light success bg */
--color-warning               /* Warning states */
--color-warning-soft          /* Light warning bg */
--color-info                  /* Informational states */
--color-info-soft             /* Light info bg */
```

**Usage:**
```tsx
<button className="bg-destructive text-destructive-foreground">
<div className="bg-success-soft text-success">
```

### Theme Switching

Themes are controlled via the `data-theme` attribute on the `<html>` element:

```typescript
// Light theme (default)
document.documentElement.removeAttribute('data-theme');

// Dark theme
document.documentElement.setAttribute('data-theme', 'dark');
```

All semantic tokens automatically update when the theme changes. Components don't need theme-specific logic.

---

## Typography

### Font Families

```css
font-sans  /* Inter, system-ui, sans-serif - Primary UI font */
font-serif /* Playfair Display, Georgia, serif - Decorative headings */
font-mono  /* Roboto Mono, monospace - Code and technical content */
```

### Font Sizes

All font sizes use rem units for accessibility:

| Class | Size | Pixels | Usage |
|-------|------|--------|-------|
| `text-xs` | 0.75rem | 12px | Small labels, captions |
| `text-sm` | 0.875rem | 14px | Body text, form inputs |
| `text-base` | 1rem | 16px | Default body text |
| `text-lg` | 1.125rem | 18px | Emphasized text |
| `text-xl` | 1.25rem | 20px | Subheadings |
| `text-2xl` | 1.5rem | 24px | Section headings |
| `text-3xl` | 1.875rem | 30px | Page headings |
| `text-4xl` | 2.25rem | 36px | Hero headings |

**Usage:**
```tsx
<h1 className="text-3xl font-bold">Page Title</h1>
<p className="text-base">Body text</p>
<span className="text-sm text-muted-foreground">Helper text</span>
```

### Font Weights

| Class | Weight | Usage |
|-------|--------|-------|
| `font-normal` | 400 | Body text |
| `font-medium` | 500 | Emphasized text |
| `font-semibold` | 600 | Subheadings |
| `font-bold` | 700 | Headings |

### Line Heights

| Class | Value | Usage |
|-------|-------|-------|
| `leading-tight` | 1.25 | Headings |
| `leading-normal` | 1.5 | Body text |
| `leading-relaxed` | 1.75 | Long-form content |

---

## Spacing

Use consistent spacing scale based on 4px increments:

| Class | Size | Pixels | Usage |
|-------|------|--------|-------|
| `p-1` / `m-1` | 0.25rem | 4px | Tight spacing |
| `p-2` / `m-2` | 0.5rem | 8px | Small spacing |
| `p-3` / `m-3` | 0.75rem | 12px | Compact spacing |
| `p-4` / `m-4` | 1rem | 16px | Default spacing |
| `p-6` / `m-6` | 1.5rem | 24px | Medium spacing |
| `p-8` / `m-8` | 2rem | 32px | Large spacing |
| `p-12` / `m-12` | 3rem | 48px | Extra large spacing |

### Common Spacing Patterns

```tsx
// Card padding
<div className="p-4 md:p-6">

// Section spacing
<div className="space-y-4">

// Button padding
<button className="px-4 py-2">

// Grid gaps
<div className="grid gap-4 md:gap-6">
```

---

## Components

### AppButton

Primary button component with multiple variants and sizes.

**Variants:**
- `primary` - Main actions (default)
- `secondary` - Secondary actions
- `ghost` - Subtle actions
- `destructive` - Delete/remove actions
- `outline` - Bordered buttons
- `link` - Text-only links

**Sizes:**
- `sm` - Small buttons (32px height)
- `md` - Default buttons (40px height)
- `lg` - Large buttons (48px height)
- `icon` - Icon-only buttons (40x40px)

**Usage:**
```tsx
import { AppButton, AppIconButton } from './components/ui/AppButton';

<AppButton variant="primary" size="md" onClick={handleClick}>
  Save Changes
</AppButton>

<AppIconButton 
  icon={Plus} 
  aria-label="Add item"
  variant="ghost"
  onClick={handleAdd}
/>
```

### AppInput

Form input component with built-in validation and accessibility.

**Props:**
- `label` - Input label
- `error` - Error message
- `helperText` - Helper text
- `leftIcon` - Icon on the left
- `rightIcon` - Icon on the right
- `size` - sm | md | lg
- `required` - Mark as required

**Usage:**
```tsx
import { AppInput } from './components/ui/AppInput';

<AppInput
  label="Email"
  type="email"
  value={email}
  onChange={(e) => setEmail(e.target.value)}
  error={emailError}
  required
  leftIcon={Mail}
/>
```

### AppCard

Container component for grouped content.

**Variants:**
- `default` - Standard card
- `interactive` - Clickable card with hover effects
- `subtle` - Muted background
- `glass` - Glass morphism effect

**Usage:**
```tsx
import { AppCard } from './components/ui/AppCard';

<AppCard variant="default" padding="lg">
  <h3 className="text-lg font-semibold">Card Title</h3>
  <p className="text-sm text-muted-foreground">Card content</p>
</AppCard>
```

### AppBadge

Status and label indicators.

**Variants:**
- `default` - Neutral badge
- `success` - Success state
- `warning` - Warning state
- `destructive` - Error state
- `info` - Informational state

**Usage:**
```tsx
import { AppBadge } from './components/ui/AppBadge';

<AppBadge variant="success">Published</AppBadge>
<AppBadge variant="warning">Draft</AppBadge>
```

---

## Accessibility

### WCAG 2.1 AA Compliance

All components meet WCAG 2.1 Level AA standards:

- **Contrast**: Minimum 4.5:1 for normal text, 3:1 for large text
- **Keyboard Navigation**: All interactive elements are keyboard accessible
- **Focus Indicators**: Visible focus rings on all interactive elements
- **Screen Reader Support**: Proper ARIA attributes and semantic HTML

### Focus States

All interactive elements use `focus-visible` for keyboard-only focus:

```tsx
<button className="focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
```

### Touch Targets

All interactive elements meet the 44x44px minimum size on mobile:

```tsx
<button className="h-10 w-10 md:h-12 md:w-12">
```

### Screen Reader Support

Use semantic HTML and ARIA attributes:

```tsx
<button aria-label="Close dialog" aria-pressed={isOpen}>
<img src={url} alt="Descriptive text" />
<div role="alert" aria-live="assertive">{error}</div>
```

---

## Responsive Design

### Mobile-First Approach

Base styles are for mobile, with progressive enhancement for larger screens:

```tsx
// Mobile first
<div className="p-4 md:p-6 lg:p-8">
<div className="text-sm md:text-base lg:text-lg">
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
```

### Breakpoints

| Prefix | Min Width | Device |
|--------|-----------|--------|
| `sm:` | 640px | Small tablets |
| `md:` | 768px | Tablets |
| `lg:` | 1024px | Laptops |
| `xl:` | 1280px | Desktops |
| `2xl:` | 1536px | Large desktops |

### Common Patterns

```tsx
// Hide on mobile, show on desktop
<div className="hidden lg:block">

// Show on mobile, hide on desktop
<div className="block lg:hidden">

// Responsive grid
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

// Responsive padding
<div className="p-4 md:p-6 lg:p-8">
```

---

## Best Practices

### Do's ✅

- Use semantic color tokens for all colors
- Use relative units (rem, em) for sizes
- Compose from existing components
- Follow mobile-first responsive design
- Include all interactive states (hover, focus, active, disabled)
- Use consistent spacing from the scale
- Test in both light and dark themes

### Don'ts ❌

- Don't use hardcoded colors (bg-blue-500, #ffffff)
- Don't use fixed pixel values for fonts
- Don't create custom styled buttons/inputs
- Don't use max-width media queries for base styles
- Don't skip focus states
- Don't use arbitrary spacing values
- Don't assume light theme only

---

## Resources

- **Accessibility Guidelines**: `.kiro/steering/accessibility.md`
- **Design System Steering**: `.kiro/steering/design-system.md`
- **Component Source**: `components/ui/`
- **Accessibility Utilities**: `utils/accessibility.ts`

---

## Support

For questions or contributions to the design system, please refer to the project documentation or contact the development team.
