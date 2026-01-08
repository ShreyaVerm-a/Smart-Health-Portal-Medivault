import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/components/auth/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, FileText, Download, Eye, Calendar, Hospital, User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const PatientRecords = () => {
  const { user } = useAuth();
  const { patientId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [documents, setDocuments] = useState([]);
  const [patientInfo, setPatientInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    checkAccessAndFetchDocuments();
  }, [user, patientId, navigate]);

  const checkAccessAndFetchDocuments = async () => {
    if (!user || !patientId) return;

    try {
      // Check if doctor has access permission
      const { data: permissionData, error: permissionError } = await supabase
        .from('document_access_permissions')
        .select('*')
        .eq('doctor_id', user.id)
        .eq('patient_id', patientId)
        .eq('is_active', true)
        .maybeSingle();

      if (permissionError || !permissionData) {
        toast({
          title: 'Access Denied',
          description: 'You do not have permission to view this patient\'s records.',
          variant: 'destructive',
        });
        navigate('/dashboard');
        return;
      }

      setHasAccess(true);

      // Fetch patient info
      const { data: patientData, error: patientError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', patientId)
        .single();

      if (patientError) {
        console.error('Error fetching patient info:', patientError);
      } else {
        setPatientInfo(patientData);
      }

      // Fetch patient's documents
      const { data: docsData, error: docsError } = await supabase
        .from('medical_documents')
        .select('*')
        .eq('patient_id', patientId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (docsError) {
        console.error('Error fetching documents:', docsError);
        toast({
          title: 'Error',
          description: 'Failed to load medical documents.',
          variant: 'destructive',
        });
      } else {
        setDocuments(docsData || []);
      }
    } catch (error) {
      console.error('Access check error:', error);
      toast({
        title: 'Error',
        description: 'Failed to verify access permissions.',
        variant: 'destructive',
      });
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (document) => {
    try {
      const { data: docData, error: docError } = await supabase
        .from('medical_documents')
        .select('file_path')
        .eq('id', document.id)
        .single();

      if (docError || !docData) {
        toast({
          title: 'Error',
          description: 'Failed to find document.',
          variant: 'destructive',
        });
        return;
      }

      const { data, error } = await supabase.storage
        .from('medical-documents')
        .download(docData.file_path);

      if (error) {
        toast({
          title: 'Error',
          description: 'Failed to download document.',
          variant: 'destructive',
        });
        return;
      }

      const url = URL.createObjectURL(data);
      const a = globalThis.document.createElement('a');
      a.href = url;
      a.download = document.file_name;
      globalThis.document.body.appendChild(a);
      a.click();
      globalThis.document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: 'Success',
        description: 'Document downloaded successfully.',
      });
    } catch (error) {
      console.error('Download error:', error);
      toast({
        title: 'Error',
        description: 'Failed to download document.',
        variant: 'destructive',
      });
    }
  };

  const handlePreview = async (document) => {
    try {
      const { data: docData, error: docError } = await supabase
        .from('medical_documents')
        .select('file_path')
        .eq('id', document.id)
        .single();

      if (docError || !docData) {
        toast({
          title: 'Error',
          description: 'Failed to find document.',
          variant: 'destructive',
        });
        return;
      }

      const { data, error } = await supabase.storage
        .from('medical-documents')
        .createSignedUrl(docData.file_path, 3600);

      if (error) {
        toast({
          title: 'Error',
          description: 'Failed to generate preview link.',
          variant: 'destructive',
        });
        return;
      }

      window.open(data.signedUrl, '_blank');
    } catch (error) {
      console.error('Preview error:', error);
      toast({
        title: 'Error',
        description: 'Failed to preview document.',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-medical-light via-background to-muted flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-primary to-accent rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
            <FileText className="w-8 h-8 text-white" />
          </div>
          <p className="text-muted-foreground">Loading patient records...</p>
        </div>
      </div>
    );
  }

  if (!hasAccess) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-medical-light via-background to-muted">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/patient-search')}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Patient Search
          </Button>
          
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 bg-primary/10 rounded-xl flex items-center justify-center">
              <User className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">{patientInfo?.full_name || 'Patient Records'}</h1>
              <p className="text-muted-foreground">
                Patient ID: {patientInfo?.patient_id || patientId}
              </p>
            </div>
          </div>
        </div>

        {documents.length === 0 ? (
          <Card className="border-0 bg-gradient-to-br from-card to-muted/30">
            <CardContent className="text-center py-12">
              <FileText className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
              <h3 className="text-xl font-semibold mb-2">No Medical Records</h3>
              <p className="text-muted-foreground mb-4">
                This patient doesn't have any medical documents yet.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {documents.map((document) => (
              <Card key={document.id} className="border-0 bg-gradient-to-br from-card to-muted/30">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                        <FileText className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{document.file_name}</CardTitle>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="secondary">{document.document_type}</Badge>
                          {document.hospital_name && (
                            <Badge variant="outline" className="flex items-center gap-1">
                              <Hospital className="w-3 h-3" />
                              {document.hospital_name}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={() => handlePreview(document)}>
                        <Eye className="w-4 h-4 mr-1" />
                        Preview
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleDownload(document)}>
                        <Download className="w-4 h-4 mr-1" />
                        Download
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                
                {(document.description || document.date_of_document) && (
                  <CardContent>
                    {document.description && (
                      <p className="text-sm text-muted-foreground mb-2">{document.description}</p>
                    )}
                    
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      {document.date_of_document && (
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          Document Date: {new Date(document.date_of_document).toLocaleDateString()}
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        Uploaded: {new Date(document.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    
                    {document.tags && document.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-3">
                        {document.tags.map((tag, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PatientRecords;
