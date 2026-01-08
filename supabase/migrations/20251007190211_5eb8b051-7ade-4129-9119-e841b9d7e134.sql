-- Phase 3: Storage Security & Enhanced Audit Logging

-- =====================================================
-- STORAGE RLS POLICIES for medical-documents bucket
-- =====================================================

-- Policy: Patients can upload their own medical documents
CREATE POLICY "Patients can upload their own documents"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'medical-documents' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy: Patients can view their own medical documents
CREATE POLICY "Patients can view their own documents"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'medical-documents' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy: Doctors can view documents they uploaded or have access to
CREATE POLICY "Doctors can view granted patient documents"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'medical-documents' AND
  (
    -- Doctor uploaded the document
    EXISTS (
      SELECT 1 FROM public.medical_documents
      WHERE file_path = storage.objects.name
        AND uploaded_by = auth.uid()
    )
    OR
    -- Doctor has access permission to the patient
    EXISTS (
      SELECT 1 FROM public.medical_documents md
      JOIN public.document_access_permissions dap
        ON md.patient_id = dap.patient_id
      WHERE md.file_path = storage.objects.name
        AND dap.doctor_id = auth.uid()
        AND dap.is_active = true
        AND (dap.expires_at IS NULL OR dap.expires_at > now())
    )
  )
);

-- Policy: Doctors and hospital admins can upload documents for patients
CREATE POLICY "Healthcare providers can upload patient documents"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'medical-documents' AND
  public.has_role(auth.uid(), 'doctor'::app_role) OR
  public.has_role(auth.uid(), 'hospital_admin'::app_role)
);

-- Policy: Patients can delete their own documents
CREATE POLICY "Patients can delete their own documents"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'medical-documents' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- =====================================================
-- ENHANCED AUDIT LOGGING FUNCTIONS
-- =====================================================

-- Function: Log security events (failed auth, OTP, etc.)
CREATE OR REPLACE FUNCTION public.log_security_event(
  p_action text,
  p_description text,
  p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.activity_logs (user_id, action, description, metadata)
  VALUES (
    auth.uid(),
    p_action,
    p_description,
    p_metadata || jsonb_build_object(
      'ip_address', current_setting('request.headers', true)::json->>'x-forwarded-for',
      'user_agent', current_setting('request.headers', true)::json->>'user-agent',
      'timestamp', now()
    )
  );
END;
$$;

-- Function: Log file access events
CREATE OR REPLACE FUNCTION public.log_file_access(
  p_file_path text,
  p_action text,
  p_patient_id uuid DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.activity_logs (user_id, action, description, metadata)
  VALUES (
    auth.uid(),
    p_action,
    'File access: ' || p_action,
    jsonb_build_object(
      'file_path', p_file_path,
      'patient_id', p_patient_id,
      'timestamp', now()
    )
  );
END;
$$;

-- Function: Log access permission changes
CREATE OR REPLACE FUNCTION public.log_permission_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM public.log_security_event(
      'permission_granted',
      'Access permission granted',
      jsonb_build_object(
        'permission_id', NEW.id,
        'doctor_id', NEW.doctor_id,
        'patient_id', NEW.patient_id,
        'access_type', NEW.access_type,
        'expires_at', NEW.expires_at
      )
    );
  ELSIF TG_OP = 'UPDATE' AND OLD.is_active = true AND NEW.is_active = false THEN
    PERFORM public.log_security_event(
      'permission_revoked',
      'Access permission revoked',
      jsonb_build_object(
        'permission_id', NEW.id,
        'doctor_id', NEW.doctor_id,
        'patient_id', NEW.patient_id
      )
    );
  END IF;
  RETURN NEW;
END;
$$;

-- Trigger: Log permission changes
DROP TRIGGER IF EXISTS log_permission_changes ON public.document_access_permissions;
CREATE TRIGGER log_permission_changes
AFTER INSERT OR UPDATE ON public.document_access_permissions
FOR EACH ROW
EXECUTE FUNCTION public.log_permission_change();

-- Function: Log OTP verification attempts
CREATE OR REPLACE FUNCTION public.log_otp_verification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM public.log_security_event(
      'otp_generated',
      'OTP generated for ' || NEW.purpose,
      jsonb_build_object(
        'otp_id', NEW.id,
        'purpose', NEW.purpose,
        'patient_id', NEW.patient_id,
        'expires_at', NEW.expires_at
      )
    );
  ELSIF TG_OP = 'UPDATE' AND OLD.is_verified = false AND NEW.is_verified = true THEN
    PERFORM public.log_security_event(
      'otp_verified',
      'OTP successfully verified',
      jsonb_build_object(
        'otp_id', NEW.id,
        'purpose', NEW.purpose
      )
    );
  END IF;
  RETURN NEW;
END;
$$;

-- Trigger: Log OTP events
DROP TRIGGER IF EXISTS log_otp_events ON public.otp_verifications;
CREATE TRIGGER log_otp_events
AFTER INSERT OR UPDATE ON public.otp_verifications
FOR EACH ROW
EXECUTE FUNCTION public.log_otp_verification();

-- =====================================================
-- FILE TYPE VALIDATION FUNCTION
-- =====================================================

CREATE OR REPLACE FUNCTION public.validate_file_upload(
  p_file_name text,
  p_file_size bigint
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_extension text;
  v_allowed_extensions text[] := ARRAY['pdf', 'jpg', 'jpeg', 'png', 'doc', 'docx', 'dcm', 'dicom'];
  v_max_size bigint := 52428800; -- 50MB in bytes
BEGIN
  -- Extract file extension
  v_extension := lower(substring(p_file_name from '\.([^.]*)$'));
  
  -- Check file size
  IF p_file_size > v_max_size THEN
    RAISE EXCEPTION 'File size exceeds maximum allowed size of 50MB';
  END IF;
  
  -- Check file extension
  IF v_extension IS NULL OR NOT (v_extension = ANY(v_allowed_extensions)) THEN
    RAISE EXCEPTION 'File type not allowed. Allowed types: %', array_to_string(v_allowed_extensions, ', ');
  END IF;
  
  RETURN true;
END;
$$;