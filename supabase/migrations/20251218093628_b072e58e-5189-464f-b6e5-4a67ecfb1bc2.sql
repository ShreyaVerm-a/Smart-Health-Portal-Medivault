-- Drop the restrictive policy (it won't work without a base permissive policy)
DROP POLICY IF EXISTS "Hospital admins can trash documents after OTP" ON public.medical_documents;

-- Create a proper PERMISSIVE policy for hospital admins to update documents after OTP verification
CREATE POLICY "Hospital admins can update documents after OTP"
ON public.medical_documents
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = auth.uid() AND ur.role = 'hospital_admin'
  )
  AND EXISTS (
    SELECT 1 FROM otp_verifications ov
    WHERE ov.doctor_id = auth.uid()
      AND ov.patient_id = medical_documents.patient_id
      AND ov.is_verified = true
      AND ov.purpose = 'document_deletion'
      AND ov.verified_at > (now() - interval '5 minutes')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = auth.uid() AND ur.role = 'hospital_admin'
  )
  AND EXISTS (
    SELECT 1 FROM otp_verifications ov
    WHERE ov.doctor_id = auth.uid()
      AND ov.patient_id = medical_documents.patient_id
      AND ov.is_verified = true
      AND ov.purpose = 'document_deletion'
      AND ov.verified_at > (now() - interval '5 minutes')
  )
);