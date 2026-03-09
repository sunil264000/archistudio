import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { SEOHead } from '@/components/seo/SEOHead';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Eye, Search, ArrowRight, Sparkles, TrendingUp, Clock, Users } from 'lucide-react';
import { motion } from 'framer-motion';
import { AnimatedBackground } from '@/components/layout/AnimatedBackground';

interface DiscoverPortfolio {
  id: string;
  title: string;
  subtitle: string | null;
  slug: string;
  accent_color: string | null;
  created_at: string;
  user_id: string;
  author_name: string;
}

type SortBy = 'recent' | 'name';

export default function PortfolioDiscovery() {
  const [portfolios, setPortfolios] = useState<DiscoverPortfolio[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<SortBy>('recent');

  useEffect(() => {
    fetchPortfolios();
  }, []);

  const fetchPortfolios = async () => {
    setLoading(true);
    const { data, error } = await (supabase as any)
      .from('portfolios')
      .select('id, title, subtitle, slug, accent_color, created_at, user_id')
      .eq('is_public', true)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error || !data) {
      setLoading(false);
      return;
    }

    // Fetch author names
    const userIds = [...new Set(data.map((p: any) => p.user_id))] as string[];
    const { data: profiles } = await supabase
      .from('profiles')
      .select('user_id, full_name')
      .in('user_id', userIds);

    const nameMap = new Map((profiles || []).map(p => [p.user_id, p.full_name]));

    setPortfolios(data.map((p: any) => ({
      ...p,
      author_name: nameMap.get(p.user_id) || 'Anonymous',
    })));
    setLoading(false);
  };

  const filtered = portfolios
    .filter(p => {
      if (!search) return true;
      const q = search.toLowerCase();
      return p.title.toLowerCase().includes(q) || p.author_name.toLowerCase().includes(q) || (p.subtitle || '').toLowerCase().includes(q);
    })
    .sort((a, b) => {
      if (sortBy === 'recent') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      return a.title.localeCompare(b.title);
    });

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEOHead
        title="Portfolio Gallery — Archistudio"
        description="Browse architecture portfolios from students across India. Get inspired by real work."
        url="https://archistudio.shop/portfolios"
      />
      <Navbar />
      <AnimatedBackground intensity="light" />

      <main className="flex-1 pt-24 pb-16">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="max-w-2xl mx-auto text-center mb-12">
            <Badge variant="outline" className="mb-4 gap-1.5">
              <Sparkles className="h-3 w-3" /> Portfolio Gallery
            </Badge>
            <h1 className="text-3xl sm:text-4xl font-display font-bold text-foreground">
              Discover Architecture Portfolios
            </h1>
            <p className="text-muted-foreground mt-3">
              Browse portfolios from architecture students. Get inspired, learn from others, and showcase your own work.
            </p>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3 mb-8 max-w-xl mx-auto">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search portfolios..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortBy)}>
              <SelectTrigger className="w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent"><Clock className="h-3 w-3 inline mr-1" /> Recent</SelectItem>
                <SelectItem value="name"><TrendingUp className="h-3 w-3 inline mr-1" /> A–Z</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Grid */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} className="h-48 rounded-xl" />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16">
              <Users className="h-10 w-10 mx-auto text-muted-foreground/40 mb-3" />
              <p className="text-muted-foreground">No portfolios found</p>
              <Link to="/portfolio/build">
                <Button className="mt-4 gap-1.5">
                  Create Your Portfolio <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((portfolio, i) => (
                <motion.div
                  key={portfolio.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                >
                  <Link to={`/portfolio/${portfolio.slug}`}>
                    <Card className="overflow-hidden group hover:border-accent/30 transition-all cursor-pointer h-full">
                      {/* Accent bar */}
                      <div
                        className="h-2 w-full"
                        style={{ backgroundColor: portfolio.accent_color || 'hsl(var(--accent))' }}
                      />
                      <CardContent className="p-5 space-y-3">
                        <div className="flex items-start gap-3">
                          <Avatar className="h-10 w-10 shrink-0">
                            <AvatarFallback className="text-sm font-semibold" style={{ backgroundColor: (portfolio.accent_color || '#666') + '20', color: portfolio.accent_color || 'hsl(var(--accent))' }}>
                              {portfolio.author_name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0 flex-1">
                            <h3 className="font-semibold text-foreground truncate group-hover:text-accent transition-colors">
                              {portfolio.title}
                            </h3>
                            <p className="text-xs text-muted-foreground">{portfolio.author_name}</p>
                          </div>
                        </div>
                        {portfolio.subtitle && (
                          <p className="text-sm text-muted-foreground line-clamp-2">{portfolio.subtitle}</p>
                        )}
                        <div className="flex items-center justify-between pt-1">
                          <span className="text-[10px] text-muted-foreground/60">
                            {new Date(portfolio.created_at).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
                          </span>
                          <div className="flex items-center gap-1 text-xs text-accent opacity-0 group-hover:opacity-100 transition-opacity">
                            <Eye className="h-3 w-3" /> View
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}

          {/* CTA */}
          <div className="text-center mt-12">
            <Link to="/portfolio/build">
              <Button variant="outline" className="gap-1.5">
                Build Your Portfolio <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
