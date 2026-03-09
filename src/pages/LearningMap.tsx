import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { SEOHead } from '@/components/seo/SEOHead';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Map, Layers, ArrowRight, CheckCircle2, Lock, Sparkles, BookOpen, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

interface MapNode {
  id: string;
  title: string;
  slug: string;
  level: string | null;
  category_id: string | null;
  thumbnail_url: string | null;
  short_description: string | null;
  enrolled: boolean;
  completed: boolean;
}

interface Category {
  id: string;
  name: string;
  icon: string | null;
}

export default function LearningMap() {
  const { user } = useAuth();
  const [nodes, setNodes] = useState<MapNode[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeLevel, setActiveLevel] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      const [coursesRes, catsRes] = await Promise.all([
        supabase.from('courses').select('id, title, slug, level, category_id, thumbnail_url, short_description')
          .eq('is_published', true).order('order_index'),
        supabase.from('course_categories').select('*'),
      ]);

      let enrolledIds = new Set<string>();
      let completedIds = new Set<string>();
      if (user) {
        const [enrollRes, certRes] = await Promise.all([
          supabase.from('enrollments').select('course_id').eq('user_id', user.id).eq('status', 'active'),
          supabase.from('certificates').select('course_id').eq('user_id', user.id),
        ]);
        enrolledIds = new Set((enrollRes.data || []).map((e: any) => e.course_id));
        completedIds = new Set((certRes.data || []).map((c: any) => c.course_id));
      }

      setCategories((catsRes.data || []) as Category[]);
      setNodes((coursesRes.data || []).map((c: any) => ({
        ...c,
        enrolled: enrolledIds.has(c.id),
        completed: completedIds.has(c.id),
      })));
      setLoading(false);
    };
    fetch();
  }, [user]);

  const levels = ['beginner', 'intermediate', 'advanced'];
  const filtered = nodes.filter(n =>
    (!activeLevel || n.level === activeLevel) &&
    (!activeCategory || n.category_id === activeCategory)
  );

  const grouped = levels.map(level => ({
    level,
    courses: filtered.filter(n => n.level === level),
  })).filter(g => g.courses.length > 0);

  // Add courses with null level
  const unlabeled = filtered.filter(n => !n.level || !levels.includes(n.level));
  if (unlabeled.length > 0) grouped.push({ level: 'other', courses: unlabeled });

  const levelLabel: Record<string, string> = {
    beginner: '🌱 Foundation',
    intermediate: '🏗️ Building',
    advanced: '🏛️ Mastery',
    other: '📚 Electives',
  };
  const levelColor: Record<string, string> = {
    beginner: 'from-emerald-500/10 to-emerald-500/5 border-emerald-500/20',
    intermediate: 'from-amber-500/10 to-amber-500/5 border-amber-500/20',
    advanced: 'from-red-500/10 to-red-500/5 border-red-500/20',
    other: 'from-blue-500/10 to-blue-500/5 border-blue-500/20',
  };

  return (
    <>
      <SEOHead title="Learning Map — Archistudio" description="Explore the interactive architecture course map to plan your learning journey." />
      <Navbar />
      <main className="min-h-screen pt-24 pb-16 bg-background">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          {/* Hero */}
          <div className="text-center mb-10">
            <Badge variant="outline" className="mb-4 gap-1.5"><Map className="h-3 w-3" /> Interactive</Badge>
            <h1 className="text-3xl sm:text-4xl font-display font-bold text-foreground">Learning Map</h1>
            <p className="text-muted-foreground mt-2 max-w-xl mx-auto">
              Visualize your architecture learning journey. See connections between courses and plan your path.
            </p>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2 mb-8">
            <span className="text-xs font-semibold text-muted-foreground mr-2">Level:</span>
            {['all', ...levels].map(l => (
              <Button
                key={l}
                size="sm"
                variant={activeLevel === (l === 'all' ? null : l) ? 'default' : 'outline'}
                onClick={() => setActiveLevel(l === 'all' ? null : l)}
                className="text-xs h-7"
              >
                {l === 'all' ? 'All' : l.charAt(0).toUpperCase() + l.slice(1)}
              </Button>
            ))}
            {categories.length > 0 && (
              <>
                <span className="text-xs font-semibold text-muted-foreground ml-4 mr-2">Category:</span>
                <Button
                  size="sm"
                  variant={!activeCategory ? 'default' : 'outline'}
                  onClick={() => setActiveCategory(null)}
                  className="text-xs h-7"
                >All</Button>
                {categories.map(cat => (
                  <Button
                    key={cat.id}
                    size="sm"
                    variant={activeCategory === cat.id ? 'default' : 'outline'}
                    onClick={() => setActiveCategory(activeCategory === cat.id ? null : cat.id)}
                    className="text-xs h-7"
                  >{cat.name}</Button>
                ))}
              </>
            )}
          </div>

          {loading ? (
            <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : grouped.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground">
              <Layers className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>No courses found</p>
            </div>
          ) : (
            <div className="space-y-8">
              {grouped.map((group, gi) => (
                <div key={group.level}>
                  {/* Level connector */}
                  {gi > 0 && (
                    <div className="flex justify-center mb-4">
                      <div className="flex flex-col items-center gap-1">
                        <div className="w-px h-8 bg-border" />
                        <ArrowRight className="h-4 w-4 text-muted-foreground rotate-90" />
                      </div>
                    </div>
                  )}
                  <div className={`rounded-2xl border bg-gradient-to-b p-6 ${levelColor[group.level] || levelColor.other}`}>
                    <h2 className="text-lg font-display font-bold text-foreground mb-4 flex items-center gap-2">
                      {levelLabel[group.level] || group.level}
                      <Badge variant="outline" className="text-[10px]">{group.courses.length} courses</Badge>
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {group.courses.map((course, i) => (
                        <motion.div
                          key={course.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.03 }}
                        >
                          <Link to={`/course/${course.slug}`}>
                            <Card className="h-full hover:border-accent/30 transition-all group overflow-hidden">
                              {course.thumbnail_url && (
                                <div className="aspect-video overflow-hidden">
                                  <img src={course.thumbnail_url} alt={course.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                                </div>
                              )}
                              <CardContent className="p-3">
                                <div className="flex items-start justify-between gap-2">
                                  <h3 className="text-sm font-semibold text-foreground line-clamp-2">{course.title}</h3>
                                  {course.completed ? (
                                    <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                                  ) : course.enrolled ? (
                                    <BookOpen className="h-4 w-4 text-accent shrink-0" />
                                  ) : (
                                    <Lock className="h-4 w-4 text-muted-foreground/30 shrink-0" />
                                  )}
                                </div>
                                {course.short_description && (
                                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{course.short_description}</p>
                                )}
                                {course.completed && (
                                  <Badge className="mt-2 bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[10px]">
                                    <Sparkles className="h-2.5 w-2.5 mr-0.5" /> Completed
                                  </Badge>
                                )}
                              </CardContent>
                            </Card>
                          </Link>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Legend */}
          <div className="flex flex-wrap items-center justify-center gap-4 mt-10 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> Completed</span>
            <span className="flex items-center gap-1"><BookOpen className="h-3.5 w-3.5 text-accent" /> Enrolled</span>
            <span className="flex items-center gap-1"><Lock className="h-3.5 w-3.5 text-muted-foreground/30" /> Not started</span>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
