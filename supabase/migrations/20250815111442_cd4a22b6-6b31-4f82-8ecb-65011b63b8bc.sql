-- Add additional RLS policies for profiles table to allow legitimate medical access
-- while maintaining security

-- Allow doctors to search and view patient profiles for medical purposes
CREATE POLICY "Doctors can search patient profiles" 
ON public.profiles 
FOR SELECT 
USING (
  -- Allow users to view their own profile
  auth.uid() = user_id 
  OR 
  -- Allow doctors/hospital_admin to view patient profiles
  (
    role = 'patient' 
    AND EXISTS (
      SELECT 1 FROM public.profiles doctor_profile 
      WHERE doctor_profile.user_id = auth.uid() 
      AND doctor_profile.role IN ('doctor', 'hospital_admin')
    )
  )
);

-- Create a security definer function to get current user role to avoid infinite recursion
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT 
LANGUAGE SQL 
SECURITY DEFINER 
STABLE
AS $$
  SELECT role::text FROM public.profiles WHERE user_id = auth.uid();
$$;

-- Update the policy to use the security definer function
DROP POLICY IF EXISTS "Doctors can search patient profiles" ON public.profiles;

CREATE POLICY "Doctors can search patient profiles" 
ON public.profiles 
FOR SELECT 
USING (
  -- Allow users to view their own profile
  auth.uid() = user_id 
  OR 
  -- Allow doctors/hospital_admin to view patient profiles only
  (
    role = 'patient' 
    AND public.get_current_user_role() IN ('doctor', 'hospital_admin')
  )
);