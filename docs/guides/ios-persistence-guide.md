# Mobile Tab Suspension & Persistence Guide (iOS & Android)

## Problem Overview

When using Sígale on mobile devices (iOS and Android), browsers suspend background tabs to save battery and memory. This causes several issues:

1. **"Not Found" errors** when returning to the app after switching to other apps
2. **Dev server disconnection** (HMR WebSocket drops)
3. **Mysterious `.txt` file downloads** (e.g., `sell-tickets.txt`)
4. **Lost navigation state** requiring manual navigation back

### iOS vs Android Behavior

**iOS (iPhone/iPad):**
- ⚠️ **VERY aggressive** tab suspension (after ~30 seconds)
- ⚠️ Kills WebSocket connections immediately
- ⚠️ Safari and Chrome both suspend aggressively
- ⚠️ PWA mode helps significantly but still has limitations

**Android:**
- ✅ **Less aggressive** than iOS (suspends after ~5-10 minutes)
- ✅ Better tab retention in Chrome
- ✅ More forgiving with background connections
- ✅ PWA mode works excellently
- ⚠️ Low-memory devices may still suspend tabs quickly

**TL;DR:** Android is generally much more tolerant, but the same solutions help both platforms.

## Root Causes

### 1. Mobile Tab Suspension
**iOS (Aggressive):**
- iOS suspends tabs after ~30 seconds in the background
- WebSocket connections (Vite HMR) are terminated immediately
- Network requests fail or timeout quickly
- JavaScript execution is paused
- Memory is aggressively reclaimed

**Android (Moderate):**
- Android suspends tabs after ~5-10 minutes (varies by device)
- Chrome Android is more lenient with background tabs
- WebSocket connections stay alive longer
- Better memory management
- Low-end devices may behave more like iOS

### 2. SPA Routing Without Server Fallback
- React Router manages routes in JavaScript (`/sell-tickets`)
- When the tab reloads, the server looks for actual files
- Without a fallback rule, the server returns 404
- Vite's dev server may serve error pages as `.txt` files

### 3. Dev Server Limitations
- Vite dev server is not designed for mobile persistence
- HMR requires active WebSocket connection
- No built-in SPA fallback in dev mode

## Solutions Implemented

### ✅ 1. Service Worker for Offline Persistence
**Files Created:**
- [public/sw.js](../public/sw.js) - Service worker with caching and SPA fallback
- [src/utils/serviceWorkerRegistration.js](../src/utils/serviceWorkerRegistration.js) - Registration utility

**What it does:**
- Caches essential app files for offline use
- Serves `index.html` for all navigation requests (SPA fallback)
- Works even when network is unavailable
- **Only activates in production build** (not dev mode)

**Benefits:**
- ✅ App works offline
- ✅ Fast loading after first visit
- ✅ Survives tab suspension
- ✅ No more "Not Found" errors

### ✅ 2. PWA (Progressive Web App) Configuration
**Files Created/Modified:**
- [public/manifest.json](../public/manifest.json) - PWA manifest
- [index.html](../index.html) - Added PWA meta tags

**What it does:**
- Makes the app installable on iOS home screen
- Runs in standalone mode (no browser UI)
- Sets theme colors and app name
- Improves mobile experience

**Benefits:**
- ✅ Can be "installed" like a native app
- ✅ Runs in full-screen mode
- ✅ Better persistence than browser tabs
- ✅ iOS treats it more like a native app

**How to install on iPhone:**
1. Open the app in Safari
2. Tap the Share button (box with arrow)
3. Scroll down and tap "Add to Home Screen"
4. The app icon will appear on your home screen
5. Launch from home screen for best experience

### ✅ 3. Page Visibility API Hook
**File Created:**
- [src/hooks/usePageVisibility.js](../src/hooks/usePageVisibility.js)

**What it does:**
- Detects when the page becomes visible/hidden
- Tracks how long the page was suspended
- Triggers custom events after long suspensions
- Logs visibility changes in dev mode

**Benefits:**
- ✅ App knows when it's been suspended
- ✅ Can trigger state refresh after long suspension
- ✅ Helps debug suspension issues
- ✅ Future-ready for implementing reconnection logic

### ✅ 4. Error Boundary for Graceful Recovery
**File Created:**
- [src/components/ErrorBoundary/ErrorBoundary.jsx](../src/components/ErrorBoundary/ErrorBoundary.jsx)

**What it does:**
- Catches React errors that would crash the app
- Shows a friendly "Something went wrong" screen
- Provides a "Reload App" button
- Shows technical details in dev mode

