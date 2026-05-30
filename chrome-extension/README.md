# Smart Tab Manager — Chrome Extension

A powerful tab management extension that groups tabs by domain, saves tab groups, detects duplicates, and lets you search across all open tabs.

## Features

- **Tab Groups by Domain** — See all open tabs organized by website
- **Save Tab Groups** — Bookmark your current session and restore it anytime
- **Duplicate Detection** — Automatically finds and highlights duplicate tabs
- **Tab Search** — Instantly filter tabs by title or URL
- **One-click close** — Close any tab without switching to it

## Loading in Chrome (Developer Mode)

1. Open Chrome → navigate to `chrome://extensions`
2. Enable **Developer Mode** (top-right toggle)
3. Click **Load unpacked**
4. Select this folder (`chrome-extension/`)
5. The Smart Tab Manager icon appears in your toolbar

## Publishing to Chrome Web Store

1. Zip this entire folder (excluding README)
2. Go to [chrome.google.com/webstore/devconsole](https://chrome.google.com/webstore/devconsole)
3. Pay the one-time $5 developer fee
4. Click **New Item** → upload the zip
5. Fill in the store listing, add screenshots, submit for review
6. Review typically takes 1-3 business days

## Monetization Plan

**Free tier** — all core features free to drive installs and reviews

**Pro tier** (via Patreon or Stripe link in popup):
- Sync saved groups across devices
- Auto-save session on close
- Tab usage statistics
- Keyboard shortcuts

## Files

| File | Purpose |
|---|---|
| `manifest.json` | Extension config (Manifest V3) |
| `popup.html` | Extension popup UI |
| `popup.js` | All popup logic |
| `background.js` | Service worker for duplicate detection |
