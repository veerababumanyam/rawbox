# Environment Configuration Guide

## Quick Setup

1. **Open `.env` file** in the project root
2. **Update the API key:**
   ```env
   VITE_GEMINI_API_KEY=your-actual-gemini-api-key-here
   ```
3. **Get your API key:** https://aistudio.google.com/apikey
4. **Restart dev server** if it's running

That's it! 🎉

---

## Configuration Approach

This project uses a **single `.env` file** for all configuration. This is simpler than managing multiple environment files and works well for:
- Private repositories
- Small teams
- Development and testing

### File Structure
```
.env          → Contains all configuration (including credentials)
.env.example  → Template for reference (optional)
```

---

## Required Configuration

### Minimum Setup (Frontend Only)

Only one variable is required to run the app:

```env
VITE_GEMINI_API_KEY=your-actual-api-key-here
```

Get your key: https://aistudio.google.com/apikey

### Full Backend Setup (Optional)

If you're using backend services, also configure:

```env
# Security Keys (generate with crypto.randomBytes)
JWT_SECRET=your-64-char-hex-string
ENCRYPTION_KEY=your-64-char-hex-string

# Google OAuth (if using)
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret

# Database (if using)
POSTGRES_PASSWORD=your-secure-password

# Email (if using)
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

---

## Generating Secure Keys

For JWT_SECRET and ENCRYPTION_KEY, generate random values:

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

This creates a secure 128-character hex string. Run it twice to get two different keys.

---

## Security Considerations

### For Private Repositories ✅
- `.env` file with actual credentials is fine
- Commit it to your private repo
- Team members get credentials automatically

### For Public Repositories ⚠️
If you plan to open-source this:
1. Add `.env` to `.gitignore`
2. Create `.env.example` with placeholders
3. Document setup in README
4. Never commit actual credentials

---

## Environment Variables Reference

### Frontend (VITE_ prefix - exposed to browser)
```env
VITE_GEMINI_API_KEY=...      # Google Gemini AI API key
VITE_GOOGLE_CLIENT_ID=...    # Google OAuth client ID
VITE_API_URL=...             # Backend API URL
```

**Note:** Only variables with `VITE_` prefix are accessible in frontend code via `import.meta.env.VITE_*`

### Backend Only (NOT exposed to browser)
```env
JWT_SECRET=...               # JWT signing secret
ENCRYPTION_KEY=...           # Data encryption key
GOOGLE_CLIENT_SECRET=...     # Google OAuth secret
POSTGRES_PASSWORD=...        # Database password
SMTP_PASS=...               # Email password
```

---

## Troubleshooting

### "VITE_GEMINI_API_KEY not set" Error
**Cause:** The API key is still set to the placeholder value or missing.

**Solution:**
1. Open `.env`
2. Replace `your-api-key-here` with your actual key
3. Restart dev server: `Ctrl+C` then `npm run dev`

### "API key expired" Error
**Cause:** Your Gemini API key has expired.

**Solution:**
1. Get a new key: https://aistudio.google.com/apikey
2. Update in `.env`
3. Restart dev server

### Changes Not Taking Effect
**Cause:** Vite caches environment variables.

**Solution:**
1. Stop dev server (`Ctrl+C`)
2. Clear cache: `rm -rf node_modules/.vite`
3. Restart: `npm run dev`

---

## Production Deployment

### Option 1: Platform Environment Variables (Recommended)
Set variables in your hosting platform (Vercel, Netlify, etc.):
- Don't deploy `.env` file
- Use platform's environment variable UI
- Separate dev/staging/prod configurations

### Option 2: Deploy with .env File
If your platform supports it:
- Ensure `.env` is included in deployment
- Use different `.env` files per environment
- Keep production credentials secure

---

## Best Practices

✅ **DO:**
- Keep `.env` secure and private
- Use strong, random values for secrets
- Rotate API keys regularly
- Use different keys for dev/prod
- Document required variables

❌ **DON'T:**
- Share `.env` file publicly
- Commit credentials to public repos
- Use production keys in development
- Hardcode values in source code
- Reuse keys across projects

---

## Quick Reference

| Variable | Required | Where to Get |
|----------|----------|--------------|
| `VITE_GEMINI_API_KEY` | ✅ Yes | https://aistudio.google.com/apikey |
| `JWT_SECRET` | ⚠️ Backend | Generate with crypto.randomBytes |
| `ENCRYPTION_KEY` | ⚠️ Backend | Generate with crypto.randomBytes |
| `GOOGLE_CLIENT_ID` | ❌ Optional | https://console.cloud.google.com |
| `POSTGRES_PASSWORD` | ❌ Optional | Your database setup |

---

## Need Help?

- **Setup Issues:** See [QUICK_START.md](QUICK_START.md)
- **Security Questions:** See [SECURITY_CHECKLIST.md](SECURITY_CHECKLIST.md)
- **Full Documentation:** See [SETUP.md](SETUP.md)

---

**Remember:** Only `VITE_GEMINI_API_KEY` is required to get started! 🚀
