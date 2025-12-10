# Project Structure

## Root Files

- `index.html`: Entry HTML file
- `index.tsx`: React application entry point, renders `<App />`
- `App.tsx`: Main application component with routing logic and state management
- `types.ts`: Centralized TypeScript type definitions for the entire application
- `vite.config.ts`: Vite build configuration
- `tsconfig.json`: TypeScript compiler configuration

## Directory Organization

### `/components`
React components organized by feature and hierarchy:

- **Root-level components**: Feature-specific views and modals
  - `*View.tsx`: Full-page views (e.g., `ClientsView`, `SettingsView`, `PeopleView`)
  - `*DetailView.tsx`: Detail pages (e.g., `AlbumDetailView`, `ClientDetailView`)
  - `*Modal.tsx`: Modal dialogs (e.g., `UploadModal`, `ShareModal`, `DeleteModal`)
  - `Layout.tsx`: Main application layout with sidebar navigation
  - `Branding.tsx`, `PublicProfile.tsx`: Specialized components

- **`/components/ui`**: Reusable UI primitives and design system components
  - `AppButton.tsx`: Button components with variants (primary, secondary, ghost, destructive, outline, link)
  - `AppInput.tsx`, `AppCard.tsx`, `AppBadge.tsx`: Form and display components
  - `AdminToolbar.tsx`: Toolbar component for admin actions
  - `PhotoGrid.tsx`: Grid layout for photo display
  - `DataTable.tsx`: Table component for data display
  - `ImageCropper.tsx`: Image manipulation component
  - `SearchInput.tsx`, `SkipToContent.tsx`: Utility components

- **`/components/album-design`**: Print album designer feature
  - `AlbumDesigner.tsx`: Main design interface
  - `SpreadCanvas.tsx`: Canvas for designing album spreads

### `/services`
Business logic and external integrations:

- `geminiService.ts`: Google Gemini AI integration
  - Photo analysis and tagging
  - Face detection with bounding boxes
  - Album story generation
  - Smart photo curation
  - Legal policy generation

### `/tests`
**All testing scripts must be created here**:

- **Naming convention**: `ComponentName.test.tsx` or `featureName.test.ts`
- **Organization**: Mirror the source code structure
  - `/tests/components/`: Component tests
  - `/tests/services/`: Service tests
  - `/tests/utils/`: Utility function tests
  - `/tests/integration/`: Integration tests
  - `/tests/e2e/`: End-to-end tests
- **Test framework**: Vitest (configured in `vitest.config.ts`)
- **Never create**: Test files outside `/tests` folder
- **Coverage**: Aim for >80% code coverage on critical paths

### `/docs`
**All project documentation must be created here**:

- **Naming convention**: SCREAMING_SNAKE_CASE (e.g., `FEATURE_NAME.md`)
- **Organization**: Use subfolders for categories
  - `/docs/features/`: Feature documentation
  - `/docs/architecture/`: System design and architecture
  - `/docs/api/`: API integration guides
  - `/docs/deployment/`: Deployment and operations
  - `/docs/development/`: Development guides
- **Never create**: Root-level documentation files (except README.md)
- **See**: `.kiro/steering/documentation.md` for complete standards

### `/node_modules`
Third-party dependencies (not committed to version control)

## Component Patterns

### Naming Conventions
- Components: PascalCase (e.g., `AlbumGrid`, `AppButton`)
- Files: Match component name (e.g., `AlbumGrid.tsx`)
- Types: PascalCase interfaces (e.g., `Album`, `Photo`, `Client`)
- Props interfaces: `ComponentNameProps` (e.g., `AppButtonProps`)

### Component Structure
```typescript
// 1. Imports
import React from 'react';
import { Icon } from 'lucide-react';
import { Type } from '../types';

// 2. Props interface
interface ComponentProps {
  prop: string;
}

// 3. Component definition
export const Component: React.FC<ComponentProps> = ({ prop }) => {
  // 4. Hooks
  const [state, setState] = useState();
  
  // 5. Handlers
  const handleAction = () => {};
  
  // 6. Render
  return <div>...</div>;
};
```

### State Management
- Local state with `useState` for component-specific data
- Props drilling for parent-child communication
- No global state library (Redux, Zustand, etc.)
- Main app state lives in `App.tsx` and flows down via props

### Styling Approach
- Utility-first CSS with Tailwind-like classes
- Custom CSS variables for theming (defined in root)
- Inline className strings with template literals
- Responsive design with mobile-first breakpoints
- Dark mode support via `data-theme` attribute

## Type System

All domain types are centralized in `types.ts`:

- **Core entities**: `Album`, `Photo`, `Client`, `Person`
- **UI types**: `AppView`, `AppSettings`, `ViewMode`
- **Design types**: `AlbumDesign`, `AlbumSpread`, `DesignElement`, `PrintSpecs`
- **Profile types**: `PhotographerProfile`, `PersonalProfile`, `CompanyProfile`
- **Utility types**: `MediaType`, `BrandingSettings`, `GallerySettings`

## File Naming Rules

- React components: `ComponentName.tsx`
- Type definitions: `types.ts` (centralized)
- Services: `serviceName.ts`
- Configuration: `*.config.ts`
- Test files: `ComponentName.test.tsx` or `featureName.test.ts` (in `/tests` folder only)
- No index.ts barrel exports (import directly from files)

## Import Patterns

```typescript
// External dependencies first
import React, { useState } from 'react';
import { Icon } from 'lucide-react';

// Internal types
import { Album, Photo } from './types';

// Internal components
import { Layout } from './components/Layout';
import { AppButton } from './components/ui/AppButton';

// Services
import { analyzePhoto } from './services/geminiService';
```
