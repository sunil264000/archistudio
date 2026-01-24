import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SEOHead, generateBlogPostSchema } from '@/components/seo/SEOHead';
import { ArrowLeft, Calendar, Share2, Copy } from 'lucide-react';
import { toast } from 'sonner';

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string | null;
  featured_image_url: string | null;
  published_at: string | null;
  created_at: string | null;
  meta_title: string | null;
  meta_description: string | null;
}

export default function BlogPost() {
  const { slug } = useParams<{ slug: string }>();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (slug) fetchPost();
  }, [slug]);

  const fetchPost = async () => {
    try {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('slug', slug)
        .eq('is_published', true)
        .single();

      if (error) throw error;
      setPost(data);

      // Update document title
      if (data) {
        document.title = data.meta_title || data.title;
      }
    } catch (error) {
      console.error('Error fetching post:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const sharePost = async () => {
    const url = window.location.href;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: post?.title,
          text: post?.excerpt || '',
          url,
        });
      } catch (error) {
        copyToClipboard(url);
      }
    } else {
      copyToClipboard(url);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Link copied to clipboard!');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container-tight py-20">
          <div className="space-y-6">
            <div className="h-8 w-32 animate-pulse bg-muted rounded" />
            <div className="h-12 animate-pulse bg-muted rounded" />
            <div className="h-64 animate-pulse bg-muted rounded" />
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-4 animate-pulse bg-muted rounded" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container-tight py-20 text-center">
          <h1 className="text-2xl font-bold mb-4">Article Not Found</h1>
          <p className="text-muted-foreground mb-6">
            The article you're looking for doesn't exist or has been removed.
          </p>
          <Link to="/blog">
            <Button>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Blog
            </Button>
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const blogSchema = generateBlogPostSchema({
    title: post.title,
    description: post.meta_description || post.excerpt || '',
    url: `https://archistudio.shop/blog/${post.slug}`,
    image: post.featured_image_url || undefined,
    publishedTime: post.published_at || post.created_at || '',
  });

  return (
    <div className="min-h-screen bg-background">
      <SEOHead 
        title={post.meta_title || `${post.title} | Archistudio Blog`}
        description={post.meta_description || post.excerpt || ''}
        url={`https://archistudio.shop/blog/${post.slug}`}
        image={post.featured_image_url || undefined}
        type="article"
        publishedTime={post.published_at || undefined}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(blogSchema) }}
      />
      <Navbar />
      
      <article className="py-12">
        <div className="container-tight">
          {/* Back link */}
          <Link to="/blog" className="inline-flex items-center text-muted-foreground hover:text-foreground mb-8">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Blog
          </Link>

          {/* Header */}
          <header className="mb-8">
            <Badge variant="secondary" className="mb-4">Article</Badge>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold tracking-tight mb-4">
              {post.title}
            </h1>
            
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-4 w-4" />
                {formatDate(post.published_at || post.created_at)}
              </div>
              
              <Button variant="outline" size="sm" onClick={sharePost}>
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
            </div>
          </header>

          {/* Featured Image */}
          {post.featured_image_url && (
            <div className="mb-8 rounded-lg overflow-hidden">
              <img
                src={post.featured_image_url}
                alt={post.title}
                className="w-full h-auto"
              />
            </div>
          )}

          {/* Content */}
          <div 
            className="prose prose-lg dark:prose-invert max-w-none"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />

          {/* Share CTA */}
          <div className="mt-12 p-6 bg-muted/50 rounded-lg text-center">
            <h3 className="font-semibold mb-2">Found this helpful?</h3>
            <p className="text-muted-foreground mb-4">Share it with fellow architects!</p>
            <Button onClick={sharePost}>
              <Share2 className="h-4 w-4 mr-2" />
              Share Article
            </Button>
          </div>

          {/* Back link */}
          <div className="mt-12 pt-8 border-t">
            <Link to="/blog">
              <Button variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                More Articles
              </Button>
            </Link>
          </div>
        </div>
      </article>

      <Footer />
    </div>
  );
}