import { useState, useCallback } from 'react';
import { X, Download, Loader2, ExternalLink, ShoppingCart, Lock } from 'lucide-react';
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
  const [downloading, setDownloading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [driveFileId, setDriveFileId] = useState<string | null>(null);
  const [iframeLoaded, setIframeLoaded] = useState(false);

  // Fetch the drive_file_id for this ebook to build Google Drive preview URL
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

      // Try to extract from file_url if drive_file_id is not set
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

  // Fetch on open
  useState(() => {
    if (isOpen && ebookId) {
      fetchDriveId();
    }
  });

  const handleDownload = async () => {
    if (!hasAccess) {
      toast({ title: 'Purchase Required', description: 'Please purchase this eBook to download.', variant: 'destructive' });
      return;
    }

    setDownloading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Please login to download');

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

      const response = await fetch(`${supabaseUrl}/functions/v1/download-ebook`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
          apikey: anonKey,
        },
        body: JSON.stringify({ ebookId }),
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        throw new Error(errorBody.error || 'Download failed');
      }

      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = objectUrl;
      anchor.download = `${ebookTitle.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_')}.pdf`;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      URL.revokeObjectURL(objectUrl);

      toast({ title: 'Download started', description: `Downloading ${ebookTitle}` });
    } catch (err: any) {
      toast({ title: 'Download failed', description: err?.message || 'Please try again.', variant: 'destructive' });
    } finally {
      setDownloading(false);
    }
  };

  const handlePurchase = () => {
    if (onPurchaseRequest) {
      onPurchaseRequest(ebookId, ebookTitle);
      onClose();
      return;
    }
    onClose();
    navigate('/ebooks');
  };

  const openInNewTab = () => {
    if (driveFileId) {
      window.open(`https://drive.google.com/file/d/${driveFileId}/preview`, '_blank');
    }
  };

  const drivePreviewUrl = driveFileId
    ? `https://drive.google.com/file/d/${driveFileId}/preview`
    : null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[98vw] w-[98vw] h-[96vh] p-0 overflow-hidden bg-background border-border/40 flex flex-col">
        {/* Compact Header */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-border/40 bg-card/60 shrink-0">
          <div className="min-w-0 flex-1 flex items-center gap-2">
            <h3 className="text-sm font-semibold truncate">{ebookTitle}</h3>
            <Badge variant="outline" className="text-[10px] border-border/40 shrink-0">
              {hasAccess ? 'Full Access' : 'Preview'}
            </Badge>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {drivePreviewUrl && (
              <Button variant="outline" size="sm" className="hidden sm:flex gap-1.5 h-7 text-xs" onClick={openInNewTab}>
                <ExternalLink className="h-3 w-3" />
                New Tab
              </Button>
            )}
            {hasAccess && (
              <Button variant="outline" size="sm" className="gap-1.5 h-7 text-xs" onClick={handleDownload} disabled={downloading}>
                {downloading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Download className="h-3 w-3" />}
                <span className="hidden sm:inline">Download</span>
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

        {/* Content - takes all remaining space */}
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
                onLoad={() => setIframeLoaded(true)}
                title={`Preview: ${ebookTitle}`}
              />
            </>
          )}

          {!loading && !drivePreviewUrl && !driveFileId && (
            <div className="h-full flex flex-col items-center justify-center gap-4 px-6 text-center">
              <Lock className="h-10 w-10 text-muted-foreground/50" />
              <p className="text-muted-foreground">Preview is not available for this eBook.</p>
              {hasAccess ? (
                <Button onClick={handleDownload} disabled={downloading} className="gap-2">
                  {downloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                  Download PDF
                </Button>
              ) : (
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
