-- Add foreign key from document_deletion_requests.patient_id to profiles.user_id
ALTER TABLE public.document_deletion_requests
ADD CONSTRAINT document_deletion_requests_patient_id_fkey
FOREIGN KEY (patient_id) REFERENCES public.profiles(user_id);

-- Also ensure hospital admins can view patient profiles for the deletion workflow
-- The existing policy already covers this via the hospital_admin check