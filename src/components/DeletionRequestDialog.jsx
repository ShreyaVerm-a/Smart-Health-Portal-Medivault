import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Trash2, AlertTriangle } from 'lucide-react';

export const DeletionRequestDialog = ({ open, onOpenChange, document, onSuccess }) => {
  const { toast } = useToast();
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!document) return;

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: 'Error',
          description: 'You must be logged in to request deletion.',
          variant: 'destructive',
        });
        return;
      }

      // Check if there's already a pending request for this document
      const { data: existingRequest } = await supabase
        .from('document_deletion_requests')
        .select('id')
        .eq('document_id', document.id)
        .eq('status', 'pending')
        .maybeSingle();

      if (existingRequest) {
        toast({
          title: 'Request Exists',
          description: 'A deletion request for this document is already pending.',
          variant: 'destructive',
        });
        return;
      }

      const { error } = await supabase
        .from('document_deletion_requests')
        .insert({
          document_id: document.id,
          patient_id: user.id,
          reason: reason.trim() || null,
          status: 'pending',
        });

      if (error) throw error;

      toast({
        title: 'Request Submitted',
        description: 'Your deletion request has been submitted. A hospital admin will process it.',
      });

      setReason('');
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error('Error submitting deletion request:', error);
      toast({
        title: 'Error',
        description: 'Failed to submit deletion request.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trash2 className="w-5 h-5 text-destructive" />
            Request Document Deletion
          </DialogTitle>
          <DialogDescription>
            Submit a request to delete this document. A hospital admin will verify your identity via OTP before processing.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
              <div className="text-sm text-amber-700 dark:text-amber-400">
                <p className="font-medium">Document to be deleted:</p>
                <p>{document?.file_name}</p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">Reason for deletion (optional)</Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Explain why you want this document deleted..."
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleSubmit} disabled={loading}>
            {loading ? 'Submitting...' : 'Submit Request'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
