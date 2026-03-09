import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { SEOHead } from '@/components/seo/SEOHead';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, ExternalLink, BookOpen, Newspaper, Image, Layers,
  ArrowRight, Sparkles, Globe, TrendingUp, Filter
} from 'lucide-react';

type FeedArticle = {
  title: string;
  link: string;
  image: string | null;
  description: string;
  published_at: string | null;
  source: string;
  category: string;
};

type ExploreItem = {
  id: string;
  type: 'course' | 'case-study' | 'article' | 'portfolio';
  title: string;
  description: string | null;
  image: string | null;
  link: string;
  source?: string;
  tags?: string[];
  level?: string;
  price?: number;
};

const FILTERS = [
  { key: 'all', label: 'All', icon: Layers },
  { key: 'course', label: 'Courses', icon: BookOpen },
  { key: 'article', label: 'Articles', icon: Newspaper },
  { key: 'case-study', label: 'Case Studies', icon: Image },
];

function MasonryGrid({ items, filter, search }: { items: ExploreItem[]; filter: string; search: string }) {
  const filtered = useMemo(() => {
    return items.filter(item => {
      const matchType = filter === 'all' || item.type === filter;
      const matchSearch = !search || item.title.toLowerCase().includes(search.toLowerCase()) ||
        item.description?.toLowerCase().includes(search.toLowerCase());
      return matchType && matchSearch;
    });
  }, [items, filter, search]);

  if (filtered.length === 0) {
    return (
      <div className="text-center py-24">
        <Globe className="h-12 w-12 text-muted-foreground/20 mx-auto mb-4" />
        <p className="text-muted-foreground">No results found. Try a different filter.</p>
      </div>
    );
  }

  // Distribute into columns for masonry
  const cols = 3;
  const columns: ExploreItem[][] = Array.from({ length: cols }, () => []);
  filtered.forEach((item, i) => columns[i % cols].push(item));

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-5">
      {columns.map((col, colIdx) => (
        <div key={colIdx} className="flex flex-col gap-4 lg:gap-5">
          <AnimatePresence mode="popLayout">
            {col.map((item, idx) => (
              <MasonryCard key={item.id} item={item} index={colIdx * 10 + idx} />
            ))}
          </AnimatePresence>
        </div>
      ))}
    </div>
  );
}

