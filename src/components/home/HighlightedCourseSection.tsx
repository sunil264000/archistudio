import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import { ArrowRight, BookOpen, Clock, Layers, Star, Sparkles, Zap } from 'lucide-react';
import { CourseThumbnail } from '@/components/course/CourseThumbnail';

interface HighlightedCourse {
  id: string;
  title: string;
  slug: string;
  short_description: string | null;
  description: string | null;
  price_inr: number | null;
  level: string | null;
  duration_hours: number | null;
  total_lessons: number | null;
  thumbnail_url: string | null;
  category_id: string | null;
}

export function HighlightedCourseSection() {
  const [course, setCourse] = useState<HighlightedCourse | null>(null);
  const [moduleCount, setModuleCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from('courses')
        .select('id, title, slug, short_description, description, price_inr, level, duration_hours, total_lessons, thumbnail_url, category_id')
        .eq('is_highlighted', true)
        .eq('is_published', true)
        .limit(1)
        .maybeSingle();

      if (data) {
        setCourse(data);
        // Get module count
        const { count } = await supabase
          .from('modules')
          .select('id', { count: 'exact', head: true })
          .eq('course_id', data.id);
        setModuleCount(count || 0);
      }
      setLoading(false);
    };
    fetch();
  }, []);

  if (loading || !course) return null;

  const desc = course.short_description || course.description || '';

  return (
    <section className="relative py-16 sm:py-24 overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-primary/[0.02] to-background" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_50%_50%,hsl(var(--accent)/0.04),transparent)]" />

      <div className="container-wide relative z-10">
        {/* Section label */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-10"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full card-glass border-glow mb-4">
            <Sparkles className="h-3.5 w-3.5 text-accent" />
            <span className="text-xs font-medium tracking-wider text-muted-foreground uppercase">
              Our Flagship Program
            </span>
          </div>
        </motion.div>

        {/* Cinematic Card */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-5xl mx-auto"
        >
          <div className="relative rounded-3xl overflow-hidden group">
            {/* Animated border glow */}
            <div className="absolute -inset-[1px] rounded-3xl bg-gradient-to-r from-accent/40 via-primary/30 to-accent/40 opacity-60 group-hover:opacity-100 transition-opacity duration-700" />

            <div className="relative rounded-3xl overflow-hidden" style={{ background: 'hsl(var(--card))' }}>
              <div className="grid lg:grid-cols-[1fr_1.2fr] gap-0">
                {/* Left: Thumbnail */}
                <div className="relative aspect-[16/10] lg:aspect-auto overflow-hidden">
                  <CourseThumbnail
                    src={course.thumbnail_url || ''}
                    alt={course.title}
                    slug={course.slug}
                    category={course.category_id || 'fundamentals'}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  {/* Overlay gradient */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-card/80 hidden lg:block" />
                  <div className="absolute inset-0 bg-gradient-to-t from-card/60 to-transparent lg:hidden" />

                  {/* Floating badge */}
                  <div className="absolute top-4 left-4">
                    <Badge className="bg-accent text-accent-foreground gap-1 px-3 py-1 shadow-lg text-xs">
                      <Zap className="h-3 w-3" />
                      Most Popular
                    </Badge>
                  </div>
                </div>

                {/* Right: Content */}
                <div className="p-6 sm:p-8 lg:p-10 flex flex-col justify-center space-y-5">
                  <div className="space-y-3">
                    <h2 className="text-2xl sm:text-3xl lg:text-4xl font-display font-bold text-foreground leading-tight">
                      {course.title}
                    </h2>
                    {desc && (
                      <p className="text-sm sm:text-base text-muted-foreground leading-relaxed line-clamp-3">
                        {desc}
                      </p>
                    )}
                  </div>

                  {/* Stats row */}
                  <div className="flex items-center gap-4 flex-wrap">
                    {course.level && (
                      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <Star className="h-4 w-4 text-accent" />
                        <span className="capitalize">{course.level}</span>
                      </div>
                    )}
                    {course.duration_hours && (
                      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4 text-accent" />
                        <span>{course.duration_hours}+ hours</span>
                      </div>
                    )}
                    {moduleCount > 0 && (
                      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <Layers className="h-4 w-4 text-accent" />
                        <span>{moduleCount} modules</span>
                      </div>
                    )}
                    {course.total_lessons && course.total_lessons > 0 && (
                      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <BookOpen className="h-4 w-4 text-accent" />
                        <span>{course.total_lessons} lessons</span>
                      </div>
                    )}
                  </div>

                  {/* Price + CTA */}
                  <div className="flex items-center gap-4 flex-wrap pt-2">
                    {course.price_inr != null && course.price_inr > 0 && (
                      <div className="text-3xl font-bold text-foreground">
                        ₹{course.price_inr.toLocaleString('en-IN')}
                      </div>
                    )}
                    <Link to={`/course/${course.slug}`} className="ml-auto sm:ml-0">
                      <Button size="lg" className="gap-2 group/btn bg-accent text-accent-foreground hover:bg-accent/90 shadow-[0_4px_20px_hsl(var(--accent)/0.25)]">
                        Explore This Course
                        <ArrowRight className="h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
                      </Button>
                    </Link>
                  </div>

                  {/* Social proof */}
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <div className="flex -space-x-1.5">
                      {[...Array(4)].map((_, i) => (
                        <div
                          key={i}
                          className="h-6 w-6 rounded-full border-2 border-card bg-gradient-to-br from-accent/30 to-primary/30"
                        />
                      ))}
                    </div>
                    <span>Trusted by thousands of students</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
