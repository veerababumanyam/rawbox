# Testing Standards

## Overview

All testing scripts must be created in the `/tests` folder following strict file structure and naming conventions. This ensures consistency, maintainability, and clear separation between source code and test code.

## Test Location

- **Primary location**: `/tests` folder ONLY
- **Never create**: Test files alongside source code (e.g., `Component.test.tsx` next to `Component.tsx`)
- **Mirror structure**: Test folder structure should mirror source code structure

## File Naming Conventions

### Test File Naming
- Component tests: `ComponentName.test.tsx`
- Service tests: `serviceName.test.ts`
- Utility tests: `utilityName.test.ts`
- Integration tests: `featureName.integration.test.ts`
- E2E tests: `workflow.e2e.test.ts`

### Examples:
- ✅ `/tests/components/AlbumGrid.test.tsx`
- ✅ `/tests/services/geminiService.test.ts`
- ✅ `/tests/utils/dateFormatter.test.ts`
- ❌ `/components/AlbumGrid.test.tsx` (wrong location)
- ❌ `/tests/AlbumGrid.spec.tsx` (wrong extension)
- ❌ `/tests/album-grid.test.tsx` (wrong naming)

## Test Folder Structure

### `/tests/components/`
Component unit tests mirroring `/components` structure:

```
/tests/components/
  ├── AlbumGrid.test.tsx
  ├── AlbumDetailView.test.tsx
  ├── ClientsView.test.tsx
  ├── ui/
  │   ├── AppButton.test.tsx
  │   ├── AppInput.test.tsx
  │   └── PhotoGrid.test.tsx
  └── album-design/
      ├── AlbumDesigner.test.tsx
      └── SpreadCanvas.test.tsx
```

### `/tests/services/`
Service and business logic tests:

```
/tests/services/
  ├── geminiService.test.ts
  ├── authService.test.ts
  └── storageService.test.ts
```

### `/tests/utils/`
Utility function tests:

```
/tests/utils/
  ├── dateFormatter.test.ts
  ├── imageProcessor.test.ts
  └── validators.test.ts
```

### `/tests/integration/`
Integration tests for feature workflows:

```
/tests/integration/
  ├── galleryUpload.integration.test.ts
  ├── clientAccess.integration.test.ts
  └── albumDesign.integration.test.ts
```

### `/tests/e2e/`
End-to-end tests for complete user workflows:

```
/tests/e2e/
  ├── photographerWorkflow.e2e.test.ts
  ├── clientGalleryAccess.e2e.test.ts
  └── albumCreation.e2e.test.ts
```

### `/tests/fixtures/`
Test data and mock fixtures:

```
/tests/fixtures/
  ├── mockAlbums.ts
  ├── mockPhotos.ts
  └── mockClients.ts
```

### `/tests/helpers/`
Test utilities and helper functions:

```
/tests/helpers/
  ├── renderWithProviders.tsx
  ├── mockApiResponses.ts
  └── testUtils.ts
```

## Test Framework

### Vitest Configuration
- **Config file**: `vitest.config.ts`
- **Test runner**: Vitest
- **Coverage tool**: Vitest coverage (c8)
- **DOM testing**: @testing-library/react

### Running Tests
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test AlbumGrid.test.tsx
```

## Test Structure

### Component Test Template

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AlbumGrid } from '@/components/AlbumGrid';
import { mockAlbums } from '../fixtures/mockAlbums';

describe('AlbumGrid', () => {
  const mockOnAlbumClick = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders album grid with correct number of items', () => {
    render(
      <AlbumGrid 
        albums={mockAlbums} 
        onAlbumClick={mockOnAlbumClick}
      />
    );

    const albumItems = screen.getAllByRole('article');
    expect(albumItems).toHaveLength(mockAlbums.length);
  });

  it('calls onAlbumClick when album is clicked', () => {
    render(
      <AlbumGrid 
        albums={mockAlbums} 
        onAlbumClick={mockOnAlbumClick}
      />
    );

    const firstAlbum = screen.getAllByRole('article')[0];
    fireEvent.click(firstAlbum);

    expect(mockOnAlbumClick).toHaveBeenCalledWith(mockAlbums[0]);
  });

  it('displays empty state when no albums provided', () => {
    render(
      <AlbumGrid 
        albums={[]} 
        onAlbumClick={mockOnAlbumClick}
      />
    );

    expect(screen.getByText(/no albums/i)).toBeInTheDocument();
  });
});
```

### Service Test Template

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { analyzePhoto } from '@/services/geminiService';

describe('geminiService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('analyzePhoto', () => {
    it('returns photo analysis with tags', async () => {
      const photoUrl = 'https://example.com/photo.jpg';
      
      const result = await analyzePhoto(photoUrl);

      expect(result).toHaveProperty('tags');
      expect(result.tags).toBeInstanceOf(Array);
      expect(result.tags.length).toBeGreaterThan(0);
    });

    it('handles API errors gracefully', async () => {
      const invalidUrl = 'invalid-url';

      await expect(analyzePhoto(invalidUrl)).rejects.toThrow();
    });
  });
});
```

## Testing Best Practices

### Unit Tests
- Test one component/function at a time
- Mock external dependencies
- Test all props and state variations
- Test error states and edge cases
- Aim for 80%+ code coverage

### Integration Tests
- Test feature workflows end-to-end
- Use real components, mock external APIs
- Test user interactions across multiple components
- Verify data flow between components

### E2E Tests
- Test complete user journeys
- Use real browser environment
- Test critical business workflows
- Keep E2E tests minimal (slower to run)

### What to Test

#### Components
- ✅ Rendering with different props
- ✅ User interactions (clicks, inputs, etc.)
- ✅ Conditional rendering
- ✅ Error states
- ✅ Loading states
- ✅ Accessibility (ARIA attributes, keyboard navigation)

#### Services
- ✅ API calls and responses
- ✅ Error handling
- ✅ Data transformation
- ✅ Edge cases and validation

#### Utilities
- ✅ Input/output for various cases
- ✅ Edge cases and boundary conditions
- ✅ Error handling

### What NOT to Test
- ❌ Third-party library internals
- ❌ Browser APIs (unless you're wrapping them)
- ❌ Implementation details (internal state, private methods)
- ❌ Trivial code (simple getters/setters)

## Mocking

### Mock External Dependencies

```typescript
// Mock Gemini AI service
vi.mock('@/services/geminiService', () => ({
  analyzePhoto: vi.fn().mockResolvedValue({
    tags: ['portrait', 'outdoor'],
    faces: []
  })
}));

