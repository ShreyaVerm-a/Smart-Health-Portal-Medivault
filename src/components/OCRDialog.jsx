import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { Copy, Loader2, FileText, Check } from 'lucide-react';
import { extractText } from '@/utils/ocr';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const OCRDialog = ({ open, onOpenChange, document }) => {
  const { toast } = useToast();
  const [extracting, setExtracting] = useState(false);
  const [extractedText, setExtractedText] = useState(document?.extracted_text || '');
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState('');
  const [copied, setCopied] = useState(false);

  const handleExtractText = async () => {
    if (!document) return;

    setExtracting(true);
    setProgress(0);
    setProgressMessage('Preparing...');

    try {
      // Download the image file
      const { data: fileData, error: downloadError } = await supabase.storage
        .from('medical-documents')
        .download(document.file_path);

      if (downloadError) {
        throw downloadError;
      }

      // Extract text using OCR (supports both images and PDFs)
      const result = await extractText(fileData, (progressData) => {
        setProgress(progressData.progress);
        setProgressMessage(progressData.message);
      });

      if (result.success) {
        setExtractedText(result.text);

        // Save extracted text to database
        const { error: updateError } = await supabase
          .from('medical_documents')
          .update({ extracted_text: result.text })
          .eq('id', document.id);

        if (updateError) {
          console.error('Error saving extracted text:', updateError);
        }

        toast({
          title: 'Text Extracted',
          description: 'Handwritten text has been successfully extracted.',
        });
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('OCR error:', error);
      toast({
        title: 'Extraction Failed',
        description: error.message || 'Failed to extract text from document.',
        variant: 'destructive',
      });
    } finally {
      setExtracting(false);
      setProgress(0);
      setProgressMessage('');
    }
  };

  const handleCopyText = () => {
    navigator.clipboard.writeText(extractedText);
    setCopied(true);
    toast({
      title: 'Copied',
      description: 'Text copied to clipboard.',
    });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            OCR Text Extraction
          </DialogTitle>
          <DialogDescription>
            Extract text from handwritten medical documents using AI-powered OCR
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {extracting && (
            <div className="space-y-2">
              <Progress value={progress} className="w-full" />
              <p className="text-sm text-muted-foreground text-center">{progressMessage}</p>
            </div>
          )}

          {!extracting && !extractedText && (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">
                Click the button below to extract text from this handwritten document.
              </p>
              <Button onClick={handleExtractText} disabled={extracting}>
                <FileText className="mr-2 h-4 w-4" />
                Extract Text
              </Button>
            </div>
          )}

          {extractedText && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Extracted Text</label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyText}
                  disabled={copied}
                >
                  {copied ? (
                    <>
                      <Check className="mr-2 h-4 w-4" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="mr-2 h-4 w-4" />
                      Copy
                    </>
                  )}
                </Button>
              </div>
              <Textarea
                value={extractedText}
                readOnly
                className="min-h-[300px] font-mono text-sm"
                placeholder="Extracted text will appear here..."
              />
              {!extracting && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleExtractText}
                  className="w-full"
                >
                  <Loader2 className="mr-2 h-4 w-4" />
                  Re-extract Text
                </Button>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
