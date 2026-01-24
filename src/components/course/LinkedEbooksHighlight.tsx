import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { Link } from 'react-router-dom';
import { 
  BookOpen, 
  Gift, 
  Sparkles, 
  ArrowRight,
  Download,
  CheckCircle
} from 'lucide-react';

interface LinkedEbook {
  id: string;
  title: string;
  category: string;
}

interface LinkedEbooksHighlightProps {
  courseId: string | null;
  courseTitle: string;
}

export function LinkedEbooksHighlight({ courseId, courseTitle }: LinkedEbooksHighlightProps) {
  const [linkedEbooks, setLinkedEbooks] = useState<LinkedEbook[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (courseId) {
      fetchLinkedEbooks();
    } else {
      setLoading(false);
    }
  }, [courseId]);

  const fetchLinkedEbooks = async () => {
    if (!courseId) return;
    
    const { data } = await supabase
      .from('course_ebook_links')
      .select(`
        ebook_id,
        ebooks:ebook_id (
          id,
          title,
          category
        )
      `)
      .eq('course_id', courseId);

    if (data) {
      const ebooks = data
        .map((link: any) => link.ebooks)
        .filter(Boolean);
      setLinkedEbooks(ebooks);
    }
    setLoading(false);
  };

  if (loading || linkedEbooks.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
    >
      <Card className="border-2 border-primary/30 bg-gradient-to-br from-primary/10 via-accent/5 to-transparent overflow-hidden relative">
        {/* Decorative sparkles */}
        <div className="absolute top-2 right-2">
          <Sparkles className="h-6 w-6 text-primary/40 animate-pulse" />
        </div>
        
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            {/* Icon and Title */}
            <div className="flex items-center gap-3">
              <div className="h-14 w-14 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
                <Gift className="h-7 w-7 text-primary" />
              </div>
              <div>
                <Badge className="mb-1 bg-success/20 text-success border-success/30 text-xs">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Bonus Included
                </Badge>
                <h3 className="font-bold text-lg">
                  {linkedEbooks.length} Premium eBook{linkedEbooks.length > 1 ? 's' : ''} Included!
                </h3>
                <p className="text-sm text-muted-foreground">
                  Free with your {courseTitle} purchase
                </p>
              </div>
            </div>

            {/* Ebook Pills */}
            <div className="flex-1">
              <div className="flex flex-wrap gap-2">
                {linkedEbooks.slice(0, 4).map((ebook) => (
                  <div 
                    key={ebook.id}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-background/60 border border-border/50 text-sm"
                  >
                    <BookOpen className="h-3.5 w-3.5 text-primary" />
                    <span className="truncate max-w-[150px]">{ebook.title}</span>
                  </div>
                ))}
                {linkedEbooks.length > 4 && (
                  <div className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium">
                    +{linkedEbooks.length - 4} more
                  </div>
                )}
              </div>
            </div>

            {/* CTA */}
            <Link to="/ebooks" className="shrink-0">
              <Button variant="outline" className="gap-2 border-primary/30 hover:bg-primary/10">
                View All eBooks
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>

          {/* Value Highlight */}
          <div className="mt-4 pt-4 border-t border-primary/20 flex items-center justify-between">
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <Download className="h-4 w-4" />
              Instant PDF download access after enrollment
            </p>
            <p className="text-sm font-medium text-success">
              Worth ₹{linkedEbooks.length * 50} FREE
            </p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}