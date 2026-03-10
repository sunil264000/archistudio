import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, Folder } from 'lucide-react';
import { CourseThumbnail } from '@/components/course/CourseThumbnail';
import {
  staggerContainerFast,
  fadeInUp,
} from '@/components/animations/AnimatedSection';

interface FeaturedCourse {
  id: string;
  title: string;
  slug: string;
  short_description: string | null;
  thumbnail_url: string | null;
  category_id: string | null;
  level: string | null;
}

export function ExploreProjectsSection() {
  const [courses, setCourses] = useState<FeaturedCourse[]>([]);

  useEffect(() => {
    supabase
      .from('courses')
      .select('id, title, slug, short_description, thumbnail_url, category_id, level')
      .eq('is_published', true)
      .eq('is_featured', true)
      .order('order_index', { ascending: true })
      .limit(6)
      .then(({ data }) => {
        if (data && data.length > 0) setCourses(data);
      });
  }, []);

  if (courses.length === 0) return null;

  return (
    <section className="section-padding relative overflow-hidden">
      <div className="container-wide">
        <motion.div
          className="max-w-2xl mx-auto text-center mb-12"
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5 }}
        >
          <div className="section-label mb-4">Explore</div>
          <h2 className="font-display mb-4">
            Featured <span className="text-accent">Programs</span>
          </h2>
          <p className="text-body text-muted-foreground max-w-md mx-auto">
            Handpicked courses to build your architecture practice skills
          </p>
        </motion.div>

        <motion.div
          className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 max-w-5xl mx-auto"
          variants={staggerContainerFast}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
        >
          {courses.map((course) => (
            <motion.div key={course.id} variants={fadeInUp}>
              <Link
                to={`/course/${course.slug}`}
                className="block group rounded-2xl card-glass overflow-hidden hover:border-accent/20 transition-all duration-300"
              >
                <div className="aspect-video overflow-hidden">
                  <CourseThumbnail
                    src={course.thumbnail_url || ''}
                    alt={course.title}
                    slug={course.slug}
                    category={course.category_id || 'fundamentals'}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                <div className="p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <Folder className="h-3.5 w-3.5 text-accent" />
                    {course.level && (
                      <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium capitalize">{course.level}</span>
                    )}
                  </div>
                  <h3 className="font-display text-sm font-semibold text-foreground group-hover:text-accent transition-colors line-clamp-2">
                    {course.title}
                  </h3>
                  {course.short_description && (
                    <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2">{course.short_description}</p>
                  )}
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>

        <div className="text-center mt-10">
          <Link to="/courses">
            <Button variant="outline" className="gap-2 group">
              View All Courses
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
