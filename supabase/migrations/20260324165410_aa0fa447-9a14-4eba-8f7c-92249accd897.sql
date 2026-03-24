CREATE POLICY "Designers can delete own draft forms"
ON public.consent_forms
FOR DELETE
TO authenticated
USING (created_by = auth.uid() AND status = 'draft');