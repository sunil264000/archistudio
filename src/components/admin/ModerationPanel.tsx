import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Shield, Flag, CheckCircle, XCircle, Eye, Loader2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';

interface ModerationItem {
  id: string;
  content_type: string;
  content_id: string;
  content_preview: string | null;
  reason: string | null;
  status: string;
  action_taken: string | null;
  created_at: string;
}

export function ModerationPanel() {
  const [items, setItems] = useState<ModerationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');
  const [actionNote, setActionNote] = useState<Record<string, string>>({});

  const fetchItems = useCallback(async () => {
    setLoading(true);
    const query = supabase
      .from('moderation_queue')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (filter !== 'all') query.eq('status', filter);
    const { data, error } = await query;

    if (error) {
      toast.error('Failed to load moderation queue');
      console.error(error);
    }
    setItems(data || []);
    setLoading(false);
  }, [filter]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const handleAction = async (id: string, action: 'approved' | 'rejected' | 'removed') => {
    const { error } = await supabase
      .from('moderation_queue')
      .update({
        status: action,
        action_taken: actionNote[id] || action,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) {
      toast.error('Failed to update');
    } else {
      toast.success(`Content ${action}`);
      fetchItems();
    }
  };

  const statusColor: Record<string, string> = {
    pending: 'bg-amber-100 text-amber-700',
    approved: 'bg-emerald-100 text-emerald-700',
    rejected: 'bg-red-100 text-red-700',
    removed: 'bg-red-200 text-red-800',
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-accent" />
                Content Moderation Queue
              </CardTitle>
              <CardDescription>
                Review reported or flagged content
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Select value={filter} onValueChange={setFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" onClick={fetchItems} disabled={loading}>
                <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 w-full rounded-lg" />)}
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <CheckCircle className="h-12 w-12 mx-auto mb-3 text-emerald-400" />
              <p className="font-medium">Queue is clean</p>
              <p className="text-sm mt-1">No {filter === 'all' ? '' : filter} items to review</p>
            </div>
          ) : (
            <ScrollArea className="max-h-[600px]">
              <div className="space-y-4">
                {items.map((item) => (
                  <div key={item.id} className="p-4 rounded-xl border bg-muted/20 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <Badge variant="outline" className="text-xs capitalize">{item.content_type}</Badge>
                          <Badge className={`text-xs ${statusColor[item.status] || ''}`}>{item.status}</Badge>
                        </div>
                        {item.content_preview && (
                          <p className="text-sm text-foreground line-clamp-3 mt-1">{item.content_preview}</p>
                        )}
                        {item.reason && (
                          <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                            <Flag className="h-3 w-3" /> {item.reason}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(item.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>

                    {item.status === 'pending' && (
                      <div className="flex items-center gap-2 pt-2 border-t">
                        <Textarea
                          placeholder="Action note (optional)..."
                          className="text-xs h-8 min-h-8 resize-none flex-1"
                          value={actionNote[item.id] || ''}
                          onChange={(e) => setActionNote(p => ({ ...p, [item.id]: e.target.value }))}
                        />
                        <Button size="sm" variant="outline" className="gap-1 text-emerald-600" onClick={() => handleAction(item.id, 'approved')}>
                          <CheckCircle className="h-3.5 w-3.5" /> Approve
                        </Button>
                        <Button size="sm" variant="outline" className="gap-1 text-red-600" onClick={() => handleAction(item.id, 'rejected')}>
                          <XCircle className="h-3.5 w-3.5" /> Reject
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
