

## Architecture Reality Check

This project is **NOT Remix** — it is a **Vite + React Router DOM SPA**. There are no server-side routes. All server-side logic must go through **backend functions** (Edge Functions). The plan below adapts LINE OAuth to this architecture.

Since edge functions run on a different domain than the app, **httpOnly cookies won't work cross-domain**. Instead, the callback function redirects back to the app with a short-lived auth code, which the app exchanges for a session token stored client-side.

---

## Plan

### 1. Secrets Required

The following secrets must be added before implementation:

| Secret | Description |
|--------|-------------|
| `LINE_CHANNEL_ID` | From LINE Developers Console |
| `LINE_CHANNEL_SECRET` | From LINE Developers Console |
| `SESSION_SECRET` | Random 64-char string for signing |

The redirect URI will be constructed dynamically from `SUPABASE_URL` + `/functions/v1/auth-line-callback`.

---

### 2. Database Tables (Migration)

Two new tables, no changes to existing `expenses` table:

**A) `line_users`**
- `id` uuid PK default `gen_random_uuid()`
- `line_sub` text UNIQUE NOT NULL (LINE `id_token.sub`)
- `display_name` text
- `avatar_url` text
- `created_at` timestamptz default `now()`
- `updated_at` timestamptz default `now()`

**B) `line_sessions`**
- `id` uuid PK default `gen_random_uuid()`
- `session_token` text UNIQUE NOT NULL
- `user_id` uuid NOT NULL references `line_users(id)` ON DELETE CASCADE
- `expires_at` timestamptz NOT NULL
- `created_at` timestamptz default `now()`

**C) `auth_states`** (temporary CSRF store)
- `id` uuid PK default `gen_random_uuid()`
- `state` text UNIQUE NOT NULL
- `nonce` text NOT NULL
- `expires_at` timestamptz NOT NULL
- `created_at` timestamptz default `now()`

RLS: All tables have RLS enabled. Policies allow access only via `service_role` (edge functions use service role key). No anon access.

---

### 3. Edge Functions (4 functions)

**A) `auth-line-start`** (GET)
- Generates random `state` and `nonce`
- Stores them in `auth_states` table (expires in 10 min)
- Returns 302 redirect to LINE authorize URL:
  ```
  https://access.line.me/oauth2/v2.1/authorize
  ?response_type=code&client_id=...&redirect_uri=...&scope=openid%20profile&state=...&nonce=...
  ```

**B) `auth-line-callback`** (GET)
- Reads `code` and `state` from query params
- Validates `state` against `auth_states` table; deletes used state
- Exchanges code for tokens via POST to `https://api.line.me/oauth2/v2.1/token`
- Verifies `id_token` JWT:
  - Fetches JWKS from `https://api.line.me/oauth2/v2.1/certs`
  - Validates signature, `aud`, `exp`, and `nonce`
- Upserts user in `line_users` (by `line_sub`)
- Creates session in `line_sessions` (30-day expiry)
- Redirects to app: `<APP_URL>/app?session_token=<token>`

**C) `auth-me`** (GET)
- Reads `Authorization: Bearer <session_token>` header
- Looks up session in `line_sessions`, checks expiry
- Returns user JSON or 401

**D) `auth-logout`** (POST)
- Reads `Authorization: Bearer <session_token>` header
- Deletes session row from `line_sessions`
- Returns 200

---

### 4. Frontend Changes

**A) Auth context** — New `src/contexts/LineAuthContext.tsx`:
- On mount: check `localStorage` for session token, call `auth-me` to validate
- On `/app` load: check URL for `?session_token=`, store in localStorage, clean URL
- Provides: `user`, `loading`, `isAuthenticated`, `logout()`

**B) Landing page** — Update `src/pages/LandingPage.tsx`:
- "Sign in" button and "เริ่มทริปด้วย LINE" buttons: change `href` to point to edge function URL (`<SUPABASE_URL>/functions/v1/auth-line-start`)
- The redirect URI for LINE callback will be `<SUPABASE_URL>/functions/v1/auth-line-callback`

**C) App.tsx** — Wrap routes with `LineAuthProvider`

**D) Optional logout** — Add logout button in the app header that calls `auth-logout` edge function and clears localStorage

---

### 5. Auth Flow Diagram

```text
Browser                     Edge Function              LINE
  |                              |                       |
  |-- GET /auth-line-start ----->|                       |
  |                              |-- store state/nonce   |
  |<-- 302 to LINE authorize ----|                       |
  |                                                      |
  |-- User logs in on LINE ----------------------------->|
  |<-- 302 to /auth-line-callback?code=...&state=... ---|
  |                              |                       |
  |-- GET /auth-line-callback -->|                       |
  |                              |-- validate state      |
  |                              |-- POST token exchange |
  |                              |-- verify id_token     |
  |                              |-- upsert user         |
  |                              |-- create session      |
  |<-- 302 to /app?session_token=xxx ---|                |
  |                                                      |
  |-- App stores token in localStorage                   |
  |-- GET /auth-me (Bearer token) -->|                   |
  |<-- 200 { user } ----------------|                   |
```

---

### 6. Security

- **CSRF**: `state` parameter validated against DB (single-use, 10-min expiry)
- **Replay**: `nonce` validated in id_token (single-use via state deletion)
- **Token verification**: JWT signature verified against LINE JWKS, `aud` and `exp` checked
- **Session token**: crypto-random, stored server-side with expiry
- **LINE secrets**: never exposed to browser; all verification server-side
- **No anon access**: RLS blocks direct table access; only service role (edge functions) can read/write

---

### 7. What Does NOT Change

- `expenses` table and all existing expense logic untouched
- `ExpenseApp` component untouched
- Internal navigation within `/app` untouched
- Existing `AuthContext.tsx` (email/password) remains but unused for now

