

## Implementation Plan: LINE Avatar in PaymentCard

### Step 1: Update `get-trip-members` edge function
**File:** `supabase/functions/get-trip-members/index.ts`

- After fetching `trip_members`, collect all `user_id` values
- If list is non-empty, query `line_users` selecting only `line_sub, avatar_url` where `line_sub` is in the user_id list
- Merge `avatar_url` into each member by matching `user_id === line_sub`
- If list is empty, skip query and return members with `avatar_url: null`

### Step 2: Update `TripContext`
**File:** `src/contexts/TripContext.tsx`

- Add `avatar_url?: string | null` to `TripMember` interface
- Add `getAvatarForName` to `TripContextType`
- Add `normalizeDisplayName()` helper: `name.trim().toLowerCase().replace(/\s+/g, " ")`
- Build `memberAvatarsNorm` map via `useMemo`: normalized display_name → avatar_url
- Expose `getAvatarForName(name)` via context

### Step 3: Update `PaymentCard`
**File:** `src/components/PaymentCard.tsx`

- Add `PersonAvatar` component with `useState` for image error fallback
- Uses `useTrip().getAvatarForName(name)` for lookup
- Renders `<img>` with `loading="lazy"`, `referrerPolicy="no-referrer"`, `onError` → sets failed state → falls back to existing emoji avatar
- Replace both "from" avatar (w-12 h-12) and "to" avatar (w-8 h-8) with `PersonAvatar`, passing appropriate size class

### Files modified
1. `supabase/functions/get-trip-members/index.ts`
2. `src/contexts/TripContext.tsx`
3. `src/components/PaymentCard.tsx`

