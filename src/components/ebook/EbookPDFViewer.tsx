import { useState, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  ChevronLeft, 
  ChevronRight, 
  ZoomIn, 
  ZoomOut, 
  Lock,
  Download,
  Loader2,
  BookOpen,
  Eye,
  ShoppingCart
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

// Set up PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface EbookPDFViewerProps {
  isOpen: boolean;
  onClose: () => void;
  ebookId: string;
  ebookTitle: string;
  hasAccess: boolean;
  previewPages?: number;
}

export function EbookPDFViewer({ 
  isOpen, 
  onClose, 
  ebookId, 
  ebookTitle, 
  hasAccess,
  previewPages = 15 
}: EbookPDFViewerProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.0);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const maxViewablePages = hasAccess ? numPages : previewPages;
  const isPageLocked = !hasAccess && currentPage > previewPages;

  useEffect(() => {
    if (isOpen && ebookId) {
      fetchPdfUrl();
    }
    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [isOpen, ebookId]);

  const fetchPdfUrl = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Get ebook details to find the drive_file_id
      const { data: ebook, error: ebookError } = await supabase
        .from('ebooks')
        .select('drive_file_id, file_url')
        .eq('id', ebookId)
        .single();

      if (ebookError || !ebook) {
        throw new Error('eBook not found');
      }

      // For preview mode, we fetch via a preview edge function
      // For full access, we use the download function
      const functionName = hasAccess ? 'download-ebook' : 'preview-ebook';
      
      const response = await supabase.functions.invoke(functionName, {
        body: { ebookId, previewPages },
      });

      if (response.error) {
        throw new Error(response.error.message || 'Failed to load PDF');
      }

      // Create blob URL for the PDF
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      setPdfUrl(url);
    } catch (err: any) {
      console.error('Error loading PDF:', err);
      setError(err.message || 'Failed to load PDF');
    } finally {
      setLoading(false);
    }
  };

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setCurrentPage(1);
  };

  const goToPrevPage = () => {
    setCurrentPage(prev => Math.max(1, prev - 1));
  };

  const goToNextPage = () => {
    const maxPage = hasAccess ? numPages : Math.min(previewPages, numPages);
    setCurrentPage(prev => Math.min(maxPage, prev + 1));
  };

  const zoomIn = () => {
    setScale(prev => Math.min(2.0, prev + 0.2));
  };

  const zoomOut = () => {
    setScale(prev => Math.max(0.5, prev - 0.2));
  };

  const handleDownload = async () => {
    if (!hasAccess) {
      toast({
        title: 'Purchase Required',
        description: 'Please purchase this eBook to download',
        variant: 'destructive',
      });
      return;
    }

    setDownloading(true);
    try {
      const response = await supabase.functions.invoke('download-ebook', {
        body: { ebookId },
      });

      if (response.error) throw response.error;

      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${ebookTitle.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_')}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: 'Download Started',
        description: `Downloading "${ebookTitle}"`,
      });
    } catch (error: any) {
      toast({
        title: 'Download Failed',
        description: error.message || 'Failed to download eBook',
        variant: 'destructive',
      });
    } finally {
      setDownloading(false);
    }
  };

  const handlePurchase = () => {
    onClose();
    navigate('/ebooks');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl w-[95vw] h-[90vh] p-0 overflow-hidden bg-background/95 backdrop-blur-xl">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b bg-card/50">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <BookOpen className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-sm line-clamp-1">{ebookTitle}</h3>
              <div className="flex items-center gap-2">
                {hasAccess ? (
                  <Badge className="bg-success/20 text-success border-success/30 text-xs">
                    Full Access
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-xs">
                    <Eye className="h-3 w-3 mr-1" />
                    Preview Mode
                  </Badge>
                )}
                {numPages > 0 && (
                  <span className="text-xs text-muted-foreground">
                    {currentPage} / {hasAccess ? numPages : `${previewPages} preview pages`}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Zoom Controls */}
            <div className="flex items-center gap-1 border rounded-lg p-1">
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={zoomOut}>
                <ZoomOut className="h-4 w-4" />
              </Button>
              <span className="text-xs w-12 text-center">{Math.round(scale * 100)}%</span>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={zoomIn}>
                <ZoomIn className="h-4 w-4" />
              </Button>
            </div>

            {hasAccess && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleDownload}
                disabled={downloading}
                className="gap-2"
              >
                {downloading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
                Download
              </Button>
            )}

            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* PDF Content */}
        <div className="flex-1 overflow-auto bg-muted/30 relative">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-full gap-4">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <p className="text-muted-foreground">Loading PDF...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-full gap-4">
              <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center">
                <X className="h-8 w-8 text-destructive" />
              </div>
              <p className="text-muted-foreground">{error}</p>
              <Button variant="outline" onClick={fetchPdfUrl}>
                Try Again
              </Button>
            </div>
          ) : pdfUrl ? (
            <div className="flex flex-col items-center py-6 min-h-full">
              <Document
                file={pdfUrl}
                onLoadSuccess={onDocumentLoadSuccess}
                loading={
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-6 w-6 animate-spin" />
                    Loading document...
                  </div>
                }
                error={
                  <div className="text-destructive">Failed to load PDF</div>
                }
              >
                <div className="relative">
                  <Page
                    pageNumber={currentPage}
                    scale={scale}
                    className="shadow-2xl rounded-lg overflow-hidden"
                    renderTextLayer={false}
                    renderAnnotationLayer={false}
                  />
                  
                  {/* Locked Page Overlay */}
                  <AnimatePresence>
                    {!hasAccess && currentPage >= previewPages && numPages > previewPages && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-gradient-to-t from-background via-background/95 to-background/50 flex flex-col items-center justify-center backdrop-blur-sm"
                      >
                        <div className="h-20 w-20 rounded-full bg-primary/20 flex items-center justify-center mb-4">
                          <Lock className="h-10 w-10 text-primary" />
                        </div>
                        <h3 className="text-xl font-bold mb-2">Preview Limit Reached</h3>
                        <p className="text-muted-foreground text-center mb-6 max-w-md px-4">
                          You've reached the end of the free preview. 
                          Purchase this eBook to unlock all {numPages} pages.
                        </p>
                        <Button onClick={handlePurchase} className="gap-2">
                          <ShoppingCart className="h-4 w-4" />
                          Purchase to Continue Reading
                        </Button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </Document>
            </div>
          ) : null}
        </div>

        {/* Footer Navigation */}
        <div className="flex items-center justify-between px-4 py-3 border-t bg-card/50">
          <Button
            variant="outline"
            onClick={goToPrevPage}
            disabled={currentPage <= 1}
            className="gap-2"
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>

          <div className="flex items-center gap-4">
            {!hasAccess && numPages > previewPages && (
              <div className="text-center">
                <p className="text-xs text-muted-foreground">
                  Preview: {previewPages} of {numPages} pages
                </p>
                <Button 
                  variant="link" 
                  size="sm" 
                  className="text-primary p-0 h-auto"
                  onClick={handlePurchase}
                >
                  Unlock Full Book →
                </Button>
              </div>
            )}
          </div>

          <Button
            variant="outline"
            onClick={goToNextPage}
            disabled={currentPage >= maxViewablePages || (hasAccess && currentPage >= numPages)}
            className="gap-2"
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
