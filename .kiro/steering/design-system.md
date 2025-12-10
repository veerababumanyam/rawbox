# Design System Guidelines

## Overview

RawBox uses a centralized design system with semantic color tokens, consistent spacing, and reusable components. All styling must use the design system tokens to ensure consistency and enable theme switching.

## Color System

### Semantic Color Tokens

All colors are defined as CSS custom properties in `index.html`. Never use hardcoded color values.

#### Background Colors
- `--color-background`: Main app background
- `--color-surface`: Card and container backgrounds
- `--color-card`: Elevated card backgrounds

#### Text Colors
- `--color-foreground`: Primary text color
- `--color-secondary-foreground`: Secondary text
- `--color-muted-foreground`: Muted/disabled text

#### Border Colors
- `--color-border`: Default border color
- `--color-ring`: Focus ring color

#### Interactive Colors
- `--color-accent`: Primary brand color (buttons, links)
- `--color-accent-hover`: Hover state for accent
- `--color-accent-light`: Light accent background
- `--color-accent-dark`: Dark accent variant

#### Status Colors
- `--color-destructive`: Error/delete actions
- `--color-success`: Success states
- `--color-warning`: Warning states
- `--color-info`: Informational states

### Usage in Components

```typescript
// ✅ Good: Use semantic tokens
className="bg-surface text-foreground border-border"

// ❌ Bad: Hardcoded Tailwind colors
className="bg-white text-gray-900 border-gray-200"

// ✅ Good: Use semantic tokens for custom styles
style={{ backgroundColor: 'var(--color-surface)' }}

// ❌ Bad: Hardcoded hex values
style={{ backgroundColor: '#ffffff' }}
```

### Theme Switching

Themes are controlled via `data-theme` attribute on the `<html>` element:

```typescript
// Light theme (default)
document.documentElement.removeAttribute('data-theme');

// Dark theme
document.documentElement.setAttribute('data-theme', 'dark');
```

All semantic tokens automatically update when theme changes. Components don't need theme-specific logic.

## Typography

### Font Families
- **Sans-serif**: Primary UI font (Inter, system-ui)
- **Serif**: Decorative headings (Playfair Display)
- **Mono**: Code and technical content (monospace)

### Font Sizes

Use relative units (rem) for all font sizes:

- `text-xs`: 0.75rem (12px)
- `text-sm`: 0.875rem (14px)
- `text-base`: 1rem (16px) - Default body text
- `text-lg`: 1.125rem (18px)
- `text-xl`: 1.25rem (20px)
- `text-2xl`: 1.5rem (24px)
- `text-3xl`: 1.875rem (30px)
- `text-4xl`: 2.25rem (36px)

### Font Weights
- `font-normal`: 400 - Body text
- `font-medium`: 500 - Emphasized text
- `font-semibold`: 600 - Subheadings
- `font-bold`: 700 - Headings

### Line Heights
- `leading-tight`: 1.25 - Headings
- `leading-normal`: 1.5 - Body text
- `leading-relaxed`: 1.75 - Long-form content

## Spacing System

Use consistent spacing scale based on 4px increments:

- `0`: 0px
- `1`: 0.25rem (4px)
- `2`: 0.5rem (8px)
- `3`: 0.75rem (12px)
- `4`: 1rem (16px)
- `5`: 1.25rem (20px)
- `6`: 1.5rem (24px)
- `8`: 2rem (32px)
- `10`: 2.5rem (40px)
- `12`: 3rem (48px)
- `16`: 4rem (64px)

### Common Spacing Patterns

```typescript
// Card padding
className="p-4 md:p-6"

// Section spacing
className="space-y-4"

// Button padding
className="px-4 py-2"

// Grid gaps
className="gap-4 md:gap-6"
```

## Border Radius

- `rounded-sm`: 0.25rem (4px) - Small elements
- `rounded`: 0.375rem (6px) - Default
- `rounded-md`: 0.5rem (8px) - Cards
- `rounded-lg`: 0.75rem (12px) - Large cards
- `rounded-xl`: 1rem (16px) - Modals
- `rounded-full`: 9999px - Circular elements

## Shadows

- `shadow-sm`: Subtle elevation
- `shadow`: Default card shadow
- `shadow-md`: Elevated cards
- `shadow-lg`: Modals and popovers
- `shadow-xl`: Maximum elevation

## Component Library

### Core Components

All UI components are in `/components/ui`:

#### AppButton
Primary button component with variants:
- `primary`: Main actions (default)
- `secondary`: Secondary actions
- `ghost`: Subtle actions
- `destructive`: Delete/remove actions
- `outline`: Bordered buttons
- `link`: Text-only links

Sizes:
- `sm`: Small buttons (32px height)
- `md`: Default buttons (40px height)
- `lg`: Large buttons (48px height)
- `icon`: Icon-only buttons (40x40px)

```typescript
<AppButton variant="primary" size="md">
  Save Changes
</AppButton>

<AppIconButton 
  icon={Plus} 
  aria-label="Add item"
  variant="ghost"
/>
```

#### AppInput
Form input component with built-in validation:

```typescript
<AppInput
  label="Email"
  type="email"
  value={email}
  onChange={setEmail}
  error={emailError}
  required
/>
```

#### AppCard
Container component for grouped content:

