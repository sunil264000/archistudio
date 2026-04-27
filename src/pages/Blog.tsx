import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { AnimatedBackground } from '@/components/layout/AnimatedBackground';
import { SEOHead } from '@/components/seo/SEOHead';
import { Calendar, Clock, Search, ArrowRight, Sparkles } from 'lucide-react';
interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  featured_image_url: string | null;
  published_at: string | null;
  created_at: string | null;
}

export default function Blog() {
  const PAGE_SIZE = 9;
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    fetchPosts();
  }, [page]);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const from = page * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;
      const { data, error, count } = await supabase
        .from('blog_posts')
        .select('id, title, slug, excerpt, featured_image_url, published_at, created_at', { count: 'exact' })
        .eq('is_published', true)
        .order('published_at', { ascending: false })
        .range(from, to);

      if (error) throw error;
      setPosts(data || []);
      setTotalCount(count || 0);
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  const filteredPosts = posts.filter(post =>
    post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    post.excerpt?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      <SEOHead
        title="Blog - Architecture Insights & Tutorials | Archistudio"
        description="Practical tips, industry insights, and tutorials to help you become a better architect. Learn 3ds Max, AutoCAD, Revit, and more."
        url="https://archistudio.shop/blog"
        keywords="architecture blog, 3ds max tutorials, autocad tips, revit tutorials, architectural visualization tips, interior design articles"
      />
      <Navbar />

      {/* Hero */}
      <section className="relative py-20 md:py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-accent/[0.03] via-transparent to-transparent" />
        <div className="absolute inset-0 dot-grid opacity-15 pointer-events-none" />

        <div className="relative container-wide text-center space-y-6">
          <Badge variant="outline" className="mb-4 gap-1.5 border-accent/20">
            <Sparkles className="h-3 w-3 text-accent" />
            Resources
          </Badge>
          <h1 className="text-4xl md:text-5xl font-display font-bold tracking-tight">
            Architecture <span className="text-hero-gradient">Insights</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Practical tips, industry insights, and tutorials to help you become a better architect.
          </p>

          {/* Search */}
          <div className="max-w-md mx-auto relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Search articles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 rounded-xl border-border/40 bg-card/50 focus:shadow-[0_0_0_2px_hsl(var(--accent)/0.2)]"
            />
          </div>
        </div>
      </section>

      {/* Posts Grid */}
      <section className="py-16">
        <div className="container-wide">
          {loading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-0">
                    <div className="h-48 animate-pulse bg-muted" />
                    <div className="p-6 space-y-3">
                      <div className="h-6 animate-pulse bg-muted rounded" />
                      <div className="h-4 animate-pulse bg-muted rounded w-2/3" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredPosts.length === 0 ? (
            <div className="text-center py-16">
              <div className="p-4 bg-muted rounded-full inline-block mb-4">
                <Search className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-2">
                {searchQuery ? 'No articles found' : 'No articles yet'}
              </h3>
              <p className="text-muted-foreground">
                {searchQuery
                  ? 'Try adjusting your search query'
                  : 'Check back soon for new content!'}
              </p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPosts.map((post) => (
                <Link key={post.id} to={`/blog/${post.slug}`}>
                  <Card className="h-full overflow-hidden group card-premium">
                    {post.featured_image_url ? (
                      <div className="h-48 overflow-hidden">
                        <img
                          src={post.featured_image_url}
                          alt={post.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    ) : (
                      <div className="h-48 bg-gradient-to-br from-muted to-muted-foreground/10 flex items-center justify-center">
                        <span className="text-4xl font-display font-bold text-muted-foreground/20">
                          {post.title.charAt(0)}
                        </span>
                      </div>
                    )}
                    <CardHeader>
                      <CardTitle className="line-clamp-2 group-hover:text-accent transition-colors">
                        {post.title}
                      </CardTitle>
                      {post.excerpt && (
                        <CardDescription className="line-clamp-2">
                          {post.excerpt}
                        </CardDescription>
                      )}
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {formatDate(post.published_at || post.created_at)}
                        </div>
                        <div className="flex items-center gap-1 text-accent group-hover:translate-x-1 transition-transform">
                          Read more
                          <ArrowRight className="h-4 w-4" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 mt-10">
              <button
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={page === 0 || loading}
                className="px-5 py-2.5 rounded-full border border-border text-sm font-medium transition-all hover:bg-accent hover:text-accent-foreground hover:border-accent disabled:opacity-40 disabled:cursor-not-allowed"
              >
                ← Previous
              </button>
              <span className="text-sm text-muted-foreground font-medium">Page {page + 1} of {totalPages}</span>
              <button
                onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1 || loading}
                className="px-5 py-2.5 rounded-full border border-border text-sm font-medium transition-all hover:bg-accent hover:text-accent-foreground hover:border-accent disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Next →
              </button>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}