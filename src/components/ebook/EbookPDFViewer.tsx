import { useState, useEffect, useCallback } from 'react';
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
  ShoppingCart,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
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
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [pageLoading, setPageLoading] = useState(false);

  const maxViewablePages = hasAccess ? numPages : previewPages;
  const progressPercent = numPages > 0 ? (currentPage / maxViewablePages) * 100 : 0;

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

  // Simulate loading progress for better UX
  useEffect(() => {
    if (loading && loadingProgress < 90) {
      const interval = setInterval(() => {
        setLoadingProgress(prev => Math.min(prev + 10, 90));
      }, 300);
      return () => clearInterval(interval);
    }
  }, [loading, loadingProgress]);

  const fetchPdfUrl = async () => {
    setLoading(true);
    setError(null);
    setLoadingProgress(0);
    
    try {
      const functionName = hasAccess ? 'download-ebook' : 'preview-ebook';
      
      // Use fetch directly for binary data - supabase.functions.invoke doesn't handle binary well
      const { data: { session } } = await supabase.auth.getSession();
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      
      const response = await fetch(`${supabaseUrl}/functions/v1/${functionName}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': session?.access_token ? `Bearer ${session.access_token}` : `Bearer ${anonKey}`,
          'apikey': anonKey,
        },
        body: JSON.stringify({ ebookId, previewPages }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to load PDF');
      }

      // Get the PDF as arraybuffer and create blob URL
      const arrayBuffer = await response.arrayBuffer();
      const blob = new Blob([arrayBuffer], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      setPdfUrl(url);
      setLoadingProgress(100);
    } catch (err: any) {
      console.error('Error loading PDF:', err);
      setError(err.message || 'Failed to load PDF. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setCurrentPage(1);
  };

  const goToPrevPage = useCallback(() => {
    setPageLoading(true);
    setCurrentPage(prev => Math.max(1, prev - 1));
  }, []);

  const goToNextPage = useCallback(() => {
    const maxPage = hasAccess ? numPages : Math.min(previewPages, numPages);
    setPageLoading(true);
    setCurrentPage(prev => Math.min(maxPage, prev + 1));
  }, [hasAccess, numPages, previewPages]);

  const zoomIn = () => {
    setScale(prev => Math.min(2.5, prev + 0.25));
  };

  const zoomOut = () => {
    setScale(prev => Math.max(0.5, prev - 0.25));
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
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Please login to download');
      }
      
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      
      const response = await fetch(`${supabaseUrl}/functions/v1/download-ebook`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
          'apikey': anonKey,
        },
        body: JSON.stringify({ ebookId }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to download PDF');
      }

      const arrayBuffer = await response.arrayBuffer();
      const blob = new Blob([arrayBuffer], { type: 'application/pdf' });
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

  const handlePageLoadSuccess = () => {
    setPageLoading(false);
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      
      if (e.key === 'ArrowLeft') {
        goToPrevPage();
      } else if (e.key === 'ArrowRight') {
        goToNextPage();
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, goToPrevPage, goToNextPage, onClose]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={`${isFullscreen ? 'max-w-full w-full h-full' : 'max-w-5xl w-[95vw] h-[90vh]'} p-0 overflow-hidden bg-background border-border/50`}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b bg-card/80 backdrop-blur-sm">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center flex-shrink-0">
              <BookOpen className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0">
              <h3 className="font-semibold text-sm truncate max-w-[200px] md:max-w-[400px]">{ebookTitle}</h3>
              <div className="flex items-center gap-2 flex-wrap">
                {hasAccess ? (
                  <Badge className="bg-success/15 text-success border-success/30 text-xs">
                    Full Access
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-xs bg-amber-500/10 text-amber-500 border-amber-500/30">
                    <Eye className="h-3 w-3 mr-1" />
                    Preview
                  </Badge>
                )}
                {numPages > 0 && (
                  <span className="text-xs text-muted-foreground">
                    Page {currentPage} of {hasAccess ? numPages : `${Math.min(previewPages, numPages)}`}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1 md:gap-2">
            {/* Zoom Controls */}
            <div className="hidden md:flex items-center gap-1 border rounded-lg p-1 bg-muted/50">
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={zoomOut} disabled={scale <= 0.5}>
                <ZoomOut className="h-3.5 w-3.5" />
              </Button>
              <span className="text-xs w-10 text-center font-medium">{Math.round(scale * 100)}%</span>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={zoomIn} disabled={scale >= 2.5}>
                <ZoomIn className="h-3.5 w-3.5" />
              </Button>
            </div>

            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setIsFullscreen(!isFullscreen)}
            >
              {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </Button>

            {hasAccess && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleDownload}
                disabled={downloading}
                className="gap-1.5 hidden md:flex"
              >
                {downloading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Download className="h-3.5 w-3.5" />
                )}
                <span className="hidden lg:inline">Download</span>
              </Button>
            )}

            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Progress Bar */}
        {numPages > 0 && (
          <div className="h-1 w-full bg-muted/50">
            <motion.div 
              className="h-full bg-gradient-to-r from-primary to-primary/70"
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        )}

        {/* PDF Content */}
        <div className="flex-1 overflow-auto bg-muted/20 relative">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-full gap-6 p-8">
              <div className="relative">
                <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                  <BookOpen className="h-10 w-10 text-primary animate-pulse" />
                </div>
                <div className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-primary flex items-center justify-center">
                  <Loader2 className="h-4 w-4 animate-spin text-primary-foreground" />
                </div>
              </div>
              <div className="text-center space-y-2">
                <p className="text-muted-foreground font-medium">Loading PDF...</p>
                <p className="text-xs text-muted-foreground/70">This may take a moment for large files</p>
              </div>
              <div className="w-48">
                <Progress value={loadingProgress} className="h-2" />
              </div>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 p-8">
              <div className="h-20 w-20 rounded-2xl bg-destructive/10 flex items-center justify-center">
                <X className="h-10 w-10 text-destructive" />
              </div>
              <div className="text-center space-y-2">
                <p className="text-destructive font-medium">Failed to load PDF</p>
                <p className="text-sm text-muted-foreground max-w-md">{error}</p>
              </div>
              <Button variant="outline" onClick={fetchPdfUrl} className="gap-2">
                <Loader2 className="h-4 w-4" />
                Try Again
              </Button>
            </div>
          ) : pdfUrl ? (
            <div className="flex flex-col items-center py-8 px-4 min-h-full">
              <Document
                file={pdfUrl}
                onLoadSuccess={onDocumentLoadSuccess}
                loading={
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Preparing document...</span>
                  </div>
                }
                error={
                  <div className="text-destructive text-center p-4">
                    <p className="font-medium">Failed to render PDF</p>
                    <p className="text-sm text-muted-foreground mt-1">The file may be corrupted or incompatible</p>
                  </div>
                }
              >
                <div className="relative">
                  <motion.div
                    key={currentPage}
                    initial={{ opacity: 0.5, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Page
                      pageNumber={currentPage}
                      scale={scale}
                      className="shadow-2xl rounded-lg overflow-hidden bg-card"
                      renderTextLayer={false}
                      renderAnnotationLayer={false}
                      onLoadSuccess={handlePageLoadSuccess}
                      loading={
                        <div className="w-[600px] h-[800px] flex items-center justify-center bg-muted/30 rounded-lg">
                          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                      }
                    />
                  </motion.div>
                  
                  {/* Page Loading Overlay */}
                  <AnimatePresence>
                    {pageLoading && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-sm rounded-lg"
                      >
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                  
                  {/* Locked Page Overlay */}
                  <AnimatePresence>
                    {!hasAccess && currentPage >= previewPages && numPages > previewPages && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-gradient-to-t from-background via-background/95 to-background/50 flex flex-col items-center justify-center backdrop-blur-sm rounded-lg"
                      >
                        <motion.div 
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ delay: 0.1 }}
                          className="text-center p-8"
                        >
                          <div className="h-24 w-24 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center mb-6 mx-auto border border-primary/30">
                            <Lock className="h-12 w-12 text-primary" />
                          </div>
                          <h3 className="text-2xl font-bold mb-3">Preview Limit Reached</h3>
                          <p className="text-muted-foreground text-center mb-8 max-w-md">
                            You've enjoyed {previewPages} free preview pages. 
                            Purchase to unlock all <span className="text-primary font-semibold">{numPages} pages</span>.
                          </p>
                          <Button onClick={handlePurchase} size="lg" className="gap-2 shadow-lg">
                            <ShoppingCart className="h-5 w-5" />
                            Purchase Full eBook
                          </Button>
                        </motion.div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </Document>
            </div>
          ) : null}
        </div>

        {/* Footer Navigation */}
        <div className="flex items-center justify-between px-4 py-3 border-t bg-card/80 backdrop-blur-sm">
          <Button
            variant="outline"
            onClick={goToPrevPage}
            disabled={currentPage <= 1 || loading}
            className="gap-2"
            size="sm"
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Previous</span>
          </Button>

          <div className="flex items-center gap-4">
            {/* Mobile zoom controls */}
            <div className="flex md:hidden items-center gap-1">
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={zoomOut} disabled={scale <= 0.5}>
                <ZoomOut className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={zoomIn} disabled={scale >= 2.5}>
                <ZoomIn className="h-4 w-4" />
              </Button>
            </div>

            {!hasAccess && numPages > previewPages && (
              <div className="text-center hidden sm:block">
                <p className="text-xs text-muted-foreground">
                  Previewing {Math.min(previewPages, numPages)} of {numPages} pages
                </p>
                <Button 
                  variant="link" 
                  size="sm" 
                  className="text-primary p-0 h-auto text-xs"
                  onClick={handlePurchase}
                >
                  Unlock Full Book →
                </Button>
              </div>
            )}

            {hasAccess && (
              <Button 
                variant="ghost" 
                size="icon"
                className="md:hidden h-8 w-8"
                onClick={handleDownload}
                disabled={downloading}
              >
                {downloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              </Button>
            )}
          </div>

          <Button
            variant="outline"
            onClick={goToNextPage}
            disabled={currentPage >= maxViewablePages || (hasAccess && currentPage >= numPages) || loading}
            className="gap-2"
            size="sm"
          >
            <span className="hidden sm:inline">Next</span>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
