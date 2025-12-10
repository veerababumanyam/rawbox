# RawBox - Setup Guide

## Security & Configuration

This project has been configured to follow security best practices. **Never commit sensitive credentials to version control.**

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

The project uses `.env` for all configuration.

1. Open `.env` file
2. Replace the placeholder with your actual API key:

```env
VITE_GEMINI_API_KEY=your-actual-gemini-api-key-here
```

**Get your Gemini API key:** https://aistudio.google.com/apikey

**⚠️ Important:** If you plan to commit this to a public repository, add `.env` to `.gitignore` and use `.env.example` for templates instead.

### 3. Start Development Server

```bash
npm run dev
```

The app will run at http://localhost:3000

## Environment Files

- `.env` - Contains all configuration including credentials
- `.env.example` - Template for reference

**⚠️ Security Note:** The `.env` file contains actual credentials. For private repos this is fine, but for public repos you should:
1. Add `.env` to `.gitignore`
2. Only commit `.env.example` with placeholders
3. Document setup in README

## What Was Fixed

### 1. Removed Tailwind CDN
- **Issue:** Using `cdn.tailwindcss.com` in production is not recommended
- **Fix:** Replaced with custom CSS utilities using semantic design tokens
- **Benefit:** Faster load times, no external dependencies, production-ready

### 2. Secured API Keys
- **Issue:** Hardcoded API keys in `.env` file
- **Fix:** 
  - Removed actual keys from `.env`
  - Created `.env.local` for real credentials
  - Updated `.gitignore` to exclude `.env.local`
  - Changed code to use `import.meta.env.VITE_GEMINI_API_KEY`
- **Benefit:** Credentials never committed to version control

### 3. Fixed Accessibility Warning
- **Issue:** AppCard component warning about missing aria-label
- **Fix:** Added default aria-label for interactive cards
- **Benefit:** Better accessibility for screen readers

### 4. Added TypeScript Types
- **Issue:** Missing @types/react and @types/react-dom
- **Fix:** Installed type definitions
- **Benefit:** Better TypeScript support and IDE autocomplete

## Security Best Practices

✅ **DO:**
- Keep `.env.local` file private
- Use environment variables for all sensitive data
- Rotate API keys regularly
- Use different keys for development and production

❌ **DON'T:**
- Commit `.env.local` to git
- Share API keys in chat, email, or screenshots
- Hardcode credentials in source code
- Use production keys in development

## Troubleshooting

### "API key expired" Error
Your Gemini API key has expired. Get a new one from https://aistudio.google.com/apikey and update `.env.local`.

### "VITE_GEMINI_API_KEY not set" Error
Make sure you've updated `.env` with your actual API key (not the placeholder). Restart the dev server after updating.

### Styles Not Working
If you see unstyled content, clear your browser cache and reload. The Tailwind CDN has been replaced with custom CSS.

## Production Deployment

Before deploying to production:

1. Set `VITE_GEMINI_API_KEY` in your hosting platform's environment variables
2. Use production-grade API keys with appropriate rate limits
3. Enable HTTPS for all requests
4. Consider using platform environment variables instead of `.env` file

## Additional Configuration

For other services (Google OAuth, MinIO, etc.):
1. Update the placeholders in `.env` with your actual values
2. Generate secure random keys for JWT_SECRET and ENCRYPTION_KEY
3. Keep `.env` secure and don't share it publicly

## Support

For issues or questions, refer to:
- [Vite Environment Variables](https://vitejs.dev/guide/env-and-mode.html)
- [Google Gemini API Docs](https://ai.google.dev/docs)
- Project steering files in `.kiro/steering/`
