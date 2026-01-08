import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/components/auth/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, FileText, Download, Eye, Calendar, Hospital, FileType, ScanText, Trash2, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { OCRDialog } from '@/components/OCRDialog';
import { ExtractedTextViewer } from '@/components/ExtractedTextViewer';
import { DeletionRequestDialog } from '@/components/DeletionRequestDialog';

const MedicalRecords = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [documents, setDocuments] = useState([]);
  const [pendingDeletions, setPendingDeletions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ocrDialogOpen, setOcrDialogOpen] = useState(false);
  const [textViewerOpen, setTextViewerOpen] = useState(false);
  const [deletionDialogOpen, setDeletionDialogOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState(null);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    fetchDocuments();
  }, [user, navigate]);

  const fetchDocuments = async () => {
    if (!user) return;

    try {
      // Fetch active documents
      const { data, error } = await supabase
        .from('medical_documents')
        .select('*')
        .eq('patient_id', user.id)
        .eq('is_active', true)
        .eq('is_trashed', false)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching documents:', error);
        toast({
          title: 'Error',
          description: 'Failed to load medical documents.',
          variant: 'destructive',
        });
      } else {
        setDocuments(data || []);
      }

      // Fetch pending deletion requests
      const { data: deletionData } = await supabase
        .from('document_deletion_requests')
        .select('document_id')
        .eq('patient_id', user.id)
        .eq('status', 'pending');

      setPendingDeletions(deletionData?.map(d => d.document_id) || []);
    } catch (error) {
      console.error('Documents fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const logActivity = async (action, description) => {
    // For now, we'll skip the activity logging since the types aren't updated yet
    // This will be implemented when the database schema is properly synced
    console.log(`Activity: ${action} - ${description}`);
  };

  const handleDownload = async (document) => {
    try {
      // Get the correct file path from the database
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

      // Log activity
      await logActivity('document_download', `Downloaded ${document.file_name}`);
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
        .createSignedUrl(docData.file_path, 3600); // 1 hour expiry

      if (error) {
        toast({
          title: 'Error',
          description: 'Failed to generate preview link.',
          variant: 'destructive',
        });
        return;
      }

      // Open in new tab for preview
      window.open(data.signedUrl, '_blank');

      // Log activity
      await logActivity('document_preview', `Previewed ${document.file_name}`);
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
          <p className="text-muted-foreground">Loading your medical records...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-medical-light via-background to-muted">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <Button 
              variant="ghost" 
              onClick={() => navigate('/dashboard')}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
            <Button 
              variant="outline" 
              onClick={() => navigate('/trash')}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              View Trash
            </Button>
          </div>
          
          <h1 className="text-3xl font-bold mb-2">Medical Records</h1>
          <p className="text-muted-foreground">
            View and manage your medical documents and reports
          </p>
        </div>

        {documents.length === 0 ? (
          <Card className="border-0 bg-gradient-to-br from-card to-muted/30">
            <CardContent className="text-center py-12">
              <FileText className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
              <h3 className="text-xl font-semibold mb-2">No Medical Records</h3>
              <p className="text-muted-foreground mb-4">
                You don't have any medical documents yet. When your doctor uploads documents, they will appear here.
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
                          {document.is_handwritten && (
                            <Badge variant="outline" className="flex items-center gap-1 bg-amber-500/10 text-amber-700 dark:text-amber-400">
                              <FileType className="w-3 h-3" />
                              Handwritten
                            </Badge>
                          )}
                          {document.extracted_text && (
                            <Badge variant="outline" className="flex items-center gap-1 bg-green-500/10 text-green-700 dark:text-green-400">
                              <ScanText className="w-3 h-3" />
                              OCR Available
                            </Badge>
                          )}
                          {document.hospital_name && (
                            <Badge variant="outline" className="flex items-center gap-1">
                              <Hospital className="w-3 h-3" />
                              {document.hospital_name}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 flex-wrap">
                      <Button variant="outline" size="sm" onClick={() => handlePreview(document)}>
                        <Eye className="w-4 h-4 mr-1" />
                        Preview
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleDownload(document)}>
                        <Download className="w-4 h-4 mr-1" />
                        Download
                      </Button>
                      {document.extracted_text && (
                        <Button 
                          variant="secondary" 
                          size="sm" 
                          onClick={() => {
                            setSelectedDocument(document);
                            setTextViewerOpen(true);
                          }}
                        >
                          <ScanText className="w-4 h-4 mr-1" />
                          View OCR Text
                        </Button>
                      )}
                      {document.is_handwritten && (
                        <Button 
                          variant="default" 
                          size="sm" 
                          onClick={() => {
                            setSelectedDocument(document);
                            setOcrDialogOpen(true);
                          }}
                        >
                          <FileType className="w-4 h-4 mr-1" />
                          {document.extracted_text ? 'Re-extract' : 'Extract Text'}
                        </Button>
                      )}
                      {pendingDeletions.includes(document.id) ? (
                        <Badge variant="outline" className="flex items-center gap-1 bg-amber-500/10 text-amber-700 dark:text-amber-400">
                          <Clock className="w-3 h-3" />
                          Deletion Pending
                        </Badge>
                      ) : (
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => {
                            setSelectedDocument(document);
                            setDeletionDialogOpen(true);
                          }}
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          Request Deletion
                        </Button>
                      )}
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

      <OCRDialog
        open={ocrDialogOpen}
        onOpenChange={(open) => {
          setOcrDialogOpen(open);
          if (!open) fetchDocuments(); // Refresh to show updated extracted_text
        }}
        document={selectedDocument}
      />

      <ExtractedTextViewer
        open={textViewerOpen}
        onOpenChange={setTextViewerOpen}
        document={selectedDocument}
      />

      <DeletionRequestDialog
        open={deletionDialogOpen}
        onOpenChange={setDeletionDialogOpen}
        document={selectedDocument}
        onSuccess={fetchDocuments}
      />
    </div>
  );
};

export default MedicalRecords;