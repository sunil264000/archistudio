import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { MessageSquare, Star, TrendingUp, Clock, ArrowRight, Image as ImageIcon, AlertCircle, RefreshCw, Filter } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

interface FeedSheet {
  id: string;
  title: string;
  thumbnail_url: string | null;
  sheet_url: string;
  critique_count: number;
  tags: string[];
  created_at: string;
  author_name?: string;
  is_featured: boolean;
}

const TAG_FILTERS = ['All', 'Concept', 'Presentation', 'Thesis', 'Portfolio', 'Competition', 'Interior', 'Urban Design'];

export function SheetCritiqueFeed() {
  const [sheets, setSheets] = useState<FeedSheet[]>([]);
  const [tab, setTab] = useState<'latest' | 'trending' | 'featured'>('latest');
  const [tagFilter, setTagFilter] = useState('All');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { fetchFeed(); }, []);

  // Realtime subscription for new sheets
  useEffect(() => {
    const channel = supabase
      .channel('sheet-feed-realtime')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'sheet_reviews',
      }, (payload) => {
        const newSheet = payload.new as any;
        setSheets(prev => [{ ...newSheet, author_name: 'New', tags: newSheet.tags || [] }, ...prev]);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const fetchFeed = async () => {
    setLoading(true);
    setError(null);

    const { data, error: fetchError } = await supabase
      .from('sheet_reviews')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(30);

    if (fetchError) {
      console.error('Failed to load sheet feed:', fetchError);
      setError('Failed to load sheets');
      toast.error('Failed to load sheet feed');
      setLoading(false);
      return;
    }

    if (data && data.length > 0) {
      const userIds = [...new Set(data.map((s: any) => s.user_id))];
      const { data: profiles } = await supabase.from('profiles').select('user_id, full_name').in('user_id', userIds);
      const nameMap = new Map((profiles || []).map((p: any) => [p.user_id, p.full_name]));
      setSheets(data.map((s: any) => ({ ...s, tags: s.tags || [], author_name: nameMap.get(s.user_id) || 'Anonymous' })));
    } else {
      setSheets([]);
    }

    setLoading(false);
  };

  // Sorting & filtering
  const filtered = sheets.filter(s => {
    if (tab === 'featured' && !s.is_featured) return false;
    if (tagFilter !== 'All' && !(s.tags || []).includes(tagFilter)) return false;
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    if (tab === 'trending') return b.critique_count - a.critique_count;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  const displaySheets = sorted.slice(0, 12);

  if (error) {
    return (
      <div className="text-center py-12 space-y-3">
        <AlertCircle className="h-10 w-10 text-destructive mx-auto" />
        <p className="text-sm text-destructive">{error}</p>
        <Button variant="outline" size="sm" onClick={fetchFeed} className="gap-1.5">
          <RefreshCw className="h-3.5 w-3.5" /> Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex gap-2 flex-wrap">
          <Button variant={tab === 'latest' ? 'default' : 'outline'} size="sm" onClick={() => setTab('latest')} className="gap-1.5">
            <Clock className="h-3.5 w-3.5" /> Latest
          </Button>
          <Button variant={tab === 'trending' ? 'default' : 'outline'} size="sm" onClick={() => setTab('trending')} className="gap-1.5">
            <TrendingUp className="h-3.5 w-3.5" /> Most Critiques
          </Button>
          <Button variant={tab === 'featured' ? 'default' : 'outline'} size="sm" onClick={() => setTab('featured')} className="gap-1.5">
            <Star className="h-3.5 w-3.5" /> Featured
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-3.5 w-3.5 text-muted-foreground" />
          <Select value={tagFilter} onValueChange={setTagFilter}>
            <SelectTrigger className="w-32 h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TAG_FILTERS.map(tag => (
                <SelectItem key={tag} value={tag}>{tag}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Link to="/sheets">
            <Button variant="ghost" size="sm" className="gap-1 text-accent">
              View All <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} className="h-48 rounded-xl" />)}
        </div>
      ) : displaySheets.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <ImageIcon className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
            <p className="text-muted-foreground">No sheets found. {tagFilter !== 'All' ? 'Try a different filter.' : 'Be the first!'}</p>
            <Link to="/sheets">
              <Button size="sm" className="mt-3 bg-accent text-accent-foreground">Upload a Sheet</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {displaySheets.map((sheet, i) => (
            <motion.div
              key={sheet.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
            >
              <Link to={`/sheets/${sheet.id}`}>
                <Card className="overflow-hidden hover:border-accent/30 transition-all group cursor-pointer">
                  <div className="aspect-[4/3] bg-muted relative overflow-hidden">
                    {sheet.thumbnail_url || sheet.sheet_url ? (
                      <img
                        src={sheet.thumbnail_url || sheet.sheet_url}
                        alt={sheet.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ImageIcon className="h-8 w-8 text-muted-foreground" />
                      </div>
                    )}
                    {sheet.is_featured && (
                      <Badge className="absolute top-2 left-2 bg-accent text-accent-foreground text-[10px]">
                        <Star className="h-3 w-3 mr-0.5" /> Featured
                      </Badge>
                    )}
                  </div>
                  <CardContent className="p-3">
                    <p className="text-sm font-medium text-foreground truncate">{sheet.title}</p>
                    <div className="flex items-center justify-between mt-1.5">
                      <p className="text-xs text-muted-foreground">{sheet.author_name}</p>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <MessageSquare className="h-3 w-3" /> {sheet.critique_count}
                      </div>
                    </div>
                    {sheet.tags && sheet.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {sheet.tags.slice(0, 2).map(tag => (
                          <Badge key={tag} variant="outline" className="text-[9px] px-1 py-0">{tag}</Badge>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
