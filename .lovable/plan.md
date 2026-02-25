

## Analysis

This project uses **Vite + React Router DOM** (not Remix file-based routing). There is no `app/routes/` directory — routing is handled in `src/App.tsx` with `<BrowserRouter>` and `<Routes>`. The plan adapts the user's intent to the actual architecture.

## Plan

### 1. Create Landing Page component
**New file: `src/pages/LandingPage.tsx`**

A minimalist landing page with:
- **Header**: "TripSplit" text logo + "Sign in" outline button
- **Hero**: Thai title, subtitle, green "เริ่มทริปด้วย LINE" CTA (`href="/auth/line/start"`), and smaller outline "เข้าแอป (ทดสอบ)" button (`href="/app"`)
- **Feature Cards**: 3 cards using shadcn Card component (rounded-xl, minimal shadow)
- **How It Works**: 3 steps with Lucide icons (User, QrCode, Wallet)
- **Final CTA**: Repeat green button
- **Footer**: "© 2026 TripSplit"

All styled with Tailwind: white background, large typography, generous whitespace, green primary CTA only, mobile-first.

### 2. Update routing in `src/App.tsx`

```text
Current:
  "/" → Index → ExpenseApp

New:
  "/"    → LandingPage
  "/app" → Index (ExpenseApp)
  "*"    → NotFound
```

- Import `LandingPage` and add route for `"/"`
- Move existing `Index` route to `"/app"`

### 3. No other changes

- `ExpenseApp` component stays untouched
- `src/pages/Index.tsx` stays untouched (still renders ExpenseApp)
- No auth logic added
- No internal navigation changes

### Technical Details

- Uses `Link` from react-router-dom for the "/app" test button
- Uses `<a>` tags for "/auth/line/start" links (external/future route)
- Lucide icons: `User`, `QrCode`, `Wallet`
- shadcn components: `Card`, `CardContent`, `Button`

