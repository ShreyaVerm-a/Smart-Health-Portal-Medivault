-- Drop existing restrictive UPDATE policies on medical_documents
DROP POLICY IF EXISTS "Hospital admins can trash documents after OTP" ON public.medical_documents;
DROP POLICY IF EXISTS "Patients can update their own documents" ON public.medical_documents;

-- Create PERMISSIVE update policy for patients
CREATE POLICY "Patients can update their own documents" 
ON public.medical_documents 
FOR UPDATE 
TO authenticated
USING (patient_id = auth.uid())
WITH CHECK (patient_id = auth.uid());

-- Create PERMISSIVE update policy for hospital admins with OTP verification
CREATE POLICY "Hospital admins can trash documents after OTP" 
ON public.medical_documents 
FOR UPDATE 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = auth.uid() AND ur.role = 'hospital_admin'::app_role
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