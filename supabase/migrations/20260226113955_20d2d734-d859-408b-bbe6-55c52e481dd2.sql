CREATE OR REPLACE FUNCTION public.normalize_display_name()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  NEW.display_name_norm := lower(trim(regexp_replace(NEW.display_name, '\s+', ' ', 'g')));
  RETURN NEW;
END;
$$;