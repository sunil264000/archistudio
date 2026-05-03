import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, Folder, Star } from 'lucide-react';
import { CourseThumbnail } from '@/components/course/CourseThumbnail';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import {
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
      .limit(8)
      .then(({ data }) => {
        if (data && data.length > 0) setCourses(data);
      });
  }, []);

  if (courses.length === 0) return null;

  return (
    <section className="section-padding relative overflow-hidden bg-secondary/5">
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

        <div className="max-w-6xl mx-auto px-4 md:px-12">
          <Carousel
            opts={{
              align: "start",
              loop: true,
            }}
            className="w-full"
          >
            <CarouselContent className="-ml-4">
              {courses.map((course, index) => {
                const badges = ["Best Seller", "Most Popular", "Trending", "Highly Rated", "Students' Choice", "Essential"];
                const ratings = [4.8, 4.9, 4.7, 4.8, 4.9, 4.8, 4.7, 4.8];
                const reviewsCount = [142, 215, 108, 305, 189, 276, 154, 203];
                const badge = badges[index % badges.length];
                const rating = ratings[index % ratings.length];
                const count = reviewsCount[index % reviewsCount.length];

                return (
                  <CarouselItem key={course.id} className="pl-4 md:basis-1/2 lg:basis-1/3">
                    <motion.div 
                      variants={fadeInUp}
                      whileHover={{ y: -8 }}
                      whileTap={{ scale: 0.98 }}
                      transition={{ duration: 0.3 }}
                      className="h-full"
                    >
                      <Link
                        to={`/course/${course.slug}`}
                        className="flex flex-col h-full group rounded-2xl card-glass overflow-hidden border border-border/40 hover:border-accent/30 transition-all duration-300"
                      >
                        <div className="aspect-[16/10] overflow-hidden relative">
                          <CourseThumbnail
                            src={course.thumbnail_url || ''}
                            alt={course.title}
                            slug={course.slug}
                            category={course.category_id || 'fundamentals'}
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                          />
                          <div className="absolute top-3 left-3 z-10">
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-accent text-accent-foreground text-[10px] font-bold tracking-widest uppercase shadow-lg">
                              {badge}
                            </div>
                          </div>
                        </div>
                        <div className="p-5 flex-1 flex flex-col">
                          <div className="flex items-center justify-between gap-2 mb-3">
                            <div className="flex items-center gap-2">
                              <Folder className="h-3.5 w-3.5 text-accent" />
                              {course.level && (
                                <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">{course.level}</span>
                              )}
                            </div>
                            <div className="flex items-center gap-1 text-[11px] font-bold text-muted-foreground bg-accent/5 px-2 py-0.5 rounded-full">
                              <Star className="h-3 w-3 fill-accent text-accent" />
                              <span className="text-foreground">{rating}</span>
                              <span>({count})</span>
                            </div>
                          </div>
                          <h3 className="font-display text-sm font-bold text-foreground group-hover:text-accent transition-colors line-clamp-2 leading-snug">
                            {course.title}
                          </h3>
                          {course.short_description && (
                            <p className="text-xs text-muted-foreground mt-2 line-clamp-2 leading-relaxed flex-1">
                              {course.short_description}
                            </p>
                          )}
                          <div className="mt-4 pt-4 border-t border-border/40 flex items-center justify-between">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-accent group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
                              View Syllabus <ArrowRight className="h-3 w-3" />
                            </span>
                          </div>
                        </div>
                      </Link>
                    </motion.div>
                  </CarouselItem>
                );
              })}
            </CarouselContent>
            <div className="hidden md:block">
              <CarouselPrevious className="-left-12 h-10 w-10 border-accent/20 hover:border-accent hover:bg-accent/5 text-accent" />
              <CarouselNext className="-right-12 h-10 w-10 border-accent/20 hover:border-accent hover:bg-accent/5 text-accent" />
            </div>
          </Carousel>
        </div>

        <div className="text-center mt-12">
          <Link to="/courses">
            <Button variant="ghost" className="gap-2 group text-muted-foreground hover:text-accent">
              Explore All 24+ Programs
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
