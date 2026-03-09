import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MessageSquare, Star, TrendingUp, Clock, ArrowRight, Image as ImageIcon } from 'lucide-react';
import { motion } from 'framer-motion';

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

export function SheetCritiqueFeed() {
  const [sheets, setSheets] = useState<FeedSheet[]>([]);
  const [trending, setTrending] = useState<FeedSheet[]>([]);
  const [tab, setTab] = useState<'latest' | 'trending'>('latest');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFeed();
  }, []);

  const fetchFeed = async () => {
    setLoading(true);
    
    // Latest sheets
    const { data: latestData } = await supabase
      .from('sheet_reviews')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(6);

    // Trending (most critiques)
    const { data: trendingData } = await supabase
      .from('sheet_reviews')
      .select('*')
      .order('critique_count', { ascending: false })
      .limit(6);

    if (latestData) {
      const userIds = [...new Set(latestData.map((s: any) => s.user_id))];
      const { data: profiles } = await supabase.from('profiles').select('user_id, full_name').in('user_id', userIds);
      const nameMap = new Map((profiles || []).map((p: any) => [p.user_id, p.full_name]));
      setSheets(latestData.map((s: any) => ({ ...s, author_name: nameMap.get(s.user_id) || 'Anonymous' })));
    }
    
    if (trendingData) {
      const userIds = [...new Set(trendingData.map((s: any) => s.user_id))];
      const { data: profiles } = await supabase.from('profiles').select('user_id, full_name').in('user_id', userIds);
      const nameMap = new Map((profiles || []).map((p: any) => [p.user_id, p.full_name]));
      setTrending(trendingData.map((s: any) => ({ ...s, author_name: nameMap.get(s.user_id) || 'Anonymous' })));
    }

    setLoading(false);
  };

  const displaySheets = tab === 'latest' ? sheets : trending;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <Button
            variant={tab === 'latest' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTab('latest')}
            className="gap-1.5"
          >
            <Clock className="h-3.5 w-3.5" /> Latest
          </Button>
          <Button
            variant={tab === 'trending' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTab('trending')}
            className="gap-1.5"
          >
            <TrendingUp className="h-3.5 w-3.5" /> Trending
          </Button>
        </div>
        <Link to="/sheets">
          <Button variant="ghost" size="sm" className="gap-1 text-accent">
            View All <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </Link>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => <div key={i} className="h-48 rounded-xl bg-muted animate-pulse" />)}
        </div>
      ) : displaySheets.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <ImageIcon className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
            <p className="text-muted-foreground">No sheets yet. Be the first!</p>
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
              transition={{ delay: i * 0.05 }}
            >
              <Link to={`/sheets/${sheet.id}`}>
                <Card className="overflow-hidden hover:border-accent/30 transition-all group cursor-pointer">
                  <div className="aspect-[4/3] bg-muted relative overflow-hidden">
                    {sheet.thumbnail_url || sheet.sheet_url ? (
                      <img
                        src={sheet.thumbnail_url || sheet.sheet_url}
                        alt={sheet.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
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
