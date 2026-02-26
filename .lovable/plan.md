

## Final Migration SQL — Trip Registration Schema

Two additions applied:
1. `created_at timestamptz DEFAULT now()` added to `trip_members`
2. `CHECK (length(trim(name)) > 0)` added to `trips.name`

```sql
-- trips
CREATE TABLE public.trips (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL CHECK (length(trim(name)) > 0),
  start_date date NOT NULL,
  end_date date NOT NULL,
  capacity_total int NOT NULL CHECK (capacity_total >= 2),
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open','confirmed','archived')),
  created_by_user_id text NOT NULL,
  created_at timestamptz DEFAULT now(),
  confirmed_at timestamptz NULL,
  CHECK (end_date >= start_date)
);

-- trip_members
CREATE TABLE public.trip_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id uuid NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  user_id text NOT NULL,
  display_name text NOT NULL CHECK (length(trim(display_name)) > 0),
  display_name_norm text NOT NULL,
  role text NOT NULL CHECK (role IN ('admin','member')),
  joined_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  UNIQUE (trip_id, user_id),
  UNIQUE (trip_id, display_name_norm)
);

-- trip_invites
CREATE TABLE public.trip_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id uuid NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  token text NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','revoked')),
  created_by_user_id text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- user_active_trip
CREATE TABLE public.user_active_trip (
  user_id text PRIMARY KEY,
  trip_id uuid NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  updated_at timestamptz DEFAULT now()
);

-- Normalization trigger
CREATE OR REPLACE FUNCTION public.normalize_display_name()
RETURNS TRIGGER AS $$
BEGIN
  NEW.display_name_norm := lower(trim(regexp_replace(NEW.display_name, '\s+', ' ', 'g')));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_normalize_display_name
  BEFORE INSERT OR UPDATE ON public.trip_members
  FOR EACH ROW
  EXECUTE FUNCTION public.normalize_display_name();

-- RLS (no public policies — service role only)
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trip_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trip_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_active_trip ENABLE ROW LEVEL SECURITY;
```

All existing constraints preserved. Ready to execute on your confirmation.

