import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { SEOHead } from '@/components/seo/SEOHead';
import { ContactSupportWidget } from '@/components/support/ContactSupportWidget';
import { AnimatedBackground } from '@/components/layout/AnimatedBackground';
import { supabase } from '@/integrations/supabase/client';
import { courseCategories, categoryImages } from '@/data/courses';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowRight, BookOpen, Users, Star, Layers, GraduationCap, Clock, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';

// Helper to guess category from title (mirrored from Courses.tsx)
function guessCategory(title: string): string {
  const t = title.toLowerCase();
  if (t.includes('autocad')) return 'autocad';
  if (t.includes('sketchup') || t.includes('sketch up')) return 'sketchup';
  if (t.includes('3ds max') || t.includes('3dsmax')) return '3ds-max';
  if (t.includes('revit') || t.includes('bim')) return 'revit-bim';
  if (t.includes('corona') || t.includes('v-ray') || t.includes('vray')) return 'corona-vray';
  if (t.includes('rhino') || t.includes('grasshopper')) return 'rhino';
  if (t.includes('lumion') || t.includes('twinmotion') || t.includes('d5 render')) return 'visualization';
  if (t.includes('interior')) return 'interior-design';
  if (t.includes('after effect') || t.includes('photoshop') || t.includes('post')) return 'post-production';
  return 'fundamentals';
}

interface CategoryStat {
  id: string;
  name: string;
  description: string;
  icon: string;
  image: string;
  courseCount: number;
  totalHours: number;
  featuredCount: number;
  levels: string[];
}

interface FeaturedCourse {
  id: string;
  title: string;
  slug: string;
  price_inr: number | null;
  level: string | null;
  duration_hours: number | null;
  thumbnail_url: string | null;
  is_featured: boolean | null;
  category: string;
}

const levelColors: Record<string, string> = {
  beginner: 'bg-success/10 text-success border-success/30',
  intermediate: 'bg-warning/10 text-warning border-warning/30',
  advanced: 'bg-destructive/10 text-destructive border-destructive/30',
};

