import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { SEOHead } from '@/components/seo/SEOHead';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { BookOpen, CheckCircle2, Loader2, ArrowRight, Clock, Layers } from 'lucide-react';

interface Track {
  id: string; title: string; slug: string; description: string | null;
  icon: string; color: string; estimated_hours: number; order_index: number;
  courses: { id: string; title: string; slug: string; thumbnail_url: string | null; order_index: number; is_required: boolean }[];
}

export default function Roadmaps() {
  const { user } = useAuth();
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [enrolledCourseIds, setEnrolledCourseIds] = useState<Set<string>>(new Set());
  const [completedCourseIds, setCompletedCourseIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      const { data: tracksData } = await (supabase as any).from('learning_tracks')
        .select('*').eq('is_published', true).order('order_index');

      const enriched: Track[] = [];
      for (const track of (tracksData || [])) {
        const { data: trackCourses } = await (supabase as any).from('learning_track_courses')
          .select('order_index, is_required, courses:course_id(id, title, slug, thumbnail_url)')
          .eq('track_id', track.id).order('order_index');
        enriched.push({
          ...track,
          courses: (trackCourses || []).map((tc: any) => ({
            ...tc.courses, order_index: tc.order_index, is_required: tc.is_required,
          })).filter(Boolean),
        });
      }
      setTracks(enriched);

      if (user) {
        const { data: enrollments } = await (supabase as any).from('enrollments')
          .select('course_id').eq('user_id', user.id).eq('status', 'active');
        setEnrolledCourseIds(new Set((enrollments || []).map((e: any) => e.course_id)));

        // Check completed courses (all lessons done)
        const { data: certs } = await (supabase as any).from('certificates')
          .select('course_id').eq('user_id', user.id);
        setCompletedCourseIds(new Set((certs || []).map((c: any) => c.course_id)));
      }
      setLoading(false);
    };
    fetch();
  }, [user]);

  return (
    <>
      <SEOHead title="Learning Roadmaps — Archistudio" description="Structured learning paths for architecture skills" />
      <Navbar />
      <main className="min-h-screen pt-24 pb-16 bg-background">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="mb-10 text-center">
            <h1 className="text-3xl sm:text-4xl font-display font-bold text-foreground">Learning Roadmaps</h1>
            <p className="text-muted-foreground mt-2 max-w-xl mx-auto">Follow structured paths to master architecture skills — from beginner to professional.</p>
          </div>

          {loading ? (
            <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : tracks.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground">
              <Layers className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p className="text-lg font-medium">No roadmaps yet</p>
              <p className="text-sm">Learning paths are being created — check back soon!</p>
            </div>
          ) : (
            <div className="space-y-8">
              {tracks.map(track => {
                const totalCourses = track.courses.length;
                const completedInTrack = track.courses.filter(c => completedCourseIds.has(c.id)).length;
                const progress = totalCourses > 0 ? Math.round((completedInTrack / totalCourses) * 100) : 0;

                return (
                  <Card key={track.id} className="overflow-visible">
                    <CardContent className="p-6">
                      {/* Track header */}
                      <div className="flex items-start gap-4 mb-6">
                        <div className="w-12 h-12 rounded-2xl bg-accent/10 flex items-center justify-center shrink-0">
                          <BookOpen className="h-6 w-6 text-accent" />
                        </div>
                        <div className="flex-1">
                          <h2 className="text-xl font-display font-bold text-foreground">{track.title}</h2>
                          {track.description && <p className="text-sm text-muted-foreground mt-1">{track.description}</p>}
                          <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1"><Layers className="h-3 w-3" /> {totalCourses} courses</span>
                            {track.estimated_hours > 0 && <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {track.estimated_hours}h</span>}
                            {user && progress > 0 && <Badge variant="outline" className="text-[10px]">{progress}% complete</Badge>}
                          </div>
                          {user && (
                            <div className="mt-3 max-w-xs">
                              <Progress value={progress} className="h-1.5" />
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Course steps */}
                      <div className="relative pl-6 border-l-2 border-border space-y-4">
                        {track.courses.map((course, idx) => {
                          const isCompleted = completedCourseIds.has(course.id);
                          const isEnrolled = enrolledCourseIds.has(course.id);
                          const isNext = !isEnrolled && !isCompleted && idx === track.courses.findIndex(c => !completedCourseIds.has(c.id) && !enrolledCourseIds.has(c.id));

                          return (
                            <div key={course.id} className="relative">
                              {/* Timeline dot */}
                              <div className={`absolute -left-[calc(1.5rem+5px)] w-3 h-3 rounded-full border-2 ${isCompleted ? 'bg-emerald-500 border-emerald-500' : isEnrolled ? 'bg-accent border-accent' : 'bg-background border-border'}`} />

                              <Link to={`/course/${course.slug}`}>
                                <div className={`flex items-center gap-3 p-3 rounded-xl transition-all hover:bg-muted/50 ${isNext ? 'ring-1 ring-accent/20 bg-accent/5' : ''}`}>
                                  {course.thumbnail_url && (
                                    <img src={course.thumbnail_url} alt="" className="w-16 h-10 object-cover rounded-lg shrink-0" />
                                  )}
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs text-muted-foreground font-mono">{String(idx + 1).padStart(2, '0')}</span>
                                      <h4 className="text-sm font-medium text-foreground line-clamp-1">{course.title}</h4>
                                    </div>
                                    <div className="flex items-center gap-2 mt-0.5">
                                      {isCompleted && <Badge className="bg-emerald-500/15 text-emerald-500 border-emerald-500/20 text-[10px]"><CheckCircle2 className="h-2.5 w-2.5 mr-0.5" /> Done</Badge>}
                                      {isEnrolled && !isCompleted && <Badge variant="outline" className="text-[10px]">In progress</Badge>}
                                      {isNext && <Badge className="bg-accent/10 text-accent border-accent/20 text-[10px]">Start here</Badge>}
                                      {!course.is_required && <Badge variant="outline" className="text-[10px]">Optional</Badge>}
                                    </div>
                                  </div>
                                  <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
                                </div>
                              </Link>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
