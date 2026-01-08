import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/components/auth/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, FileText, Trash2, Calendar, Hospital, AlertTriangle, RotateCcw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const TrashDocuments = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [trashedDocuments, setTrashedDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [restoringId, setRestoringId] = useState(null);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    fetchTrashedDocuments();
  }, [user, navigate]);

  const fetchTrashedDocuments = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('medical_documents')
        .select('*')
        .eq('patient_id', user.id)
        .eq('is_trashed', true)
        .order('trashed_at', { ascending: false });

      if (error) {
        console.error('Error fetching trashed documents:', error);
        toast({
          title: 'Error',
          description: 'Failed to load trashed documents.',
          variant: 'destructive',
        });
      } else {
        setTrashedDocuments(data || []);
      }
    } catch (error) {
      console.error('Trash fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async (documentId) => {
    if (!user) return;
    setRestoringId(documentId);
    try {
      const { error } = await supabase
        .from('medical_documents')
        .update({
          is_trashed: false,
          is_active: true,
          trashed_at: null,
          trashed_by: null,
        })
        .eq('id', documentId)
        .eq('patient_id', user.id);

      if (error) throw error;

      setTrashedDocuments((prev) => prev.filter((d) => d.id !== documentId));
      toast({
        title: 'Restored',
        description: 'Document restored to Medical Records.',
      });
    } catch (error) {
      console.error('Restore error:', error);
      const msg =
        (error && typeof error === 'object' && 'message' in error && error.message)
          ? String(error.message)
          : 'Failed to restore document.';

      toast({
        title: 'Error',
        description: msg,
        variant: 'destructive',
      });
    } finally {
      setRestoringId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-medical-light via-background to-muted flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-destructive/50 to-destructive rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Trash2 className="w-8 h-8 text-white" />
          </div>
          <p className="text-muted-foreground">Loading trash...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-medical-light via-background to-muted">
      <div className="container mx-auto px-4 py-8">
        <header className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate('/medical-records')}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Medical Records
          </Button>

          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-destructive/10 rounded-xl flex items-center justify-center">
              <Trash2 className="w-5 h-5 text-destructive" />
            </div>
            <h1 className="text-3xl font-bold">Trash</h1>
          </div>
          <p className="text-muted-foreground">
            Documents moved to trash after your deletion request.
          </p>
        </header>

        {trashedDocuments.length === 0 ? (
          <main>
            <Card className="border-0 bg-gradient-to-br from-card to-muted/30">
              <CardContent className="text-center py-12">
                <Trash2 className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
                <h2 className="text-xl font-semibold mb-2">Trash is Empty</h2>
                <p className="text-muted-foreground">No documents are in trash.</p>
              </CardContent>
            </Card>
          </main>
        ) : (
          <main className="space-y-4">
            <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800">
              <CardContent className="py-4">
                <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
                  <AlertTriangle className="w-5 h-5" />
                  <span className="text-sm font-medium">
                    You can restore documents back to Medical Records.
                  </span>
                </div>
              </CardContent>
            </Card>

            <section className="grid gap-4" aria-label="Trashed documents">
              {trashedDocuments.map((document) => (
                <Card key={document.id} className="border-0 bg-gradient-to-br from-card to-muted/30">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-destructive/10 rounded-xl flex items-center justify-center">
                          <FileText className="w-6 h-6 text-destructive" />
                        </div>
                        <div>
                          <CardTitle className="text-lg text-muted-foreground line-through">
                            {document.file_name}
                          </CardTitle>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <Badge variant="destructive">Deleted</Badge>
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

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRestore(document.id)}
                        disabled={restoringId === document.id}
                      >
                        <RotateCcw className="w-4 h-4 mr-1" />
                        {restoringId === document.id ? 'Restoring...' : 'Restore'}
                      </Button>
                    </div>
                  </CardHeader>

                  <CardContent>
                    {document.description && (
                      <p className="text-sm text-muted-foreground mb-2">{document.description}</p>
                    )}

                    <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                      {document.trashed_at && (
                        <div className="flex items-center gap-1">
                          <Trash2 className="w-3 h-3" />
                          Deleted: {new Date(document.trashed_at).toLocaleDateString()}
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        Uploaded: {new Date(document.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </section>
          </main>
        )}
      </div>
    </div>
  );
};

export default TrashDocuments;
