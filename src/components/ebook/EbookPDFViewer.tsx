import { useState, useEffect, useCallback, useMemo } from 'react';
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
  Sparkles,
  MessageSquare,
  Info,
  CheckCircle,
  Clock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

// Configure PDF.js worker using the official Vite 5 recommended method
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();

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
  const { user } = useAuth();

  const [pdfData, setPdfData] = useState<string | null>(null);
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.0);
  const [loading, setLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [pageLoading, setPageLoading] = useState(false);

  const [showRequestForm, setShowRequestForm] = useState(false);
  const [requestReason, setRequestReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [existingRequest, setExistingRequest] = useState<Record<string, unknown> | null>(null);

  const maxViewablePages = hasAccess ? numPages : previewPages;
  const progressPercent = numPages > 0 ? (currentPage / maxViewablePages) * 100 : 0;

  const fetchPdfUrl = useCallback(async () => {
    if (!ebookId) return;
    setLoading(true);
    setError(null);
    setLoadingProgress(0);
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      const proxyUrl = `${supabaseUrl}/functions/v1/previewebook?ebookId=${encodeURIComponent(ebookId)}`;

      const response = await fetch(proxyUrl, {
        headers: {
          apikey: anonKey,
          Authorization: `Bearer ${anonKey}`,
        },
      });

      if (!response.ok) {
        const errBody = await response.json().catch(() => ({}));
        throw new Error(errBody.error || 'Failed to fetch PDF content');
      }

      const arrayBuffer = await response.arrayBuffer();
      if (arrayBuffer.byteLength < 10) throw new Error('Empty PDF response');

      const signature = new Uint8Array(arrayBuffer.slice(0, 5));
      const isPdfSignature = signature[0] === 0x25 && signature[1] === 0x50 && signature[2] === 0x44 && signature[3] === 0x46 && signature[4] === 0x2D;

      if (!isPdfSignature) {
        throw new Error('The file source returned an invalid PDF. Please retry or contact support.');
      }

      const blob = new Blob([arrayBuffer], { type: 'application/pdf' });
      const objectUrl = URL.createObjectURL(blob);
      setPdfData(objectUrl);
      setLoadingProgress(100);
    } catch (err: any) {
      setError(err?.message || 'Could not load eBook content');
      toast({ title: 'Error', description: err?.message || 'Could not load eBook', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [ebookId, toast]);

  const checkExistingRequest = useCallback(async () => {
    if (!user || !ebookId) return;
    const { data } = await supabase
      .from('download_requests')
      .select('*')
      .eq('ebook_id', ebookId)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1);

    if (data && data.length > 0) {
      setExistingRequest(data[0]);
    }
  }, [ebookId, user]);

  useEffect(() => {
    if (isOpen && ebookId) {
      fetchPdfUrl();
      checkExistingRequest();
      setShowRequestForm(false);
      setRequestReason('');
    }
  }, [isOpen, ebookId, fetchPdfUrl, checkExistingRequest]);

  useEffect(() => {
    if (loading && loadingProgress < 90) {
      const interval = setInterval(() => setLoadingProgress(prev => Math.min(prev + 10, 90)), 300);
      return () => clearInterval(interval);
    }
  }, [loading, loadingProgress]);

  // Cleanup object url to prevent memory leaks
  useEffect(() => {
    return () => {
      if (pdfData && typeof pdfData === 'string' && pdfData.startsWith('blob:')) {
        URL.revokeObjectURL(pdfData);
      }
    };
  }, [pdfData]);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setCurrentPage(1);
    setLoading(false);
  };

  const handlePageLoadSuccess = () => {
    setPageLoading(false);
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

  const submitDownloadRequest = async () => {
    if (!user) {
      toast({ title: 'Login Required', description: 'Please login to request a download.', variant: 'destructive' });
      return;
    }
    if (!requestReason.trim()) {
      toast({ title: 'Reason Required', description: 'Please provide a reason for your download request.', variant: 'destructive' });
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.from('download_requests').insert({
        user_id: user.id,
        ebook_id: ebookId,
        reason: requestReason.trim(),
      });

      if (error) throw error;

      toast({ title: 'Request Submitted!', description: 'Your download request has been sent to the admin. You will be notified once approved.' });
      setShowRequestForm(false);
      setRequestReason('');
      await checkExistingRequest();
    } catch (err: any) {
      toast({ title: 'Error', description: err?.message || 'Failed to submit request.', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const handlePayForDownload = async () => {
    if (!existingRequest || !existingRequest.price_set) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Please login');

      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, email, phone')
        .eq('user_id', user!.id)
        .single();

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

      const response = await fetch(`${supabaseUrl}/functions/v1/create-download-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
          apikey: anonKey,
        },
        body: JSON.stringify({
          requestId: existingRequest.id,
          customerName: profile?.full_name || user!.email?.split('@')[0] || 'User',
          customerEmail: profile?.email || user!.email || '',
          customerPhone: profile?.phone || '9999999999',
        }),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Payment failed');

      if (result.paymentSessionId) {
        // @ts-ignore - Cashfree SDK loaded globally
        const cashfree = (window as any).Cashfree?.({ mode: 'production' });
        if (cashfree) {
          await cashfree.checkout({ paymentSessionId: result.paymentSessionId, redirectTarget: '_self' });
        } else {
          toast({ title: 'Error', description: 'Payment gateway not loaded. Please refresh and try again.', variant: 'destructive' });
        }
      }
    } catch (err: any) {
      toast({ title: 'Payment Error', description: err?.message || 'Failed to initiate payment.', variant: 'destructive' });
    }
  };

  const getRequestStatusBadge = () => {
    if (!existingRequest) return null;
    const s = existingRequest.status;
    if (s === 'pending') return <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/30"><Clock className="h-3 w-3 mr-1" />Request Pending</Badge>;
    if (s === 'approved_free') return <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/30"><CheckCircle className="h-3 w-3 mr-1" />Approved (Free)</Badge>;
    if (s === 'approved_paid') return <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/30">₹{existingRequest.price_set} — Pay to Download</Badge>;
    if (s === 'paid' || s === 'completed') return <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/30"><CheckCircle className="h-3 w-3 mr-1" />Download Ready</Badge>;
    if (s === 'rejected') return <Badge variant="destructive">Rejected</Badge>;
    return null;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[98vw] w-[98vw] h-[96vh] p-0 overflow-hidden bg-background border-border/40 flex flex-col">
        <DialogTitle className="sr-only">Viewing eBook: {ebookTitle}</DialogTitle>

        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-border/40 bg-card/60 shrink-0">
          <div className="min-w-0 flex-1 flex items-center gap-2">
            <h3 className="text-sm font-semibold truncate">{ebookTitle}</h3>
            <Badge variant="outline" className="text-[10px] border-border/40 shrink-0">
              {hasAccess ? 'Full Access' : 'Preview'}
            </Badge>
            {getRequestStatusBadge()}
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {user && (
              <>
                {existingRequest?.status === 'approved_paid' && (
                  <Button size="sm" className="gap-1.5 h-7 text-xs bg-primary text-primary-foreground" onClick={handlePayForDownload}>
                    ₹{existingRequest.price_set} — Pay & Download
                  </Button>
                )}
                {(existingRequest?.status === 'approved_free' || existingRequest?.status === 'paid' || existingRequest?.status === 'completed') && (
                  <Button size="sm" variant="outline" className="gap-1.5 h-7 text-xs" onClick={() => {
                    toast({ title: 'Download starting...', description: 'Your PDF download will begin shortly.' });
                    window.open(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/download-ebook-approved?requestId=${existingRequest.id}`, '_blank');
                  }}>
                    <Download className="h-3 w-3" />
                    Download PDF
                  </Button>
                )}
                {(!existingRequest || existingRequest.status === 'rejected') && (
                  <Button variant="outline" size="sm" className="gap-1.5 h-7 text-xs" onClick={() => setShowRequestForm(true)}>
                    <MessageSquare className="h-3 w-3" />
                    Request Download
                  </Button>
                )}
              </>
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

        {/* Download notice */}
        <div className="px-3 py-1.5 bg-muted/30 border-b border-border/20 shrink-0 text-center sm:text-left">
          <p className="text-[10px] sm:text-[11px] text-muted-foreground flex items-center justify-center sm:justify-start gap-1.5">
            <Info className="h-3 w-3 shrink-0" />
            Downloads are available on request. Additional charges may apply.
          </p>
        </div>

        {/* Request form overlay */}
        {showRequestForm && (
          <div className="px-4 py-3 bg-card border-b border-border/40 shrink-0 space-y-3">
            <h4 className="text-sm font-semibold">Request Download — {ebookTitle}</h4>
            <Textarea
              value={requestReason}
              onChange={(e) => setRequestReason(e.target.value)}
              placeholder="Why do you need to download this eBook? (e.g., offline study, printing, etc.)"
              className="min-h-[80px] text-sm"
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={submitDownloadRequest} disabled={submitting}>
                {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : null}
                Submit Request
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setShowRequestForm(false)}>Cancel</Button>
            </div>
          </div>
        )}

        {/* PDF Preview Content */}
        <div className="flex-1 min-h-0 relative overflow-auto bg-muted/5">
          {loading ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-primary/40" />
              <div className="w-48 space-y-2">
                <Progress value={loadingProgress} className="h-1" />
                <p className="text-[10px] text-muted-foreground text-center">Loading PDF content...</p>
              </div>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 p-8">
              <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center">
                <X className="h-8 w-8 text-destructive/60" />
              </div>
              <p className="text-sm font-medium text-destructive">{error}</p>
              <Button variant="outline" size="sm" onClick={fetchPdfUrl}>Retry Loading</Button>
            </div>
          ) : pdfData ? (
            <div className="flex flex-col items-center py-6 sm:py-10 px-2 sm:px-4">
              <Document
                file={pdfData}
                onLoadSuccess={onDocumentLoadSuccess}
                loading={
                  <div className="flex items-center gap-3 text-muted-foreground py-20">
                    <Loader2 className="h-6 w-6 animate-spin" />
                    Preparing reader...
                  </div>
                }
              >
                <div className="relative">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Page
                      pageNumber={currentPage}
                      scale={scale}
                      className="shadow-2xl rounded-sm overflow-hidden ring-1 ring-border/5"
                      renderTextLayer={true}
                      renderAnnotationLayer={true}
                      onLoadSuccess={handlePageLoadSuccess}
                      width={typeof window !== 'undefined' ? (window.innerWidth < 640 ? window.innerWidth - 40 : Math.min(window.innerWidth * 0.8, 800)) : 800}
                    />
                  </motion.div>

                  {/* Access Control Overlay */}
                  <AnimatePresence>
                    {!hasAccess && currentPage >= previewPages && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="absolute inset-0 bg-background/95 backdrop-blur-sm flex flex-col items-center justify-center p-8 text-center rounded-sm"
                      >
                        <Lock className="h-12 w-12 text-primary/40 mb-4" />
                        <Badge className="mb-4 bg-amber-500/10 text-amber-500 border-amber-500/20">Preview Complete</Badge>
                        <h3 className="text-xl font-bold mb-2">Want to read the full book?</h3>
                        <p className="text-sm text-muted-foreground max-w-sm mb-6">
                          You've reached the end of the free preview ({previewPages} pages).
                          Please purchase the full version for access to all {numPages} pages.
                        </p>
                        <Button onClick={handlePurchase} size="lg" className="gap-2 shadow-xl shadow-primary/20">
                          <ShoppingCart className="h-4 w-4" />
                          Purchase Full Version
                        </Button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </Document>

              {/* Navigation Controls */}
              {numPages > 0 && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-background/80 backdrop-blur-md border border-border/40 p-1.5 rounded-full shadow-2xl z-50">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-full"
                    disabled={currentPage <= 1}
                    onClick={() => setCurrentPage(p => p - 1)}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <div className="px-3 flex items-center gap-2 border-x border-border/20">
                    <span className="text-xs font-medium">{currentPage}</span>
                    <span className="text-[10px] text-muted-foreground">/</span>
                    <span className="text-[10px] text-muted-foreground font-medium">{maxViewablePages}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-full"
                    disabled={currentPage >= maxViewablePages}
                    onClick={() => setCurrentPage(p => p + 1)}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>

                  <div className="w-[1px] h-4 bg-border/20 mx-1" />

                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-full"
                    onClick={() => setScale(s => Math.max(s - 0.1, 0.5))}
                  >
                    <ZoomOut className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-full"
                    onClick={() => setScale(s => Math.min(s + 0.1, 2.0))}
                  >
                    <ZoomIn className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center gap-4 text-muted-foreground">
              <BookOpen className="h-10 w-10 opacity-20" />
              <p className="text-sm">No preview content available</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
