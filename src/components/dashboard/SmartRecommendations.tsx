import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Link } from 'react-router-dom';
import { Sparkles, BookOpen, ArrowRight, TrendingUp, Loader2 } from 'lucide-react';
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
  const { user } = useAuth();
  const [recommendations, setRecommendations] = useState<RecommendedCourse[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRecommendations = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    try {
      // Get user's enrolled courses
      const { data: enrollments } = await supabase
        .from('enrollments')
        .select('course_id')
        .eq('user_id', user.id)
        .eq('status', 'active');

      const enrolledIds = new Set((enrollments || []).map((e: any) => e.course_id));

      // Get user's completed courses for level inference
      const { data: certs } = await supabase
        .from('certificates')
        .select('course_id')
        .eq('user_id', user.id);
      const completedIds = new Set((certs || []).map((c: any) => c.course_id));

      // Get enrolled course details for category/tag matching
      const { data: enrolledCourses } = await supabase
        .from('courses')
        .select('category_id, tags, level')
        .in('id', Array.from(enrolledIds).length > 0 ? Array.from(enrolledIds) : ['none']);

      const enrolledCategories = new Set((enrolledCourses || []).map((c: any) => c.category_id).filter(Boolean));
      const enrolledTags = new Set((enrolledCourses || []).flatMap((c: any) => c.tags || []));
      const enrolledLevels = new Set((enrolledCourses || []).map((c: any) => c.level).filter(Boolean));

      // Fetch all published courses
      const { data: allCourses } = await supabase
        .from('courses')
        .select('id, title, slug, thumbnail_url, level, short_description, category_id, tags, is_featured')
        .eq('is_published', true)
        .order('order_index');

      if (!allCourses) { setLoading(false); return; }

      // Score each unenrolled course
      const scored = allCourses
        .filter(c => !enrolledIds.has(c.id))
        .map(c => {
          let score = 0;
          let reason = '';

          // Same category bonus
          if (c.category_id && enrolledCategories.has(c.category_id)) {
            score += 3;
            reason = 'Related to your current studies';
          }

          // Tag overlap
          const tagOverlap = (c.tags || []).filter((t: string) => enrolledTags.has(t)).length;
          if (tagOverlap > 0) {
            score += tagOverlap * 2;
            if (!reason) reason = 'Matches your interests';
          }

          // Level progression
          if (enrolledLevels.has('beginner') && c.level === 'intermediate') {
            score += 2;
            if (!reason) reason = 'Next step in your journey';
          }
          if (enrolledLevels.has('intermediate') && c.level === 'advanced') {
            score += 2;
            if (!reason) reason = 'Level up your skills';
          }

          // Featured bonus
          if (c.is_featured) {
            score += 1;
            if (!reason) reason = 'Popular course';
          }

          // New user: recommend beginner courses
          if (enrolledIds.size === 0 && c.level === 'beginner') {
            score += 3;
            reason = 'Great starting point';
          }

          if (!reason) reason = 'Expand your skillset';

          return { ...c, score, reason };
        })
        .sort((a, b) => b.score - a.score)
        .slice(0, 4);

      setRecommendations(scored);
    } catch (err) {
      console.error('Recommendation error:', err);
    }
    setLoading(false);
  }, [user]);

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
          <TrendingUp className="h-2.5 w-2.5" /> Personalized
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
