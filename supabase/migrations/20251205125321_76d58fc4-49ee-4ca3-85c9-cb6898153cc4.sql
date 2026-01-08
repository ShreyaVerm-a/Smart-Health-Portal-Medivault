-- Fix 1: Update profiles RLS policy - Doctors can only view patients they have permission/appointments with
DROP POLICY IF EXISTS "Doctors can search and view all patient profiles" ON public.profiles;

CREATE POLICY "Doctors can view authorized patient profiles"
ON public.profiles
FOR SELECT
USING (
  -- Users can always view their own profile
  (auth.uid() = user_id)
  OR
  -- Doctors can view patients they have active access permissions for
  (
    role = 'patient'::user_role 
    AND has_role(auth.uid(), 'doctor'::app_role)
    AND EXISTS (
      SELECT 1 FROM document_access_permissions dap
      WHERE dap.doctor_id = auth.uid()
        AND dap.patient_id = profiles.user_id
        AND dap.is_active = true
        AND (dap.expires_at IS NULL OR dap.expires_at > now())
    )
  )
  OR
  -- Doctors can view patients they have appointments with
  (
    role = 'patient'::user_role 
    AND has_role(auth.uid(), 'doctor'::app_role)
    AND EXISTS (
      SELECT 1 FROM appointments a
      WHERE a.doctor_id = auth.uid()
        AND a.patient_id = profiles.user_id
    )
  )
  OR
  -- Hospital admins can view all profiles for management
  has_role(auth.uid(), 'hospital_admin'::app_role)
  OR
  -- Patients can view doctor profiles (for booking) - only show necessary info via view
  (
    role = 'doctor'::user_role 
    AND has_role(auth.uid(), 'patient'::app_role)
  )
);

-- Fix 2: Update doctor_working_hours - Only authenticated users can view (not public)
DROP POLICY IF EXISTS "Everyone can view doctor working hours" ON public.doctor_working_hours;

CREATE POLICY "Authenticated users can view doctor working hours"
ON public.doctor_working_hours
FOR SELECT
TO authenticated
USING (true);

-- Fix 3: Restrict OTP verifications - users can only see their own pending/recent verifications
DROP POLICY IF EXISTS "Users can verify their own OTP" ON public.otp_verifications;

CREATE POLICY "Users can access their own OTP verifications"
ON public.otp_verifications
FOR ALL
USING (
  (doctor_id = auth.uid() OR patient_id = auth.uid())
  AND (
    -- Only show recent OTPs (within last 10 minutes) or pending ones
    created_at > now() - interval '10 minutes'
    OR is_verified = false
  )
);

-- Fix 4: Doctors can only view other doctors' basic info (name, specialization, hospital) for collaboration
-- This is handled by the updated profiles policy above - doctors can't see other doctors unless hospital_admin