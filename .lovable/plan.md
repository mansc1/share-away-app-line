

## Problem

The screenshot shows a **404 error** when LINE redirects back to `https://share-away-app-line.lovable.app/auth/line/callback?code=...&state=...`. This is a classic **SPA routing issue** — the hosting server doesn't recognize `/auth/line/callback` as a valid path and returns 404 instead of serving `index.html`.

The React Router route exists in `App.tsx`, but the server never gets a chance to serve the SPA because it returns 404 for unknown paths.

## Solution

Add a `public/_redirects` file to configure the hosting server to serve `index.html` for all routes (SPA fallback). Lovable's hosting uses this file to handle client-side routing.

### File to create

**`public/_redirects`**
```
/*    /index.html   200
```

This single line tells the server: for any path that doesn't match a static file, serve `index.html` with a 200 status, allowing React Router to handle the route.

### No other changes needed
- `App.tsx` already has the correct route for `/auth/line/callback`
- `LineCallbackPage.tsx` already handles the OAuth exchange correctly

