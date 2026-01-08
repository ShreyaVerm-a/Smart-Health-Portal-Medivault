-- Allow hospital admins (based on profiles.role) to trash documents after OTP verification
-- This fixes cases where user_roles isn't populated but profiles.role is.

DO $$
BEGIN
  -- Ensure RLS is enabled (should already be)
  EXECUTE 'ALTER TABLE public.medical_documents ENABLE ROW LEVEL SECURITY';
EXCEPTION
  WHEN others THEN
    -- ignore if cannot alter / already enabled
    NULL;
END $$;

DROP POLICY IF EXISTS "Hospital admins can trash documents after OTP (profile role)" ON public.medical_documents;

CREATE POLICY "Hospital admins can trash documents after OTP (profile role)"
ON public.medical_documents
FOR UPDATE
USING (
  EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.user_id = auth.uid()
      AND p.role = 'hospital_admin'::public.user_role
  )
  AND EXISTS (
    SELECT 1
    FROM public.otp_verifications ov
    WHERE ov.doctor_id = auth.uid()
      AND ov.patient_id = medical_documents.patient_id
      AND ov.is_verified = true
      AND ov.purpose = 'document_deletion'
      AND ov.verified_at > (now() - interval '15 minutes')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.user_id = auth.uid()
      AND p.role = 'hospital_admin'::public.user_role
  )
  AND EXISTS (
    SELECT 1
    FROM public.otp_verifications ov
    WHERE ov.doctor_id = auth.uid()
      AND ov.patient_id = medical_documents.patient_id
      AND ov.is_verified = true
      AND ov.purpose = 'document_deletion'
      AND ov.verified_at > (now() - interval '15 minutes')
  )
);
