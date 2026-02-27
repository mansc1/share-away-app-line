

## Plan: Calendar popover + reset to trip.start_date on open

### File: `src/components/AddExpenseForm.tsx`

**Imports to add:**
- `useEffect` from react
- `Calendar` from `@/components/ui/calendar`
- `Popover`, `PopoverContent`, `PopoverTrigger` from `@/components/ui/popover`
- `CalendarIcon` from `lucide-react`
- `format`, `parseISO` from `date-fns`
- `th` from `date-fns/locale/th`
- `cn` from `@/lib/utils`

**Remove:** `DATES` from imports (no longer needed), `Select`-related imports for date field

**Changes:**

1. Add `selectedDate` local state: `const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined)`

2. Get `trip` from `useTrip()` (already imported, just destructure `trip` alongside existing fields)

3. Compute `minDate`/`maxDate` from `trip.start_date`/`trip.end_date` with fallback

4. Add `useEffect` to reset date on modal open:
   ```ts
   useEffect(() => {
     if (!isOpen) return;
     if (trip?.start_date) {
       setSelectedDate(parseISO(trip.start_date));
     } else {
       setSelectedDate(undefined);
     }
   }, [isOpen, trip?.start_date]);
   ```

5. Replace date `Select` dropdown (lines 168-180) with `Popover > Button > Calendar`:
   - Button shows `format(selectedDate, "d MMM yyyy", { locale: th })` or placeholder "เลือกวันที่"
   - Calendar: `mode="single"`, `selected={selectedDate}`, `disabled` outside trip range, `pointer-events-auto`
   - On select: set `selectedDate`, close popover

6. Update `formData.date` sync: when `selectedDate` changes, set `formData.date` to the Thai shorthand format (matching current DB format, e.g. `"27 ก.พ."`) using `format(selectedDate, "d MMM", { locale: th })` + `.` — keeping backward compatibility with existing data

7. Update `validateForm`: check `selectedDate` instead of `formData.date` string

8. Update `handleSubmit`: derive `date` from `selectedDate` in the same Thai format

9. Add helper text under the date field: "เลือกได้เฉพาะวันที่ในทริป"

10. On form reset after successful submit, also reset `selectedDate` to undefined (it will be re-set by the useEffect on next open)

### No other files changed
- DB format stays as Thai text (per user's earlier decision to keep format)
- `ExpenseEditDialog` not touched in this task (separate request)

