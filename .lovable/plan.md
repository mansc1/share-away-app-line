

## Plan: Add migration + auto-revoke in join-trip

### Step 1: Database Migration
Add two columns to `trip_invites`:
```sql
ALTER TABLE public.trip_invites
  ADD COLUMN IF NOT EXISTS revoked_at timestamptz,
  ADD COLUMN IF NOT EXISTS revoked_reason text;
```

### Step 2: Update `join-trip` Edge Function
After the successful member insert (line ~145), add auto-revoke logic:
1. Re-count members for the trip
2. If `count >= trip.capacity_total`, bulk-revoke all active invites:
```typescript
const { count: newCount } = await supabase
  .from("trip_members")
  .select("id", { count: "exact", head: true })
  .eq("trip_id", trip.id);

if (newCount !== null && newCount >= trip.capacity_total) {
  await supabase
    .from("trip_invites")
    .update({
      status: "revoked",
      revoked_at: new Date().toISOString(),
      revoked_reason: "capacity_full",
    })
    .eq("trip_id", trip.id)
    .eq("status", "active");
}
```

### Files changed
- **Migration**: 1 SQL file (add `revoked_at`, `revoked_reason` to `trip_invites`)
- **Edge Function**: `supabase/functions/join-trip/index.ts` — add ~12 lines after member insert

