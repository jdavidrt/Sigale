/**
 * Asset loader for static resources
 * Loads Charly's illustration and other assets at app initialization
 */

import { loadCharlyIllustration } from './svgTicketTemplate';

/**
 * Initialize all assets needed for the application
 * Call this function once when the app starts
 */
export const initializeAssets = async () => {
  try {
    // Load Charly's illustration from the public assets
    // In production, you would fetch this from a static file or import it
    const response = await fetch('/mockups/dibujosCharly64.txt');
    const base64Data = await response.text();

    // Load the illustration into the SVG template
    loadCharlyIllustration(base64Data);

    console.log('✓ Assets loaded successfully');
  } catch (error) {
    console.warn('Failed to load assets:', error);
    // App continues to work without the illustration
  }
};

/**
 * Alternative: Load illustration from imported base64 string
 * Use this if you prefer to bundle the image with the app
 */
export const initializeAssetsFromImport = (base64String) => {
  try {
    loadCharlyIllustration(base64String);
    console.log('✓ Assets loaded from import');
  } catch (error) {
    console.warn('Failed to load assets from import:', error);
  }
};
