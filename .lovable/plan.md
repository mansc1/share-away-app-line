## Plan: Server-side Expense Permissions

### Overview

Move expense create/update/delete from direct Supabase client calls to Edge Functions with server-side permission enforcement. UI shows/hides buttons as convenience only.

### Step 1: Database Migration

```sql
ALTER TABLE public.expenses
  ADD COLUMN IF NOT EXISTS created_by_user_id text,
  ADD COLUMN IF NOT EXISTS updated_by_user_id text,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();
```

All nullable — legacy rows stay `NULL`.

### Step 2: Create Edge Function `create-expense`

**File: `supabase/functions/create-expense/index.ts**`

- Authenticate via session token (same `authenticateUser` pattern as `create-trip`)
- Resolve `line_sub` from `line_users` table using the authenticated user's UUID
- Validate: user is a member of the trip (`trip_members` where `user_id = line_sub` and `trip_id`)
- Validate: trip status not `archived`/`cancelled`
- Insert expense with `created_by_user_id = line_sub`, `updated_by_user_id = line_sub`
- Return created expense

**Config: add `[functions.create-expense] verify_jwt = false**`

### Step 3: Create Edge Function `update-expense`

**File: `supabase/functions/update-expense/index.ts**`

- Authenticate user → get `line_sub`
- Fetch expense by ID, verify `expense.trip_id` matches request
- Permission check:
  - Get member role from `trip_members` (user_id = line_sub, trip_id)
  - Allow if `role = 'admin'`
  - Allow if `expense.created_by_user_id = line_sub`
  - If `expense.created_by_user_id IS NULL` → only admin can edit
  - Otherwise → 403 `{ code: "forbidden", message: "คุณไม่มีสิทธิ์แก้ไขรายจ่ายนี้" }`
- Update expense fields + set `updated_by_user_id = line_sub`, `updated_at = now()`
- This also handles convert-to-THB (same permission rules apply)

### Step 4: Create Edge Function `delete-expense`

**File: `supabase/functions/delete-expense/index.ts**`

- Same auth + permission check as update-expense
- Delete expense row
- Return success

### Step 5: Update `src/types/expense.ts`

Add to `Expense` interface:

```ts
createdByUserId?: string | null;
updatedByUserId?: string | null;
updatedAt?: string | null;
```

### Step 6: Update `src/hooks/useExpenses.ts`

- **fetchExpenses**: map `created_by_user_id`, `updated_by_user_id`, `updated_at` into Expense objects (read stays via Supabase client — public SELECT RLS is fine)
- **addExpense**: replace direct `supabase.insert()` with `supabase.functions.invoke('create-expense', { body: { trip_id, ...fields } })`
- **updateExpense**: replace `supabase.update()` with `supabase.functions.invoke('update-expense', { body: { expense_id, ...fields } })`
- **deleteExpense**: replace `supabase.delete()` with `supabase.functions.invoke('delete-expense', { body: { expense_id, trip_id } })`
- **convertExpenseToCurrency**: use `update-expense` edge function (same permission rules)
- Add `canModifyExpense(expense)` helper: returns `true` if `isAdmin` OR `expense.createdByUserId === currentUser.line_sub`; for `null` creator → only admin
- All invoke calls include `Authorization: Bearer ${sessionToken}` header

### Step 7: Update `src/components/pages/details/ExpenseCard.tsx`

- Add `canModify` prop (boolean)
- Conditionally render Edit/Delete buttons only when `canModify` is true
- "แปลงเป็นบาท" button follows same `canModify` rule (since it updates the expense)

### Step 8: Update `src/components/pages/DetailsPage.tsx`

- Import `useLineAuth` and `useTrip` to compute `canModify` per expense
- Pass `canModify` to each `ExpenseCard`

### Files Changed


| Action    | File                                            |
| --------- | ----------------------------------------------- |
| Migration | Add 3 columns to `expenses`                     |
| New       | `supabase/functions/create-expense/index.ts`    |
| New       | `supabase/functions/update-expense/index.ts`    |
| New       | `supabase/functions/delete-expense/index.ts`    |
| Edit      | `supabase/config.toml` (add 3 function entries) |
| Edit      | `src/types/expense.ts`                          |
| Edit      | `src/hooks/useExpenses.ts`                      |
| Edit      | `src/components/pages/details/ExpenseCard.tsx`  |
| Edit      | `src/components/pages/DetailsPage.tsx`          |


### Key Architecture Note

- **Read** (SELECT): stays via Supabase client (public RLS, realtime subscription unchanged)
- **Write** (INSERT/UPDATE/DELETE): routed through Edge Functions with session-based auth + server-side permission checks
- `line_sub` is the user identifier used in `trip_members.user_id` and `expenses.created_by_user_id` — Edge Functions resolve UUID → line_sub via `line_users` table  


Approve this plan, but add these 4 hardening requirements before implementation:

1) In create-expense, validate that payer and all shared members belong to the same trip_id.

2) In update-expense, validate expense.trip_id matches the request trip_id and validate any new payer/shared members also belong to that trip.

3) In update-expense and delete-expense, reject archived/cancelled trips with code trip_closed (410), same as other trip lifecycle rules.

4) Use the same strict CORS allowlist pattern as other verify_jwt=false edge functions.