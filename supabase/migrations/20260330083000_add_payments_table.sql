CREATE TABLE public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id uuid NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  from_user_id text NOT NULL,
  to_user_id text NOT NULL,
  amount numeric NOT NULL CHECK (amount > 0),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'confirmed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  paid_at timestamptz NULL,
  confirmed_at timestamptz NULL,
  created_by_user_id text NOT NULL,
  updated_by_user_id text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (from_user_id <> to_user_id)
);

CREATE INDEX idx_payments_trip_id ON public.payments(trip_id);
CREATE INDEX idx_payments_trip_status ON public.payments(trip_id, status);
CREATE INDEX idx_payments_from_user ON public.payments(from_user_id);
CREATE INDEX idx_payments_to_user ON public.payments(to_user_id);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public select on payments"
  ON public.payments
  FOR SELECT
  USING (true);

ALTER PUBLICATION supabase_realtime ADD TABLE public.payments;
