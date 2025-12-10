# Accessibility Guidelines

## WCAG 2.1 AA Compliance

All components and features must meet WCAG 2.1 Level AA standards.

### Contrast Requirements

- **Normal text**: Minimum 4.5:1 contrast ratio against background
- **Large text** (18px+ or 14px+ bold): Minimum 3:1 contrast ratio
- **UI components**: Minimum 3:1 contrast ratio for interactive elements and their states
- **Focus indicators**: Minimum 3:1 contrast ratio, must be visible on all interactive elements

### Keyboard Navigation

- All interactive elements must be keyboard accessible
- Tab order must follow logical reading order
- Focus indicators must be visible and clear
- No keyboard traps (users can navigate away from all elements)
- Support standard keyboard patterns (Enter, Space, Escape, Arrow keys where appropriate)

### Screen Reader Support

- Use semantic HTML elements (button, nav, main, aside, header, footer)
- Maintain proper heading hierarchy (h1 → h2 → h3, no skipping levels)
- Associate labels with form inputs using `htmlFor`/`id` or `aria-label`
- Provide descriptive alt text for meaningful images
- Use empty alt (`alt=""`) for decorative images
- Announce dynamic content changes with ARIA live regions
- Include `role="alert"` for error messages

### ARIA Attributes

When building custom components that don't use native HTML elements:

- Add appropriate `role` attributes (e.g., `role="button"`, `role="dialog"`)
- Use `aria-label` or `aria-labelledby` for accessible names
- Use `aria-describedby` for additional descriptions
- Use `aria-expanded` for expandable elements
- Use `aria-hidden="true"` for decorative elements
- Use `aria-live` for dynamic content announcements
- Use `aria-invalid` and `aria-describedby` for form validation

### Skip Links

- Include a "Skip to main content" link as the first focusable element
- Already implemented in `components/ui/SkipToContent.tsx`
- Ensure it's visible when focused

## Mobile Accessibility

### Touch Targets

- Minimum size: 44x44 pixels for all interactive elements
- Adequate spacing between touch targets (at least 8px)
- Applies to buttons, links, form inputs, and custom controls

### Text Scaling

- Use relative units (rem, em) for font sizes, not fixed pixels
- Support browser zoom up to 200% without loss of functionality
- Avoid horizontal scrolling at 200% zoom
- Test with browser text size settings

### Responsive Design

- Mobile-first approach: base styles for mobile, enhance for larger screens
- Use `min-width` media queries for progressive enhancement
- Avoid `max-width` media queries for base functionality
- Test on actual devices, not just browser dev tools

## Component-Specific Guidelines

### Buttons (AppButton)

- Use semantic `<button>` elements, not divs with click handlers
- Include `type="button"` to prevent form submission
- Provide `aria-label` for icon-only buttons
- Show loading state with `aria-busy="true"`
- Disable with `disabled` attribute, not just visual styling
- Ensure 44x44px minimum size on mobile

### Forms (AppInput)

- Always associate labels with inputs
- Use `aria-invalid="true"` for validation errors
- Use `aria-describedby` to link error messages
- Mark required fields with `aria-required="true"` or `required` attribute
- Announce errors with `role="alert"` or `aria-live="assertive"`
- Group related inputs with `<fieldset>` and `<legend>`

### Modals and Dialogs

- Use `role="dialog"` or `role="alertdialog"`
- Trap focus within the modal when open
- Return focus to trigger element when closed (store ref to trigger button)
- Support Escape key to close
- Use `aria-modal="true"` to indicate modal behavior
- Provide accessible close button with clear label
- **Modal overlays must NOT be keyboard-interactive**: Use `role="presentation"` and `aria-hidden="true"` on backdrop overlays
- Click-to-close on overlay is fine for mouse users, but keyboard users should use Escape key or close button

### Images and Media

- Provide descriptive alt text for content images
- Use empty alt for decorative images
- Include captions for videos
- Provide transcripts for audio content
- Specify width and height to prevent layout shift

## Testing Checklist

Before marking a component complete:

- [ ] Test with keyboard only (no mouse)
- [ ] Test with screen reader (NVDA, JAWS, or VoiceOver)
- [ ] Verify color contrast with browser dev tools
- [ ] Test at 200% browser zoom
- [ ] Test on mobile device with touch
- [ ] Validate HTML with W3C validator
- [ ] Run automated accessibility audit (Lighthouse, axe)

## Common Patterns

### Focus Management

```typescript
// Complete modal/sidebar focus management pattern
const MyModal = ({ isOpen, onClose }) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // Focus trap
  useEffect(() => {
    if (!isOpen) return;

    const modal = modalRef.current;
    if (!modal) return;

    const focusableElements = modal.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

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

    modal.addEventListener('keydown', handleTab);
    firstElement?.focus(); // Focus first element when modal opens

    return () => modal.removeEventListener('keydown', handleTab);
  }, [isOpen]);

  // Escape key handler
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        handleClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen]);

  // Return focus to trigger element when closed
  const handleClose = useCallback(() => {
    onClose();
    setTimeout(() => triggerRef.current?.focus(), 100);
  }, [onClose]);

  return (
    <>
      <button ref={triggerRef} onClick={() => setOpen(true)}>
        Open Modal
      </button>

      {isOpen && (
        <>
          {/* Overlay - NOT keyboard interactive */}
          <div
            className="fixed inset-0 bg-black/50"
            onClick={handleClose}
            role="presentation"
            aria-hidden="true"
          />

          {/* Modal content */}
          <div
            ref={modalRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
          >
            <h2 id="modal-title">Modal Title</h2>
            <button onClick={handleClose}>Close</button>
          </div>
        </>
      )}
    </>
  );
};
```

### Screen Reader Announcements

```typescript
// Announce to screen reader
const announce = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
  const announcement = document.createElement('div');
  announcement.setAttribute('role', 'status');
  announcement.setAttribute('aria-live', priority);
  announcement.className = 'sr-only';
  announcement.textContent = message;
  document.body.appendChild(announcement);
  setTimeout(() => announcement.remove(), 1000);
};
```

### Visually Hidden Class

```css
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}
```

## Resources

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [ARIA Authoring Practices Guide](https://www.w3.org/WAI/ARIA/apg/)
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
- [Inclusive Components](https://inclusive-components.design/)
