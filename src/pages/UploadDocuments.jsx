import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/components/auth/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, Upload, FileText, User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const UploadDocuments = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState(null);
  const [formData, setFormData] = useState({
    patientEmail: '',
    documentType: '',
    hospitalName: '',
    doctorName: '',
    description: '',
    dateOfDocument: '',
    tags: '',
    isHandwritten: false
  });
  const [selectedFile, setSelectedFile] = useState(null);

  React.useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    fetchProfile();
  }, [user, navigate]);

  const fetchProfile = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
      } else {
        setProfile(data);
        // Pre-fill doctor name and hospital from profile
        setFormData(prev => ({
          ...prev,
          hospitalName: data.hospital_affiliation || '',
          doctorName: data.full_name || ''
        }));
      }
    } catch (error) {
      console.error('Profile fetch error:', error);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFile || !user) return;

    setLoading(true);

    try {
      // First, find the patient by email or patient ID
      const searchField = formData.patientEmail.includes('@') ? 'email' : 'patient_id';
      const { data: patientProfile, error: patientError } = await supabase
        .from('profiles')
        .select('user_id, patient_id, email, full_name')
        .eq(searchField, formData.patientEmail)
        .eq('role', 'patient')
        .maybeSingle();

      if (patientError || !patientProfile) {
        toast({
          title: 'Patient Not Found',
          description: 'No patient found with this email address.',
          variant: 'destructive',
        });
        setLoading(false);
        return;
      }

      // Upload file to storage
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('medical-documents')
        .upload(fileName, selectedFile);

      if (uploadError) {
        throw uploadError;
      }

      // Save document metadata to database
      const { error: dbError } = await supabase
        .from('medical_documents')
        .insert({
          patient_id: patientProfile.user_id,
          uploaded_by: user.id,
          file_name: selectedFile.name,
          file_path: fileName,
          file_type: selectedFile.type,
          document_type: formData.documentType,
          is_handwritten: formData.isHandwritten,
          hospital_name: formData.hospitalName || null,
          description: `Dr. ${formData.doctorName}${formData.description ? ` - ${formData.description}` : ''}`,
          date_of_document: formData.dateOfDocument || null,
          tags: formData.tags ? formData.tags.split(',').map(tag => tag.trim()) : null
        });

      if (dbError) {
        throw dbError;
      }

      toast({
        title: 'Document Uploaded',
        description: 'Medical document has been uploaded successfully.',
      });

      // Reset form (keep doctor name and hospital pre-filled)
      setFormData({
        patientEmail: '',
        documentType: '',
        hospitalName: profile?.hospital_affiliation || '',
        doctorName: profile?.full_name || '',
        description: '',
        dateOfDocument: '',
        tags: '',
        isHandwritten: false
      });
      setSelectedFile(null);
      
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: 'Upload Failed',
        description: 'Failed to upload document. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-medical-light via-background to-muted">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="mb-8">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/dashboard')}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          
          <h1 className="text-3xl font-bold mb-2">Upload Medical Documents</h1>
          <p className="text-muted-foreground">
            Upload medical documents for your patients
          </p>
        </div>

        <Card className="border-0 bg-gradient-to-br from-card to-muted/30">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                <Upload className="w-6 h-6 text-primary" />
              </div>
              <div>
                <CardTitle>Document Upload Form</CardTitle>
                <CardDescription>
                  Fill in the patient and document details
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="patientEmail">Patient Email or Patient ID</Label>
                <Input
                  id="patientEmail"
                  value={formData.patientEmail}
                  onChange={(e) => handleInputChange('patientEmail', e.target.value)}
                  placeholder="patient@example.com or PAT-12345678"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="file">Medical Document</Label>
                <Input
                  id="file"
                  type="file"
                  onChange={handleFileChange}
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Supported formats: PDF, JPG, PNG, DOC, DOCX
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="documentType">Document Type</Label>
                <Select 
                  value={formData.documentType} 
                  onValueChange={(value) => handleInputChange('documentType', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select document type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="blood_test">Blood Test</SelectItem>
                    <SelectItem value="x_ray">X-Ray</SelectItem>
                    <SelectItem value="mri">MRI Scan</SelectItem>
                    <SelectItem value="ct_scan">CT Scan</SelectItem>
                    <SelectItem value="prescription">Prescription</SelectItem>
                    <SelectItem value="discharge_summary">Discharge Summary</SelectItem>
                    <SelectItem value="consultation_notes">Consultation Notes</SelectItem>
                    <SelectItem value="vaccination_record">Vaccination Record</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div className="space-y-0.5">
                  <Label htmlFor="isHandwritten" className="text-base font-medium">
                    Handwritten Document
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Toggle if this document contains handwritten content
                  </p>
                </div>
                <Switch
                  id="isHandwritten"
                  checked={formData.isHandwritten}
                  onCheckedChange={(checked) => handleInputChange('isHandwritten', checked)}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="doctorName">Doctor Name</Label>
                  <Input
                    id="doctorName"
                    value={formData.doctorName}
                    onChange={(e) => handleInputChange('doctorName', e.target.value)}
                    placeholder="Dr. John Smith"
                    disabled
                    className="bg-muted"
                  />
                  <p className="text-xs text-muted-foreground">
                    Auto-filled from your profile
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="hospitalName">Hospital/Clinic Name</Label>
                  <Input
                    id="hospitalName"
                    value={formData.hospitalName}
                    onChange={(e) => handleInputChange('hospitalName', e.target.value)}
                    placeholder="General Hospital"
                    disabled
                    className="bg-muted"
                  />
                  <p className="text-xs text-muted-foreground">
                    Auto-filled from your profile
                  </p>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="dateOfDocument">Document Date</Label>
                <Input
                  id="dateOfDocument"
                  type="date"
                  value={formData.dateOfDocument}
                  onChange={(e) => handleInputChange('dateOfDocument', e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Brief description of the document or findings..."
                  rows={3}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="tags">Tags (comma-separated)</Label>
                <Input
                  id="tags"
                  value={formData.tags}
                  onChange={(e) => handleInputChange('tags', e.target.value)}
                  placeholder="diabetes, cardiology, follow-up"
                />
              </div>
              
              <Button 
                type="submit" 
                className="w-full" 
                disabled={loading || !selectedFile}
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Document
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default UploadDocuments;