export default function BrowseBy() {
  const [categories, setCategories] = useState<CategoryStat[]>([]);
  const [featuredCourses, setFeaturedCourses] = useState<FeaturedCourse[]>([]);
  const [totalCourses, setTotalCourses] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedLevel, setSelectedLevel] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      const { data: dbCourses, error } = await supabase
        .from('courses')
        .select('id, title, slug, level, duration_hours, price_inr, thumbnail_url, is_featured, is_highlighted, short_description')
        .eq('is_published', true);

      if (error || !dbCourses) {
        setLoading(false);
        return;
      }

      setTotalCourses(dbCourses.length);

      // Build category map from DB
      const catMap: Record<string, { count: number; hours: number; featured: number; levels: Set<string>; }> = {};
      courseCategories.forEach(c => {
        catMap[c.id] = { count: 0, hours: 0, featured: 0, levels: new Set() };
      });

      dbCourses.forEach(course => {
        const cat = guessCategory(course.title);
        if (!catMap[cat]) catMap[cat] = { count: 0, hours: 0, featured: 0, levels: new Set() };
        catMap[cat].count++;
        catMap[cat].hours += course.duration_hours || 0;
        if (course.is_featured) catMap[cat].featured++;
        if (course.level) catMap[cat].levels.add(course.level);
      });

      const stats: CategoryStat[] = courseCategories
        .map(cat => ({
          id: cat.id,
          name: cat.name,
          description: cat.description,
          icon: cat.icon,
          image: categoryImages[cat.id] || '',
          courseCount: catMap[cat.id]?.count || 0,
          totalHours: Math.round(catMap[cat.id]?.hours || 0),
          featuredCount: catMap[cat.id]?.featured || 0,
          levels: Array.from(catMap[cat.id]?.levels || []),
        }))
        .filter(c => c.courseCount > 0)
        .sort((a, b) => b.courseCount - a.courseCount);

      setCategories(stats);

      // Featured courses: top 6
      const featured: FeaturedCourse[] = dbCourses
        .filter(c => c.is_featured)
        .slice(0, 6)
        .map(c => ({ ...c, category: guessCategory(c.title) }));

      setFeaturedCourses(featured);
      setLoading(false);
    };

    fetchData();
  }, []);

  const filteredCategories = selectedLevel
    ? categories.filter(c => c.levels.includes(selectedLevel))
    : categories;

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Browse by Category - Archistudio"
        description="Explore our architecture and design courses organized by category. Find the perfect studio for your skill level."
        url="https://archistudio.shop/by"
      />

      <Navbar />
      <AnimatedBackground intensity="light" showOrbs showGrid={false} />

      {/* Hero */}
      <section className="pt-28 pb-16 relative overflow-hidden">
        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 text-accent text-sm font-medium border border-accent/20 mb-6">
              <Layers className="h-4 w-4" />
              Browse by Category
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 tracking-tight">
              Find Your Perfect
              <span className="text-accent block">Studio Program</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
              {loading
                ? 'Loading...'
                : `${totalCourses}+ courses across ${categories.length} categories — from beginner to advanced`}
            </p>

            {/* Level filter pills */}
            <div className="flex flex-wrap justify-center gap-2 mb-8">
              {['All Levels', 'beginner', 'intermediate', 'advanced'].map(level => (
                <button
                  key={level}
                  onClick={() => setSelectedLevel(level === 'All Levels' ? null : level)}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-all duration-200 capitalize ${
                    (level === 'All Levels' && !selectedLevel) || selectedLevel === level
                      ? 'bg-accent text-accent-foreground border-accent'
                      : 'bg-background text-muted-foreground border-border hover:border-accent/50 hover:text-foreground'
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats bar */}
      <section className="border-y border-border/50 bg-muted/30 py-5">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap justify-center gap-8 md:gap-16">
            {[
              { icon: BookOpen, label: 'Total Studios', value: loading ? '...' : `${totalCourses}+` },
              { icon: Layers, label: 'Categories', value: loading ? '...' : `${categories.length}` },
              { icon: Star, label: 'Featured Courses', value: loading ? '...' : `${featuredCourses.length}` },
              { icon: GraduationCap, label: 'Skill Levels', value: '3' },
            ].map(stat => (
              <div key={stat.label} className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-accent/10 flex items-center justify-center">
                  <stat.icon className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <div className="text-xl font-bold">{stat.value}</div>
                  <div className="text-xs text-muted-foreground">{stat.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Category Grid */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold mb-8">
            {selectedLevel ? (
              <span>
                <span className="capitalize">{selectedLevel}</span>
                <span className="text-muted-foreground font-normal"> Level Categories</span>
              </span>
            ) : 'All Categories'}
          </h2>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 9 }).map((_, i) => (
                <CategoryCardSkeleton key={i} />
              ))}
            </div>
          ) : filteredCategories.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No categories found for this level.</p>
              <Button variant="outline" className="mt-4" onClick={() => setSelectedLevel(null)}>
                Show All
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCategories.map((cat, index) => (
                <CategoryCard key={cat.id} category={cat} index={index} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Featured Courses Strip */}
      {!loading && featuredCourses.length > 0 && (
        <section className="py-16 bg-muted/30 border-t border-border/50">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-2">
                <Star className="h-5 w-5 text-warning fill-warning" />
                <h2 className="text-2xl font-bold">Featured Studios</h2>
              </div>
              <Link to="/courses">
                <Button variant="outline" size="sm" className="gap-1.5">
                  View All <ChevronRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {featuredCourses.map((course, i) => (
                <FeaturedCourseCard key={course.id} course={course} index={i} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Bottom CTA */}
      <section className="py-16 border-t border-border/50">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-3">Not sure where to start?</h2>
          <p className="text-muted-foreground mb-6 max-w-lg mx-auto">
            Chat with our AI advisor Archi and get a personalized course recommendation based on your goals.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link to="/courses">
              <Button size="lg" className="gap-2">
                <BookOpen className="h-4 w-4" /> Browse All Studios
              </Button>
            </Link>
            <Link to="/contact">
              <Button size="lg" variant="outline" className="gap-2">
                <Users className="h-4 w-4" /> Talk to an Expert
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
      <ContactSupportWidget />
    </div>
  );
}

// ─── Category Card ────────────────────────────────────────────────────────────
function CategoryCard({ category, index }: { category: CategoryStat; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.4 }}
    >
      <Link to={`/courses?category=${category.id}`}>
        <div className="group relative overflow-hidden rounded-2xl border border-border/60 bg-card hover:border-accent/40 hover:shadow-lg transition-all duration-300 cursor-pointer">
          {/* Thumbnail */}
          <div className="aspect-video overflow-hidden relative">
            {category.image ? (
              <img
                src={category.image}
                alt={category.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-accent/20 to-primary/10 flex items-center justify-center">
                <span className="text-5xl">{category.icon}</span>
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />

            {/* Overlay badges */}
            <div className="absolute top-3 left-3 flex gap-1.5 flex-wrap">
              {category.levels.includes('beginner') && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-success/80 text-white backdrop-blur-sm">Beginner</span>
              )}
              {category.levels.includes('intermediate') && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-warning/80 text-white backdrop-blur-sm">Intermediate</span>
              )}
              {category.levels.includes('advanced') && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-destructive/80 text-white backdrop-blur-sm">Advanced</span>
              )}
            </div>

            {/* Course count chip */}
            <div className="absolute bottom-3 right-3">
              <span className="px-3 py-1 rounded-full bg-black/60 backdrop-blur-sm text-white text-xs font-semibold border border-white/10">
                {category.courseCount} studio{category.courseCount !== 1 ? 's' : ''}
              </span>
            </div>
          </div>

          {/* Body */}
          <div className="p-4">
            <div className="flex items-start justify-between gap-2 mb-1.5">
              <div className="flex items-center gap-2">
                <span className="text-xl">{category.icon}</span>
                <h3 className="font-semibold text-base leading-snug group-hover:text-accent transition-colors">
                  {category.name}
                </h3>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-accent group-hover:translate-x-1 transition-all shrink-0 mt-0.5" />
            </div>

            <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{category.description}</p>

            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <BookOpen className="h-3 w-3" />
                {category.courseCount} courses
              </span>
              {category.totalHours > 0 && (
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {category.totalHours}h content
                </span>
              )}
              {category.featuredCount > 0 && (
                <span className="flex items-center gap-1">
                  <Star className="h-3 w-3 text-warning" />
                  {category.featuredCount} featured
                </span>
              )}
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

// ─── Featured Course Card ─────────────────────────────────────────────────────
function FeaturedCourseCard({ course, index }: { course: FeaturedCourse; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07, duration: 0.35 }}
    >
      <Link to={`/courses/${course.slug}`}>
        <div className="group flex gap-3 p-3.5 rounded-xl border border-border/60 bg-card hover:border-accent/40 hover:shadow-md transition-all duration-300 cursor-pointer">
          {/* Thumbnail */}
          <div className="h-16 w-20 rounded-lg overflow-hidden shrink-0 bg-muted">
            {course.thumbnail_url ? (
              <img src={course.thumbnail_url} alt={course.title} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300" />
            ) : (
              <div className="h-full w-full bg-gradient-to-br from-accent/20 to-primary/10 flex items-center justify-center">
                <BookOpen className="h-5 w-5 text-accent/50" />
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-sm leading-snug mb-1 line-clamp-2 group-hover:text-accent transition-colors">
              {course.title}
            </h3>
            <div className="flex items-center gap-2 flex-wrap">
              {course.level && (
                <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium border capitalize ${levelColors[course.level] || ''}`}>
                  {course.level}
                </span>
              )}
              {course.price_inr && (
                <span className="text-xs font-semibold text-accent">₹{course.price_inr.toLocaleString()}</span>
              )}
              {course.duration_hours && (
                <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                  <Clock className="h-2.5 w-2.5" />
                  {course.duration_hours}h
                </span>
              )}
            </div>
          </div>

          <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-accent shrink-0 self-center" />
        </div>
      </Link>
    </motion.div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function CategoryCardSkeleton() {
  return (
    <div className="rounded-2xl border border-border/40 overflow-hidden bg-card">
      <Skeleton className="aspect-video w-full" />
      <div className="p-4 space-y-2">
        <Skeleton className="h-5 w-2/3" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-4/5" />
        <div className="flex gap-3 pt-1">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-3 w-16" />
        </div>
      </div>
    </div>
  );
}
