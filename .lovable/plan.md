## Plan: Admin Trip Actions Menu (Archive & Cancel) — IMPLEMENTED

### Completed Steps

1. **DB Migration** — DO block to discover/drop CHECK constraint dynamically, recreated with `('open','confirmed','archived','cancelled')`, added `archived_at` and `cancelled_at` columns.

2. **`supabase/functions/archive-trip/index.ts`** — CORS allowlist, LINE session auth, admin check, reject if already archived/cancelled, set status + timestamp, clear `user_active_trip`.

3. **`supabase/functions/cancel-trip/index.ts`** — Same pattern as archive-trip but sets `cancelled` status.

4. **Updated edge functions:**
   - `join-trip`: rejects archived/cancelled with `trip_closed` (410)
   - `add-capacity`: rejects archived/cancelled with `trip_closed` (410)
   - `confirm-trip`: explicit `trip_closed` (410) for archived/cancelled before existing `invalid_status` check

5. **`src/components/TripActionsMenu.tsx`** — DropdownMenu with ⚙️ trigger, "จัดการทริป" → navigate, "จบทริป" → archive AlertDialog, "ยกเลิกทริป" → cancel AlertDialog with text confirmation.

6. **`src/components/AppHeader.tsx`** — Replaced Settings button with `<TripActionsMenu />` for admins.
