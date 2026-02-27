

## Update `get-invite-info` Edge Function

### Changes to `supabase/functions/get-invite-info/index.ts`

**1. Select `revoked_reason` from invite query** (line 39):
- Change `.select("id, trip_id, status")` → `.select("id, trip_id, status, revoked_reason")`

**2. Replace the simple `invite_revoked` check** (lines 47-49) with granular handling:
```typescript
if (invite.status !== "active") {
  if (invite.revoked_reason === "capacity_full") {
    return json({ code: "invite_closed", message: "ทริปเต็มแล้ว" }, 410);
  }
  return json({ code: "invite_revoked", message: "ลิงก์ถูกปิดใช้งานแล้ว" }, 410);
}
```

**3. Expand trip status check** (line 62):
- Change `trip.status === "archived"` → `trip.status === "archived" || trip.status === "cancelled"`
- Update message to Thai: `"ทริปนี้ปิดแล้ว"`

No DB migration needed — `revoked_reason` column will be added in the Onboard QR migration. The select will return `null` for existing rows, which is fine since the check is explicit.

**Also update `JoinTripPage.tsx`** error messages map to handle the new `invite_closed` code:
- Add `invite_closed` → `{ title: "ทริปเต็มแล้ว", desc: "ทริปนี้เต็มแล้ว ไม่สามารถเข้าร่วมได้" }`

### Files changed
- `supabase/functions/get-invite-info/index.ts` — 3 small edits
- `src/pages/JoinTripPage.tsx` — add `invite_closed` to error map

