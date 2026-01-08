-- Allow hospital admins to verify doctors (update is_verified field only)
CREATE POLICY "Hospital admins can verify doctors"
ON public.profiles
FOR UPDATE
USING (
  has_role(auth.uid(), 'hospital_admin'::app_role) 
  AND role = 'doctor'::user_role
)
WITH CHECK (
  has_role(auth.uid(), 'hospital_admin'::app_role) 
  AND role = 'doctor'::user_role
);