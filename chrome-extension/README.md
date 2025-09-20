# DIGIPIN Tools Chrome Extension

A Chrome extension for encoding and decoding DIGIPINs with right-click context menu support.

## Features

- **Encode**: Convert latitude/longitude coordinates to DIGIPIN
- **Decode**: Convert DIGIPIN back to coordinates
- **Context Menu**: Right-click on selected coordinates to convert them
- **History**: Track recent conversions
- **Google Maps Integration**: Open decoded coordinates in Google Maps
- **Clipboard Support**: Automatic copying of results

## Development

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Generate icons:
   - Open `create-icons.html` in a browser
   - Download the three icon files (16x16, 48x48, 128x128)
   - Save them to `public/icons/` folder

3. Build the extension:
   ```bash
   npm run build
   ```

### Loading in Chrome

1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top right)
3. Click "Load unpacked"
4. Select the `dist/` folder from this project

## Usage

### Popup Interface
- Click the extension icon to open the popup
- Enter coordinates to encode or DIGIPIN to decode
- Results are automatically copied to clipboard

### Context Menu
- Select coordinates on any webpage (e.g., "28.6139,77.2090")
- Right-click and choose "Convert to DIGIPIN"
- The result is copied to clipboard and shown in a notification

### Building for Distribution

Create a ZIP file for Chrome Web Store:
```bash
npm run zip
```

This creates `digipin-extension.zip` in the parent directory.

## Project Structure

```
chrome-extension/
├─ public/
│  ├─ icons/          # Extension icons
│  └─ manifest.json   # Chrome extension manifest
├─ src/
│  ├─ background.ts   # Service worker (context menus, notifications)
│  ├─ content.ts      # Content script (future use)
│  └─ popup/          # Popup UI components
├─ tsconfig.json      # TypeScript configuration
├─ vite.config.ts     # Build configuration
└─ package.json       # Dependencies and scripts
```

## Dependencies

- `digipinjs`: Core DIGIPIN encoding/decoding library
- `react`: UI framework for popup interface
- `vite`: Build tool and development server
- `@types/chrome`: TypeScript definitions for Chrome APIs 