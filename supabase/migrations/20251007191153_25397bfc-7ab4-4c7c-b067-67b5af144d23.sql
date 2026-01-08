-- Fix RLS policies to allow doctors and hospital admins to search for patients

-- Drop the restrictive policy that prevents searching
DROP POLICY IF EXISTS "Doctors can view granted patient profiles" ON public.profiles;

-- Create new policies that allow proper patient search
CREATE POLICY "Doctors can search and view all patient profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  -- Users can always view their own profile
  auth.uid() = user_id
  OR
  -- Doctors can view all patient profiles (needed for search)
  (role = 'patient'::user_role AND public.has_role(auth.uid(), 'doctor'::app_role))
  OR
  -- Hospital admins can view all patient profiles
  (role = 'patient'::user_role AND public.has_role(auth.uid(), 'hospital_admin'::app_role))
  OR
  -- Doctors can view other doctors' profiles (for collaboration)
  (role = 'doctor'::user_role AND public.has_role(auth.uid(), 'doctor'::app_role))
  OR
  -- Hospital admins can view all profiles
  public.has_role(auth.uid(), 'hospital_admin'::app_role)
);