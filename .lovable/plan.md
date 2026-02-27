

## Verification Report: Trip-Scoped Expenses Isolation

### Code Review Results

**Step 1-2: Clean state & Trip creation** — handled by TripContext + `/trip/new` flow. No issues found.

**Step 3: Add expenses in Trip A**
- **PASS** — `addExpense` (line 64) inserts `trip_id: activeTripId` on every new expense.

**Step 4: Archive Trip A**
- **PASS** — `archive-trip` edge function clears `user_active_trip`, TripActionsMenu navigates to `/trip/new`.

**Step 5: Create Trip B → empty expenses**
- **PASS** — `fetchExpenses` (line 26) filters `.eq('trip_id', activeTripId)`. New trip = new ID = no matching rows.

**Step 6: Switch back to Trip A**
- **N/A** — App currently has no UI to switch back to an archived trip. Would require manual DB update to `user_active_trip`.

**Step 7: DB-level assertions**
- **PASS** — Insert always includes `trip_id` (line 64). Fetch always filters by `trip_id` (line 26). The column is `NOT NULL` with FK constraint.

### Edge Cases

**A) Edit in Trip A not visible in Trip B**
- **PASS** — `updateExpense` updates by `id` only; fetch is scoped by `trip_id`, so Trip B never loads Trip A rows.

**B) Delete in Trip A not affecting Trip B**
- **PASS** — `deleteExpense` deletes by `id`; no cross-trip leakage possible.

**C) Block new expenses on archived/cancelled trip**
- **PARTIAL** — The DB does NOT have a trigger or constraint preventing inserts on archived trips. The UI doesn't check `trip.status` before allowing the add form. However, after archiving, `user_active_trip` is cleared → `activeTripId` becomes `null` → `addExpense` returns early (line 60). So in practice, blocked. But a race condition exists: if the user has the app open while another admin archives, they could still insert.

**D) Refetch on activeTripId change**
- **PASS** — `fetchExpenses` is in a `useCallback` with `[activeTripId]` dependency (line 57), and `useEffect` triggers on change (line 207-209). State resets to `[]` when `activeTripId` is null (line 17-19).

### Issues Found

1. **No UI guard for archived/cancelled trips** — The `AddExpenseForm` doesn't check `trip.status`. If a user somehow stays on `/app` after archiving (e.g., browser back), they could attempt to add expenses (insert would succeed at DB level since there's no trigger blocking it, though `activeTripId` would be null after refetch).

2. **No DB-level insert protection** — There is no trigger or RLS policy preventing expense inserts for archived/cancelled trips. This is a defense-in-depth gap.

### Recommended Fixes

1. **Add a validation trigger** on `expenses` INSERT that rejects if the referenced `trip.status` is `archived` or `cancelled`:

```sql
CREATE OR REPLACE FUNCTION reject_expense_on_closed_trip()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE trip_status text;
BEGIN
  SELECT status INTO trip_status FROM public.trips WHERE id = NEW.trip_id;
  IF trip_status IN ('archived', 'cancelled') THEN
    RAISE EXCEPTION 'Cannot add expenses to a closed trip';
  END IF;
  RETURN NEW;
END; $$;

CREATE TRIGGER trg_reject_expense_closed_trip
  BEFORE INSERT ON public.expenses
  FOR EACH ROW EXECUTE FUNCTION reject_expense_on_closed_trip();
```

2. **Frontend guard** in `useExpenses.addExpense`: check `trip.status` before inserting, show a toast if trip is closed.

3. **Disable AddExpenseForm** when `trip.status` is `archived` or `cancelled` — pass `isConfirmed` or a new `isClosed` flag.

### Implementation Steps

1. Run DB migration: create trigger `reject_expense_on_closed_trip` on `expenses` INSERT
2. Update `useExpenses.addExpense` to check `trip.status` and reject with toast if archived/cancelled
3. Update `AddExpenseForm` to disable the "+" button when trip status is archived/cancelled
4. Update `ExpenseApp` to pass trip status awareness to child components

### Summary

| Test | Result |
|------|--------|
| Expenses filtered by trip_id | PASS |
| Insert includes trip_id | PASS |
| New trip shows empty list | PASS |
| Edit/delete isolated | PASS |
| Refetch on trip change | PASS |
| Block insert on closed trip (UI) | PARTIAL — needs guard |
| Block insert on closed trip (DB) | FAIL — needs trigger |

