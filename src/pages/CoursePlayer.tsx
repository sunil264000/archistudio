import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate, Link, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useAccessControl } from '@/hooks/useAccessControl';
import { Navbar } from '@/components/layout/Navbar';
import { SecureVideoPlayer } from '@/components/video/SecureVideoPlayer';
import { CourseQA } from '@/components/course/CourseQA';
import { LessonResources } from '@/components/course/LessonResources';
import { CourseResources } from '@/components/course/CourseResources';
import { LockedLessonPlaceholder } from '@/components/course/LockedLessonPlaceholder';
import { AccessBadge } from '@/components/course/AccessBadge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import {
  ChevronLeft, Play, CheckCircle, Lock, Clock,
  BookOpen, Award, ChevronRight, CheckCircle2, MessageCircle, Download,
  Menu, X, List, Layers, GraduationCap, Sparkles
} from 'lucide-react';
import { toast } from 'sonner';
import { CourseCompletionModal } from '@/components/course/CourseCompletionModal';
import { IssueReportButton } from '@/components/course/IssueReportButton';
import { motion } from 'framer-motion';

interface Module {
  id: string;
  title: string;
  order_index: number;
  lessons: Lesson[];
}

interface Lesson {
  id: string;
  title: string;
  description: string | null;
  video_url: string | null;
  duration_minutes: number | null;
  order_index: number;
  is_free_preview: boolean;
}

interface LessonProgress {
  lesson_id: string;
  completed: boolean;
  last_position_seconds: number;
}

