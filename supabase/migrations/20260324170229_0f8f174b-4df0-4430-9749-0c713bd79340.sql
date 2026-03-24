INSERT INTO storage.buckets (id, name, public)
VALUES ('consent-pdfs', 'consent-pdfs', true);

CREATE POLICY "Authenticated users can upload PDFs"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'consent-pdfs');

CREATE POLICY "Authenticated users can read PDFs"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'consent-pdfs');

CREATE POLICY "Admins can delete PDFs"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'consent-pdfs' AND public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins can delete any form"
ON public.consent_forms FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role));