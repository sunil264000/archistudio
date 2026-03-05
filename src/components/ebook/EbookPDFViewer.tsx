import { useState, useCallback, useEffect } from 'react';
import { X, Loader2, ShoppingCart, Lock, MessageSquare, Info, CheckCircle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

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
  const [loading, setLoading] = useState(false);
  const [driveFileId, setDriveFileId] = useState<string | null>(null);
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [requestReason, setRequestReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [existingRequest, setExistingRequest] = useState<any>(null);

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

  const checkExistingRequest = useCallback(async () => {
    if (!user) return;
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
      fetchDriveId();
      checkExistingRequest();
      setShowRequestForm(false);
      setRequestReason('');
    }
  }, [isOpen, ebookId, fetchDriveId, checkExistingRequest]);

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
        const cashfree = window.Cashfree?.({ mode: 'production' });
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

  const drivePreviewUrl = driveFileId
    ? `https://drive.google.com/file/d/${driveFileId}/preview`
    : null;

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
                {(existingRequest?.status === 'approved_free' || existingRequest?.status === 'paid' || existingRequest?.status === 'completed') && existingRequest?.download_granted && (
                  <Button size="sm" variant="outline" className="gap-1.5 h-7 text-xs" onClick={() => {
                    // Trigger download via edge function
                    toast({ title: 'Download starting...', description: 'Your PDF download will begin shortly.' });
                    window.open(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/download-ebook-approved?requestId=${existingRequest.id}`, '_blank');
                  }}>
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
        <div className="px-3 py-1.5 bg-muted/30 border-b border-border/20 shrink-0">
          <p className="text-[11px] text-muted-foreground flex items-center gap-1.5">
            <Info className="h-3 w-3 shrink-0" />
            Downloads are available on request. Additional charges may apply depending on your reason and plan. Contact us for details.
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
            <p className="text-[11px] text-muted-foreground">
              Your request will be reviewed by the admin. Downloads may be provided free or may involve additional charges based on your reason.
            </p>
            <div className="flex gap-2">
              <Button size="sm" onClick={submitDownloadRequest} disabled={submitting}>
                {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : null}
                Submit Request
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setShowRequestForm(false)}>Cancel</Button>
            </div>
          </div>
        )}

        {/* PDF Preview */}
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
