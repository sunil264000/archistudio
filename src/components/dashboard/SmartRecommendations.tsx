import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Link } from 'react-router-dom';
import { Sparkles, ArrowRight, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';

interface RecommendedCourse {
  id: string;
  title: string;
  slug: string;
  thumbnail_url: string | null;
  level: string | null;
  short_description: string | null;
  reason: string;
}

export function SmartRecommendations() {
  const { user, session } = useAuth();
  const [recommendations, setRecommendations] = useState<RecommendedCourse[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRecommendations = useCallback(async () => {
    if (!user || !session?.access_token) return;
    setLoading(true);

    try {
      // Call the backend edge function for smart recommendations
      const { data, error } = await supabase.functions.invoke('smart-recommendations', {});

      if (error) throw error;

      if (data?.recommendations) {
        setRecommendations(data.recommendations.slice(0, 4));
      }
    } catch (err) {
      console.error('Recommendation error:', err);
      // Fallback to client-side recommendations
      await fallbackRecommendations();
    }
    setLoading(false);
  }, [user, session]);

  const fallbackRecommendations = async () => {
    if (!user) return;

    const { data: enrollments } = await supabase
      .from('enrollments')
      .select('course_id')
      .eq('user_id', user.id)
      .eq('status', 'active');

    const enrolledIds = new Set((enrollments || []).map((e: any) => e.course_id));

    const { data: allCourses } = await supabase
      .from('courses')
      .select('id, title, slug, thumbnail_url, level, short_description, is_featured')
      .eq('is_published', true)
      .order('order_index');

    if (!allCourses) return;

    const recs = allCourses
      .filter(c => !enrolledIds.has(c.id))
      .slice(0, 4)
      .map(c => ({ ...c, reason: c.is_featured ? 'Popular course' : 'Expand your skillset' }));

    setRecommendations(recs);
  };

  useEffect(() => { fetchRecommendations(); }, [fetchRecommendations]);

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-accent" />
          <h3 className="text-sm font-semibold text-foreground">Recommended for You</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[1, 2].map(i => <Skeleton key={i} className="h-32 rounded-xl" />)}
        </div>
      </div>
    );
  }

  if (recommendations.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-accent" />
        <h3 className="text-sm font-semibold text-foreground">Recommended for You</h3>
        <Badge variant="outline" className="text-[10px] ml-auto gap-1">
          <TrendingUp className="h-2.5 w-2.5" /> AI-Powered
        </Badge>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {recommendations.map((course, i) => (
          <motion.div
            key={course.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
          >
            <Link to={`/course/${course.slug}`}>
              <Card className="group overflow-hidden hover:border-accent/30 transition-all h-full">
                <div className="flex gap-3 p-3">
                  {course.thumbnail_url && (
                    <div className="w-20 h-16 rounded-lg overflow-hidden shrink-0">
                      <img
                        src={course.thumbnail_url}
                        alt={course.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                      />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-semibold text-foreground line-clamp-2 group-hover:text-accent transition-colors">
                      {course.title}
                    </h4>
                    <p className="text-[10px] text-accent mt-1 flex items-center gap-1">
                      <Sparkles className="h-2.5 w-2.5" /> {course.reason}
                    </p>
                    {course.level && (
                      <Badge variant="outline" className="text-[9px] mt-1.5">{course.level}</Badge>
                    )}
                  </div>
                  <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/30 group-hover:text-accent shrink-0 mt-1 transition-colors" />
                </div>
              </Card>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
