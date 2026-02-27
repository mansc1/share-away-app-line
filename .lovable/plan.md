

## Adjusted Plan: Admin Trip Actions Menu (Archive & Cancel)

### Hardened DB Migration

Use a `DO` block to discover and drop the actual CHECK constraint name dynamically, then recreate with the expanded set:

```sql
DO $$
DECLARE
  _con_name text;
BEGIN
  SELECT c.conname INTO _con_name
    FROM pg_constraint c
    JOIN pg_attribute a ON a.attnum = ANY(c.conkey) AND a.attrelid = c.conrelid
   WHERE c.conrelid = 'public.trips'::regclass
     AND c.contype = 'c'
     AND a.attname = 'status';

  IF _con_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.trips DROP CONSTRAINT %I', _con_name);
  END IF;
END $$;

ALTER TABLE public.trips ADD CONSTRAINT trips_status_check
  CHECK (status IN ('open','confirmed','archived','cancelled'));

ALTER TABLE public.trips ADD COLUMN IF NOT EXISTS archived_at timestamptz;
ALTER TABLE public.trips ADD COLUMN IF NOT EXISTS cancelled_at timestamptz;
```

### New Edge Functions

**`archive-trip`** and **`cancel-trip`** — same pattern:
- Strict CORS origin allowlist (published + preview URLs)
- LINE session auth + admin check
- Reject if status already `archived`/`cancelled`
- Set status + timestamp, clear `user_active_trip` rows

### Update Existing Edge Functions

- **join-trip** (line 97): reject `archived`/`cancelled` with `{ code: "trip_closed" }` (410)
- **add-capacity**: add status check after trip fetch to reject `archived`/`cancelled` (410)
- **confirm-trip** (line 83): change `if (trip.status !== "open")` to also explicitly return `trip_closed` (410) for `archived`/`cancelled`, keeping the existing `invalid_status` for other non-open states

### New Frontend Component

**`src/components/TripActionsMenu.tsx`**
- DropdownMenu with ⚙️ trigger, replaces current Settings button in AppHeader
- Items: "จัดการทริป" → navigate, "จบทริป" → archive AlertDialog, "ยกเลิกทริป" → cancel AlertDialog (type trip name or "ยกเลิก" to confirm)
- On success: toast + navigate `/trip/new`

### Update `src/components/AppHeader.tsx`
- Replace Settings icon button with `<TripActionsMenu />` for admins

### Files
1. DB migration (DO block + constraint + columns)
2. `supabase/functions/archive-trip/index.ts` (new)
3. `supabase/functions/cancel-trip/index.ts` (new)
4. `supabase/functions/join-trip/index.ts` (reject archived/cancelled)
5. `supabase/functions/add-capacity/index.ts` (reject archived/cancelled)
6. `supabase/functions/confirm-trip/index.ts` (explicit trip_closed for archived/cancelled)
7. `src/components/TripActionsMenu.tsx` (new)
8. `src/components/AppHeader.tsx` (integrate menu)

