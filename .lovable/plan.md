

## Plan: Smart post-login routing based on active trip

### Change: `src/pages/LineCallbackPage.tsx`

After successful token exchange (line 53), replace the current redirect logic (lines 54-56) with:

1. Read and immediately remove `post_login_redirect` from localStorage
2. If a redirect path exists → navigate there directly (unchanged behavior)
3. If no redirect path → call `get-active-trip` with the new session token
   - If trip exists → navigate to `/app`
   - If no trip → navigate to `/trip/new`
   - If fetch fails → fallback to `/app`

All within the existing `exchange` async function, no new components or hooks needed. Single trip check, no loop risk.

