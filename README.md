# Share Away App LINE

Trip expense sharing app for LINE groups. Users sign in with LINE, create trips, invite friends, track shared expenses, and settle trip balances in THB.

## What works today

- LINE login via OAuth callback and LIFF session bootstrap
- Create a trip with destination country and default expense currency
- Invite members with share link / QR flow
- Join trip from invite link
- Manage members, confirm trip roster, and increase capacity
- Add, edit, delete, and convert expenses to THB
- Generate settlement payments and track `pending -> paid -> confirmed`
- Switch between multiple trips
- AI expense chat assistant

## Stack

- Vite + React + TypeScript
- Tailwind + shadcn/ui
- Supabase Edge Functions + Postgres
- LINE Login + LIFF

## Local setup

1. Install dependencies:

```bash
npm install
```

2. Create `.env` for the web app:

```bash
VITE_SUPABASE_URL=https://<your-project>.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<your-anon-key>
VITE_SUPABASE_PROJECT_ID=<your-project-id>
VITE_LIFF_ID=<your-line-liff-id>
VITE_LINE_BOT_ADD_FRIEND_URL=https://line.me/R/ti/p/<bot-id>
VITE_APP_BASE_URL=http://localhost:5173
```

3. Set Supabase Edge Function secrets:

```bash
SUPABASE_URL=https://<your-project>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
LINE_CHANNEL_ID=<line-login-channel-id>
LINE_CHANNEL_SECRET=<line-login-channel-secret>
LINE_REDIRECT_URI=http://localhost:5173/auth/line/callback
APP_BASE_URL=http://localhost:5173
LOVABLE_API_KEY=<optional-ai-key>
```

4. Make sure your LINE Login channel allows the callback URL you configured in `LINE_REDIRECT_URI`.

5. Start the app:

```bash
npm run dev
```

## Supabase notes

- Custom app auth is handled by LINE session tokens stored in `line_sessions`
- Edge functions in [supabase/config.toml](/Users/man/Desktop/share-away-app-line/supabase/config.toml) use `verify_jwt = false` because requests are authorized with the custom LINE session token, not Supabase Auth JWTs
- Expense and payment reads now go through edge functions instead of direct public table access
- Apply the latest migrations before testing or deploying, including [20260401100000_harden_expense_and_payment_access.sql](/Users/man/Desktop/share-away-app-line/supabase/migrations/20260401100000_harden_expense_and_payment_access.sql)

## Commands

```bash
npm run dev
npm run lint
npm run build
```

For Deno-based function tests:

```bash
deno test supabase/functions --allow-env --allow-net
```

## Deploy checklist

1. Push latest frontend code
2. Deploy Supabase migrations
3. Deploy Supabase edge functions
4. Set all function secrets
5. Confirm LINE callback URL and LIFF ID match the deployed domain
6. Smoke test:
   - LINE login
   - create trip
   - invite/join
   - add expense
   - convert to THB
   - create payment settlement
   - mark paid / confirm paid
   - switch active trip

## Known follow-ups

- The production bundle is still large and should be split further
- Realtime updates were reduced in favor of secured read paths through edge functions
- Some ESLint warnings remain in shared shadcn/context files, but `lint` and `build` now pass
