-- Ensure document deletion approvals always trash the document, even if the approving user lacks UPDATE/SELECT on medical_documents

-- 1) Helper function to trash a document (runs with elevated privileges)
CREATE OR REPLACE FUNCTION public.trash_document_after_approval(p_request_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_doc_id uuid;
  v_patient_id uuid;
  v_processed_by uuid;
  v_status text;
BEGIN
  SELECT document_id, patient_id, processed_by, status
    INTO v_doc_id, v_patient_id, v_processed_by, v_status
  FROM public.document_deletion_requests
  WHERE id = p_request_id;

  IF v_doc_id IS NULL THEN
    RETURN;
  END IF;

  -- Only act on approved requests
  IF v_status IS DISTINCT FROM 'approved' THEN
    RETURN;
  END IF;

  -- Trash the document
  UPDATE public.medical_documents
  SET is_trashed = true,
      is_active = false,
      trashed_at = COALESCE(trashed_at, now()),
      trashed_by = COALESCE(trashed_by, v_processed_by),
      updated_at = now()
  WHERE id = v_doc_id
    AND patient_id = v_patient_id;
END;
$$;

-- 2) Trigger function that runs after approval
CREATE OR REPLACE FUNCTION public.on_deletion_request_approved_trash_document()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- fire only when status transitions to approved
  IF (TG_OP = 'UPDATE') AND (OLD.status IS DISTINCT FROM 'approved') AND (NEW.status = 'approved') THEN
    PERFORM public.trash_document_after_approval(NEW.id);
  END IF;
  RETURN NEW;
END;
$$;

-- 3) Create trigger
DROP TRIGGER IF EXISTS trg_deletion_request_approved_trash_document ON public.document_deletion_requests;
CREATE TRIGGER trg_deletion_request_approved_trash_document
AFTER UPDATE OF status, processed_by, processed_at ON public.document_deletion_requests
FOR EACH ROW
EXECUTE FUNCTION public.on_deletion_request_approved_trash_document();

-- 4) (Optional safety) ensure RLS enabled on involved tables (should already be)
ALTER TABLE public.document_deletion_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medical_documents ENABLE ROW LEVEL SECURITY;