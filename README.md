# School Lost & Found (FBLA Demo)

A fast, accessible, mobile-first Lost & Found website built for the FBLA Website Coding & Development event. 

## Highlights
- Accessible by default: semantic HTML, ARIA, keyboard-friendly, high contrast.
- Core features: search, filters (category/status/date), sort, item details, claim flow, report flow with validation.
- Admin demo: toggle to mark claimed/unclaimed and delete items (local-only).
- Performance: minimal JS, lazy images, PWA with offline caching.
- Privacy: no server or tracking; everything stays in the browser for the demo.

## Quick Start
Open `index.html` directly in your browser. For PWA and service worker to work, serve via a local server (or VS Code Live Server).

### Optional local server (Windows PowerShell)
```powershell
# If you have Python installed
python -m http.server 5500
# Then open http://localhost:5500/
```

Or use VS Code "Live Server" extension and click "Go Live".

## How it works
- Items are stored in `localStorage` under `lf_items_v1`.
- On first run, the app seeds 8 sample items.
- Reporting a found item lets you add a photo (stored as a DataURL) and metadata.
- Claiming an item captures contact info and marks the item as claimed.
- The Admin toggle (footer) unlocks mark/delete actions.

## Accessibility
- Landmarks: header, nav, main, sections, footer.
- Skip link, focusable main, aria-live results count, properly labeled forms.
- Keyboard-friendly dialogs and controls.

## Structure
- `index.html` – main app
- `styles/main.css` – responsive, accessible styles
- `scripts/app.js` – functionality and persistence
- `sw.js` – service worker for offline caching
- `manifest.webmanifest` – PWA manifest
- `assets/logo.svg` – logo icon
- `admin.html` – manager-only admin portal
- `scripts/admin.js` – admin portal logic
- `server/` – Node/Express API + MongoDB (for production)

## Rubric mapping (summary)
- Technical implementation: clean structure, modular JS, no frameworks, PWA.
- UX/UI: clear hierarchy, mobile-first grid, consistent design system.
- Accessibility: WCAG-informed patterns (roles, labels, contrast).
- Content: About, Contact, instructions on reporting/claiming.
- Documentation: this README with setup and decisions.

## Future improvements
- Real backend with moderation queue and email notifications.
- Image optimization and CDN.
- Auth for staff and students.
- Audit with Lighthouse and axe and iterate.

## Admin + MongoDB backend (production)
This repo includes an optional Node/Express backend to use MongoDB for storage and a protected admin portal with a shared password (demo). Replace the demo password with an environment variable and rotate it regularly—or use proper accounts.