**Benefits:**
- ✅ App doesn't crash completely
- ✅ Users can recover with one tap
- ✅ Better user experience
- ✅ Helpful error details for debugging

### ✅ 5. Vite Configuration Improvements
**File Modified:**
- [vite.config.js](../vite.config.js)

**Changes:**
- Added `host: true` - Allows mobile device access on local network
- Increased HMR timeout to 30 seconds - More lenient for mobile
- Disabled HMR error overlay - No annoying popups on reconnect
- Added preview server config - Better production testing

**Benefits:**
- ✅ Can access dev server from iPhone via IP address
- ✅ More tolerant of slow mobile connections
- ✅ Better experience when HMR reconnects

### ✅ 6. SPA Fallback Rule
**File Created:**
- [public/_redirects](../public/_redirects)

**Content:**
```
/* /index.html 200
```

**What it does:**
- Tells hosting providers (Netlify/Vercel) to serve `index.html` for all routes
- Works with Vite preview server
- Essential for SPA routing

**Benefits:**
- ✅ All routes work on production deployment
- ✅ Direct URL access works (e.g., `/sell-tickets`)
- ✅ No more 404 errors

## How to Use

### Option 1: Production Build + Preview (Recommended for Mobile Testing)
```bash
# Build the production version
npm run build

# Start preview server
npm run preview
```

**Access from iPhone:**
1. Find your computer's local IP address:
   - Windows: `ipconfig` (look for IPv4)
   - Mac: `ifconfig` (look for inet)
2. On iPhone, open Chrome/Safari
3. Navigate to: `http://YOUR_IP:4173`
4. Test switching between apps - should work perfectly

**Why this is best:**
- Service Worker is active (only works in production)
- No HMR disconnection issues
- Matches real deployment behavior
- SPA routing works correctly

### Option 2: Dev Server (Development)
```bash
npm run dev
```

**Access from iPhone:**
- Navigate to: `http://YOUR_IP:5173`

**Limitations:**
- Service Worker won't register (dev mode only)
- HMR may disconnect after tab suspension
- Not recommended for extended mobile testing

### Option 3: Deploy to Hosting (Best for Real-World Testing)

**Netlify (Free):**
```bash
npm run build
# Drag & drop the dist/ folder to Netlify
```

**Vercel (Free):**
```bash
npm install -g vercel
npm run build
vercel --prod
```

**GitHub Pages:**
```bash
npm run build
# Push dist/ folder to gh-pages branch
```

**Benefits:**
- HTTPS by default (required for camera, clipboard APIs)
- Persistent URL you can bookmark
- Test from anywhere, not just local network
- Real production environment

## Testing Checklist

### ✅ Production Build Testing
1. [ ] Build completes without errors: `npm run build`
2. [ ] Preview server starts: `npm run preview`
3. [ ] Can access from iPhone via `http://IP:4173`
4. [ ] Service Worker registers (check browser console)
5. [ ] Navigate to `/sell-tickets` directly - works
6. [ ] Switch to another app for 5+ minutes
7. [ ] Return to browser - page still works
8. [ ] Check DevTools > Application > Service Workers (shows registered)

### ✅ PWA Installation Testing (iOS)
1. [ ] Open app in Safari on iPhone
2. [ ] Share button > "Add to Home Screen"
3. [ ] App icon appears on home screen
4. [ ] Launch from home screen (opens in standalone mode)
5. [ ] No browser UI visible (full screen)
6. [ ] Switch apps and return - persists correctly

### ✅ PWA Installation Testing (Android)
1. [ ] Open app in Chrome on Android
2. [ ] Look for "Add to Home screen" banner (appears automatically)
3. [ ] Or: Menu (⋮) > "Install app" or "Add to Home screen"
4. [ ] App icon appears on home screen
5. [ ] Launch from home screen (opens in standalone mode)
6. [ ] Switch apps and return - persists correctly
7. [ ] **Android advantage:** Better background tab retention than iOS

### ✅ Android-Specific Testing
1. [ ] Dev server works better than iOS (less aggressive suspension)
2. [ ] Chrome Android keeps tabs alive longer (5-10 min vs 30 sec)
3. [ ] WebSocket (HMR) reconnects more reliably
4. [ ] PWA installation is easier (automatic prompt)
5. [ ] Test on low-memory device if possible (may behave like iOS)

### ✅ Error Recovery Testing
1. [ ] Force an error (e.g., corrupt localStorage)
2. [ ] Error boundary shows "Something went wrong" screen
3. [ ] "Reload App" button works
4. [ ] App recovers gracefully

