

## Plan: Debug LINE Login — Better Error Reporting

### Problem
The `auth-line-callback` edge function returns generic `internal_error` messages. The logs show `No matching key found in LINE JWKS` errors, but the frontend only displays "Login failed: internal_error" with no actionable details.

### Changes

#### 1. Edge Function: `supabase/functions/auth-line-callback/index.ts`

**Improve error handling in token exchange (around line 107-120):**
- When `tokenRes` fails, parse the response as JSON and return `line_status`, `line_error`, `line_error_description`, and `redirect_uri_used` in the error response.

**Improve error handling in id_token verification (around line 134):**
- Wrap `verifyIdToken()` call in its own try/catch.
- Return the specific error message (e.g., "No matching key found in LINE JWKS") in the response JSON.

**Improve the outer catch block (around line 172-177):**
- Return `err.message` in the response instead of just `"internal_error"`.

**Log the redirect_uri being used** for debugging.

#### 2. Frontend: `src/pages/LineCallbackPage.tsx`

**Enhance error display (around line 37-39):**
- When the edge function returns error JSON with `details`, parse and display all fields: `line_status`, `line_error`, `line_error_description`, `redirect_uri_used`, and `message`.
- Show a more detailed error card instead of just the error code string.

### Technical Details

The key error from logs is `No matching key found in LINE JWKS` — this means the JWT `kid` header doesn't match any key from `https://api.line.me/oauth2/v2.1/certs`. This could indicate:
- LINE rotated their JWKS keys between the token being issued and verification
- A caching issue
- The id_token's `kid` is using a different algorithm

The improved error reporting will surface the exact failure point so we can diagnose further.

