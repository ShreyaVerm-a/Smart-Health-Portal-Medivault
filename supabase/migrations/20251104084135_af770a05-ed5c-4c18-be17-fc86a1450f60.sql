-- Allow doctors to insert access permissions after successful OTP verification
CREATE POLICY "Doctors can create permissions after OTP verification"
ON public.document_access_permissions
FOR INSERT
TO authenticated
WITH CHECK (
  doctor_id = auth.uid() 
  AND EXISTS (
    SELECT 1 
    FROM public.otp_verifications 
    WHERE otp_verifications.doctor_id = auth.uid() 
      AND otp_verifications.patient_id = document_access_permissions.patient_id
      AND otp_verifications.is_verified = true
      AND otp_verifications.verified_at > (now() - interval '5 minutes')
  )
);