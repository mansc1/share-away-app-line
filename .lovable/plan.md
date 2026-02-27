

## Realtime Sync for Expenses — Implementation Plan

### Step 1: DB Migration
Enable realtime on the `expenses` table:
```sql
ALTER PUBLICATION supabase_realtime ADD TABLE public.expenses;
```
No RLS changes needed — public SELECT policy already exists.

### Step 2: Update `src/hooks/useExpenses.ts`
- Add `useRef` to imports
- Add `debounceRef` for 300ms debounce timer
- Add new `useEffect` after the existing fetch effect:
  - Guard on `activeTripId`
  - Subscribe to `postgres_changes` on `expenses` filtered by `trip_id=eq.${activeTripId}`
  - On any event: debounced `fetchExpenses()` (300ms)
  - Cleanup: clear timer + remove channel

### Step 3: No other changes
Keep all optimistic updates as-is.

