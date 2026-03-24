ALTER TABLE public.consent_forms 
DROP CONSTRAINT IF EXISTS consent_forms_assigned_artist_id_fkey;

ALTER TABLE public.consent_forms
ADD CONSTRAINT consent_forms_assigned_artist_id_fkey
FOREIGN KEY (assigned_artist_id) REFERENCES public.artists(id) ON DELETE SET NULL;