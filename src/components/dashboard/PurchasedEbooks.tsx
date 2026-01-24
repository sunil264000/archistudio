import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Download, BookOpen, Library, Loader2, ExternalLink, Eye, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'react-router-dom';
import { EbookPDFViewer } from '@/components/ebook/EbookPDFViewer';

interface Ebook {
  id: string;
  title: string;
  description: string | null;
  category: string;
  cover_image_url: string | null;
}

export function PurchasedEbooks() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [ebooks, setEbooks] = useState<Ebook[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [selectedEbook, setSelectedEbook] = useState<Ebook | null>(null);

  useEffect(() => {
    if (user) {
      fetchPurchasedEbooks();
    }
  }, [user]);

  const fetchPurchasedEbooks = async () => {
    try {
      const { data: purchases, error: purchaseError } = await supabase
        .from('ebook_purchases')
        .select('ebook_ids')
        .eq('user_id', user?.id)
        .eq('status', 'completed');

      if (purchaseError) throw purchaseError;

      const ebookIds = new Set<string>();
      purchases?.forEach(purchase => {
        purchase.ebook_ids?.forEach(id => ebookIds.add(id));
      });

      if (ebookIds.size === 0) {
        setEbooks([]);
        setLoading(false);
        return;
      }

      const { data: ebooksData, error: ebooksError } = await supabase
        .from('ebooks')
        .select('id, title, description, category, cover_image_url')
        .in('id', Array.from(ebookIds))
        .order('category')
        .order('title');

      if (ebooksError) throw ebooksError;
      setEbooks(ebooksData || []);
    } catch (error) {
      console.error('Error fetching purchased ebooks:', error);
      toast({
        title: 'Error',
        description: 'Failed to load your eBooks',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (ebookId: string, title: string) => {
    setDownloading(ebookId);
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) {
        throw new Error('Please login to download');
      }

      const response = await supabase.functions.invoke('download-ebook', {
        body: { ebookId },
      });

      if (response.error) throw response.error;

      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${title.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_')}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast({
        title: 'Download Started',
        description: `Downloading "${title}"`,
      });
    } catch (error: any) {
      console.error('Download error:', error);
      toast({
        title: 'Download Failed',
        description: error.message || 'Failed to download eBook',
        variant: 'destructive',
      });
    } finally {
      setDownloading(null);
    }
  };

  const handleReadBook = (ebook: Ebook) => {
    setSelectedEbook(ebook);
    setViewerOpen(true);
  };

  // Group ebooks by category
  const groupedEbooks = ebooks.reduce((acc, ebook) => {
    if (!acc[ebook.category]) {
      acc[ebook.category] = [];
    }
    acc[ebook.category].push(ebook);
    return acc;
  }, {} as Record<string, Ebook[]>);

  const categoryColors: Record<string, string> = {
    'Fundamentals of Design': 'from-blue-500/20 to-blue-600/5 border-blue-500/20',
    'Construction & Detailing': 'from-orange-500/20 to-orange-600/5 border-orange-500/20',
    'Drawing & Representation': 'from-purple-500/20 to-purple-600/5 border-purple-500/20',
    'Specialized Buildings & Interiors': 'from-emerald-500/20 to-emerald-600/5 border-emerald-500/20',
    'Sustainable Design': 'from-green-500/20 to-green-600/5 border-green-500/20',
    'History & Reference': 'from-amber-500/20 to-amber-600/5 border-amber-500/20',
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (ebooks.length === 0) {
    return (
      <Card className="bg-gradient-to-br from-primary/5 via-transparent to-accent/5 border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-16">
          <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mb-6 shadow-lg">
            <Library className="h-10 w-10 text-primary" />
          </div>
          <h3 className="text-2xl font-bold mb-3">Your Library is Empty</h3>
          <p className="text-muted-foreground text-center mb-6 max-w-md">
            Start building your architecture reference collection. Browse our curated library of professional eBooks.
          </p>
          <Link to="/ebooks">
            <Button size="lg" className="gap-2 shadow-lg">
              <Sparkles className="h-4 w-4" />
              Explore eBook Library
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Your eBook Library</h2>
          <p className="text-muted-foreground">
            {ebooks.length} {ebooks.length === 1 ? 'book' : 'books'} in your collection
          </p>
        </div>
        <Link to="/ebooks">
          <Button variant="outline" className="gap-2">
            <ExternalLink className="h-4 w-4" />
            Browse More
          </Button>
        </Link>
      </div>

      {/* Stats Card */}
      <Card className="bg-gradient-to-r from-primary/10 via-accent/5 to-primary/10 border-primary/20">
        <CardContent className="py-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-3xl font-bold text-primary">{ebooks.length}</p>
              <p className="text-sm text-muted-foreground">Total Books</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-primary">{Object.keys(groupedEbooks).length}</p>
              <p className="text-sm text-muted-foreground">Categories</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-success">∞</p>
              <p className="text-sm text-muted-foreground">Lifetime Access</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-accent">PDF</p>
              <p className="text-sm text-muted-foreground">Download Format</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Books by Category */}
      {Object.entries(groupedEbooks).map(([category, categoryEbooks], catIndex) => (
        <motion.div
          key={category}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: catIndex * 0.1 }}
        >
          <Card className={`bg-gradient-to-br ${categoryColors[category] || 'from-card to-card'} overflow-hidden`}>
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-background/80 flex items-center justify-center shadow-sm">
                  <BookOpen className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">{category}</h3>
                  <p className="text-sm text-muted-foreground">
                    {categoryEbooks.length} {categoryEbooks.length === 1 ? 'book' : 'books'}
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {categoryEbooks.map((ebook, index) => (
                  <motion.div
                    key={ebook.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.05 }}
                    whileHover={{ scale: 1.02, y: -2 }}
                    className="group"
                  >
                    <Card className="overflow-hidden bg-background/80 backdrop-blur-sm hover:shadow-xl transition-all duration-300 border-transparent hover:border-primary/30">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3 mb-4">
                          <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center shrink-0 shadow-inner group-hover:shadow-lg transition-shadow">
                            <BookOpen className="h-7 w-7 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-sm line-clamp-2 mb-1 group-hover:text-primary transition-colors">
                              {ebook.title}
                            </h4>
                            <Badge variant="secondary" className="text-xs bg-success/10 text-success border-0">
                              Owned
                            </Badge>
                          </div>
                        </div>
                        
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1 gap-2"
                            onClick={() => handleReadBook(ebook)}
                          >
                            <Eye className="h-4 w-4" />
                            Read
                          </Button>
                          <Button
                            size="sm"
                            className="flex-1 gap-2"
                            onClick={() => handleDownload(ebook.id, ebook.title)}
                            disabled={downloading === ebook.id}
                          >
                            {downloading === ebook.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Download className="h-4 w-4" />
                            )}
                            {downloading === ebook.id ? '...' : 'Save'}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}

      {/* PDF Viewer Modal */}
      {selectedEbook && (
        <EbookPDFViewer
          isOpen={viewerOpen}
          onClose={() => {
            setViewerOpen(false);
            setSelectedEbook(null);
          }}
          ebookId={selectedEbook.id}
          ebookTitle={selectedEbook.title}
          hasAccess={true}
        />
      )}
    </div>
  );
}
