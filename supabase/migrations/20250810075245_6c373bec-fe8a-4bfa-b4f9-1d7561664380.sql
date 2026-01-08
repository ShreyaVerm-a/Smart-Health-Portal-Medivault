-- Add patient_id column to profiles table for easy patient identification
ALTER TABLE public.profiles 
ADD COLUMN patient_id TEXT GENERATED ALWAYS AS (
  CASE 
    WHEN role = 'patient' THEN 'PAT-' || UPPER(SUBSTRING(id::text, 1, 8))
    ELSE NULL 
  END
) STORED;