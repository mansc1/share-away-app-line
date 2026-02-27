

## Investigation Results

The realtime subscription code in `TripContext.tsx` is correct (filters by `trip_id`, subscribes only after `activeTripId` is available). However, two infrastructure issues prevent it from working:

### Problem 1: `trip_members` not in Realtime publication
The table must be added to `supabase_realtime` publication for postgres_changes events to fire.

### Problem 2: No SELECT RLS policy on `trip_members`
RLS is enabled but there are zero policies. The Supabase realtime client uses the anon key, so it needs a SELECT policy to receive change events. Since this app uses custom LINE auth (not Supabase Auth), `auth.uid()` isn't applicable — a public SELECT policy is needed (matching the pattern already used on the `expenses` table).

### Fix (single SQL migration)

```sql
-- Enable realtime for trip_members
ALTER PUBLICATION supabase_realtime ADD TABLE public.trip_members;

-- Allow anon/authenticated to SELECT (needed for realtime subscription)
CREATE POLICY "Allow public select on trip_members"
  ON public.trip_members
  FOR SELECT
  USING (true);
```

### Files changed
- Database migration only. No code changes needed.

