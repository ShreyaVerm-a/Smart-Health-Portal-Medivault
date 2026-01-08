-- Create document deletion requests table
CREATE TABLE public.document_deletion_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id UUID NOT NULL REFERENCES public.medical_documents(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL,
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, approved, rejected
  requested_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  processed_at TIMESTAMP WITH TIME ZONE,
  processed_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add is_trashed column to medical_documents
ALTER TABLE public.medical_documents 
ADD COLUMN is_trashed BOOLEAN DEFAULT false,
ADD COLUMN trashed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN trashed_by UUID;

-- Enable RLS
ALTER TABLE public.document_deletion_requests ENABLE ROW LEVEL SECURITY;

-- Patients can create deletion requests for their own documents
CREATE POLICY "Patients can create deletion requests"
ON public.document_deletion_requests
FOR INSERT
WITH CHECK (patient_id = auth.uid());

-- Patients can view their own deletion requests
CREATE POLICY "Patients can view their deletion requests"
ON public.document_deletion_requests
FOR SELECT
USING (patient_id = auth.uid());

-- Hospital admins can view all deletion requests
CREATE POLICY "Hospital admins can view deletion requests"
ON public.document_deletion_requests
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.user_roles
  WHERE user_id = auth.uid() AND role = 'hospital_admin'
));

-- Hospital admins can update deletion requests after OTP verification
CREATE POLICY "Hospital admins can update deletion requests"
ON public.document_deletion_requests
FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM public.user_roles
  WHERE user_id = auth.uid() AND role = 'hospital_admin'
));

-- Allow patients to view trashed documents
CREATE POLICY "Patients can view their trashed documents"
ON public.medical_documents
FOR SELECT
USING (patient_id = auth.uid() AND is_trashed = true);

-- Hospital admins can update documents for trash operations after OTP
CREATE POLICY "Hospital admins can trash documents after OTP"
ON public.medical_documents
FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM public.user_roles ur
  WHERE ur.user_id = auth.uid() AND ur.role = 'hospital_admin'
) AND EXISTS (
  SELECT 1 FROM public.otp_verifications ov
  WHERE ov.doctor_id = auth.uid()
    AND ov.patient_id = medical_documents.patient_id
    AND ov.is_verified = true
    AND ov.purpose = 'document_deletion'
    AND ov.verified_at > (now() - interval '5 minutes')
));