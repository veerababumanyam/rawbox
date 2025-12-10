# Diagnostic Steps for "Pages Not Loading"

## Quick Diagnosis

Since all routes are correctly implemented, follow these steps to identify the actual issue:

## Step 1: Open Browser DevTools

1. Open the application in your browser
2. Press `F12` or `Ctrl+Shift+I` (Windows) to open DevTools
3. Go to the **Console** tab

## Step 2: Test Each Route

Click through each sidebar item and note what happens:

### Main Navigation Items

- [ ] **Galleries** - Does it show empty state or error?
- [ ] **Print Albums** - Does it show empty state or error?
- [ ] **Clients** - Does it show empty state or error?
- [ ] **People & Pets** - Does it show empty state or error?

### Settings Submenu Items

Click the **Settings** item to expand it, then test each:

- [ ] **Visibility & SEO** - Does it load the form?
- [ ] **Brand Defaults** - Does it load the form?
- [ ] **Company Info** - Does it load the form?
- [ ] **Personal Info** - Does it load the form?
- [ ] **Integrations** - Does it load the form?
- [ ] **Policies** - Does it load the form?

## Step 3: Check Console Errors

For each page that doesn't load, look for errors in the Console tab:

### Common Error Types

**Import/Module Errors:**
```
Failed to load module script
Cannot find module './components/...'
Unexpected token '<'
```
→ **Cause**: Component file missing or build issue
→ **Fix**: Verify file exists, rebuild with `npm run build`

**React Errors:**
```
Error: A component suspended while responding to synchronous input
Uncaught Error: Minified React error
```
→ **Cause**: Component rendering issue
→ **Fix**: Check component implementation

**API Errors:**
```
Failed to fetch
404 Not Found
500 Internal Server Error
```
→ **Cause**: Backend not running or API endpoint missing
→ **Fix**: Start backend server

## Step 4: Check Network Tab

1. Go to **Network** tab in DevTools
2. Click on a page that's not loading
3. Look for failed requests (red status codes)

### What to Look For

- **Failed API calls** (`/api/albums`, `/api/storage-providers`)
  - Status 404: Backend route not implemented
  - Status 500: Backend error
  - Status 0 or CORS error: Backend not running

- **Failed component imports** (`.js` or `.tsx` files)
  - Status 404: File doesn't exist
  - Status 500: Build error

## Step 5: Check for Empty States

Some pages show empty states when there's no data. This is **expected behavior**:

### AlbumsView (Galleries)
Shows: "No galleries found. Create your first gallery to get started."
→ This is normal if you haven't created any galleries

### ClientsView (Clients)
Shows: "No clients yet. Add your first client to get started."
→ This is normal if you haven't added any clients

### PeopleView (People & Pets)
Shows: "No people detected yet. Scan your photos to find faces."
→ This is normal if you haven't scanned photos

### SettingsView (All Settings Pages)
Shows: Forms with empty fields
→ This is normal for first-time setup

## Step 6: Verify Backend is Running

If you see API errors, check if the backend server is running:

```bash
# Check if server is running
# Look for a process on port 3000 or your configured port

# Windows
netstat -ano | findstr :3000

# If not running, start it
npm run dev
# or
npm run server
```

## Step 7: Check Build Status

If components aren't loading, rebuild the application:

```bash
# Clean and rebuild
npm run build

# Or restart dev server
npm run dev
```

## Expected Results

### ✅ Working Correctly

- Page loads with content or empty state message
- No errors in console
- API calls return 200 status (or 404 if no data)
- Forms are interactive

### ❌ Not Working

- Infinite loading spinner
- White/blank screen
- Console shows errors
- API calls fail with network errors
- "View not found" message

## Report Your Findings

After completing these steps, report:

1. **Which specific pages fail to load?**
   - List the exact sidebar items that don't work

2. **What errors appear in the console?**
   - Copy the exact error messages

3. **What do you see on the page?**
   - Empty state message?
   - Loading spinner?
   - Blank screen?
   - Error message?

4. **Are there failed network requests?**
   - Which API endpoints fail?
   - What status codes?

This information will help identify the root cause.
