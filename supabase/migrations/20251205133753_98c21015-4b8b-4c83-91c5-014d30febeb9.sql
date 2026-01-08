-- Fix the infinite recursion in profiles RLS policy
-- The issue is mixing has_role() checks with profile role conditions

-- Drop the problematic policy
DROP POLICY IF EXISTS "Doctors can view authorized patient profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

-- Create a single combined SELECT policy that avoids recursion
-- Use user_roles table directly instead of has_role() to avoid recursion
CREATE POLICY "Users can view their own profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Doctors can view authorized patient profiles"
ON public.profiles
FOR SELECT
USING (
  -- Doctors can view patients they have active access permissions for
  (
    role = 'patient'::user_role 
    AND EXISTS (
      SELECT 1 FROM user_roles ur 
      WHERE ur.user_id = auth.uid() AND ur.role = 'doctor'::app_role
    )
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
    AND EXISTS (
      SELECT 1 FROM user_roles ur 
      WHERE ur.user_id = auth.uid() AND ur.role = 'doctor'::app_role
    )
    AND EXISTS (
      SELECT 1 FROM appointments a
      WHERE a.doctor_id = auth.uid()
        AND a.patient_id = profiles.user_id
    )
  )
  OR
  -- Hospital admins can view all profiles for management
  EXISTS (
    SELECT 1 FROM user_roles ur 
    WHERE ur.user_id = auth.uid() AND ur.role = 'hospital_admin'::app_role
  )
  OR
  -- Patients can view doctor profiles (for booking)
  (
    role = 'doctor'::user_role 
    AND EXISTS (
      SELECT 1 FROM user_roles ur 
      WHERE ur.user_id = auth.uid() AND ur.role = 'patient'::app_role
    )
  )
);

-- Fix the hospital admin update policy to avoid recursion too
DROP POLICY IF EXISTS "Hospital admins can verify doctors" ON public.profiles;

CREATE POLICY "Hospital admins can verify doctors"
ON public.profiles
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM user_roles ur 
    WHERE ur.user_id = auth.uid() AND ur.role = 'hospital_admin'::app_role
  )
  AND role = 'doctor'::user_role
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles ur 
    WHERE ur.user_id = auth.uid() AND ur.role = 'hospital_admin'::app_role
  )
  AND role = 'doctor'::user_role
);