## Advanced: Monitoring in Production

### Check Service Worker Status (Chrome DevTools)
1. Open app on iPhone Chrome
2. Go to `chrome://inspect` on your computer
3. Find your iPhone device
4. Open DevTools remotely
5. Go to Application > Service Workers
6. Verify status: "activated and is running"

### Check Page Visibility Events
Open browser console and look for:
```
[App] Page visibility: hidden
[App] Page visibility: visible
[PageVisibility] Page was suspended for 315 seconds
```

## Future Enhancements

### Potential Improvements
1. **Background Sync API** - Sync data when app comes back online
2. **IndexedDB** - More robust storage than localStorage
3. **Push Notifications** - Remind users about events
4. **App Install Prompt** - Guide users to install PWA
5. **Offline Queue** - Queue operations when offline, sync when online
6. **State Restoration** - Save scroll position, form data, etc.

### Known Limitations
1. **Dev Server**: Service Worker doesn't run in dev mode (by design)
2. **iOS Safari Limits**: PWAs have some limitations vs native apps
3. **Storage Quota**: localStorage limited to ~5-10MB
4. **Camera Permission**: May need re-request after suspension

## Troubleshooting

### Issue: Still getting "Not Found" errors
**Solution:**
- Make sure you're testing with production build (`npm run preview`)
- Service Worker only works in production mode
- Check browser console for SW registration errors

### Issue: Service Worker not registering
**Solution:**
- Only works in production build (not `npm run dev`)
- Requires HTTPS in production (HTTP is OK for localhost)
- Check browser console for errors
- Try unregistering: DevTools > Application > Service Workers > Unregister

### Issue: PWA won't install on iPhone
**Solution:**
- Must use Safari (not Chrome) for PWA installation
- Check manifest.json is accessible: `http://IP:4173/manifest.json`
- Ensure all required fields in manifest are valid

### Issue: App still crashes after suspension
**Solution:**
- Check localStorage isn't corrupted
- Clear browser cache and reload
- Check Error Boundary is rendering correctly
- Look for console errors before crash

### Issue: Camera stops working after suspension
**Solution:**
- iOS may revoke camera permission after long suspension
- User needs to refresh page or grant permission again
- This is an iOS security limitation

## Android vs iOS: Persistence Comparison

| Feature | iOS (iPhone/iPad) | Android |
|---------|------------------|---------|
| **Tab Suspension** | ⚠️ Very aggressive (~30s) | ✅ Moderate (~5-10 min) |
| **Dev Server Tolerance** | ❌ Poor (HMR drops quickly) | ✅ Good (reconnects well) |
| **Production Build** | ✅ Excellent with SW | ✅ Excellent with SW |
| **PWA Installation** | 🟡 Safari only, manual | ✅ Chrome auto-prompt |
| **PWA Persistence** | ✅ Good (better than tab) | ✅ Excellent |
| **Background Tabs** | ❌ Kills quickly | ✅ Keeps longer |
| **WebSocket Stability** | ❌ Drops immediately | ✅ More resilient |
| **Memory Management** | ⚠️ Aggressive | ✅ Balanced |
| **Camera Permission** | ⚠️ May revoke | ✅ Persists |
| **Overall Experience** | 🟡 Requires workarounds | ✅ Generally smoother |

**Verdict:**
- **Android:** You'll likely have **fewer persistence problems**, especially in Chrome. Dev server may even work acceptably for testing.
- **iOS:** Requires production build + PWA installation for best experience. More strict about tab suspension.
- **Both:** Service Worker + PWA setup (already implemented) ensures excellent experience on both platforms.

## Summary

**Before these changes:**
- ❌ "Not Found" errors on mobile (especially iOS)
- ❌ Mysterious `.txt` downloads
- ❌ Lost state after switching apps
- ❌ Poor mobile persistence

**After these changes:**
- ✅ Works offline with Service Worker
- ✅ Survives tab suspension (iOS & Android)
- ✅ Can be installed as PWA (both platforms)
- ✅ Graceful error recovery
- ✅ Professional mobile experience
- ✅ **Android users will have smoother experience out-of-the-box**
- ✅ **iOS users protected with proper PWA setup**

**Key Takeaways:**
1. **Android:** Generally works better in browser tabs, less aggressive suspension
2. **iOS:** Use production build (`npm run build` + `npm run preview`) and install as PWA for best results
3. **Both:** Service Worker and PWA features only work in production mode (not dev server)
4. **Best Practice:** Test on both platforms, but Android will be more forgiving during development
