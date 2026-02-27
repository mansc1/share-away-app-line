

## Plan: Extract PersonAvatar + Add to ExpenseCard

### Step 1: Create `src/components/shared/PersonAvatar.tsx`
Extract from `PaymentCard.tsx` into a shared component with size prop (`sm`/`md`/`lg` mapping to w-6/w-8/w-12), `name`, and optional `className`. Uses `useTrip().getAvatarForName`, `useState` for error fallback, emoji via `getPersonAvatar`.

### Step 2: Update `src/components/PaymentCard.tsx`
- Remove inline `PersonAvatar` and `PersonAvatarProps` interface (lines ~14-41)
- Import from `@/components/shared/PersonAvatar`
- Map existing usage: `sizeClass="w-12 h-12"` → `size="lg"`, `sizeClass="w-8 h-8"` → `size="md"`

### Step 3: Update `src/components/pages/details/ExpenseCard.tsx`
- Import `PersonAvatar` from shared
- Replace the "จ่ายโดย" section (around line 119-123) with right-aligned layout showing name + avatar below:
```
<div className="text-right">
  <div className="text-xs text-gray-500">จ่ายโดย {expense.paidBy}</div>
  <div className="mt-1 flex justify-end">
    <PersonAvatar name={expense.paidBy} size="sm" />
  </div>
</div>
```

### Files
1. `src/components/shared/PersonAvatar.tsx` (new)
2. `src/components/PaymentCard.tsx` (remove inline, import shared)
3. `src/components/pages/details/ExpenseCard.tsx` (add avatar below payer name)