```typescript
<AppCard>
  <AppCard.Header>
    <h2>Card Title</h2>
  </AppCard.Header>
  <AppCard.Content>
    Card content here
  </AppCard.Content>
</AppCard>
```

#### AppBadge
Status and label indicators:

```typescript
<AppBadge variant="success">Published</AppBadge>
<AppBadge variant="warning">Draft</AppBadge>
<AppBadge variant="destructive">Archived</AppBadge>
```

### Component Composition

Build complex UIs by composing simple components:

```typescript
// ✅ Good: Compose from design system
<AppCard>
  <div className="flex items-center justify-between">
    <h3 className="text-lg font-semibold">Gallery Title</h3>
    <AppButton variant="ghost" size="sm">
      Edit
    </AppButton>
  </div>
</AppCard>

// ❌ Bad: Custom styled divs
<div className="bg-white p-4 rounded-lg shadow">
  <div className="flex items-center justify-between">
    <h3>Gallery Title</h3>
    <button className="px-3 py-1 text-sm">Edit</button>
  </div>
</div>
```

## Interactive States

All interactive elements must have clear visual feedback:

### Hover States
```typescript
className="hover:bg-accent-light hover:text-accent-DEFAULT"
```

### Focus States
```typescript
className="focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
```

### Active States
```typescript
className="active:scale-[0.98]"
```

### Disabled States
```typescript
className="disabled:opacity-50 disabled:cursor-not-allowed"
```

## Responsive Design

### Breakpoints

Mobile-first approach with these breakpoints:

- `sm`: 640px - Small tablets
- `md`: 768px - Tablets
- `lg`: 1024px - Laptops
- `xl`: 1280px - Desktops
- `2xl`: 1536px - Large desktops

### Responsive Patterns

```typescript
// Mobile-first: base styles for mobile, enhance for larger screens
className="text-sm md:text-base lg:text-lg"
className="p-4 md:p-6 lg:p-8"
className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3"

// Hide/show at breakpoints
className="hidden md:block" // Hidden on mobile, visible on tablet+
className="block md:hidden" // Visible on mobile, hidden on tablet+
```

## Animation & Transitions

### Transition Utilities

```typescript
// Standard transitions
className="transition-colors duration-200"
className="transition-all duration-300 ease-in-out"

// Hover transitions
className="transition-transform hover:scale-105"

// Focus transitions
className="transition-shadow focus:shadow-lg"
```

### Animation Classes

```typescript
// Fade in
className="animate-in fade-in duration-500"

// Slide in
className="animate-in slide-in-from-top-4 duration-300"

// Spin (for loading)
className="animate-spin"
```

## Icons

Use lucide-react for all icons:

```typescript
import { Plus, Edit, Trash2, Download } from 'lucide-react';

// Standard icon size
<Plus className="w-5 h-5" />

// Small icon
<Plus className="w-4 h-4" />

// Large icon
<Plus className="w-6 h-6" />

// With semantic color
<Plus className="w-5 h-5 text-accent-DEFAULT" />
```

## Layout Patterns

### Container Widths

```typescript
// Full width
className="w-full"

// Constrained width
className="max-w-7xl mx-auto"

// Responsive container
className="container mx-auto px-4 md:px-6 lg:px-8"
```

### Flexbox Patterns

```typescript
// Horizontal layout
className="flex items-center gap-4"

// Vertical layout
className="flex flex-col space-y-4"

// Space between
className="flex items-center justify-between"

// Centered
className="flex items-center justify-center"
```

### Grid Patterns

```typescript
// Responsive grid
className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"

// Auto-fit grid
className="grid grid-cols-[repeat(auto-fit,minmax(250px,1fr))] gap-4"

// Photo grid
className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2"
```

## Best Practices

### Do's
- ✅ Use semantic color tokens for all colors
- ✅ Use relative units (rem, em) for sizes
- ✅ Compose from existing components
- ✅ Follow mobile-first responsive design
- ✅ Include all interactive states (hover, focus, active, disabled)
- ✅ Use consistent spacing from the scale
- ✅ Test in both light and dark themes

### Don'ts
- ❌ Don't use hardcoded colors (bg-blue-500, #ffffff)
- ❌ Don't use fixed pixel values for fonts
- ❌ Don't create custom styled buttons/inputs
- ❌ Don't use max-width media queries for base styles
- ❌ Don't skip focus states
- ❌ Don't use arbitrary spacing values
- ❌ Don't assume light theme only

## File Size Limits

To maintain code quality and readability:

- Component files: Maximum 600 lines
- If a file exceeds 600 lines, split into smaller modules
- Extract shared logic into hooks or utilities
- Separate business logic into service files

## Documentation

When creating new components:

1. Add TypeScript interface for props
2. Include JSDoc comments for complex props
3. Export component with named export
4. Add usage example in comments
5. Document accessibility considerations

```typescript
/**
 * AppButton - Primary button component
 * 
 * @example
 * <AppButton variant="primary" onClick={handleClick}>
 *   Click me
 * </AppButton>
 */
export interface AppButtonProps {
  /** Button style variant */
  variant?: 'primary' | 'secondary' | 'ghost' | 'destructive';
  /** Button size */
  size?: 'sm' | 'md' | 'lg';
  /** Loading state */
  loading?: boolean;
  /** Click handler */
  onClick?: () => void;
}
```
