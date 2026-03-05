import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
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
  Eye,
  ShoppingCart,
  Maximize2,
  Minimize2,
  Search,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

pdfjs.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).toString();

interface EbookPDFViewerProps {
  isOpen: boolean;
  onClose: () => void;
  ebookId: string;
  ebookTitle: string;
  hasAccess: boolean;
  previewPages?: number;
  onPurchaseRequest?: (ebookId: string, ebookTitle: string) => void;
}

interface SourceConfig {
  url: string;
  headers: Record<string, string>;
}

const sourceCache = new Map<string, SourceConfig>();

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

  const [source, setSource] = useState<SourceConfig | null>(null);
  const [numPages, setNumPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [scale, setScale] = useState(1);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [jumpToPage, setJumpToPage] = useState('1');
  const [searchTerm, setSearchTerm] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchMatches, setSearchMatches] = useState<number[]>([]);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const pageRefs = useRef<Record<number, HTMLDivElement | null>>({});
  const renderedPages = useRef<Set<number>>(new Set([1]));
  const textCache = useRef<Map<number, string>>(new Map());
  const pdfDocumentRef = useRef<any>(null);

  const maxViewablePages = hasAccess ? numPages : Math.min(previewPages, numPages);

  const file = useMemo(() => {
    if (!source) return null;
    return {
      url: source.url,
      httpHeaders: source.headers,
      withCredentials: false,
    };
  }, [source]);

  const visibleWindow = useMemo(() => {
    const pages = new Set<number>();
    const start = Math.max(1, currentPage - 2);
    const end = Math.min(maxViewablePages || 1, currentPage + 2);
    for (let p = start; p <= end; p += 1) pages.add(p);
    return pages;
  }, [currentPage, maxViewablePages]);

  const fetchSource = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const cacheKey = `${ebookId}:${previewPages}`;
      if (sourceCache.has(cacheKey)) {
        setSource(sourceCache.get(cacheKey)!);
        setLoading(false);
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      const endpoint = `${supabaseUrl}/functions/v1/preview-ebook?ebookId=${encodeURIComponent(ebookId)}&previewPages=${previewPages}`;
      const headers: Record<string, string> = {
        apikey: anonKey,
        Authorization: session?.access_token ? `Bearer ${session.access_token}` : `Bearer ${anonKey}`,
      };

      const nextSource = { url: endpoint, headers };
      sourceCache.set(cacheKey, nextSource);
      setSource(nextSource);
    } catch (err: any) {
      setError(err?.message || 'Unable to open this PDF right now.');
    } finally {
      setLoading(false);
    }
  }, [ebookId, previewPages]);

  useEffect(() => {
    if (isOpen && ebookId) {
      setCurrentPage(1);
      setSearchMatches([]);
      setSearchTerm('');
      renderedPages.current = new Set([1]);
      textCache.current.clear();
      pdfDocumentRef.current = null;
      void fetchSource();
    }
  }, [isOpen, ebookId, fetchSource]);

  useEffect(() => {
    if (!containerRef.current || !numPages) return;

    const observer = new IntersectionObserver(
      (entries) => {
        let mostVisiblePage = currentPage;
        let highestRatio = 0;

        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const ratio = entry.intersectionRatio;
          const page = Number((entry.target as HTMLElement).dataset.page || 0);
          if (page > 0 && ratio > highestRatio) {
            highestRatio = ratio;
            mostVisiblePage = page;
          }
        }

        if (mostVisiblePage !== currentPage) {
          setCurrentPage(mostVisiblePage);
          setJumpToPage(String(mostVisiblePage));
        }
      },
      { root: containerRef.current, threshold: [0.25, 0.5, 0.75] },
    );

    for (let i = 1; i <= maxViewablePages; i += 1) {
      const node = pageRefs.current[i];
      if (node) observer.observe(node);
    }

    return () => observer.disconnect();
  }, [numPages, maxViewablePages, currentPage]);

  const onDocumentLoadSuccess = ({ numPages: pages, ...doc }: any) => {
    setNumPages(pages);
    setCurrentPage(1);
    setJumpToPage('1');
    pdfDocumentRef.current = doc;
  };

  const goToPage = (page: number) => {
    if (page < 1 || page > maxViewablePages) return;
    setCurrentPage(page);
    setJumpToPage(String(page));
    pageRefs.current[page]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const goToPrevPage = () => goToPage(Math.max(1, currentPage - 1));
  const goToNextPage = () => goToPage(Math.min(maxViewablePages, currentPage + 1));

  const zoomIn = () => setScale((prev) => Math.min(2.5, Number((prev + 0.2).toFixed(2))));
  const zoomOut = () => setScale((prev) => Math.max(0.6, Number((prev - 0.2).toFixed(2))));

  const runSearch = async () => {
    const term = searchTerm.trim().toLowerCase();
    if (!term || !pdfDocumentRef.current) {
      setSearchMatches([]);
      return;
    }

    setSearching(true);
    try {
      const hits: number[] = [];
      for (let i = 1; i <= maxViewablePages; i += 1) {
        let text = textCache.current.get(i);
        if (!text) {
          const page = await pdfDocumentRef.current.getPage(i);
          const content = await page.getTextContent();
          text = content.items.map((item: any) => item?.str || '').join(' ').toLowerCase();
          textCache.current.set(i, text);
        }
        if (text.includes(term)) hits.push(i);
      }
      setSearchMatches(hits);
      if (hits.length) goToPage(hits[0]);
    } catch (err) {
      console.error('PDF search failed:', err);
      toast({ title: 'Search failed', description: 'Could not search this PDF.', variant: 'destructive' });
    } finally {
      setSearching(false);
    }
  };

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

  const pages = useMemo(() => {
    if (!maxViewablePages) return [];
    return Array.from({ length: maxViewablePages }, (_, i) => i + 1);
  }, [maxViewablePages]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={`${isFullscreen ? 'max-w-[100vw] h-[100vh] rounded-none' : 'max-w-6xl w-[98vw] h-[95vh] sm:h-[92vh]'} p-0 overflow-hidden bg-background border-border/40`}>
        <div className="flex items-center justify-between px-3 sm:px-5 py-2.5 border-b border-border/40 bg-card/60">
          <div className="min-w-0">
            <h3 className="text-sm sm:text-base font-semibold truncate">{ebookTitle}</h3>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline" className="text-[10px] sm:text-xs border-border/40">
                {hasAccess ? 'Full Access' : 'Preview'}
              </Badge>
              {numPages > 0 && <span className="text-[11px] text-muted-foreground">Page {currentPage}/{maxViewablePages}</span>}
              {searchMatches.length > 0 && <span className="text-[11px] text-muted-foreground">{searchMatches.length} match(es)</span>}
            </div>
          </div>

          <div className="flex items-center gap-1 sm:gap-2">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={zoomOut} disabled={scale <= 0.6}><ZoomOut className="h-4 w-4" /></Button>
            <span className="text-xs w-12 text-center text-muted-foreground">{Math.round(scale * 100)}%</span>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={zoomIn} disabled={scale >= 2.5}><ZoomIn className="h-4 w-4" /></Button>
            {hasAccess && (
              <Button variant="outline" size="sm" className="hidden sm:flex" onClick={handleDownload} disabled={downloading}>
                {downloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              </Button>
            )}
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setIsFullscreen((p) => !p)}>
              {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}><X className="h-4 w-4" /></Button>
          </div>
        </div>

        <div className="flex items-center gap-2 px-3 sm:px-5 py-2 border-b border-border/30 bg-muted/20 flex-wrap">
          <div className="flex items-center gap-2">
            <Input
              value={jumpToPage}
              onChange={(e) => setJumpToPage(e.target.value.replace(/[^0-9]/g, ''))}
              className="w-20 h-8"
              placeholder="Page"
            />
            <Button size="sm" variant="outline" className="h-8" onClick={() => goToPage(Number(jumpToPage || '1'))}>Go</Button>
          </div>

          <div className="flex items-center gap-2 ml-0 sm:ml-4">
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-44 sm:w-64 h-8"
              placeholder="Search inside PDF"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  void runSearch();
                }
              }}
            />
            <Button size="sm" variant="outline" className="h-8" onClick={() => void runSearch()} disabled={searching}>
              {searching ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Search className="h-3.5 w-3.5" />}
            </Button>
          </div>
        </div>

        <div ref={containerRef} className="flex-1 overflow-auto bg-muted/10 scroll-smooth">
          {loading && (
            <div className="h-full flex items-center justify-center">
              <div className="flex items-center gap-2 text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" />Preparing document...</div>
            </div>
          )}

          {!loading && error && (
            <div className="h-full flex flex-col items-center justify-center gap-3 px-6 text-center">
              <p className="text-destructive font-medium">Failed to open PDF</p>
              <p className="text-sm text-muted-foreground">{error}</p>
              <Button variant="outline" onClick={() => void fetchSource()}>Retry</Button>
            </div>
          )}

          {!loading && !error && file && (
            <Document
              file={file}
              onLoadSuccess={onDocumentLoadSuccess}
              onLoadError={(err) => {
                console.error('Document load error', err);
                setError('Could not load this document.');
              }}
              options={{
                cMapUrl: '/pdf-cmaps/',
                cMapPacked: true,
                standardFontDataUrl: '/pdf-standard_fonts/',
              }}
              loading={
                <div className="h-[40vh] flex items-center justify-center text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />Loading pages...
                </div>
              }
            >
              <div className="max-w-5xl mx-auto py-4 sm:py-6 px-2 sm:px-4 space-y-4">
                {pages.map((pageNumber) => {
                  const shouldRender = visibleWindow.has(pageNumber) || renderedPages.current.has(pageNumber);
                  const isLockedPreviewGate = !hasAccess && numPages > previewPages && pageNumber === previewPages;

                  return (
                    <div
                      key={pageNumber}
                      data-page={pageNumber}
                      ref={(node) => {
                        pageRefs.current[pageNumber] = node;
                      }}
                      className="relative"
                    >
                      {shouldRender ? (
                        <Page
                          pageNumber={pageNumber}
                          scale={scale}
                          renderTextLayer
                          renderAnnotationLayer
                          className="mx-auto shadow-xl ring-1 ring-border/20 rounded-md overflow-hidden bg-card"
                          width={typeof window !== 'undefined' && window.innerWidth < 640 ? window.innerWidth - 24 : undefined}
                          onRenderSuccess={() => renderedPages.current.add(pageNumber)}
                          loading={
                            <div className="h-[60vh] flex items-center justify-center border border-border/20 rounded-md bg-card">
                              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                            </div>
                          }
                        />
                      ) : (
                        <div className="h-[70vh] rounded-md border border-border/20 bg-card/60 animate-pulse" />
                      )}

                      {isLockedPreviewGate && (
                        <AnimatePresence>
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="absolute inset-0 bg-background/95 rounded-md flex items-center justify-center px-6"
                          >
                            <div className="text-center max-w-sm">
                              <Lock className="h-10 w-10 text-primary mx-auto mb-3" />
                              <h4 className="font-semibold text-lg mb-1">Preview limit reached</h4>
                              <p className="text-sm text-muted-foreground mb-4">You viewed {previewPages} pages. Unlock full access to continue reading.</p>
                              <Button className="w-full" onClick={handlePurchase}><ShoppingCart className="h-4 w-4 mr-2" />Unlock Full eBook</Button>
                            </div>
                          </motion.div>
                        </AnimatePresence>
                      )}
                    </div>
                  );
                })}
              </div>
            </Document>
          )}
        </div>

        <div className="flex items-center justify-between px-3 sm:px-5 py-2.5 border-t border-border/30 bg-card/60">
          <Button variant="outline" size="sm" onClick={goToPrevPage} disabled={currentPage <= 1 || loading}>
            <ChevronLeft className="h-4 w-4 mr-1" />Previous
          </Button>
          <div className="text-xs text-muted-foreground flex items-center gap-2">
            <Eye className="h-3.5 w-3.5" />
            {maxViewablePages > 0 ? Math.round((currentPage / maxViewablePages) * 100) : 0}% read
          </div>
          <Button variant="outline" size="sm" onClick={goToNextPage} disabled={currentPage >= maxViewablePages || loading}>
            Next<ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
