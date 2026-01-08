-- Create user roles enum
CREATE TYPE public.user_role AS ENUM ('patient', 'doctor', 'hospital_admin');

-- Create user profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT,
  role user_role NOT NULL DEFAULT 'patient',
  is_verified BOOLEAN DEFAULT false,
  medical_license TEXT, -- For doctors only
  hospital_affiliation TEXT, -- For doctors/hospital_admin
  date_of_birth DATE, -- For patients
  address TEXT,
  emergency_contact TEXT, -- For patients
  specialization TEXT, -- For doctors
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles
CREATE POLICY "Users can view their own profile" 
ON public.profiles FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create medical documents table
CREATE TABLE public.medical_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  uploaded_by UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_type TEXT NOT NULL,
  document_type TEXT NOT NULL, -- 'lab_report', 'prescription', 'imaging', 'diagnosis', etc.
  hospital_name TEXT,
  description TEXT,
  date_of_document DATE,
  tags TEXT[],
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.medical_documents ENABLE ROW LEVEL SECURITY;

-- Create policies for medical documents
CREATE POLICY "Patients can view their own documents" 
ON public.medical_documents FOR SELECT 
USING (patient_id = auth.uid());

CREATE POLICY "Doctors can upload documents for patients" 
ON public.medical_documents FOR INSERT 
WITH CHECK (
  uploaded_by = auth.uid() AND 
  EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role IN ('doctor', 'hospital_admin'))
);

CREATE POLICY "Doctors can view documents they uploaded" 
ON public.medical_documents FOR SELECT 
USING (uploaded_by = auth.uid());

-- Create document access permissions table
CREATE TABLE public.document_access_permissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  doctor_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  document_id UUID REFERENCES public.medical_documents(id) ON DELETE CASCADE, -- NULL means all documents
  granted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  access_type TEXT DEFAULT 'view_only', -- 'view_only', 'full_access'
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.document_access_permissions ENABLE ROW LEVEL SECURITY;

-- Create policies for access permissions
CREATE POLICY "Patients can manage their access permissions" 
ON public.document_access_permissions FOR ALL 
USING (patient_id = auth.uid());

CREATE POLICY "Doctors can view permissions granted to them" 
ON public.document_access_permissions FOR SELECT 
USING (doctor_id = auth.uid() AND is_active = true AND (expires_at IS NULL OR expires_at > now()));

-- Create OTP verification table
CREATE TABLE public.otp_verifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  doctor_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  otp_code TEXT NOT NULL,
  purpose TEXT NOT NULL, -- 'document_access', 'profile_access'
  is_verified BOOLEAN DEFAULT false,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '10 minutes'),
  verified_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.otp_verifications ENABLE ROW LEVEL SECURITY;

-- Create policies for OTP verifications
CREATE POLICY "Doctors can create OTP for document access" 
ON public.otp_verifications FOR INSERT 
WITH CHECK (doctor_id = auth.uid());

CREATE POLICY "Users can verify their own OTP" 
ON public.otp_verifications FOR ALL 
USING (doctor_id = auth.uid() OR patient_id = auth.uid());

-- Create medicine tracker table
CREATE TABLE public.medicine_tracker (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  medicine_name TEXT NOT NULL,
  dosage TEXT NOT NULL,
  frequency TEXT NOT NULL, -- 'once_daily', 'twice_daily', 'three_times_daily', 'as_needed'
  timing TEXT[], -- Array of times like ['08:00', '20:00']
  start_date DATE NOT NULL,
  end_date DATE,
  prescribed_by UUID REFERENCES public.profiles(user_id),
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.medicine_tracker ENABLE ROW LEVEL SECURITY;

-- Create policies for medicine tracker
CREATE POLICY "Patients can manage their medicine tracker" 
ON public.medicine_tracker FOR ALL 
USING (patient_id = auth.uid());

CREATE POLICY "Doctors can view medicine tracker for their patients" 
ON public.medicine_tracker FOR SELECT 
USING (
  prescribed_by = auth.uid() OR
  EXISTS (
    SELECT 1 FROM public.document_access_permissions 
    WHERE doctor_id = auth.uid() AND patient_id = medicine_tracker.patient_id 
    AND is_active = true AND (expires_at IS NULL OR expires_at > now())
  )
);

-- Create medicine reminders table
CREATE TABLE public.medicine_reminders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  medicine_id UUID NOT NULL REFERENCES public.medicine_tracker(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  reminder_time TIME NOT NULL,
  taken_at TIMESTAMP WITH TIME ZONE,
  skipped_at TIMESTAMP WITH TIME ZONE,
  reminder_date DATE NOT NULL,
  status TEXT DEFAULT 'pending', -- 'pending', 'taken', 'skipped', 'missed'
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.medicine_reminders ENABLE ROW LEVEL SECURITY;

-- Create policies for medicine reminders
CREATE POLICY "Patients can manage their medicine reminders" 
ON public.medicine_reminders FOR ALL 
USING (patient_id = auth.uid());

-- Create storage buckets for medical documents
INSERT INTO storage.buckets (id, name, public) 
VALUES ('medical-documents', 'medical-documents', false);

-- Create storage policies
CREATE POLICY "Doctors can upload medical documents" 
ON storage.objects FOR INSERT 
WITH CHECK (
  bucket_id = 'medical-documents' AND 
  EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role IN ('doctor', 'hospital_admin'))
);

CREATE POLICY "Users can view medical documents they have access to" 
ON storage.objects FOR SELECT 
USING (
  bucket_id = 'medical-documents' AND (
    -- Patients can view their own documents
    auth.uid()::text = (storage.foldername(name))[1] OR
    -- Doctors can view documents they uploaded or have permission to access
    EXISTS (
      SELECT 1 FROM public.medical_documents md 
      WHERE md.file_path = name AND (
        md.uploaded_by = auth.uid() OR
        md.patient_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM public.document_access_permissions dap 
          WHERE dap.doctor_id = auth.uid() 
          AND dap.patient_id = md.patient_id 
          AND dap.is_active = true 
          AND (dap.expires_at IS NULL OR dap.expires_at > now())
        )
      )
    )
  )
);

-- Create function to handle new user profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', 'Unknown'),
    COALESCE((NEW.raw_user_meta_data ->> 'role')::user_role, 'patient')
  );
  RETURN NEW;
END;
$$;

-- Create trigger for new user registration
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_medical_documents_updated_at
  BEFORE UPDATE ON public.medical_documents
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_medicine_tracker_updated_at
  BEFORE UPDATE ON public.medicine_tracker
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();