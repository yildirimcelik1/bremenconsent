ALTER TABLE public.consent_forms 
ADD COLUMN IF NOT EXISTS price text,
ADD COLUMN IF NOT EXISTS assigned_artist_id uuid REFERENCES public.profiles(id);