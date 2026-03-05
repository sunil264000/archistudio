import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import {
  Download, Check, X, DollarSign, Clock, Loader2,
  MessageSquare, User, BookOpen, RefreshCw
} from 'lucide-react';

interface DownloadRequest {
  id: string;
  user_id: string;
  ebook_id: string;
  reason: string;
  status: string;
  price_set: number | null;
  admin_note: string | null;
  payment_order_id: string | null;
  payment_verified: boolean;
  download_granted: boolean;
  created_at: string;
  updated_at: string;
}

export function DownloadRequestManagement() {
  const [requests, setRequests] = useState<DownloadRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [ebookNames, setEbookNames] = useState<Record<string, string>>({});
  const [userEmails, setUserEmails] = useState<Record<string, string>>({});
  const [priceInputs, setPriceInputs] = useState<Record<string, string>>({});
  const [noteInputs, setNoteInputs] = useState<Record<string, string>>({});
  const [processing, setProcessing] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    let query = supabase.from('download_requests').select('*').order('created_at', { ascending: false });

    if (filter === 'pending') query = query.eq('status', 'pending');
    else if (filter === 'approved') query = query.in('status', ['approved_free', 'approved_paid', 'paid', 'completed']);
    else if (filter === 'rejected') query = query.eq('status', 'rejected');

    const { data, error } = await query;
    if (error) {
      toast.error('Failed to load requests');
      setLoading(false);
      return;
    }

    setRequests(data || []);

    // Fetch ebook names
    const ebookIds = [...new Set((data || []).map(r => r.ebook_id))];
    if (ebookIds.length) {
      const { data: ebooks } = await supabase.from('ebooks').select('id, title').in('id', ebookIds);
      const nameMap: Record<string, string> = {};
      ebooks?.forEach(e => { nameMap[e.id] = e.title; });
      setEbookNames(nameMap);
    }

    // Fetch user emails
    const userIds = [...new Set((data || []).map(r => r.user_id))];
    if (userIds.length) {
      const { data: profiles } = await supabase.from('profiles').select('user_id, email, full_name').in('user_id', userIds);
      const emailMap: Record<string, string> = {};
      profiles?.forEach(p => { emailMap[p.user_id] = p.full_name || p.email || 'Unknown'; });
      setUserEmails(emailMap);
    }

    setLoading(false);
  }, [filter]);

  useEffect(() => { fetchRequests(); }, [fetchRequests]);

  const handleApprove = async (request: DownloadRequest, type: 'free' | 'paid') => {
    setProcessing(request.id);
    try {
      const updates: any = {
        admin_note: noteInputs[request.id] || null,
        updated_at: new Date().toISOString(),
      };

      if (type === 'free') {
        updates.status = 'approved_free';
        updates.price_set = 0;
        updates.download_granted = true;
      } else {
        const price = parseInt(priceInputs[request.id] || '0');
        if (!price || price <= 0) {
          toast.error('Please set a valid price');
          setProcessing(null);
          return;
        }
        updates.status = 'approved_paid';
        updates.price_set = price;
        updates.download_granted = false;
      }

      const { error } = await supabase.from('download_requests').update(updates).eq('id', request.id);
      if (error) throw error;

      // Send notification to user
      await supabase.from('notifications').insert({
        user_id: request.user_id,
        title: type === 'free' ? 'Download Approved (Free)' : `Download Approved — ₹${updates.price_set}`,
        message: type === 'free'
          ? `Your download request for "${ebookNames[request.ebook_id]}" has been approved! You can now download it for free.`
          : `Your download request for "${ebookNames[request.ebook_id]}" has been approved. Please pay ₹${updates.price_set} to download.`,
        type: 'download_request',
        action_url: '/ebooks',
      });

      toast.success(type === 'free' ? 'Approved (Free download)' : `Approved with price ₹${updates.price_set}`);
      fetchRequests();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to approve');
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (request: DownloadRequest) => {
    setProcessing(request.id);
    try {
      const { error } = await supabase.from('download_requests').update({
        status: 'rejected',
        admin_note: noteInputs[request.id] || 'Request rejected.',
        updated_at: new Date().toISOString(),
      }).eq('id', request.id);
      if (error) throw error;

      await supabase.from('notifications').insert({
        user_id: request.user_id,
        title: 'Download Request Rejected',
        message: `Your download request for "${ebookNames[request.ebook_id]}" was rejected. ${noteInputs[request.id] || ''}`,
        type: 'download_request',
      });

      toast.success('Request rejected');
      fetchRequests();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to reject');
    } finally {
      setProcessing(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/30';
      case 'approved_free': return 'bg-green-500/10 text-green-500 border-green-500/30';
      case 'approved_paid': return 'bg-blue-500/10 text-blue-500 border-blue-500/30';
      case 'paid': case 'completed': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30';
      case 'rejected': return 'bg-red-500/10 text-red-500 border-red-500/30';
      default: return '';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Download Requests</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Manage eBook download requests. Approve for free or set a price with Cashfree payment.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchRequests}>
          <RefreshCw className="h-4 w-4 mr-1" /> Refresh
        </Button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2">
        {(['pending', 'approved', 'rejected', 'all'] as const).map(f => (
          <Button
            key={f}
            size="sm"
            variant={filter === f ? 'default' : 'outline'}
            onClick={() => setFilter(f)}
            className="capitalize"
          >
            {f}
          </Button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : requests.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Download className="h-10 w-10 mx-auto mb-3 opacity-40" />
            <p>No {filter !== 'all' ? filter : ''} download requests.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {requests.map(request => (
            <Card key={request.id} className="overflow-hidden">
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  {/* Info */}
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline" className={getStatusColor(request.status)}>
                        {request.status.replace('_', ' ')}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(request.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-sm">
                      <BookOpen className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{ebookNames[request.ebook_id] || 'Unknown eBook'}</span>
                    </div>

                    <div className="flex items-center gap-2 text-sm">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span>{userEmails[request.user_id] || 'Unknown user'}</span>
                    </div>

                    <div className="flex items-start gap-2 text-sm">
                      <MessageSquare className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <p className="text-muted-foreground">{request.reason}</p>
                    </div>

                    {request.price_set !== null && request.price_set > 0 && (
                      <div className="flex items-center gap-2 text-sm">
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                        <span>Price set: ₹{request.price_set}</span>
                        {request.payment_verified && <Badge className="bg-green-500 text-white">Paid</Badge>}
                      </div>
                    )}
                  </div>

                  {/* Actions for pending requests */}
                  {request.status === 'pending' && (
                    <div className="sm:w-64 space-y-2 border-t sm:border-t-0 sm:border-l border-border/40 pt-3 sm:pt-0 sm:pl-4">
                      <Input
                        placeholder="Set price (₹)"
                        type="number"
                        value={priceInputs[request.id] || ''}
                        onChange={e => setPriceInputs(p => ({ ...p, [request.id]: e.target.value }))}
                        className="h-8 text-sm"
                      />
                      <Textarea
                        placeholder="Admin note (optional)"
                        value={noteInputs[request.id] || ''}
                        onChange={e => setNoteInputs(p => ({ ...p, [request.id]: e.target.value }))}
                        className="min-h-[60px] text-sm"
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 text-green-500 border-green-500/30 hover:bg-green-500/10"
                          onClick={() => handleApprove(request, 'free')}
                          disabled={processing === request.id}
                        >
                          <Check className="h-3 w-3 mr-1" /> Free
                        </Button>
                        <Button
                          size="sm"
                          className="flex-1"
                          onClick={() => handleApprove(request, 'paid')}
                          disabled={processing === request.id || !priceInputs[request.id]}
                        >
                          <DollarSign className="h-3 w-3 mr-1" /> Paid
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleReject(request)}
                          disabled={processing === request.id}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                      {processing === request.id && (
                        <div className="flex items-center justify-center">
                          <Loader2 className="h-4 w-4 animate-spin" />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
