CREATE POLICY "Allow public select on trip_members"
  ON public.trip_members
  FOR SELECT
  USING (true);