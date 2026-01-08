import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Copy, Check, FileText, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export const ExtractedTextViewer = ({ open, onOpenChange, document }) => {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const handleCopyText = () => {
    navigator.clipboard.writeText(document?.extracted_text || '');
    setCopied(true);
    toast({
      title: 'Copied',
      description: 'Text copied to clipboard.',
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadText = () => {
    const text = document?.extracted_text || '';
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = globalThis.document.createElement('a');
    a.href = url;
    a.download = `${document?.file_name?.replace(/\.[^/.]+$/, '') || 'extracted'}_OCR.txt`;
    globalThis.document.body.appendChild(a);
    a.click();
    globalThis.document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: 'Downloaded',
      description: 'OCR text file downloaded.',
    });
  };

  if (!document?.extracted_text) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Extracted OCR Text
          </DialogTitle>
          <DialogDescription>
            OCR extracted text from: {document.file_name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadText}
            >
              <Download className="mr-2 h-4 w-4" />
              Download as TXT
            </Button>
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
            value={document.extracted_text}
            readOnly
            className="min-h-[400px] font-mono text-sm bg-muted/30"
            placeholder="No extracted text available..."
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};
