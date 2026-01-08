-- Add columns for admin-booked appointments
ALTER TABLE public.appointments 
ADD COLUMN IF NOT EXISTS booked_by uuid REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS patient_name text;

-- Create index for faster lookup
CREATE INDEX IF NOT EXISTS idx_appointments_booked_by ON public.appointments(booked_by);

-- Allow hospital admins to create appointments for patients
CREATE POLICY "Hospital admins can create appointments"
ON public.appointments
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = auth.uid() AND ur.role = 'hospital_admin'
  )
);

-- Allow hospital admins to view all appointments
CREATE POLICY "Hospital admins can view all appointments"
ON public.appointments
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = auth.uid() AND ur.role = 'hospital_admin'
  )
);

-- Fix medical_documents UPDATE policy - drop restrictive and create permissive
DROP POLICY IF EXISTS "Hospital admins can update documents after OTP" ON public.medical_documents;

CREATE POLICY "Hospital admins can trash documents after OTP"
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
      AND ov.verified_at > (now() - interval '15 minutes')
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
      AND ov.verified_at > (now() - interval '15 minutes')
  )
);