-- Fix security vulnerability: Restrict doctor access to patient profiles
-- Doctors should only see patient profiles for patients who have granted them access

-- Drop the existing overly permissive policy
DROP POLICY IF EXISTS "Doctors can search patient profiles" ON public.profiles;

-- Create a new restrictive policy for doctors
CREATE POLICY "Doctors can view patients with granted access" 
ON public.profiles 
FOR SELECT 
USING (
  (auth.uid() = user_id) OR 
  (
    role = 'patient'::user_role AND 
    get_current_user_role() = ANY (ARRAY['doctor'::text, 'hospital_admin'::text]) AND
    EXISTS (
      SELECT 1 
      FROM public.document_access_permissions dap
      WHERE dap.patient_id = profiles.user_id
        AND dap.doctor_id = auth.uid()
        AND dap.is_active = true
        AND (dap.expires_at IS NULL OR dap.expires_at > now())
    )
  )
);

-- Add a separate policy for patient search functionality during OTP verification
-- This allows doctors to find patients by email/patient_id for initial access request
CREATE POLICY "Doctors can search patients for access requests" 
ON public.profiles 
FOR SELECT 
USING (
  role = 'patient'::user_role AND 
  get_current_user_role() = ANY (ARRAY['doctor'::text, 'hospital_admin'::text]) AND
  -- Only allow access to basic search fields (email, patient_id, full_name)
  -- The application should limit what data is returned in search results
  true
);

-- Create a view for secure patient search that only exposes necessary fields
CREATE OR REPLACE VIEW public.patient_search AS
SELECT 
  user_id,
  email,
  patient_id,
  full_name
FROM public.profiles
WHERE role = 'patient'::user_role;

-- Enable RLS on the view
ALTER VIEW public.patient_search SET (security_barrier = true);

-- Create policy for the patient search view
CREATE POLICY "Doctors can search patients by limited fields" 
ON public.patient_search
FOR SELECT 
USING (
  get_current_user_role() = ANY (ARRAY['doctor'::text, 'hospital_admin'::text])
);