-- Add is_handwritten field to medical_documents table
ALTER TABLE public.medical_documents 
ADD COLUMN is_handwritten BOOLEAN DEFAULT false;

-- Add extracted_text field to store OCR results
ALTER TABLE public.medical_documents 
ADD COLUMN extracted_text TEXT DEFAULT NULL;

COMMENT ON COLUMN public.medical_documents.is_handwritten IS 'Indicates if the document contains handwritten content';
COMMENT ON COLUMN public.medical_documents.extracted_text IS 'OCR extracted text from handwritten documents';