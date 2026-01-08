-- Fix function search path security issue
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER 
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', 'Unknown'),
    COALESCE((NEW.raw_user_meta_data ->> 'role')::public.user_role, 'patient')
  );
  RETURN NEW;
END;
$$;

-- Fix OTP expiry time to be more secure (5 minutes instead of 10)
ALTER TABLE public.otp_verifications 
ALTER COLUMN expires_at SET DEFAULT (now() + interval '5 minutes');