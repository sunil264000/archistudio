import { useState, useEffect, useCallback } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
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
  Minimize2,
  BookMarked,
  Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

// Configure PDF.js worker using a more reliable unpkg content-type safe URL
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

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
  isOpen, onClose, ebookId, ebookTitle, hasAccess,
  previewPages = 15, onPurchaseRequest
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
    if (isOpen && ebookId) fetchPdfUrl();
    return () => { if (pdfUrl) URL.revokeObjectURL(pdfUrl); };
  }, [isOpen, ebookId]);

  useEffect(() => {
    if (loading && loadingProgress < 90) {
      const interval = setInterval(() => setLoadingProgress(prev => Math.min(prev + 10, 90)), 300);
      return () => clearInterval(interval);
    }
  }, [loading, loadingProgress]);

  const fetchPdfUrl = async () => {
    setLoading(true); setError(null); setLoadingProgress(0);
    try {
      const functionName = hasAccess ? 'download-ebook' : 'preview-ebook';
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
        let errorMessage = `Failed to load PDF (${response.status})`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch {
          // JSON parse failed — response body is not JSON (e.g. HTML error page)
        }
        if (response.status === 401) errorMessage = 'Please log in to access this eBook.';
        if (response.status === 403) errorMessage = 'You don\'t have access to this eBook. Please purchase it first.';
        if (response.status === 404) errorMessage = 'eBook file not found. Please contact support.';
        if (response.status === 504) errorMessage = 'Request timed out. The eBook may be large — please try again.';
        throw new Error(errorMessage);
      }

      const contentType = response.headers.get('content-type') || '';
      if (!contentType.includes('application/pdf')) {
        // Some errors come back as 200 with JSON — catch that
        const text = await response.text();
        try {
          const parsed = JSON.parse(text);
          throw new Error(parsed.error || 'Unexpected server response');
        } catch {
          throw new Error('Server returned unexpected content. Please try again.');
        }
      }

      const arrayBuffer = await response.arrayBuffer();
      const blob = new Blob([arrayBuffer], { type: 'application/pdf' });
      setPdfUrl(URL.createObjectURL(blob));
      setLoadingProgress(100);
    } catch (err: any) {
      console.error('Error loading PDF:', err);
      setError(err.message || 'Failed to load PDF. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages); setCurrentPage(1);
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

  const zoomIn = () => setScale(prev => Math.min(2.5, prev + 0.25));
  const zoomOut = () => setScale(prev => Math.max(0.5, prev - 0.25));

  const handleDownload = async () => {
    if (!hasAccess) {
      toast({ title: 'Purchase Required', description: 'Please purchase this eBook to download', variant: 'destructive' });
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
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}`, 'apikey': anonKey },
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
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast({ title: 'Download Started', description: `Downloading "${ebookTitle}"` });
    } catch (error: any) {
      toast({ title: 'Download Failed', description: error.message || 'Failed to download eBook', variant: 'destructive' });
    } finally {
      setDownloading(false);
    }
  };

  const handlePurchase = () => {
    if (onPurchaseRequest) { onPurchaseRequest(ebookId, ebookTitle); onClose(); }
    else { onClose(); navigate('/ebooks'); }
  };

  const handlePageLoadSuccess = () => setPageLoading(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'ArrowLeft') goToPrevPage();
      else if (e.key === 'ArrowRight') goToNextPage();
      else if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, goToPrevPage, goToNextPage, onClose]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className={`${isFullscreen ? 'max-w-full w-full h-full rounded-none' : 'max-w-5xl w-[98vw] sm:w-[95vw] h-[95vh] sm:h-[90vh]'} p-0 overflow-hidden bg-background border-border/30`}
        aria-describedby="pdf-viewer-description"
      >
        <span id="pdf-viewer-description" className="sr-only">
          PDF viewer for {ebookTitle}. Use arrow keys to navigate pages.
        </span>

        {/* Premium Header */}
        <div className="relative flex items-center justify-between px-3 sm:px-5 py-2.5 sm:py-3 border-b border-border/30 bg-card/60">
          {/* Subtle gradient line at top */}
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />

          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
            <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl bg-primary/8 border border-primary/15 flex items-center justify-center flex-shrink-0">
              <BookMarked className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-xs sm:text-sm truncate leading-tight">{ebookTitle}</h3>
              <div className="flex items-center gap-1.5 sm:gap-2 mt-0.5">
                {hasAccess ? (
                  <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[10px] sm:text-xs px-1.5 sm:px-2 h-5">
                    Full Access
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-[10px] sm:text-xs bg-amber-500/8 text-amber-400 border-amber-500/20 px-1.5 sm:px-2 h-5">
                    <Eye className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-0.5 sm:mr-1" />
                    Preview
                  </Badge>
                )}
                {numPages > 0 && (
                  <span className="text-[10px] sm:text-xs text-muted-foreground/70 font-mono">
                    {currentPage} / {hasAccess ? numPages : Math.min(previewPages, numPages)}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {/* Zoom Controls */}
            <div className="hidden md:flex items-center gap-0.5 border border-border/30 rounded-lg p-0.5 bg-muted/30">
              <Button variant="ghost" size="icon" className="h-7 w-7 rounded-md" onClick={zoomOut} disabled={scale <= 0.5}>
                <ZoomOut className="h-3.5 w-3.5" />
              </Button>
              <span className="text-[11px] w-11 text-center font-mono text-muted-foreground">{Math.round(scale * 100)}%</span>
              <Button variant="ghost" size="icon" className="h-7 w-7 rounded-md" onClick={zoomIn} disabled={scale >= 2.5}>
                <ZoomIn className="h-3.5 w-3.5" />
              </Button>
            </div>

            <Button variant="ghost" size="icon" className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg" onClick={() => setIsFullscreen(!isFullscreen)}>
              {isFullscreen ? <Minimize2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> : <Maximize2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />}
            </Button>

            {hasAccess && (
              <Button
                variant="outline" size="sm" onClick={handleDownload} disabled={downloading}
                className="gap-1.5 hidden md:flex h-8 border-border/30 text-xs"
              >
                {downloading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
                <span className="hidden lg:inline">Download</span>
              </Button>
            )}

            <Button variant="ghost" size="icon" className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg hover:bg-destructive/10 hover:text-destructive" onClick={onClose}>
              <X className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </Button>
          </div>
        </div>

        {/* Progress Bar */}
        {numPages > 0 && (
          <div className="h-0.5 w-full bg-muted/30">
            <motion.div
              className="h-full bg-gradient-to-r from-primary via-primary/80 to-accent"
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            />
          </div>
        )}

        {/* PDF Content */}
        <div className="flex-1 overflow-auto bg-muted/5 relative mobile-scroll">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-full gap-5 sm:gap-6 p-6 sm:p-8">
              <div className="relative">
                <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-2xl bg-primary/8 border border-primary/10 flex items-center justify-center">
                  <BookOpen className="h-10 w-10 sm:h-12 sm:w-12 text-primary/60 animate-pulse" />
                </div>
                <div className="absolute -bottom-2 -right-2 h-7 w-7 rounded-full bg-primary/15 border border-primary/20 flex items-center justify-center">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                </div>
              </div>
              <div className="text-center space-y-1.5">
                <p className="text-muted-foreground font-medium text-sm sm:text-base">Preparing your book...</p>
                <p className="text-[10px] sm:text-xs text-muted-foreground/50">This may take a moment</p>
              </div>
              <div className="w-40 sm:w-56">
                <Progress value={loadingProgress} className="h-1" />
              </div>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 sm:gap-5 p-6 sm:p-8">
              <div className="h-20 w-20 rounded-2xl bg-destructive/8 border border-destructive/15 flex items-center justify-center">
                <X className="h-10 w-10 text-destructive/60" />
              </div>
              <div className="text-center space-y-1.5">
                <p className="text-destructive font-medium text-sm sm:text-base">Failed to load PDF</p>
                <p className="text-xs sm:text-sm text-muted-foreground max-w-md">{error}</p>
              </div>
              <Button variant="outline" onClick={fetchPdfUrl} className="gap-2 border-border/30" size="sm">
                <Loader2 className="h-3.5 w-3.5" />
                Try Again
              </Button>
            </div>
          ) : pdfUrl ? (
            <div className="flex flex-col items-center py-6 sm:py-10 px-2 sm:px-4 min-h-full">
              <Document
                file={pdfUrl}
                onLoadSuccess={onDocumentLoadSuccess}
                options={{
                  cMapUrl: `https://unpkg.com/pdfjs-dist@${pdfjs.version}/cmaps/`,
                  cMapPacked: true,
                  standardFontDataUrl: `https://unpkg.com/pdfjs-dist@${pdfjs.version}/standard_fonts/`,
                }}
                loading={
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span className="text-sm">Preparing document...</span>
                  </div>
                }
                error={
                  <div className="text-destructive text-center p-4">
                    <p className="font-medium text-sm sm:text-base">Failed to render PDF</p>
                    <p className="text-xs sm:text-sm text-muted-foreground mt-1">The file may be corrupted</p>
                  </div>
                }
              >
                <div className="relative">
                  <motion.div
                    key={currentPage}
                    initial={{ opacity: 0.5, scale: 0.995 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                  >
                    <Page
                      pageNumber={currentPage}
                      scale={scale}
                      className="shadow-2xl rounded-lg overflow-hidden ring-1 ring-border/10"
                      renderTextLayer={true}
                      renderAnnotationLayer={true}
                      onLoadSuccess={handlePageLoadSuccess}
                      onLoadError={(err) => console.error("Page load error:", err)}
                      onRenderError={(err) => console.error("Page render error:", err)}
                      width={typeof window !== 'undefined' && window.innerWidth < 640 ? window.innerWidth - 32 : undefined}
                      loading={
                        <div className="w-full max-w-[600px] aspect-[3/4] flex items-center justify-center bg-muted/10 rounded-lg border border-border/10">
                          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground/30" />
                        </div>
                      }
                    />
                  </motion.div>

                  {/* Page Loading Overlay */}
                  <AnimatePresence>
                    {pageLoading && (
                      <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="absolute inset-0 flex items-center justify-center bg-background/40 backdrop-blur-[2px] rounded-lg"
                      >
                        <Loader2 className="h-8 w-8 animate-spin text-primary/60" />
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Locked Page Overlay */}
                  <AnimatePresence>
                    {!hasAccess && currentPage >= previewPages && numPages > previewPages && (
                      <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-gradient-to-t from-background via-background/98 to-background/60 flex flex-col items-center justify-center rounded-lg"
                      >
                        <motion.div
                          initial={{ scale: 0.9, opacity: 0, y: 16 }}
                          animate={{ scale: 1, opacity: 1, y: 0 }}
                          transition={{ delay: 0.15, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                          className="text-center p-6 sm:p-10 max-w-md mx-auto"
                        >
                          {/* Lock icon with glow */}
                          <div className="relative mx-auto mb-6 w-fit">
                            <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-2xl bg-primary/8 border border-primary/15 flex items-center justify-center shadow-xl shadow-primary/5">
                              <Lock className="h-10 w-10 sm:h-12 sm:w-12 text-primary/70" />
                            </div>
                            <div className="absolute -top-1 -right-1 h-6 w-6 rounded-full bg-amber-500/15 border border-amber-500/20 flex items-center justify-center">
                              <Sparkles className="h-3 w-3 text-amber-400" />
                            </div>
                          </div>

                          <Badge className="mb-4 bg-amber-500/10 text-amber-400 border-amber-500/20 text-xs px-3 py-1">
                            <Eye className="h-3 w-3 mr-1.5" />
                            Preview Complete
                          </Badge>

                          <h3 className="text-xl sm:text-2xl md:text-3xl font-bold mb-2 tracking-tight">
                            Enjoying this book?
                          </h3>
                          <p className="text-muted-foreground text-center mb-6 text-xs sm:text-sm leading-relaxed">
                            You've previewed {previewPages} pages.
                            Unlock all <span className="text-primary font-semibold">{numPages} pages</span> for the full experience.
                          </p>

                          {/* Price card */}
                          <div className="bg-card/60 rounded-xl p-4 mb-6 border border-border/30">
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="text-xs sm:text-sm font-medium truncate flex-1 mr-2">{ebookTitle}</span>
                              <Badge variant="outline" className="text-[10px] sm:text-xs shrink-0 border-border/30">₹50/book</Badge>
                            </div>
                            <p className="text-[10px] sm:text-xs text-muted-foreground/60 text-left">
                              Buy more books together to save up to 45%
                            </p>
                          </div>

                          <Button
                            onClick={handlePurchase}
                            size="lg"
                            className="gap-2.5 shadow-lg shadow-primary/15 w-full sm:w-auto bg-primary hover:bg-primary/90 h-12 text-base font-semibold touch-target"
                          >
                            <ShoppingCart className="h-4.5 w-4.5" />
                            Continue to Purchase
                          </Button>

                          <p className="text-[10px] sm:text-xs text-muted-foreground/50 mt-4">
                            One-time purchase • Instant access • PDF download
                          </p>
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
        <div className="relative flex items-center justify-between px-3 sm:px-5 py-2.5 sm:py-3 border-t border-border/30 bg-card/60">
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border/50 to-transparent" />

          <Button
            variant="outline"
            onClick={goToPrevPage}
            disabled={currentPage <= 1 || loading}
            className="gap-1.5 sm:gap-2 touch-target h-9 border-border/30 text-xs"
            size="sm"
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Previous</span>
          </Button>

          <div className="flex items-center gap-3 sm:gap-4">
            {/* Mobile zoom */}
            <div className="flex sm:hidden items-center gap-0.5 border border-border/30 rounded-lg p-0.5 bg-muted/20">
              <Button variant="ghost" size="icon" className="h-7 w-7 rounded-md" onClick={zoomOut} disabled={scale <= 0.5}>
                <ZoomOut className="h-3.5 w-3.5" />
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7 rounded-md" onClick={zoomIn} disabled={scale >= 2.5}>
                <ZoomIn className="h-3.5 w-3.5" />
              </Button>
            </div>

            {!hasAccess && numPages > previewPages && (
              <div className="text-center">
                <p className="text-[10px] sm:text-xs text-muted-foreground/60 font-mono">
                  {Math.min(previewPages, numPages)}/{numPages} pages
                </p>
                <Button
                  variant="link" size="sm"
                  className="text-primary p-0 h-auto text-[10px] sm:text-xs font-medium"
                  onClick={handlePurchase}
                >
                  Unlock Full →
                </Button>
              </div>
            )}

            {hasAccess && (
              <Button variant="ghost" size="icon" className="sm:hidden h-8 w-8 rounded-lg" onClick={handleDownload} disabled={downloading}>
                {downloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              </Button>
            )}
          </div>

          <Button
            variant="outline"
            onClick={goToNextPage}
            disabled={currentPage >= maxViewablePages || (hasAccess && currentPage >= numPages) || loading}
            className="gap-1.5 sm:gap-2 touch-target h-9 border-border/30 text-xs"
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
