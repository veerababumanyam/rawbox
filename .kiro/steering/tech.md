# Technology Stack

## Build System & Tooling

- **Build Tool**: Vite 6.2.0
- **Package Manager**: npm
- **TypeScript**: 5.8.2 with strict configuration
- **Module System**: ESNext with bundler resolution

## Frontend Framework

- **React**: 19.2.1 with React DOM 19.2.1
- **JSX Transform**: Automatic runtime (`react-jsx`)
- **UI Library**: Custom component library (no external UI framework)
- **Icons**: lucide-react 0.556.0

## AI Integration

- **Provider**: Google Gemini AI via `@google/genai` (1.31.0)
- **Model**: gemini-2.5-flash
- **Capabilities**: Image analysis, face detection, content generation, smart curation

## Development Configuration

### Path Aliases
- `@/*` maps to project root for clean imports
- Example: `import { Layout } from '@/components/Layout'`

### Environment Variables
- `GEMINI_API_KEY`: Required for AI features (set in `.env.local`)
- Exposed to client via Vite's `define` config as `process.env.API_KEY`

### Dev Server
- Port: 3000
- Host: 0.0.0.0 (accessible on network)

## Common Commands

```bash
# Install dependencies
npm install

# Start development server (runs on http://localhost:3000)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## TypeScript Configuration

- Target: ES2022
- Experimental decorators enabled
- No emit (Vite handles compilation)
- Isolated modules for faster builds
- JSX: react-jsx (automatic runtime)
- Allow importing .ts extensions (Vite resolves)

## Code Style Conventions

- Use functional components with hooks (no class components)
- Prefer `const` over `let`, avoid `var`
- Use TypeScript interfaces for type definitions
- Export types from `types.ts` for shared domain models
- Use `forwardRef` for components that need ref forwarding
