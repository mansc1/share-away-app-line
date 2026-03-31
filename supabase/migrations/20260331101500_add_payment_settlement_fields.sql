ALTER TABLE public.payments
  ADD COLUMN settlement_amount numeric NULL,
  ADD COLUMN settlement_currency text NOT NULL DEFAULT 'THB';

CREATE INDEX idx_payments_trip_settlement
  ON public.payments(trip_id, settlement_currency, settlement_amount);
