import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Download, BookOpen, Library, Loader2, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'react-router-dom';

interface Ebook {
  id: string;
  title: string;
  description: string | null;
  category: string;
  cover_image_url: string | null;
}

interface Purchase {
  id: string;
  ebook_ids: string[];
  is_full_bundle: boolean;
  created_at: string;
  status: string;
}

export function PurchasedEbooks() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [ebooks, setEbooks] = useState<Ebook[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchPurchasedEbooks();
    }
  }, [user]);

  const fetchPurchasedEbooks = async () => {
    try {
      // Get all completed purchases for the user
      const { data: purchases, error: purchaseError } = await supabase
        .from('ebook_purchases')
        .select('ebook_ids')
        .eq('user_id', user?.id)
        .eq('status', 'completed');

      if (purchaseError) throw purchaseError;

      // Collect all unique ebook IDs
      const ebookIds = new Set<string>();
      purchases?.forEach(purchase => {
        purchase.ebook_ids?.forEach(id => ebookIds.add(id));
      });

      if (ebookIds.size === 0) {
        setEbooks([]);
        setLoading(false);
        return;
      }

      // Fetch ebook details
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

      // The response should be a blob/file
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

  // Group ebooks by category
  const groupedEbooks = ebooks.reduce((acc, ebook) => {
    if (!acc[ebook.category]) {
      acc[ebook.category] = [];
    }
    acc[ebook.category].push(ebook);
    return acc;
  }, {} as Record<string, Ebook[]>);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (ebooks.length === 0) {
    return (
      <Card className="bg-card/50 border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <Library className="h-8 w-8 text-primary" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No eBooks Yet</h3>
          <p className="text-muted-foreground text-center mb-4 max-w-md">
            You haven't purchased any eBooks yet. Browse our premium architecture library to get started.
          </p>
          <Link to="/ebooks">
            <Button className="gap-2">
              <BookOpen className="h-4 w-4" />
              Browse eBook Library
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Your eBook Library</h2>
          <p className="text-sm text-muted-foreground">
            {ebooks.length} {ebooks.length === 1 ? 'eBook' : 'eBooks'} in your collection
          </p>
        </div>
        <Link to="/ebooks">
          <Button variant="outline" size="sm" className="gap-2">
            <ExternalLink className="h-4 w-4" />
            Browse More
          </Button>
        </Link>
      </div>

      {Object.entries(groupedEbooks).map(([category, categoryEbooks], catIndex) => (
        <motion.div
          key={category}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: catIndex * 0.1 }}
        >
          <div className="mb-3">
            <Badge variant="outline" className="text-xs">
              {category}
            </Badge>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categoryEbooks.map((ebook, index) => (
              <motion.div
                key={ebook.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="overflow-hidden hover:shadow-lg transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <BookOpen className="h-6 w-6 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm line-clamp-2 mb-1">
                          {ebook.title}
                        </h4>
                        {ebook.description && (
                          <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                            {ebook.description}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <Button
                      size="sm"
                      className="w-full mt-3 gap-2"
                      onClick={() => handleDownload(ebook.id, ebook.title)}
                      disabled={downloading === ebook.id}
                    >
                      {downloading === ebook.id ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Downloading...
                        </>
                      ) : (
                        <>
                          <Download className="h-4 w-4" />
                          Download PDF
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>
      ))}
    </div>
  );
}
