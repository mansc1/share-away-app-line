ALTER TABLE public.trips
  ADD COLUMN destination_country_code text NULL,
  ADD COLUMN default_expense_currency text NULL;
