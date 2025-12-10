# Quick Start Guide

## 🚀 Get Started in 3 Steps

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Configure API Key
1. Get your Gemini API key: https://aistudio.google.com/apikey

2. Open `.env` and replace the placeholder:
   ```env
   VITE_GEMINI_API_KEY=your-actual-gemini-api-key-here
   ```

### Step 3: Start Development Server
```bash
npm run dev
```

Open http://localhost:3000 🎉

---

## 🔧 Generate Security Keys (Optional)

If you need JWT/encryption keys for backend features:

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Copy the output to `.env` for:
- `JWT_SECRET`
- `ENCRYPTION_KEY`
- `AMPLY_ENCRYPTION_KEY`

---

## ✅ Verify Setup

### Check 1: No Console Warnings
Open browser console - should see NO warnings about:
- ❌ Tailwind CDN
- ❌ Missing aria-labels
- ❌ API key issues

### Check 2: API Key Working
Try using an AI feature (photo analysis, story generation, etc.)
- ✅ Should work without errors
- ❌ If you see "API key expired" - get a new key

### Check 3: TypeScript Working
In your IDE:
- ✅ No red squiggly lines
- ✅ Autocomplete working
- ✅ Type hints showing

---

## 🚨 Troubleshooting

### "API key expired" Error
**Solution:** Get a new API key from https://aistudio.google.com/apikey

### "VITE_GEMINI_API_KEY not set" Error
**Solution:** 
1. Open `.env` file
2. Replace `your-api-key-here` with your actual API key
3. Restart dev server (`Ctrl+C` then `npm run dev`)

### Styles Not Working
**Solution:** Clear browser cache and hard reload (`Ctrl+Shift+R`)

### TypeScript Errors
**Solution:** 
```bash
npm install --save-dev @types/react @types/react-dom
```

---

## 📚 More Information

- **Full Setup Guide:** See `SETUP.md`
- **Security Checklist:** See `SECURITY_CHECKLIST.md`
- **All Fixes Applied:** See `FIXES_APPLIED.md`

---

## 🎯 What's Fixed

✅ No hardcoded API keys (secure)
✅ No Tailwind CDN warnings (production-ready)
✅ No accessibility warnings (WCAG compliant)
✅ TypeScript fully working (type-safe)

**You're all set! Happy coding! 🚀**
