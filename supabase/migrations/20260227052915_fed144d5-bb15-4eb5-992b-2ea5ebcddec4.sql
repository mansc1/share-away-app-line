
-- Add trip_id column (nullable first for backfill)
ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS trip_id uuid REFERENCES public.trips(id) ON DELETE CASCADE;

-- Backfill: assign existing expenses to a trip via user_active_trip or first available trip
UPDATE public.expenses e
SET trip_id = COALESCE(
  (SELECT uat.trip_id FROM public.user_active_trip uat LIMIT 1),
  (SELECT t.id FROM public.trips t ORDER BY t.created_at DESC LIMIT 1)
)
WHERE e.trip_id IS NULL;

-- Now make it NOT NULL
ALTER TABLE public.expenses ALTER COLUMN trip_id SET NOT NULL;
