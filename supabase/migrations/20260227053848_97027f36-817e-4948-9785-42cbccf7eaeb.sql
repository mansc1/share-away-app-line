CREATE OR REPLACE FUNCTION public.reject_expense_on_closed_trip()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO ''
AS $$
DECLARE
  trip_status text;
BEGIN
  SELECT t.status
    INTO trip_status
  FROM public.trips t
  WHERE t.id = NEW.trip_id;

  IF trip_status IS NULL THEN
    RAISE EXCEPTION USING
      ERRCODE = 'P0001',
      MESSAGE = 'trip_not_found';
  END IF;

  IF trip_status IN ('archived', 'cancelled') THEN
    RAISE EXCEPTION USING
      ERRCODE = 'P0001',
      MESSAGE = 'trip_closed';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_reject_expense_closed_trip ON public.expenses;

CREATE TRIGGER trg_reject_expense_closed_trip
  BEFORE INSERT OR UPDATE ON public.expenses
  FOR EACH ROW
  EXECUTE FUNCTION public.reject_expense_on_closed_trip();