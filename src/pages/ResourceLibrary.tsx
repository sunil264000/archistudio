import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { SEOHead } from '@/components/seo/SEOHead';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import {
  Search, Download, Bookmark, BookmarkCheck, FileText, Image,
  Package, Loader2, Filter, FolderOpen
} from 'lucide-react';

const CATEGORIES = [
  { key: 'all', label: 'All', icon: FolderOpen },
  { key: 'case-studies', label: 'Case Studies', icon: FileText },
  { key: 'building-standards', label: 'Building Standards', icon: Package },
  { key: 'cad-blocks', label: 'CAD Blocks', icon: FileText },
  { key: 'rendering-assets', label: 'Rendering Assets', icon: Image },
  { key: 'presentation-templates', label: 'Templates', icon: FileText },
];

export default function ResourceLibrary() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [resources, setResources] = useState<any[]>([]);
  const [bookmarks, setBookmarks] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');

  useEffect(() => {
    fetchResources();
    if (user) fetchBookmarks();
  }, [user]);

  const fetchResources = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('resources')
      .select('*')
      .eq('is_published', true)
      .order('created_at', { ascending: false });
    setResources(data || []);
    setLoading(false);
  };

  const fetchBookmarks = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('resource_bookmarks')
      .select('resource_id')
      .eq('user_id', user.id);
    setBookmarks(new Set((data || []).map((b: any) => b.resource_id)));
  };

  const toggleBookmark = async (resourceId: string) => {
    if (!user) {
      toast({ title: 'Login Required', description: 'Please login to bookmark resources.', variant: 'destructive' });
      return;
    }
    if (bookmarks.has(resourceId)) {
      await supabase.from('resource_bookmarks').delete().eq('user_id', user.id).eq('resource_id', resourceId);
      setBookmarks(prev => { const n = new Set(prev); n.delete(resourceId); return n; });
    } else {
      await supabase.from('resource_bookmarks').insert({ user_id: user.id, resource_id: resourceId });
      setBookmarks(prev => new Set(prev).add(resourceId));
    }
  };

  const handleDownload = async (resource: any) => {
    const url = resource.file_url || resource.external_url;
    if (url) {
      window.open(url, '_blank');
      // Increment download count
      await supabase.from('resources').update({ download_count: (resource.download_count || 0) + 1 }).eq('id', resource.id);
    }
  };

  const filtered = resources.filter(r => {
    const matchesCategory = category === 'all' || r.category === category;
    const matchesSearch = !search || r.title.toLowerCase().includes(search.toLowerCase()) ||
      r.description?.toLowerCase().includes(search.toLowerCase()) ||
      r.tags?.some((t: string) => t.toLowerCase().includes(search.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const getFileIcon = (type: string) => {
    if (type?.includes('image') || type === 'texture') return <Image className="h-5 w-5" />;
    return <FileText className="h-5 w-5" />;
  };

  return (
    <>
      <SEOHead title="Resource Library — Archistudio" description="Searchable architecture resource library with CAD blocks, case studies, rendering assets, and templates." />
      <Navbar />
      <main className="min-h-screen bg-background">
        <div className="bg-gradient-to-b from-primary/5 to-background border-b border-border/30">
          <div className="container-wide py-12 text-center">
            <Badge variant="outline" className="mb-4">Resource Vault</Badge>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground">Architecture Resource Library</h1>
            <p className="text-muted-foreground mt-2 max-w-lg mx-auto">
              Case studies, CAD blocks, rendering assets, templates, and more — curated for architecture students.
            </p>
          </div>
        </div>

        <div className="container-wide py-8 space-y-6">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search resources..."
                className="pl-10"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              {CATEGORIES.map(cat => (
                <Button
                  key={cat.key}
                  variant={category === cat.key ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setCategory(cat.key)}
                  className="gap-1.5"
                >
                  <cat.icon className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">{cat.label}</span>
                </Button>
              ))}
            </div>
          </div>

          {/* Results */}
          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20">
              <FolderOpen className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-muted-foreground">No resources found. Check back soon!</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map(resource => (
                <Card key={resource.id} className="bg-card/50 hover:bg-card/80 transition-colors group">
                  <CardContent className="p-4">
                    {resource.thumbnail_url && (
                      <img src={resource.thumbnail_url} alt={resource.title} className="w-full h-32 object-cover rounded-lg mb-3" />
                    )}
                    <div className="flex items-start gap-3">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                        {getFileIcon(resource.file_type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold text-foreground line-clamp-2">{resource.title}</h3>
                        {resource.description && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{resource.description}</p>
                        )}
                        <div className="flex flex-wrap gap-1 mt-2">
                          <Badge variant="outline" className="text-[10px]">{resource.category}</Badge>
                          {resource.tags?.slice(0, 2).map((tag: string) => (
                            <Badge key={tag} variant="secondary" className="text-[10px]">{tag}</Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/30">
                      <span className="text-[10px] text-muted-foreground">
                        {resource.download_count || 0} downloads
                      </span>
                      <div className="flex gap-1.5">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => toggleBookmark(resource.id)}
                        >
                          {bookmarks.has(resource.id) ? (
                            <BookmarkCheck className="h-3.5 w-3.5 text-primary" />
                          ) : (
                            <Bookmark className="h-3.5 w-3.5" />
                          )}
                        </Button>
                        {(resource.file_url || resource.external_url) && (
                          <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => handleDownload(resource)}>
                            <Download className="h-3 w-3" /> Get
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
