# Charly Illustration Integration

## Overview
Added Charly's illustration (4 characters with bow ties) to the **bottom right corner** of all generated ticket PNGs/SVGs.

## Files Modified

### 1. `src/utils/base64Cleaner.js` ✨ NEW
- **Purpose**: Clean and validate base64 data from files
- **Key Functions**:
  - `cleanBase64(rawData)` - Removes data URI prefixes and whitespace
  - `isValidBase64(str)` - Validates base64 alphabet
  - `cleanAndValidateBase64(rawData)` - Combined clean + validate
  - `toDataURI(base64Data, mimeType)` - Convert base64 to data URI
  - `extractMimeType(dataURI)` - Extract MIME type from data URI

**Fixed Issue**: The original `dibujosCharly64.txt` had a `data:image/jpeg;base64,` prefix which caused the API error `invalid base64 data`. This utility strips that prefix and validates the data.

### 2. `mockups/dibujosCharly64.txt` 🧹 CLEANED
- **Before**: 167,095 characters with data URI prefix
- **After**: 167,072 characters of pure base64
- **Validation**: ✅ All characters are valid base64 (A-Z, a-z, 0-9, +, /, =)

### 3. `src/utils/svgTicketTemplate.js` 🎨 ENHANCED
**Changes**:
- Imported `cleanBase64` from `base64Cleaner.js`
- Added module-level variable `charlyIllustration` to store the loaded image
- Created `loadCharlyIllustration(base64Data)` export function to initialize the image
- Added illustration positioning logic:
  ```javascript
  const illustrationWidth = 100;  // Adjustable
  const illustrationHeight = 60;  // Maintains aspect ratio
  const illustrationX = ticketWidth - illustrationWidth - 10;  // 10px from right
  const illustrationY = totalHeight - illustrationHeight - 10; // 10px from bottom
  ```
- Embedded illustration in SVG template with opacity 0.9:
  ```xml
  <image x="${illustrationX}" y="${illustrationY}"
         width="${illustrationWidth}"
         height="${illustrationHeight}"
         href="data:image/jpeg;base64,${charlyIllustration}"
         preserveAspectRatio="xMidYMid meet"
         opacity="0.9"/>
  ```

### 4. `src/utils/loadAssets.js` ✨ NEW
- **Purpose**: Initialize app assets at startup
- **Key Functions**:
  - `initializeAssets()` - Fetches illustration from `/public/mockups/` and loads it
  - `initializeAssetsFromImport(base64String)` - Alternative for bundled imports
- **Error Handling**: Graceful fallback - app works without illustration if loading fails

### 5. `src/App.jsx` 🔧 UPDATED
- Added `useEffect` hook to call `initializeAssets()` on mount
- Ensures illustration is loaded before any tickets are generated

### 6. `public/mockups/dibujosCharly64.txt` 📁 NEW
- Copied cleaned base64 file to public folder for runtime fetching
- Accessible via `/mockups/dibujosCharly64.txt` URL

## How It Works

### Initialization Flow
1. **App starts** → `App.jsx` mounts
2. **useEffect triggers** → `initializeAssets()` called
3. **Fetch image** → Loads `/mockups/dibujosCharly64.txt`
4. **Clean & store** → `loadCharlyIllustration()` processes and stores base64
5. **Ready** → All ticket generation includes the illustration

### Ticket Generation Flow
1. **User creates ticket** → `QRDisplay` component renders
2. **SVG generated** → `generateTicketSVG()` called
3. **Illustration check** → If `charlyIllustration` exists, add to SVG
4. **Position** → Bottom right corner (10px margins)
5. **Export** → PNG/SVG includes the illustration

## Customization

### Adjust Illustration Size
Edit `src/utils/svgTicketTemplate.js`:
```javascript
const illustrationWidth = 120;  // Change width (default: 100)
const illustrationHeight = 72;  // Change height (default: 60)
```

### Adjust Illustration Position
```javascript
const illustrationX = ticketWidth - illustrationWidth - 20; // More margin
const illustrationY = totalHeight - illustrationHeight - 5;  // Less margin
```

### Change Opacity
```javascript
opacity="0.7"  // More transparent (default: 0.9)
```

### Replace Illustration
1. Place new base64 image in `public/mockups/newImage64.txt`
2. Update `src/utils/loadAssets.js`:
   ```javascript
   const response = await fetch('/mockups/newImage64.txt');
   ```

## Testing

### Verify Illustration Loads
1. Open browser console
2. Look for: `✓ Assets loaded successfully`
3. If missing, check:
   - File exists at `public/mockups/dibujosCharly64.txt`
   - No CORS errors in console
   - Base64 data is valid

### Verify Illustration Appears on Ticket
1. Create a test ticket
2. Click "Copy PNG" or "Copy SVG"
3. Paste into image editor
4. Check bottom right corner for 4 characters illustration

## Troubleshooting

### Illustration Not Showing
- **Check console**: Look for asset loading errors
- **Verify file**: Ensure `public/mockups/dibujosCharly64.txt` exists
- **Clear cache**: Hard refresh browser (Ctrl+Shift+R)
- **Check base64**: File should start with `/9j/4Q...` (JPEG signature)

### API Error "invalid base64 data"
- **Use cleaner**: Always pass base64 through `cleanBase64()` before sending to APIs
- **Check prefix**: Ensure no `data:image/...;base64,` prefix
- **Validate**: Use `isValidBase64()` to check validity

### Performance Issues
- **Large file**: 167KB base64 is loaded once at startup
- **Memory**: Stored in module scope, shared across all tickets
- **Optimization**: Consider compressing image or reducing dimensions

## Benefits

✅ **Branding**: Every ticket includes Charly's illustration
✅ **Automatic**: No manual work needed per ticket
✅ **Configurable**: Easy to adjust size, position, opacity
✅ **Graceful**: App works even if illustration fails to load
✅ **Efficient**: Image loaded once, reused for all tickets
✅ **Clean**: Proper base64 validation prevents API errors

## Future Enhancements

- 🎯 Allow users to upload custom illustrations via UI
- 🎨 Support multiple illustrations (random selection)
- 📐 Auto-calculate optimal size based on ticket dimensions
- 🖼️ Add border/shadow effects to illustration
- 💾 Cache illustration in localStorage for offline use