function MasonryCard({ item, index }: { item: ExploreItem; index: number }) {
  const isExternal = item.type === 'article';

  const CardWrapper = ({ children }: { children: React.ReactNode }) =>
    isExternal ? (
      <a href={item.link} target="_blank" rel="noopener noreferrer" className="block">
        {children}
      </a>
    ) : (
      <Link to={item.link} className="block">
        {children}
      </Link>
    );

  const typeStyles: Record<string, string> = {
    course: 'bg-accent/10 text-accent border-accent/20',
    article: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    'case-study': 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
    portfolio: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
  };

  // Vary card heights based on content
  const hasImage = !!item.image;
  const imageHeight = hasImage ? (index % 3 === 0 ? 'h-56' : index % 3 === 1 ? 'h-44' : 'h-36') : '';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.4, delay: index * 0.03, ease: [0.22, 1, 0.36, 1] }}
    >
      <CardWrapper>
        <Card className="group overflow-hidden bg-card/60 hover:bg-card/90 border-border/40 hover:border-border/60 transition-all duration-500 hover:shadow-[var(--shadow-medium)]">
          {hasImage && (
            <div className={`${imageHeight} overflow-hidden relative`}>
              <img
                src={item.image!}
                alt={item.title}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-card/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

              {/* Source badge on image */}
              {item.source && (
                <div className="absolute top-3 left-3">
                  <Badge variant="secondary" className="text-[10px] backdrop-blur-sm bg-background/70 border-0">
                    {item.source}
                  </Badge>
                </div>
              )}
            </div>
          )}

          <CardContent className="p-4 space-y-2.5">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${typeStyles[item.type] || ''}`}>
                {item.type === 'case-study' ? 'Case Study' : item.type.charAt(0).toUpperCase() + item.type.slice(1)}
              </Badge>
              {item.level && (
                <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                  {item.level}
                </Badge>
              )}
              {isExternal && <ExternalLink className="h-3 w-3 text-muted-foreground ml-auto" />}
            </div>

            <h3 className="text-sm font-semibold text-foreground leading-snug line-clamp-2 group-hover:text-accent transition-colors duration-300">
              {item.title}
            </h3>

            {item.description && (
              <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">
                {item.description}
              </p>
            )}

            {item.price !== undefined && item.price > 0 && (
              <p className="text-sm font-semibold text-foreground">
                ₹{item.price.toLocaleString('en-IN')}
              </p>
            )}

            {item.tags && item.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 pt-1">
                {item.tags.slice(0, 3).map(tag => (
                  <span key={tag} className="text-[10px] text-muted-foreground/70 bg-muted/50 px-1.5 py-0.5 rounded">
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </CardWrapper>
    </motion.div>
  );
}

export default function Explore() {
  const [items, setItems] = useState<ExploreItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadAllContent();
  }, []);

  const loadAllContent = async () => {
    setLoading(true);

    const [coursesRes, caseStudiesRes, feedRes] = await Promise.allSettled([
      supabase.from('courses')
        .select('id, title, slug, short_description, thumbnail_url, price_inr, level, tags')
        .eq('is_published', true).order('order_index'),
      supabase.from('case_studies')
        .select('*')
        .eq('is_published', true).order('order_index'),
      supabase.functions.invoke('fetch-architecture-feed'),
    ]);

    const allItems: ExploreItem[] = [];

    // Courses
    if (coursesRes.status === 'fulfilled' && coursesRes.value.data) {
      coursesRes.value.data.forEach((c: any) => {
        allItems.push({
          id: `course-${c.id}`,
          type: 'course',
          title: c.title,
          description: c.short_description,
          image: c.thumbnail_url,
          link: `/course/${c.slug}`,
          tags: c.tags,
          level: c.level,
          price: c.price_inr,
        });
      });
    }

    // Case studies
    if (caseStudiesRes.status === 'fulfilled' && caseStudiesRes.value.data) {
      caseStudiesRes.value.data.forEach((cs: any) => {
        allItems.push({
          id: `case-${cs.id}`,
          type: 'case-study',
          title: cs.title,
          description: cs.brief,
          image: cs.image_url,
          link: `/case-studies`,
          tags: cs.tags,
          source: cs.architect,
        });
      });
    }

    // RSS articles
    if (feedRes.status === 'fulfilled' && feedRes.value.data?.articles) {
      feedRes.value.data.articles.forEach((a: FeedArticle, i: number) => {
        allItems.push({
          id: `article-${i}`,
          type: 'article',
          title: a.title,
          description: a.description,
          image: a.image,
          link: a.link || '#',
          source: a.source,
        });
      });
    }

    // Shuffle to create an interesting mix
    const shuffled = allItems.sort(() => Math.random() - 0.5);
    setItems(shuffled);
    setLoading(false);
  };

  return (
    <>
      <SEOHead
        title="Explore Architecture — Archistudio"
        description="Discover architecture courses, case studies, and curated inspiration from ArchDaily, Dezeen, and more."
      />
      <Navbar />
      <main className="min-h-screen bg-background">
        {/* Hero header */}
        <section className="relative border-b border-border/30 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-accent/[0.03] via-transparent to-transparent" />
          <div className="container mx-auto px-4 py-16 md:py-20 relative">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="max-w-2xl mx-auto text-center space-y-5"
            >
              <Badge variant="outline" className="gap-1.5 text-xs font-medium">
                <Sparkles className="h-3 w-3" /> Discover & Learn
              </Badge>
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight">
                Architecture{' '}
                <span className="text-gradient-accent">Explored</span>
              </h1>
              <p className="text-muted-foreground text-base md:text-lg leading-relaxed max-w-lg mx-auto">
                Curated courses, global inspiration from ArchDaily & Dezeen, case studies — all in one place.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Filters & search */}
        <div className="sticky top-0 z-30 bg-background/80 backdrop-blur-xl border-b border-border/30">
          <div className="container mx-auto px-4 py-3 flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search courses, articles, case studies..."
                className="pl-10 bg-muted/30 border-border/40"
              />
            </div>
            <div className="flex gap-1.5">
              {FILTERS.map(f => (
                <Button
                  key={f.key}
                  variant={filter === f.key ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setFilter(f.key)}
                  className="gap-1.5 text-xs"
                >
                  <f.icon className="h-3.5 w-3.5" />
                  {f.label}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="container mx-auto px-4 py-8">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-5">
              {Array.from({ length: 9 }).map((_, i) => (
                <div key={i} className="space-y-3">
                  <Skeleton className={`w-full rounded-xl ${i % 3 === 0 ? 'h-56' : 'h-40'}`} />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              ))}
            </div>
          ) : (
            <MasonryGrid items={items} filter={filter} search={search} />
          )}
        </div>

        {/* Trending section */}
        <section className="border-t border-border/30 bg-muted/20">
          <div className="container mx-auto px-4 py-12">
            <div className="flex items-center gap-2 mb-6">
              <TrendingUp className="h-4 w-4 text-accent" />
              <h2 className="text-lg font-semibold">Quick Links</h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: 'All Courses', link: '/courses', icon: BookOpen },
                { label: 'Case Studies', link: '/case-studies', icon: Image },
                { label: 'Student Portfolios', link: '/portfolios', icon: Layers },
                { label: 'Resource Library', link: '/resources', icon: Globe },
                { label: 'Learning Paths', link: '/roadmaps', icon: TrendingUp },
                { label: 'eBooks', link: '/ebooks', icon: Newspaper },
                { label: 'Forum', link: '/forum', icon: Layers },
                { label: 'Leaderboard', link: '/leaderboard', icon: TrendingUp },
              ].map(q => (
                <Link key={q.label} to={q.link}>
                  <Card className="group bg-card/50 hover:bg-card/80 border-border/30 hover:border-border/50 transition-all duration-300 cursor-pointer">
                    <CardContent className="p-4 flex items-center gap-3">
                      <q.icon className="h-4 w-4 text-muted-foreground group-hover:text-accent transition-colors" />
                      <span className="text-sm font-medium">{q.label}</span>
                      <ArrowRight className="h-3.5 w-3.5 ml-auto text-muted-foreground/40 group-hover:text-accent group-hover:translate-x-0.5 transition-all" />
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
