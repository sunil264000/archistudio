import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import { ArrowRight, BookOpen, Clock, Layers, Star, Zap } from 'lucide-react';
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
    <section className="relative py-20 sm:py-28 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-background via-secondary/5 to-background" />

      <div className="container-wide relative z-10">
        {/* Section label */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <div className="section-label mb-3">Featured Program</div>
          <h2 className="font-display max-w-xl mx-auto">Our Flagship Course</h2>
        </motion.div>

        {/* Card */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-4xl mx-auto"
        >
          <div className="relative rounded-2xl overflow-hidden card-glass group">
            <div className="grid lg:grid-cols-[1fr_1.1fr] gap-0">
              {/* Left: Thumbnail */}
              <div className="relative aspect-[16/10] lg:aspect-auto overflow-hidden">
                <CourseThumbnail
                  src={course.thumbnail_url || ''}
                  alt={course.title}
                  slug={course.slug}
                  category={course.category_id || 'fundamentals'}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-card/70 hidden lg:block" />
                <div className="absolute inset-0 bg-gradient-to-t from-card/50 to-transparent lg:hidden" />

                <div className="absolute top-4 left-4">
                  <Badge className="bg-accent text-accent-foreground gap-1.5 px-3 py-1.5 text-[11px] font-semibold shadow-md">
                    <Zap className="h-3 w-3" />
                    Most Popular
                  </Badge>
                </div>
              </div>

              {/* Right: Content */}
              <div className="p-7 sm:p-9 flex flex-col justify-center space-y-5">
                <div className="space-y-3">
                  <h3 className="font-display text-2xl lg:text-3xl font-bold text-foreground leading-tight">
                    {course.title}
                  </h3>
                  {desc && (
                    <p className="text-body-sm text-muted-foreground line-clamp-3">
                      {desc}
                    </p>
                  )}
                </div>

                {/* Stats */}
                <div className="flex items-center gap-5 flex-wrap">
                  {course.level && (
                    <div className="flex items-center gap-1.5 text-body-sm text-muted-foreground">
                      <Star className="h-3.5 w-3.5 text-accent" />
                      <span className="capitalize">{course.level}</span>
                    </div>
                  )}
                  {course.duration_hours && (
                    <div className="flex items-center gap-1.5 text-body-sm text-muted-foreground">
                      <Clock className="h-3.5 w-3.5 text-accent" />
                      <span>{course.duration_hours}+ hrs</span>
                    </div>
                  )}
                  {moduleCount > 0 && (
                    <div className="flex items-center gap-1.5 text-body-sm text-muted-foreground">
                      <Layers className="h-3.5 w-3.5 text-accent" />
                      <span>{moduleCount} modules</span>
                    </div>
                  )}
                  {course.total_lessons && course.total_lessons > 0 && (
                    <div className="flex items-center gap-1.5 text-body-sm text-muted-foreground">
                      <BookOpen className="h-3.5 w-3.5 text-accent" />
                      <span>{course.total_lessons} lessons</span>
                    </div>
                  )}
                </div>

                {/* Price + CTA */}
                <div className="flex items-center gap-5 flex-wrap pt-1">
                  {course.price_inr != null && course.price_inr > 0 && (
                    <div className="font-display text-3xl font-bold text-foreground tracking-tight">
                      ₹{course.price_inr.toLocaleString('en-IN')}
                    </div>
                  )}
                  <Link to={`/course/${course.slug}`}>
                    <Button size="lg" className="gap-2 group/btn bg-accent text-accent-foreground hover:bg-accent/90 shadow-[0_4px_20px_hsl(var(--accent)/0.2)]">
                      Explore Course
                      <ArrowRight className="h-4 w-4 transition-transform group-hover/btn:translate-x-0.5" />
                    </Button>
                  </Link>
                </div>

                {/* Social proof */}
                <div className="flex items-center gap-2.5 text-caption text-muted-foreground">
                  <div className="flex -space-x-1.5">
                    {[...Array(4)].map((_, i) => (
                      <div
                        key={i}
                        className="h-6 w-6 rounded-full border-2 border-card bg-gradient-to-br from-accent/25 to-primary/20"
                      />
                    ))}
                  </div>
                  <span>Trusted by thousands of students</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
