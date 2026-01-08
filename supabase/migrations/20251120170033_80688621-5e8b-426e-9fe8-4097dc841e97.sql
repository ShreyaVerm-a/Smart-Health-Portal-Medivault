-- Create appointments table
CREATE TABLE public.appointments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL,
  doctor_id UUID NOT NULL,
  appointment_date DATE NOT NULL,
  appointment_time TIME NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 30,
  status TEXT NOT NULL DEFAULT 'scheduled',
  reason TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT appointments_patient_fkey FOREIGN KEY (patient_id) REFERENCES public.profiles(user_id),
  CONSTRAINT appointments_doctor_fkey FOREIGN KEY (doctor_id) REFERENCES public.profiles(user_id),
  CONSTRAINT valid_status CHECK (status IN ('scheduled', 'completed', 'cancelled', 'no_show'))
);

-- Create doctor_working_hours table
CREATE TABLE public.doctor_working_hours (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  doctor_id UUID NOT NULL,
  day_of_week INTEGER NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT doctor_working_hours_doctor_fkey FOREIGN KEY (doctor_id) REFERENCES public.profiles(user_id),
  CONSTRAINT valid_day CHECK (day_of_week >= 0 AND day_of_week <= 6)
);

-- Enable RLS
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctor_working_hours ENABLE ROW LEVEL SECURITY;

-- RLS Policies for appointments
CREATE POLICY "Patients can view their own appointments"
ON public.appointments
FOR SELECT
USING (patient_id = auth.uid());

CREATE POLICY "Doctors can view their appointments"
ON public.appointments
FOR SELECT
USING (doctor_id = auth.uid());

CREATE POLICY "Patients can create appointments"
ON public.appointments
FOR INSERT
WITH CHECK (patient_id = auth.uid());

CREATE POLICY "Patients can update their own appointments"
ON public.appointments
FOR UPDATE
USING (patient_id = auth.uid());

CREATE POLICY "Doctors can update their appointments"
ON public.appointments
FOR UPDATE
USING (doctor_id = auth.uid());

CREATE POLICY "Patients can delete their own appointments"
ON public.appointments
FOR DELETE
USING (patient_id = auth.uid());

-- RLS Policies for doctor_working_hours
CREATE POLICY "Everyone can view doctor working hours"
ON public.doctor_working_hours
FOR SELECT
USING (true);

CREATE POLICY "Doctors can manage their working hours"
ON public.doctor_working_hours
FOR ALL
USING (doctor_id = auth.uid());

-- Triggers for updated_at
CREATE TRIGGER update_appointments_updated_at
BEFORE UPDATE ON public.appointments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_doctor_working_hours_updated_at
BEFORE UPDATE ON public.doctor_working_hours
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Indexes for performance
CREATE INDEX idx_appointments_patient ON public.appointments(patient_id);
CREATE INDEX idx_appointments_doctor ON public.appointments(doctor_id);
CREATE INDEX idx_appointments_date ON public.appointments(appointment_date);
CREATE INDEX idx_doctor_working_hours_doctor ON public.doctor_working_hours(doctor_id);
CREATE INDEX idx_doctor_working_hours_day ON public.doctor_working_hours(day_of_week);