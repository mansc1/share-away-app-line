DO $$
DECLARE
  _con_name text;
BEGIN
  SELECT c.conname INTO _con_name
    FROM pg_constraint c
    JOIN pg_attribute a ON a.attnum = ANY(c.conkey) AND a.attrelid = c.conrelid
   WHERE c.conrelid = 'public.trips'::regclass
     AND c.contype = 'c'
     AND a.attname = 'status';

  IF _con_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.trips DROP CONSTRAINT %I', _con_name);
  END IF;
END $$;

ALTER TABLE public.trips ADD CONSTRAINT trips_status_check
  CHECK (status IN ('open','confirmed','archived','cancelled'));

ALTER TABLE public.trips ADD COLUMN IF NOT EXISTS archived_at timestamptz;
ALTER TABLE public.trips ADD COLUMN IF NOT EXISTS cancelled_at timestamptz;