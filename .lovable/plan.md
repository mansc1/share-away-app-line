

## Plan: Add APP_BASE_URL Secret

Add the `APP_BASE_URL` secret with value `https://share-away-app-line.lovable.app` to the project. This secret is used by the `auth-line-start` and `auth-line-callback` edge functions to construct the correct `redirect_uri` for LINE OAuth.

### Action
- Use the secrets tool to add `APP_BASE_URL` = `https://share-away-app-line.lovable.app`

No code changes needed — the edge functions already reference `Deno.env.get("APP_BASE_URL")`.

