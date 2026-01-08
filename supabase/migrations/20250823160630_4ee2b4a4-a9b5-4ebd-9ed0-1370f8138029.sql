-- Create activity_logs table for tracking user actions
CREATE TABLE public.activity_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  action TEXT NOT NULL,
  description TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- Create policy for users to view their own activity
CREATE POLICY "Users can view their own activity logs" 
ON public.activity_logs 
FOR SELECT 
USING (user_id = auth.uid());

-- Create policy for users to insert their own activity
CREATE POLICY "Users can insert their own activity logs" 
ON public.activity_logs 
FOR INSERT 
WITH CHECK (user_id = auth.uid());

-- Create indexes for better performance
CREATE INDEX idx_activity_logs_user_id ON public.activity_logs(user_id);
CREATE INDEX idx_activity_logs_created_at ON public.activity_logs(created_at DESC);
CREATE INDEX idx_activity_logs_action ON public.activity_logs(action);

-- Create a function to send OTP emails
CREATE OR REPLACE FUNCTION public.send_otp_notification(
  patient_email TEXT,
  patient_name TEXT,
  doctor_name TEXT,
  otp_code TEXT
) RETURNS VOID AS $$
BEGIN
  -- Call edge function to send email
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
$$ LANGUAGE plpgsql SECURITY DEFINER;