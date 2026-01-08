-- Allow patients to update their own documents (specifically for extracted_text)
CREATE POLICY "Patients can update their own documents" 
ON public.medical_documents 
FOR UPDATE 
USING (patient_id = auth.uid())
WITH CHECK (patient_id = auth.uid());