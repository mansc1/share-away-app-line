
CREATE TABLE public.expenses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  date TEXT NOT NULL,
  time TEXT NOT NULL,
  category TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  paid_by TEXT NOT NULL,
  shared_by TEXT[] NOT NULL DEFAULT '{}',
  currency TEXT NOT NULL DEFAULT 'CNY',
  thb_amount NUMERIC,
  is_converted_to_thb BOOLEAN NOT NULL DEFAULT false,
  user_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public select" ON public.expenses FOR SELECT USING (true);
CREATE POLICY "Allow public insert" ON public.expenses FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update" ON public.expenses FOR UPDATE USING (true);
CREATE POLICY "Allow public delete" ON public.expenses FOR DELETE USING (true);
