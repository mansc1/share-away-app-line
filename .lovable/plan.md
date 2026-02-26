

## Plan: Create get-invite-info + Update JoinTripPage

### 1. Create `supabase/functions/get-invite-info/index.ts`
- POST, no auth required
- Accepts `{ token }`
- Lookup `trip_invites` by token; 404 if not found; 410 `invite_revoked` if status != 'active'
- Join `trips`; 410 `trip_closed` if status == 'archived'
- Count `trip_members` → `member_count`, compute `is_full`
- Query admin name (`role='admin'`, order `joined_at asc`, limit 1) → nullable
- Return `{ trip, admin_name, member_count, is_full }`

### 2. Update `supabase/config.toml`
- Add `[functions.get-invite-info]` with `verify_jwt = false`

### 3. Rewrite `src/pages/JoinTripPage.tsx`
- On mount, fetch `get-invite-info` with token (no auth)
- States: `tripInfo`, `inviteError` (code string), `loadingInfo`
- Loading: Card with Skeleton placeholders
- Error states: `invalid_invite`/`invite_revoked` → "ลิงก์เชิญไม่ถูกต้อง" + link to `/`; `trip_closed` → "ทริปนี้ปิดแล้ว" + link to `/`
- Valid trip info shown to all users (including unauthenticated)
- If `is_full`: show trip info + "ทริปเต็มแล้ว", disable join button
- If not authenticated: show trip info + LINE login button (no join form)
- If authenticated + not full: show trip info + name input + join button
- Join button disabled while `joining=true`

