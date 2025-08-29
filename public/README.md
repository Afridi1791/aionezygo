# Public Assets

This folder contains static assets that are served directly by the web server.

## Files

- **`favicon.ico`** - Browser favicon (placeholder)
- **`logo.svg`** - App logo in SVG format
- **`logo.png`** - App logo in PNG format (placeholder)
- **`manifest.json`** - Web app manifest for PWA support
- **`robots.txt`** - Search engine crawling instructions

## Usage

These files are automatically served from the root URL. For example:
- `/logo.svg` serves the SVG logo
- `/manifest.json` serves the web app manifest
- `/favicon.ico` serves the favicon

## Adding New Assets

1. Place new static files in this folder
2. Reference them in your code using absolute paths (e.g., `/new-asset.png`)
3. Update the manifest.json if adding new icons

## Notes

- Replace placeholder files (favicon.ico, logo.png) with actual assets
- The SVG logo is a simple placeholder - replace with your actual logo
- All files in this folder are publicly accessible
