# 📱 Quick Mobile Testing Guide

## TL;DR - Will Android have persistence problems?

**Short Answer:** **No, Android is much better than iOS.** Android Chrome keeps tabs alive 5-10x longer and handles background suspension more gracefully.

## Quick Comparison

| Issue | iOS | Android |
|-------|-----|---------|
| **Tab suspension** | 😱 ~30 seconds | 😊 ~5-10 minutes |
| **Dev server** | ❌ Breaks easily | ✅ Usually fine |
| **"Not Found" errors** | ⚠️ Common | ✅ Rare |
| **WebSocket (HMR)** | ❌ Drops fast | ✅ Reconnects well |
| **PWA install** | 🟡 Manual (Safari) | ✅ Auto-prompt |

## Recommendations by Platform

### 🍎 iOS Testing (iPhone/iPad)
```bash
# MUST use production build
npm run build
npm run preview
```
- Access: `http://YOUR_IP:4173`
- **Install as PWA** (Safari → Share → Add to Home Screen)
- Dev server won't work well

### 🤖 Android Testing
```bash
# Dev server usually works fine
npm run dev
```
- Access: `http://YOUR_IP:5173`
- Dev server is acceptable for testing
- Production build still recommended for final testing
- Install as PWA from Chrome menu

## Solutions Already Implemented ✅

The following features protect **both iOS and Android**:

1. **Service Worker** - Offline caching, SPA fallback
2. **PWA Manifest** - Install as home screen app
3. **Error Boundary** - Graceful error recovery
4. **Page Visibility Hook** - Detects suspension
5. **Improved Vite Config** - Better HMR handling

All these work in production mode (`npm run build`).

## Quick Start

### For Development (Android OK, iOS not recommended)
```bash
npm run dev
# Access from phone: http://YOUR_COMPUTER_IP:5173
```

### For Testing (Both platforms)
```bash
npm run build && npm run preview
# Access from phone: http://YOUR_COMPUTER_IP:4173
```

### For Production (Best experience)
```bash
npm run build
# Deploy to Netlify/Vercel
# Get HTTPS URL for full features (camera, clipboard)
```

## What Problems You'll Actually Experience

### Android Chrome
- ✅ **Very few problems** with dev server
- ✅ Tabs stay alive 5-10 minutes
- ✅ HMR reconnects automatically
- ✅ Good memory management
- ⚠️ Low-end devices may have issues

### iOS Safari/Chrome
- ❌ **Lots of problems** with dev server
- ❌ Tabs die after 30 seconds
- ❌ "Not Found" errors common
- ❌ `.txt` file downloads
- ✅ **Fixed with production build + PWA**

## Bottom Line

**Android:** You're mostly fine, even with dev server. Production build is better but not critical.

**iOS:** You **need** production build + PWA installation for acceptable experience.

**Both:** The solutions we implemented (Service Worker, PWA, Error Boundary) work great on both platforms.

---

The older iOS persistence guide was written when localStorage was the database; it has been retired to [`legacy/docs/ios-persistence-guide.md`](../../legacy/docs/ios-persistence-guide.md). For behavior that still applies, see [`android-ios-compatibility.md`](android-ios-compatibility.md).
