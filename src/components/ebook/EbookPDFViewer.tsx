import { useState, useCallback } from 'react';
import { X, Loader2, ShoppingCart, Lock, MessageSquare, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

interface EbookPDFViewerProps {
  isOpen: boolean;
  onClose: () => void;
  ebookId: string;
  ebookTitle: string;
  hasAccess: boolean;
  previewPages?: number;
  onPurchaseRequest?: (ebookId: string, ebookTitle: string) => void;
}

export function EbookPDFViewer({
  isOpen,
  onClose,
  ebookId,
  ebookTitle,
  hasAccess,
  previewPages = 15,
  onPurchaseRequest,
}: EbookPDFViewerProps) {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [driveFileId, setDriveFileId] = useState<string | null>(null);
  const [iframeLoaded, setIframeLoaded] = useState(false);

  const fetchDriveId = useCallback(async () => {
    setLoading(true);
    setIframeLoaded(false);
    try {
      const { data, error } = await supabase
        .from('ebooks')
        .select('drive_file_id, file_url')
        .eq('id', ebookId)
        .single();

      if (error || !data) throw new Error('eBook not found');

      let fileId = data.drive_file_id;
      if (!fileId && data.file_url) {
        const byPath = data.file_url.match(/\/d\/([a-zA-Z0-9_-]+)/)?.[1];
        const byParam = data.file_url.match(/[?&]id=([a-zA-Z0-9_-]+)/)?.[1];
        fileId = byPath || byParam || null;
      }
      setDriveFileId(fileId);
    } catch (err: any) {
      toast({ title: 'Error', description: err?.message || 'Could not load eBook info', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [ebookId, toast]);

  useState(() => {
    if (isOpen && ebookId) {
      fetchDriveId();
    }
  });

  const handlePurchase = () => {
    if (onPurchaseRequest) {
      onPurchaseRequest(ebookId, ebookTitle);
      onClose();
      return;
    }
    onClose();
    navigate('/ebooks');
  };

  const handleDownloadRequest = () => {
    onClose();
    navigate('/contact');
    toast({
      title: 'Download Request',
      description: 'Please submit a download request via the contact form. Additional charges may apply based on your request.',
    });
  };

  const drivePreviewUrl = driveFileId
    ? `https://drive.google.com/file/d/${driveFileId}/preview`
    : null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[98vw] w-[98vw] h-[96vh] p-0 overflow-hidden bg-background border-border/40 flex flex-col">
        <div className="flex items-center justify-between px-3 py-2 border-b border-border/40 bg-card/60 shrink-0">
          <div className="min-w-0 flex-1 flex items-center gap-2">
            <h3 className="text-sm font-semibold truncate">{ebookTitle}</h3>
            <Badge variant="outline" className="text-[10px] border-border/40 shrink-0">
              {hasAccess ? 'Full Access' : 'Preview'}
            </Badge>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {hasAccess && (
              <Button variant="outline" size="sm" className="hidden sm:flex gap-1.5 h-7 text-xs" onClick={handleDownloadRequest}>
                <MessageSquare className="h-3 w-3" />
                Request Download
              </Button>
            )}
            {!hasAccess && (
              <Button size="sm" className="gap-1.5 h-7 text-xs bg-primary text-primary-foreground" onClick={handlePurchase}>
                <ShoppingCart className="h-3 w-3" />
                <span className="hidden sm:inline">Purchase</span>
              </Button>
            )}
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Download notice banner */}
        <div className="px-3 py-1.5 bg-muted/30 border-b border-border/20 shrink-0">
          <p className="text-[11px] text-muted-foreground flex items-center gap-1.5">
            <Info className="h-3 w-3 shrink-0" />
            Downloads are available on request and may involve additional charges depending on your plan. Contact us for details.
          </p>
        </div>

        <div className="flex-1 min-h-0 relative">
          {loading && (
            <div className="h-full flex items-center justify-center">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
                Loading eBook...
              </div>
            </div>
          )}

          {!loading && drivePreviewUrl && (
            <>
              {!iframeLoaded && (
                <div className="absolute inset-0 flex items-center justify-center z-10 bg-background">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Loading preview...
                  </div>
                </div>
              )}
              <iframe
                src={drivePreviewUrl}
                className="w-full h-full border-0"
                allow="autoplay"
                sandbox="allow-scripts allow-same-origin"
                onLoad={() => setIframeLoaded(true)}
                title={`Preview: ${ebookTitle}`}
              />
            </>
          )}

          {!loading && !drivePreviewUrl && !driveFileId && (
            <div className="h-full flex flex-col items-center justify-center gap-4 px-6 text-center">
              <Lock className="h-10 w-10 text-muted-foreground/50" />
              <p className="text-muted-foreground">Preview is not available for this eBook.</p>
              {!hasAccess && (
                <Button onClick={handlePurchase} className="gap-2">
                  <ShoppingCart className="h-4 w-4" />
                  Purchase to Access
                </Button>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
