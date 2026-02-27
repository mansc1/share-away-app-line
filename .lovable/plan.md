

## Plan: OnboardQRModal with auto-generate invite and realtime counter

### Step 1: Create `src/components/trip/OnboardQRModal.tsx`

New component — fullscreen Dialog with:
- **Props**: `open`, `onOpenChange`
- **Auto-generate**: On `open=true`, call `generate-invite-link` once using a `useRef` guard. Reset guard + state when modal closes.
- **Trip info**: Name as `DialogTitle`, Thai-formatted date range below
- **Realtime counter**: `members.length / trip.capacity_total` from `useTrip()` — no new subscription
- **QR code**: `QRCodeSVG` size 220, wrapped in white rounded container
- **Buttons**: Copy link + LINE share (logic reused from `InviteShareSection`)
- **Full capacity**: "เต็มแล้ว" destructive Badge, QR gets `opacity-40`, copy/share buttons disabled. Modal stays open.

### Step 2: Edit `src/pages/TripNewPage.tsx`

- Add `qrModalOpen` state
- After `create-trip` succeeds: `await refetch()`, then `setQrModalOpen(true)` instead of `navigate("/app")`
- On modal close: `navigate("/app")`
- Render `<OnboardQRModal open={qrModalOpen} onOpenChange={...} />`

### Step 3: Edit `src/pages/TripManagePage.tsx`

- Add `qrModalOpen` state
- Add admin-only `<Button>` with `QrCode` icon labeled "เปิด QR ลงทะเบียน" (visible when trip status is `open` or `confirmed`)
- Render `<OnboardQRModal open={qrModalOpen} onOpenChange={setQrModalOpen} />`

### Files changed
| Action | File |
|--------|------|
| New | `src/components/trip/OnboardQRModal.tsx` |
| Edit | `src/pages/TripNewPage.tsx` |
| Edit | `src/pages/TripManagePage.tsx` |

