

## Verification Checklist for /trip/new

Base URL: `https://share-away-app-line.lovable.app`

---

### Check 1: Unauthenticated Access

**Steps:**
1. Open incognito or clear `line_session_token` from localStorage
2. Go to `https://share-away-app-line.lovable.app/trip/new`

**Expected:** Card with "กรุณาเข้าสู่ระบบก่อนสร้างทริป" + LINE login button

**Network:** No edge function calls (auth check is local via `useLineAuth`)

**Known Bug:** After LINE login, user lands on `/app` instead of `/trip/new`. `LineCallbackPage.tsx` line 54 hardcodes `navigate("/app")` and ignores `post_login_redirect` stored by `TripNewPage`. **Fix:** In `LineCallbackPage`, read `post_login_redirect` from localStorage, navigate there, then remove it.

---

### Check 2: Successful Trip Creation

**Steps:**
1. Log in first, then go to `/trip/new`
2. Fill: name="ทดสอบทริป", pick start date (future), end date (after start), capacity=3
3. Click "สร้างทริป"

**Expected:** Toast "สร้างทริปสำเร็จ!", redirect to `/app`, trip shown as active

**Network:**
- `POST create-trip` → 201
- `GET get-active-trip` → 200 (from refetch)
- `POST get-trip-members` → 200 (from refetch)

---

### Check 3: Date Validation

**Steps:**
1. On `/trip/new`, pick start date, then manually try to pick end date before start

**Expected:** Calendar disables dates before start date (line 220-222: `disabled={(date) => startDate ? date < startDate : date < new Date()}`). User cannot select invalid end date. If somehow bypassed, submit shows toast "วันกลับต้องไม่ก่อนวันไป" and no API call is made.

**Network:** No `create-trip` call

---

### Check 4: Capacity Validation

**Steps:**
1. Set capacity to `1`, fill other fields, click submit
2. Set capacity to `0`, click submit

**Expected:** Toast "จำนวนคนต้องอย่างน้อย 2 คน". No API call. Note: HTML `min={2}` on the input may also prevent typing values below 2 via spinner, but direct typing can bypass it -- the JS validation catches it.

**Network:** No `create-trip` call

---

### Check 5: Active Trip Persistence

**Steps:**
1. After creating a trip, on `/app`, hard-refresh (Ctrl+R)

**Expected:** `/app` loads, shows the trip. Does not redirect to `/trip/new`.

**Network:** `GET get-active-trip` → 200 with `{ trip: {...} }`

---

### Check 6: Trip Manage Page

**Steps:**
1. Go to `https://share-away-app-line.lovable.app/trip/manage`

**Expected:** Shows trip name, dates, capacity. Members list shows admin (you) with correct display name.

**Network:**
- `GET get-active-trip` → 200
- `POST get-trip-members` → 200
- Console: no errors

---

### Summary of Issues Found

| # | Status | Issue |
|---|--------|-------|
| 1 | BUG | `LineCallbackPage` ignores `post_login_redirect` -- user always lands on `/app` after login instead of returning to `/trip/new` |
| 2-6 | OK | Code logic is correct |

### Proposed Fix

Add 3 lines to `LineCallbackPage.tsx` after setting the session token (line 53): read `post_login_redirect` from localStorage, navigate to that path (or fall back to `/app`), and remove the key.

