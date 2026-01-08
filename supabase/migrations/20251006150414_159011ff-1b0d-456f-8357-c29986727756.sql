-- Step 1: Create app_role enum
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('patient', 'doctor', 'hospital_admin');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Step 2: Create user_roles table for secure role management
CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role public.app_role NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Step 3: Migrate existing roles from profiles to user_roles
INSERT INTO public.user_roles (user_id, role)
SELECT user_id, role::text::public.app_role
FROM public.profiles
WHERE user_id IS NOT NULL
ON CONFLICT (user_id, role) DO NOTHING;

-- Step 4: Create security definer function to check roles (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  );
$$;

-- Step 5: Create security definer function to get user role
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role::text FROM public.user_roles WHERE user_id = auth.uid() LIMIT 1;
$$;

-- Step 6: Update handle_new_user trigger to use user_roles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert into profiles
  INSERT INTO public.profiles (user_id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', 'Unknown'),
    COALESCE((NEW.raw_user_meta_data ->> 'role')::public.user_role, 'patient')
  );
  
  -- Insert into user_roles for secure role management
  INSERT INTO public.user_roles (user_id, role)
  VALUES (
    NEW.id,
    COALESCE((NEW.raw_user_meta_data ->> 'role')::text::public.app_role, 'patient'::public.app_role)
  )
  ON CONFLICT (user_id, role) DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- Step 7: Fix profiles RLS - Restrict doctor access to only patients who granted access
DROP POLICY IF EXISTS "Doctors can search patient profiles" ON public.profiles;

CREATE POLICY "Doctors can view granted patient profiles"
ON public.profiles
FOR SELECT
USING (
  auth.uid() = user_id 
  OR (
    role = 'patient'::user_role
    AND public.has_role(auth.uid(), 'doctor'::public.app_role)
    AND EXISTS (
      SELECT 1 FROM public.document_access_permissions
      WHERE patient_id = profiles.user_id
        AND doctor_id = auth.uid()
        AND is_active = true
        AND (expires_at IS NULL OR expires_at > now())
    )
  )
  OR (
    role = 'patient'::user_role
    AND public.has_role(auth.uid(), 'hospital_admin'::public.app_role)
  )
);

-- Step 8: Update profiles update policy to prevent role changes
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (
  auth.uid() = user_id
  AND role = (SELECT role FROM public.profiles WHERE user_id = auth.uid())
);

-- Step 9: Add doctor access to medicine_reminders
DROP POLICY IF EXISTS "Doctors can view medicine reminders for their patients" ON public.medicine_reminders;

CREATE POLICY "Doctors can view medicine reminders for their patients"
ON public.medicine_reminders
FOR SELECT
USING (
  patient_id = auth.uid()
  OR (
    public.has_role(auth.uid(), 'doctor'::public.app_role)
    AND (
      -- Doctor prescribed the medicine
      EXISTS (
        SELECT 1 FROM public.medicine_tracker
        WHERE id = medicine_reminders.medicine_id
          AND prescribed_by = auth.uid()
      )
      OR
      -- Patient granted access to doctor
      EXISTS (
        SELECT 1 FROM public.document_access_permissions
        WHERE patient_id = medicine_reminders.patient_id
          AND doctor_id = auth.uid()
          AND is_active = true
          AND (expires_at IS NULL OR expires_at > now())
      )
    )
  )
);

-- Step 10: Add RLS policies for user_roles table
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Only system can insert roles"
ON public.user_roles
FOR INSERT
WITH CHECK (false);

CREATE POLICY "Users cannot update roles"
ON public.user_roles
FOR UPDATE
USING (false);

CREATE POLICY "Users cannot delete roles"
ON public.user_roles
FOR DELETE
USING (false);

-- Step 11: Fix search_path for send_otp_notification function
CREATE OR REPLACE FUNCTION public.send_otp_notification(patient_email text, patient_name text, doctor_name text, otp_code text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM 
    net.http_post(
      url := 'https://zyvgdptebvkxmihgiszr.supabase.co/functions/v1/send-otp-email',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer ' || current_setting('request.jwt.claims', true)::json->>'sub' || '"}'::jsonb,
      body := json_build_object(
        'patient_email', patient_email,
        'patient_name', patient_name,
        'doctor_name', doctor_name,
        'otp_code', otp_code
      )::text
    );
END;
$$;

-- Step 12: Fix search_path for schedule_medicine_reminders function
CREATE OR REPLACE FUNCTION public.schedule_medicine_reminders()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.medicine_reminders (medicine_id, patient_id, reminder_date, reminder_time, status)
  SELECT 
    mt.id,
    mt.patient_id,
    CURRENT_DATE,
    unnest(mt.timing)::time,
    'pending'
  FROM public.medicine_tracker mt
  WHERE mt.is_active = true
    AND mt.start_date <= CURRENT_DATE
    AND (mt.end_date IS NULL OR mt.end_date >= CURRENT_DATE)
    AND NOT EXISTS (
      SELECT 1 FROM public.medicine_reminders mr
      WHERE mr.medicine_id = mt.id
        AND mr.reminder_date = CURRENT_DATE
        AND mr.reminder_time = unnest(mt.timing)::time
    );
END;
$$;