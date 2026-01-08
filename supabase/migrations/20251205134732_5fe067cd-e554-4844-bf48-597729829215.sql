-- Drop the problematic policy
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

-- Recreate without recursion - use security definer function instead
CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (
  auth.uid() = user_id 
  AND role = (public.get_current_user_role())::user_role
);