// Mock fetch API
global.fetch = vi.fn().mockResolvedValue({
  ok: true,
  json: async () => ({ data: 'mock data' })
});
```

### Mock Components

```typescript
// Mock heavy components
vi.mock('@/components/album-design/AlbumDesigner', () => ({
  AlbumDesigner: () => <div>Mocked Album Designer</div>
}));
```

### Mock Hooks

```typescript
// Mock custom hooks
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: '1', name: 'Test User' },
    isAuthenticated: true
  })
}));
```

## Test Coverage

### Coverage Targets
- **Overall**: 80%+ code coverage
- **Critical paths**: 90%+ coverage (auth, payment, data loss prevention)
- **UI components**: 70%+ coverage
- **Services**: 90%+ coverage
- **Utilities**: 95%+ coverage

### Coverage Reports
```bash
# Generate coverage report
npm run test:coverage

# View HTML coverage report
open coverage/index.html
```

### Coverage Configuration
```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    coverage: {
      provider: 'c8',
      reporter: ['text', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'tests/',
        '*.config.ts',
        'dist/'
      ],
      lines: 80,
      functions: 80,
      branches: 80,
      statements: 80
    }
  }
});
```

## Continuous Integration

### Pre-commit Hooks
- Run tests before commit
- Fail commit if tests fail
- Run linting and type checking

### CI Pipeline
1. Install dependencies
2. Run linter
3. Run type checker
4. Run all tests
5. Generate coverage report
6. Fail build if coverage drops below threshold

## Accessibility Testing

### Test Keyboard Navigation
```typescript
it('supports keyboard navigation', () => {
  render(<AlbumGrid albums={mockAlbums} />);
  
  const firstAlbum = screen.getAllByRole('article')[0];
  firstAlbum.focus();
  
  expect(document.activeElement).toBe(firstAlbum);
  
  fireEvent.keyDown(firstAlbum, { key: 'Enter' });
  expect(mockOnAlbumClick).toHaveBeenCalled();
});
```

### Test ARIA Attributes
```typescript
it('has correct ARIA attributes', () => {
  render(<AppButton aria-label="Delete album">Delete</AppButton>);
  
  const button = screen.getByRole('button');
  expect(button).toHaveAttribute('aria-label', 'Delete album');
});
```

### Test Screen Reader Announcements
```typescript
it('announces loading state to screen readers', () => {
  render(<AlbumGrid albums={[]} loading={true} />);
  
  const loadingRegion = screen.getByRole('status');
  expect(loadingRegion).toHaveAttribute('aria-live', 'polite');
});
```

## Performance Testing

### Test Rendering Performance
```typescript
it('renders large album list efficiently', () => {
  const largeAlbumList = Array.from({ length: 1000 }, (_, i) => ({
    id: `album-${i}`,
    title: `Album ${i}`
  }));

  const startTime = performance.now();
  render(<AlbumGrid albums={largeAlbumList} />);
  const endTime = performance.now();

  expect(endTime - startTime).toBeLessThan(1000); // Should render in < 1s
});
```

## Security Testing

### Test Input Validation
```typescript
it('sanitizes user input', () => {
  const maliciousInput = '<script>alert("XSS")</script>';
  
  render(<AppInput value={maliciousInput} onChange={vi.fn()} />);
  
  const input = screen.getByRole('textbox');
  expect(input.value).not.toContain('<script>');
});
```

### Test Authentication
```typescript
it('redirects unauthenticated users', () => {
  vi.mock('@/hooks/useAuth', () => ({
    useAuth: () => ({ isAuthenticated: false })
  }));

  render(<ProtectedRoute><AlbumGrid /></ProtectedRoute>);
  
  expect(screen.getByText(/please log in/i)).toBeInTheDocument();
});
```

## Debugging Tests

### Run Single Test
```bash
npm test -- AlbumGrid.test.tsx
```

### Run Tests in Watch Mode
```bash
npm run test:watch
```

### Debug in VS Code
Add to `.vscode/launch.json`:
```json
{
  "type": "node",
  "request": "launch",
  "name": "Debug Vitest Tests",
  "runtimeExecutable": "npm",
  "runtimeArgs": ["run", "test"],
  "console": "integratedTerminal"
}
```

## Agent Behavior

### When Creating Tests
1. Always create test files in `/tests` folder
2. Mirror the source code structure
3. Use correct naming convention (`.test.tsx` or `.test.ts`)
4. Include describe blocks for organization
5. Test happy path, error cases, and edge cases
6. Mock external dependencies
7. Ensure tests are isolated and independent

### When Running Tests
- Use `npm test` command, not direct vitest calls
- Check coverage reports after running tests
- Fix failing tests before proceeding
- Update tests when changing implementation

## Resources

- Vitest Documentation: https://vitest.dev/
- Testing Library: https://testing-library.com/
- Test Coverage: `coverage/index.html` (after running tests)
