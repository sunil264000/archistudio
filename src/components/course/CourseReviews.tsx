import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Star, Loader2, MessageSquare, Sparkles, Quote } from 'lucide-react';
import { motion } from 'framer-motion';

interface Review {
  id: string;
  user_id: string;
  rating: number;
  review: string | null;
  created_at: string;
  user_name?: string;
}

interface CourseReviewsProps {
  courseId: string;
}

export function CourseReviews({ courseId }: CourseReviewsProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReviews();
  }, [courseId]);

  const fetchReviews = async () => {
    setLoading(true);
    
    const { data: reviewsData } = await supabase
      .from('reviews')
      .select('*')
      .eq('course_id', courseId)
      .order('created_at', { ascending: false });

    if (reviewsData && reviewsData.length > 0) {
      const userIds = reviewsData.map(r => r.user_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name')
        .in('user_id', userIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p.full_name]) || []);
      
      const enrichedReviews = reviewsData.map(r => ({
        ...r,
        user_name: profileMap.get(r.user_id) || 'Verified Student',
      }));

      setReviews(enrichedReviews);
    } else {
      setReviews([]);
    }

    setLoading(false);
  };

  const averageRating = reviews.length > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0;

  const renderStars = (count: number, size: 'sm' | 'lg' = 'sm') => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <motion.div
            key={star}
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: star * 0.1, type: 'spring', stiffness: 200 }}
          >
            <Star
              className={`${size === 'lg' ? 'h-6 w-6' : 'h-4 w-4'} ${
                star <= count
                  ? 'fill-yellow-400 text-yellow-400 drop-shadow-[0_0_4px_rgba(250,204,21,0.5)]'
                  : 'text-muted-foreground/30'
              } transition-colors`}
            />
          </motion.div>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-accent" />
        </CardContent>
      </Card>
    );
  }

  if (reviews.length === 0) {
    return null; // Don't show empty reviews section - DemoReviews will handle it
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="border-border/50 bg-gradient-to-br from-card via-card to-accent/5 backdrop-blur-sm overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-accent/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        
        <CardHeader className="relative">
          <CardTitle className="flex items-center gap-2 text-xl">
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
            >
              <Sparkles className="h-5 w-5 text-accent" />
            </motion.div>
            Verified Student Reviews
          </CardTitle>
          <CardDescription className="flex items-center gap-3 mt-2">
            {renderStars(Math.round(averageRating), 'lg')}
            <span className="text-lg font-bold text-foreground">{averageRating.toFixed(1)}</span>
            <span className="text-muted-foreground">from {reviews.length} verified students</span>
          </CardDescription>
        </CardHeader>

        <CardContent className="relative">
          <div className="space-y-4">
            {reviews.map((review, index) => (
              <motion.div
                key={review.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1, duration: 0.4 }}
                className="group relative flex gap-4 p-5 rounded-xl bg-background/50 border border-border/50 hover:border-accent/30 hover:bg-accent/5 transition-all duration-300"
              >
                <Quote className="absolute top-4 right-4 h-8 w-8 text-accent/10 group-hover:text-accent/20 transition-colors" />
                
                <Avatar className="h-12 w-12 ring-2 ring-accent/20 group-hover:ring-accent/40 transition-all">
                  <AvatarFallback className="bg-gradient-to-br from-accent/20 to-primary/20 text-foreground font-semibold">
                    {review.user_name?.charAt(0).toUpperCase() || 'S'}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div>
                      <p className="font-semibold text-foreground">{review.user_name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        {renderStars(review.rating)}
                        <span className="text-xs text-muted-foreground">
                          {new Date(review.created_at).toLocaleDateString('en-IN', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                  {review.review && (
                    <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                      "{review.review}"
                    </p>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}