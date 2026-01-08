-- Create edge function for sending medicine reminders
CREATE OR REPLACE FUNCTION public.schedule_medicine_reminders()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- This function will be called by an edge function to send reminders
  -- Insert reminder records for upcoming medicine times
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