export default function CoursePlayer() {
  const { slug } = useParams<{ slug: string }>();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [course, setCourse] = useState<any>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);
  const [progress, setProgress] = useState<Record<string, LessonProgress>>({});
  const [loading, setLoading] = useState(true);
  const [watchProgress, setWatchProgress] = useState(0);
  const [showFinishButton, setShowFinishButton] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [theaterMode, setTheaterMode] = useState(() => localStorage.getItem('course-theater-mode') === 'true');

  useEffect(() => {
    localStorage.setItem('course-theater-mode', theaterMode.toString());
  }, [theaterMode]);

  const accessInfo = useAccessControl(user?.id, course?.id);
  const isEnrolled = accessInfo.hasAccess;
  const hasFetchedRef = useRef(false);
  const courseSlugRef = useRef<string | null>(null);
  const lastProgressSaveRef = useRef<Record<string, number>>({});
  const lessonIdFromUrl = searchParams.get('lesson');

  useEffect(() => {
    if (hasFetchedRef.current && courseSlugRef.current === slug && course) return;
    fetchCourseData();
  }, [slug, user]);

  const fetchCourseData = async () => {
    if (!slug) return;
    setLoading(true);
    try {
      const { data: courseData, error: courseError } = await supabase
        .from('courses').select('*').eq('slug', slug).single();
      if (courseError || !courseData) { toast.error('Course not found'); navigate('/courses'); return; }
      setCourse(courseData);

      const { data: modulesData } = await supabase
        .from('modules')
        .select(`id, title, order_index, lessons (id, title, description, video_url, duration_minutes, order_index, is_free_preview)`)
        .eq('course_id', courseData.id).order('order_index');

      const sortedModules = (modulesData || []).map(mod => ({
        ...mod,
        lessons: (mod.lessons as Lesson[]).sort((a, b) => (a.order_index || 0) - (b.order_index || 0)),
      }));
      setModules(sortedModules);

      const allLessonIds = sortedModules.flatMap(m => m.lessons.map(l => l.id));
      const progressMap: Record<string, LessonProgress> = {};
      if (user && allLessonIds.length > 0) {
        const { data: progressData } = await supabase
          .from('progress').select('lesson_id, completed, last_position_seconds')
          .eq('user_id', user.id).in('lesson_id', allLessonIds);
        (progressData || []).forEach(p => { progressMap[p.lesson_id] = p; });
        setProgress(progressMap);
      }

      const allLessonsFlat = sortedModules.flatMap(m => m.lessons);
      let initialLesson: Lesson | null = null;
      if (lessonIdFromUrl) initialLesson = allLessonsFlat.find(l => l.id === lessonIdFromUrl) || null;
      if (!initialLesson && !user) initialLesson = allLessonsFlat.find(l => l.is_free_preview) || allLessonsFlat[0] || null;
      if (!initialLesson && user && Object.keys(progressMap).length > 0) {
        const completedIds = new Set(Object.entries(progressMap).filter(([_, p]) => p.completed).map(([id]) => id));
        initialLesson = allLessonsFlat.find(l => !completedIds.has(l.id)) || null;
      }
      if (!initialLesson && allLessonsFlat.length > 0) initialLesson = allLessonsFlat[0];
      if (initialLesson) setCurrentLesson(initialLesson);

      hasFetchedRef.current = true;
      courseSlugRef.current = slug || null;
    } catch (error) { console.error('Error fetching course:', error); }
    finally { setLoading(false); }
  };

  const handleLessonSelect = (lesson: Lesson) => { setCurrentLesson(lesson); setSidebarOpen(false); };

  const handleProgress = useCallback(async (progressPercent: number, currentTime: number) => {
    if (!currentLesson || !user) return;
    setWatchProgress(progressPercent);
    if (progressPercent >= 95 && !progress[currentLesson.id]?.completed) setShowFinishButton(true);
    const roundedTime = Math.floor(currentTime / 10) * 10;
    const lastSaved = lastProgressSaveRef.current[currentLesson.id] ?? -1;
    if (roundedTime <= lastSaved) return;
    lastProgressSaveRef.current[currentLesson.id] = roundedTime;
    supabase.from('progress').upsert({
      user_id: user.id, lesson_id: currentLesson.id,
      last_position_seconds: roundedTime, watch_time_seconds: roundedTime,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id,lesson_id' }).then(({ error }) => { if (error) console.error('Progress save failed:', error); });
  }, [currentLesson, user, progress]);

  const handleComplete = useCallback(async () => {
    if (!currentLesson || !user) return;
    await supabase.from('progress').upsert({
      user_id: user.id, lesson_id: currentLesson.id, completed: true,
      completed_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id,lesson_id' });
    
    // Cinematic Archipoint Reward
    const pointsAwarded = 50;
    toast.success(`Lesson completed! +${pointsAwarded} Archipoints gained`, {
      icon: <Sparkles className="h-4 w-4 text-amber-500" />,
      className: "border-amber-500/20 bg-amber-500/5",
      description: "Use points for bid boosts in the Studio Hub."
    });

    setProgress(prev => ({ ...prev, [currentLesson.id]: { ...prev[currentLesson.id], completed: true, lesson_id: currentLesson.id, last_position_seconds: 0 } }));
    setShowFinishButton(false); setWatchProgress(0);
    
    const allLessons = modules.flatMap(m => m.lessons);
    const newCompletedCount = Object.values(progress).filter(p => p.completed).length + 1;
    if (newCompletedCount >= allLessons.length && course?.id) {
      supabase.functions.invoke('check-course-completion', { body: { userId: user.id, courseId: course.id } }).catch(console.error);
      setTimeout(() => setShowCompletionModal(true), 500);
    }
  }, [currentLesson, user, modules, progress, course]);

  const goToNextLesson = () => {
    if (!currentLesson) return;
    const allLessons = modules.flatMap(m => m.lessons);
    const idx = allLessons.findIndex(l => l.id === currentLesson.id);
    if (idx < allLessons.length - 1) handleLessonSelect(allLessons[idx + 1]);
  };
  const goToPrevLesson = () => {
    if (!currentLesson) return;
    const allLessons = modules.flatMap(m => m.lessons);
    const idx = allLessons.findIndex(l => l.id === currentLesson.id);
    if (idx > 0) handleLessonSelect(allLessons[idx - 1]);
  };

  const totalLessons = modules.reduce((sum, m) => sum + m.lessons.length, 0);
  const completedLessons = Object.values(progress).filter(p => p.completed).length;
  const overallProgress = totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center h-[80vh]">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center gap-4"
          >
            <div className="relative w-16 h-16">
              <div className="absolute inset-0 rounded-2xl border-2 border-accent/20 animate-pulse" />
              <div className="absolute inset-0 rounded-2xl border-2 border-t-accent animate-spin" />
              <div className="absolute inset-3 rounded-lg bg-accent/10 flex items-center justify-center">
                <Play className="h-5 w-5 text-accent" />
              </div>
            </div>
            <p className="text-sm text-muted-foreground">Loading your course...</p>
          </motion.div>
        </div>
      </div>
    );
  }

  // Sidebar content
  const SidebarContent = () => (
    <>
      <div className="p-4 border-b border-border/40 bg-gradient-to-b from-card to-transparent">
        <Link to={`/course/${slug}`}>
          <Button variant="ghost" size="sm" className="gap-2 mb-3 -ml-1 text-xs hover:bg-accent/8 hover:text-accent">
            <ChevronLeft className="h-3.5 w-3.5" />
            Back to Course
          </Button>
        </Link>

        <div className="space-y-3">
          <h2 className="font-semibold text-sm leading-snug">{course?.title}</h2>

          {accessInfo.accessType !== 'none' && (
            <AccessBadge
              accessType={accessInfo.accessType}
              unlockedPercent={accessInfo.unlockedPercent}
              expiryDate={accessInfo.giftExpiry || accessInfo.launchFreeExpiry}
            />
          )}
        </div>

        {!user && (
          <div className="mt-4 p-4 rounded-xl bg-accent/8 border border-accent/15">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-accent/15 flex items-center justify-center shrink-0">
                <GraduationCap className="h-4 w-4 text-accent" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-accent text-xs mb-1">Unlock Full Access</p>
                <p className="text-muted-foreground text-[11px] mb-2.5 leading-relaxed">
                  Sign up to track progress and access all lessons.
                </p>
                <Button size="sm" onClick={() => navigate('/auth')} className="w-full h-8 text-xs bg-accent hover:bg-accent/90 text-accent-foreground">
                  Sign Up Free
                </Button>
              </div>
            </div>
          </div>
        )}

        {user && (
          <div className="mt-4 p-3 rounded-xl bg-muted/30 border border-border/40">
            <div className="flex justify-between items-center mb-2">
              <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Progress</span>
              <span className="text-xs font-bold text-accent">{Math.round(overallProgress)}%</span>
            </div>
            <Progress value={overallProgress} className="h-1.5" />
            <p className="text-[10px] text-muted-foreground mt-1.5">
              {completedLessons} of {totalLessons} lessons
            </p>
          </div>
        )}
      </div>

      <ScrollArea className="flex-1">
        <Accordion type="multiple" defaultValue={modules.map(m => m.id)} className="p-3">
          {modules.map((module, modIdx) => {
            const isModuleUnlocked = accessInfo.accessType === 'partial'
              ? accessInfo.unlockedModuleIds.includes(module.id) : isEnrolled;
            const moduleLessons = module.lessons;
            const moduleCompletedCount = moduleLessons.filter(l => progress[l.id]?.completed).length;
            const moduleProgress = moduleLessons.length > 0 ? (moduleCompletedCount / moduleLessons.length) * 100 : 0;

            return (
              <AccordionItem key={module.id} value={module.id} className="border-b border-border/20 last:border-b-0">
                <AccordionTrigger className="hover:no-underline px-3 py-3 hover:bg-muted/20 rounded-lg transition-colors [&[data-state=open]]:bg-muted/10">
                  <div className="flex items-center gap-3 text-left min-w-0 flex-1">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-[11px] font-bold ${
                      moduleProgress === 100
                        ? 'bg-emerald-500/15 text-emerald-500'
                        : 'bg-accent/8 text-accent'
                    }`}>
                      {moduleProgress === 100 ? <CheckCircle className="h-3.5 w-3.5" /> : modIdx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-[13px] font-medium leading-snug block truncate">{module.title}</span>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] text-muted-foreground">{moduleLessons.length} lessons</span>
                        {user && moduleCompletedCount > 0 && (
                          <span className="text-[10px] text-accent">{moduleCompletedCount}/{moduleLessons.length}</span>
                        )}
                        {accessInfo.accessType === 'partial' && !isModuleUnlocked && (
                          <Lock className="h-2.5 w-2.5 text-muted-foreground/60" />
                        )}
                      </div>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pb-2 pt-0.5">
                  <div className="space-y-0.5 pl-1">
                    {module.lessons.map((lesson, lessonIdx) => {
                      const isCompleted = progress[lesson.id]?.completed;
                      const isAutoFreePreview = modIdx === 0 && lessonIdx === 0;
                      const isEffectiveFreePreview = lesson.is_free_preview || isAutoFreePreview;
                      const isLocked = isEffectiveFreePreview ? false
                        : accessInfo.accessType === 'partial' ? !isModuleUnlocked : !isEnrolled;
                      const isCurrent = currentLesson?.id === lesson.id;

                      return (
                        <button
                          key={lesson.id}
                          onClick={() => handleLessonSelect(lesson)}
                          className={`w-full flex items-center gap-2.5 p-2.5 rounded-lg text-left text-[13px] transition-all duration-200 ${
                            isCurrent
                              ? 'bg-accent text-accent-foreground shadow-sm shadow-accent/20'
                              : isLocked
                                ? 'text-muted-foreground/50 hover:bg-muted/20'
                                : 'hover:bg-muted/30 text-foreground/80 hover:text-foreground'
                          }`}
                        >
                          <span className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-xs transition-all ${
                            isCurrent ? 'bg-white/20'
                              : isCompleted ? 'bg-emerald-500/10 text-emerald-500'
                                : isLocked ? 'bg-muted/30' : 'bg-muted/40'
                          }`}>
                            {isLocked ? <Lock className="h-3 w-3" />
                              : isCompleted ? <CheckCircle className="h-3.5 w-3.5" />
                                : <Play className={`h-3 w-3 ${isCurrent ? 'fill-current' : ''}`} />}
                          </span>

                          <div className="flex-1 min-w-0">
                            <span className="block leading-snug truncate font-medium">{lesson.title}</span>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              {isEffectiveFreePreview && !isEnrolled && (
                                <Badge className="bg-emerald-500/10 text-emerald-500 border-0 text-[9px] px-1.5 py-0 h-4">Free</Badge>
                              )}
                              {!!lesson.duration_minutes && lesson.duration_minutes > 0 && (
                                <span className={`text-[10px] flex items-center gap-0.5 ${isCurrent ? 'opacity-70' : 'opacity-50'}`}>
                                  <Clock className="h-2.5 w-2.5" />{lesson.duration_minutes}m
                                </span>
                              )}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      </ScrollArea>
    </>
  );

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Mobile Header */}
      <div className="md:hidden sticky top-16 z-40 bg-card/95 backdrop-blur-sm border-b border-border/40 px-3 py-2 flex items-center gap-2">
        <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1.5 h-8 text-xs border-border/50">
              <Layers className="h-3.5 w-3.5" />
              Lessons
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[88vw] max-w-sm p-0 flex flex-col">
            <SidebarContent />
          </SheetContent>
        </Sheet>

        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium truncate">{currentLesson?.title || 'Select a lesson'}</p>
          {user && <Progress value={overallProgress} className="h-0.5 mt-1" />}
        </div>

        <div className="flex gap-0.5 shrink-0">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={goToPrevLesson}>
            <ChevronLeft className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={goToNextLesson}>
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row md:h-[calc(100vh-4rem)]">
        {/* Desktop Sidebar */}
        {!theaterMode && (
          <aside className="hidden md:flex w-80 border-r border-border/40 bg-card/50 flex-col shrink-0 transition-all duration-500">
            <SidebarContent />
          </aside>
        )}

        {/* Main Content */}
        <main className={`flex-1 flex flex-col overflow-auto transition-all duration-500 ${theaterMode ? 'bg-[#050505]' : ''}`}>
          {currentLesson ? (
            <ScrollArea className="flex-1">
              {/* Video Container */}
              <div className={`transition-all duration-500 ease-in-out ${theaterMode ? 'bg-black w-full' : 'bg-black'}`}>
                <div className={`${theaterMode ? 'max-w-7xl mx-auto py-2' : ''}`}>
                {(() => {
                  const allLessonsFlat = modules.flatMap(m => m.lessons);
                  const isFirstLesson = allLessonsFlat.length > 0 && allLessonsFlat[0].id === currentLesson.id;
                  const isEffectiveFree = currentLesson.is_free_preview || isFirstLesson;
                  const isLocked = !isEnrolled && !isEffectiveFree;

                  if (isLocked) {
                    return (
                      <div className="w-full py-8 px-4">
                        <LockedLessonPlaceholder
                          title={currentLesson.title}
                          description={currentLesson.description}
                          isLoggedIn={!!user}
                          onSignIn={() => navigate('/auth')}
                          onEnroll={() => navigate(`/course/${slug}`)}
                        />
                      </div>
                    );
                  }

                  if (currentLesson.video_url) {
                    return (
                      <div className="w-full">
                        <div className="w-full aspect-video max-w-5xl mx-auto">
                          <SecureVideoPlayer
                            lessonId={currentLesson.id}
                            videoPath={currentLesson.video_url}
                            isFreePreview={!!currentLesson.is_free_preview}
                            onProgress={handleProgress}
                            onComplete={handleComplete}
                            initialPosition={progress[currentLesson.id]?.last_position_seconds || 0}
                            allowExternal={true}
                          />
                        </div>
                        {/* Player Controls Overlay (Theater Mode Toggle) */}
                        <div className="max-w-5xl mx-auto flex justify-end px-4 py-2 gap-2">
                           <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => setTheaterMode(!theaterMode)}
                            className="text-white/40 hover:text-white/90 hover:bg-white/10 h-7 text-[10px] gap-1.5"
                          >
                            <Layers className="h-3 w-3" />
                            {theaterMode ? 'Normal View' : 'Theater Mode'}
                          </Button>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div className="text-center text-white/70 py-16 px-4">
                      <BookOpen className="h-12 w-12 mx-auto mb-3 opacity-30" />
                      <p className="text-sm">No video available for this lesson</p>
                    </div>
                  );
                })()}
                </div>
              </div>

              {/* Lesson Info Bar - Redesigned */}
              <div className={`border-t border-border/40 transition-all duration-500 ${theaterMode ? 'bg-[#0a0a0a] border-white/5' : 'bg-card'}`}>
                <div className={`p-4 md:p-5 transition-all duration-500 ${theaterMode ? 'max-w-5xl mx-auto' : ''}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h3 className="font-semibold text-base">{currentLesson.title}</h3>
                        {progress[currentLesson.id]?.completed && (
                          <Badge className="bg-emerald-500/10 text-emerald-500 border-0 text-[10px] h-5">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Complete
                          </Badge>
                        )}
                      </div>
                      {currentLesson.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">{currentLesson.description}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {isEnrolled && !progress[currentLesson.id]?.completed && (
                        <Button
                          size="sm"
                          onClick={handleComplete}
                          className="bg-emerald-500 hover:bg-emerald-600 text-white gap-1.5 h-8 text-xs shadow-sm"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Complete
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Nav Buttons */}
                  <div className="hidden md:flex gap-2 justify-between items-center mt-4 pt-3 border-t border-border/30">
                    <div className="flex gap-2">
                      {isEnrolled && course && currentLesson && (
                        <IssueReportButton
                          courseId={course.id} courseTitle={course.title}
                          lessonId={currentLesson.id} lessonTitle={currentLesson.title}
                        />
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={goToPrevLesson} className="h-8 text-xs border-border/50">
                        <ChevronLeft className="h-3.5 w-3.5 mr-1" />Previous
                      </Button>
                      <Button size="sm" onClick={goToNextLesson} className="h-8 text-xs">
                        Next<ChevronRight className="h-3.5 w-3.5 ml-1" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Resources & Q&A */}
              {course && currentLesson && (
                <div className={`p-4 md:p-5 border-t border-border/30 transition-all duration-500 ${theaterMode ? 'max-w-5xl mx-auto border-white/5' : ''}`}>
                  <LessonResources lessonId={currentLesson.id} isEnrolled={isEnrolled} />
                  <Tabs defaultValue="qa" className="w-full mt-5">
                    <TabsList className="mb-4 bg-muted/30 border border-border/30">
                      <TabsTrigger value="qa" className="gap-1.5 text-xs data-[state=active]:bg-card">
                        <MessageCircle className="h-3.5 w-3.5" />Q&A
                      </TabsTrigger>
                      <TabsTrigger value="resources" className="gap-1.5 text-xs data-[state=active]:bg-card">
                        <Download className="h-3.5 w-3.5" />Resources
                      </TabsTrigger>
                    </TabsList>
                    <TabsContent value="qa"><CourseQA courseId={course.id} /></TabsContent>
                    <TabsContent value="resources"><CourseResources courseId={course.id} isEnrolled={isEnrolled} /></TabsContent>
                  </Tabs>
                </div>
              )}
            </ScrollArea>
          ) : (
            <div className="flex-1 flex items-center justify-center p-8">
              <div className="text-center">
                <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground/30" />
                <p className="text-muted-foreground text-sm">Select a lesson to start learning</p>
                <Button variant="outline" className="mt-4 md:hidden text-xs" onClick={() => setSidebarOpen(true)}>
                  <List className="h-3.5 w-3.5 mr-1.5" />View Lessons
                </Button>
              </div>
            </div>
          )}
        </main>
      </div>

      {user && course && (
        <CourseCompletionModal
          open={showCompletionModal} onOpenChange={setShowCompletionModal}
          courseName={course.title} courseId={course.id} userId={user.id}
        />
      )}
    </div>
  );
}
