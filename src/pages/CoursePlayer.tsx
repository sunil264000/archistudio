import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate, Link, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useAccessControl } from '@/hooks/useAccessControl';
import { Navbar } from '@/components/layout/Navbar';
import { SecureVideoPlayer } from '@/components/video/SecureVideoPlayer';
import { CourseQA } from '@/components/course/CourseQA';
import { LessonResources } from '@/components/course/LessonResources';
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
  Menu, X, List
} from 'lucide-react';
import { toast } from 'sonner';
import { CourseCompletionModal } from '@/components/course/CourseCompletionModal';

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
  
  // Use access control hook for proper access checking (enrollment, gift, EMI, launch free)
  const accessInfo = useAccessControl(user?.id, course?.id);
  
  // Derived enrollment state from access control
  const isEnrolled = accessInfo.hasAccess;
  
  // Refs to prevent re-fetching on tab switch or re-renders
  const hasFetchedRef = useRef(false);
  const courseSlugRef = useRef<string | null>(null);

  // Throttle progress writes to avoid flooding the network (can cause playback stutter)
  const lastProgressSaveRef = useRef<Record<string, number>>({});

  // Get lesson ID from URL query param if present
  const lessonIdFromUrl = searchParams.get('lesson');

  useEffect(() => {
    // Allow non-logged-in users to view free preview lessons
    // Prevent re-fetching if we already have the data for this course
    if (hasFetchedRef.current && courseSlugRef.current === slug && course) {
      return;
    }
    
    fetchCourseData();
  }, [slug, user]);

  const fetchCourseData = async () => {
    if (!slug) return;

    setLoading(true);
    try {
      // Fetch course
      const { data: courseData, error: courseError } = await supabase
        .from('courses')
        .select('*')
        .eq('slug', slug)
        .single();

      if (courseError || !courseData) {
        toast.error('Course not found');
        navigate('/courses');
        return;
      }

      setCourse(courseData);

      // Note: Enrollment/access is now handled by useAccessControl hook
      // We still need to determine initial lesson selection based on access

      // Fetch modules with lessons
      const { data: modulesData } = await supabase
        .from('modules')
        .select(`
          id, title, order_index,
          lessons (
            id, title, description, video_url, 
            duration_minutes, order_index, is_free_preview
          )
        `)
        .eq('course_id', courseData.id)
        .order('order_index');

      const sortedModules = (modulesData || []).map(mod => ({
        ...mod,
        lessons: (mod.lessons as Lesson[]).sort((a, b) => 
          (a.order_index || 0) - (b.order_index || 0)
        ),
      }));

      setModules(sortedModules);

      // Fetch user progress (only if logged in)
      const allLessonIds = sortedModules.flatMap(m => m.lessons.map(l => l.id));
      let progressMap: Record<string, LessonProgress> = {};
      
      if (user && allLessonIds.length > 0) {
        const { data: progressData } = await supabase
          .from('progress')
          .select('lesson_id, completed, last_position_seconds')
          .eq('user_id', user.id)
          .in('lesson_id', allLessonIds);

        (progressData || []).forEach(p => {
          progressMap[p.lesson_id] = p;
        });
        setProgress(progressMap);
      }

      // Set initial lesson - prioritize URL param, then find first free preview
      const allLessonsFlat = sortedModules.flatMap(m => m.lessons);
      
      let initialLesson: Lesson | null = null;
      
      // Note: At this point we don't have accessInfo yet (hook runs after course is set)
      // So we use basic checks here, and full access control happens in the render
      
      // 1. Check URL param
      if (lessonIdFromUrl) {
        const fromUrl = allLessonsFlat.find(l => l.id === lessonIdFromUrl) || null;
        if (fromUrl) {
          // We'll let the player show locked placeholder if needed
          initialLesson = fromUrl;
        }
      }
      
      // 2. If not logged in, find first free preview lesson
      if (!initialLesson && !user) {
        initialLesson = allLessonsFlat.find(l => l.is_free_preview) || null;
      }
      
      // 3. If logged in, find first incomplete lesson (auto-continue)
      if (!initialLesson && user && Object.keys(progressMap).length > 0) {
        const completedIds = new Set(
          Object.entries(progressMap)
            .filter(([_, p]) => p.completed)
            .map(([id]) => id)
        );
        initialLesson = allLessonsFlat.find(l => !completedIds.has(l.id)) || null;
      }
      
      // 4. Fallback to first lesson or first free preview
      if (!initialLesson && allLessonsFlat.length > 0) {
        // Prefer first free preview for guests
        if (!user) {
          initialLesson = allLessonsFlat.find(l => l.is_free_preview) || allLessonsFlat[0];
        } else {
          initialLesson = allLessonsFlat[0];
        }
      }
      
      if (initialLesson) {
        setCurrentLesson(initialLesson);
      }
      
      // Mark as fetched to prevent refetching on tab switch
      hasFetchedRef.current = true;
      courseSlugRef.current = slug || null;
    } catch (error) {
      console.error('Error fetching course:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLessonSelect = (lesson: Lesson) => {
    // Allow selecting any lesson - the player will show locked placeholder if needed
    setCurrentLesson(lesson);
    setSidebarOpen(false); // Close sidebar on mobile after selection
  };

  const handleProgress = useCallback(async (progressPercent: number, currentTime: number) => {
    if (!currentLesson || !user) return;

    // Update watch progress state for UI
    setWatchProgress(progressPercent);
    
    // Show finish button at 95% or more
    if (progressPercent >= 95 && !progress[currentLesson.id]?.completed) {
      setShowFinishButton(true);
    }

    // Save progress every 10 seconds (but only when we cross a new 10s boundary)
    const roundedTime = Math.floor(currentTime / 10) * 10;
    const lastSaved = lastProgressSaveRef.current[currentLesson.id] ?? -1;
    if (roundedTime <= lastSaved) return;

    lastProgressSaveRef.current[currentLesson.id] = roundedTime;

    supabase
      .from('progress')
      .upsert(
        {
          user_id: user.id,
          lesson_id: currentLesson.id,
          last_position_seconds: roundedTime,
          watch_time_seconds: roundedTime,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'user_id,lesson_id',
        }
      )
      .then(({ error }) => {
        if (error) console.error('Progress save failed:', error);
      });
  }, [currentLesson, user, progress]);

  const handleComplete = useCallback(async () => {
    if (!currentLesson || !user) return;

    await supabase.from('progress').upsert({
      user_id: user.id,
      lesson_id: currentLesson.id,
      completed: true,
      completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'user_id,lesson_id',
    });

    setProgress(prev => ({
      ...prev,
      [currentLesson.id]: { ...prev[currentLesson.id], completed: true, lesson_id: currentLesson.id, last_position_seconds: 0 },
    }));
    
    setShowFinishButton(false);
    setWatchProgress(0);

    toast.success('Session completed! 🎉');
    
    // Check for course completion
    const allLessons = modules.flatMap(m => m.lessons);
    const newCompletedCount = Object.values(progress).filter(p => p.completed).length + 1;
    if (newCompletedCount >= allLessons.length && course?.id) {
      // Trigger certificate generation in background
      supabase.functions.invoke('check-course-completion', {
        body: { userId: user.id, courseId: course.id }
      }).catch(console.error);
      
      // Show completion modal
      setTimeout(() => setShowCompletionModal(true), 800);
    }
  }, [currentLesson, user, modules, progress, course]);

  const handleFinishLesson = () => {
    handleComplete();
  };

  const goToNextLesson = () => {
    if (!currentLesson) return;

    const allLessons = modules.flatMap(m => m.lessons);
    const currentIndex = allLessons.findIndex(l => l.id === currentLesson.id);
    if (currentIndex < allLessons.length - 1) {
      handleLessonSelect(allLessons[currentIndex + 1]);
    }
  };

  const goToPrevLesson = () => {
    if (!currentLesson) return;

    const allLessons = modules.flatMap(m => m.lessons);
    const currentIndex = allLessons.findIndex(l => l.id === currentLesson.id);
    if (currentIndex > 0) {
      handleLessonSelect(allLessons[currentIndex - 1]);
    }
  };

  // Calculate overall progress
  const totalLessons = modules.reduce((sum, m) => sum + m.lessons.length, 0);
  const completedLessons = Object.values(progress).filter(p => p.completed).length;
  const overallProgress = totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center h-[60vh]">
          <div className="flex flex-col items-center gap-4">
            <div className="relative w-16 h-16">
              <div className="absolute inset-0 rounded-full border-4 border-muted animate-pulse" />
              <div className="absolute inset-0 rounded-full border-4 border-t-accent animate-spin" />
            </div>
            <p className="text-muted-foreground animate-pulse">Loading your studio...</p>
          </div>
        </div>
      </div>
    );
  }

  // Sidebar content component (reused in both desktop and mobile)
  const SidebarContent = () => (
    <>
      <div className="p-4 border-b bg-gradient-to-b from-muted/30 to-transparent">
        <Link to={`/course/${slug}`}>
          <Button variant="ghost" size="sm" className="gap-2 mb-3 hover:bg-accent/10 hover:text-accent transition-all">
            <ChevronLeft className="h-4 w-4" />
            Back to Studio
          </Button>
        </Link>
        
        <div className="space-y-3">
          {/* Course title with better styling */}
          <div className="space-y-2">
            <h2 className="font-semibold text-sm md:text-base leading-snug break-words whitespace-normal">
              {course?.title}
            </h2>
            
            {/* Access Badge with animation */}
            {accessInfo.accessType !== 'none' && (
              <div className="animate-fade-in">
                <AccessBadge 
                  accessType={accessInfo.accessType}
                  unlockedPercent={accessInfo.unlockedPercent}
                  expiryDate={accessInfo.giftExpiry || accessInfo.launchFreeExpiry}
                />
              </div>
            )}
          </div>
        </div>
        
        {/* Signup prompt for non-logged-in users - Enhanced design */}
        {!user && (
          <div className="mt-4 p-4 rounded-xl bg-gradient-to-br from-accent/15 via-accent/10 to-transparent border border-accent/20 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center shrink-0">
                <Award className="h-5 w-5 text-accent" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-accent text-sm mb-1">Like what you see?</p>
                <p className="text-muted-foreground text-xs mb-3 leading-relaxed">
                  Sign up free to unlock all lessons and track your learning progress!
                </p>
                <Button 
                  size="sm" 
                  onClick={() => navigate('/auth')} 
                  className="w-full bg-accent hover:bg-accent/90 text-accent-foreground shadow-sm"
                >
                  Sign Up Free
                </Button>
              </div>
            </div>
          </div>
        )}
        
        {/* Progress section - Enhanced */}
        {user && (
          <div className="mt-4 p-3 rounded-xl bg-muted/30 border border-border/50">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-medium text-muted-foreground">Your Progress</span>
              <span className="text-sm font-bold text-accent">{Math.round(overallProgress)}%</span>
            </div>
            <div className="relative">
              <Progress value={overallProgress} className="h-2.5" />
              {overallProgress > 0 && (
                <div 
                  className="absolute top-0 h-2.5 bg-gradient-to-r from-accent to-accent/80 rounded-full transition-all duration-500"
                  style={{ width: `${overallProgress}%` }}
                />
              )}
            </div>
            {completedLessons > 0 && (
              <p className="text-[10px] text-muted-foreground mt-1.5">
                {completedLessons} of {totalLessons} sessions completed
              </p>
            )}
          </div>
        )}
      </div>

      <ScrollArea className="flex-1">
        <Accordion type="multiple" defaultValue={modules.map(m => m.id)} className="p-3">
          {modules.map((module, modIdx) => {
            // Check if this module is unlocked (for partial EMI access)
            const isModuleUnlocked = accessInfo.accessType === 'partial' 
              ? accessInfo.unlockedModuleIds.includes(module.id)
              : isEnrolled;
            
            // Calculate module progress
            const moduleLessons = module.lessons;
            const moduleCompletedCount = moduleLessons.filter(l => progress[l.id]?.completed).length;
            const moduleProgress = moduleLessons.length > 0 ? (moduleCompletedCount / moduleLessons.length) * 100 : 0;
              
            return (
              <AccordionItem key={module.id} value={module.id} className="border-b border-border/30 last:border-b-0">
                <AccordionTrigger className="hover:no-underline px-3 py-3.5 hover:bg-muted/30 rounded-lg transition-colors [&[data-state=open]]:bg-muted/20">
                  <div className="flex items-start gap-3 text-left min-w-0 flex-1">
                    {/* Module number badge */}
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold ${
                      moduleProgress === 100 
                        ? 'bg-success/20 text-success' 
                        : 'bg-accent/10 text-accent'
                    }`}>
                      {moduleProgress === 100 ? (
                        <CheckCircle className="h-4 w-4" />
                      ) : (
                        modIdx + 1
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-medium leading-snug break-words whitespace-normal block">
                        {module.title}
                      </span>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] text-muted-foreground">
                          {moduleLessons.length} sessions
                        </span>
                        {user && moduleCompletedCount > 0 && (
                          <span className="text-[10px] text-accent font-medium">
                            {moduleCompletedCount}/{moduleLessons.length} done
                          </span>
                        )}
                        {accessInfo.accessType === 'partial' && !isModuleUnlocked && (
                          <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
                            <Lock className="h-2.5 w-2.5" />
                            Locked
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pb-2 pt-1">
                  <div className="space-y-1 pl-1">
                    {module.lessons.map((lesson, lessonIdx) => {
                      const isCompleted = progress[lesson.id]?.completed;
                      // Lesson is locked if: no access AND not free preview
                      // For partial access: check module unlock status
                      const isLocked = lesson.is_free_preview 
                        ? false 
                        : accessInfo.accessType === 'partial'
                          ? !isModuleUnlocked
                          : !isEnrolled;
                      const isCurrent = currentLesson?.id === lesson.id;

                      return (
                        <button
                          key={lesson.id}
                          onClick={() => handleLessonSelect(lesson)}
                          className={`w-full flex items-start gap-3 p-3 rounded-xl text-left text-sm transition-all group ${
                            isCurrent 
                              ? 'bg-gradient-to-r from-accent to-accent/80 text-accent-foreground shadow-md shadow-accent/20' 
                              : isLocked 
                                ? 'text-muted-foreground hover:bg-muted/30 opacity-60'
                                : 'hover:bg-muted/50'
                          }`}
                        >
                          {/* Status icon */}
                          <span className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-all ${
                            isCurrent 
                              ? 'bg-white/20' 
                              : isCompleted 
                                ? 'bg-success/15 text-success' 
                                : isLocked 
                                  ? 'bg-muted/50' 
                                  : 'bg-muted group-hover:bg-accent/10 group-hover:text-accent'
                          }`}>
                            {isLocked ? (
                              <Lock className="h-3.5 w-3.5" />
                            ) : isCompleted ? (
                              <CheckCircle className="h-4 w-4" />
                            ) : isCurrent ? (
                              <Play className="h-3.5 w-3.5 fill-current" />
                            ) : (
                              <Play className="h-3.5 w-3.5" />
                            )}
                          </span>
                          
                          <div className="flex-1 min-w-0">
                            <span className="block leading-snug break-words whitespace-normal font-medium">
                              {lesson.title}
                            </span>
                            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                              {lesson.is_free_preview && !isEnrolled && (
                                <Badge className="bg-success/15 text-success border-success/20 text-[10px] px-2 py-0.5 font-medium">
                                  Free Preview
                                </Badge>
                              )}
                              {lesson.duration_minutes && lesson.duration_minutes > 0 && (
                                <span className={`text-[10px] flex items-center gap-1 ${isCurrent ? 'opacity-80' : 'opacity-60'}`}>
                                  <Clock className="h-3 w-3" />
                                  {lesson.duration_minutes} min
                                </span>
                              )}
                              {isCurrent && (
                                <Badge className="bg-white/20 text-[10px] px-2 py-0.5 border-0 font-medium">
                                  Now Playing
                                </Badge>
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
      
      {/* Mobile Header with Lesson Toggle */}
      <div className="md:hidden sticky top-16 z-40 bg-background/95 backdrop-blur-sm border-b px-3 py-2 flex items-center gap-2 safe-area-inset">
        <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2 touch-target shrink-0">
              <List className="h-4 w-4" />
              <span className="text-xs">Lessons</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[90vw] max-w-sm p-0 flex flex-col">
            <SidebarContent />
          </SheetContent>
        </Sheet>
        
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium truncate">{currentLesson?.title || 'Select a lesson'}</p>
        </div>
        
        {/* Quick nav arrows for mobile */}
        <div className="flex gap-1 shrink-0">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={goToPrevLesson}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={goToNextLesson}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row md:h-[calc(100vh-4rem)]">
        {/* Sidebar - Hidden on mobile, shown via Sheet */}
        <aside className="hidden md:flex w-80 border-r bg-card flex-col shrink-0">
          <SidebarContent />
        </aside>

        {/* Main Content - Video Player */}
        <main className="flex-1 flex flex-col overflow-auto mobile-scroll">
          {currentLesson ? (
            <ScrollArea className="flex-1">
              {/* Video Container - Full width on mobile with proper aspect ratio */}
              <div className="bg-black flex items-center justify-center">
                {(() => {
                  const isLocked = !isEnrolled && !currentLesson.is_free_preview;

                  if (isLocked) {
                    return (
                      <div className="w-full py-6 md:py-10 px-4">
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
                      </div>
                    );
                  }

                  return (
                  <div className="text-center text-white py-8 md:py-16 px-4">
                    <BookOpen className="h-12 w-12 md:h-16 md:w-16 mx-auto mb-4 opacity-50" />
                    <p className="text-sm md:text-base">No video available for this lesson</p>
                    {currentLesson.description && (
                      <p className="mt-4 text-xs md:text-sm opacity-75 max-w-md">
                        {currentLesson.description}
                      </p>
                    )}
                  </div>
                  );
                })()}
              </div>

              {/* Lesson Info Bar */}
              <div className="border-t p-3 md:p-4 bg-card">
                <div className="flex flex-col gap-3">
                  {/* Title and status */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-sm md:text-base truncate">{currentLesson.title}</h3>
                        {progress[currentLesson.id]?.completed && (
                          <Badge variant="secondary" className="bg-success/10 text-success shrink-0 text-xs">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Done
                          </Badge>
                        )}
                      </div>
                      {currentLesson.description && (
                        <p className="text-xs md:text-sm text-muted-foreground mt-1 line-clamp-2">
                          {currentLesson.description}
                        </p>
                      )}
                    </div>
                    
                    {/* Finish Button - more prominent on mobile */}
                    {showFinishButton && !progress[currentLesson.id]?.completed && (
                      <Button 
                        size="sm" 
                        onClick={handleFinishLesson}
                        className="bg-success hover:bg-success/90 text-success-foreground shrink-0 text-xs md:text-sm"
                      >
                        <CheckCircle2 className="h-4 w-4 md:mr-1" />
                        <span className="hidden md:inline">Finish Session</span>
                      </Button>
                    )}
                  </div>
                  
                  {/* Navigation Buttons - Hidden on mobile (they're in the header now) */}
                  <div className="hidden md:flex gap-2 justify-end">
                    <Button variant="outline" size="sm" onClick={goToPrevLesson}>
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Previous
                    </Button>
                    <Button size="sm" onClick={goToNextLesson}>
                      Next
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Resources & Q&A Section Below Video */}
              {course && currentLesson && (
                <div className="p-3 md:p-4 border-t">
                  {/* Downloadable Resources */}
                  <LessonResources lessonId={currentLesson.id} isEnrolled={isEnrolled} />
                  
                  <Tabs defaultValue="qa" className="w-full mt-4">
                    <TabsList className="mb-4">
                      <TabsTrigger value="qa" className="gap-2 text-xs md:text-sm">
                        <MessageCircle className="h-4 w-4" />
                        <span className="hidden sm:inline">Questions & Answers</span>
                        <span className="sm:hidden">Q&A</span>
                      </TabsTrigger>
                    </TabsList>
                    <TabsContent value="qa">
                      <CourseQA courseId={course.id} />
                    </TabsContent>
                  </Tabs>
                </div>
              )}
            </ScrollArea>
          ) : (
            <div className="flex-1 flex items-center justify-center p-8">
              <div className="text-center">
                <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">Select a lesson to start learning</p>
                <Button 
                  variant="outline" 
                  className="mt-4 md:hidden"
                  onClick={() => setSidebarOpen(true)}
                >
                  <List className="h-4 w-4 mr-2" />
                  View Lessons
                </Button>
              </div>
            </div>
          )}
        </main>
      </div>
      {/* Course Completion Celebration Modal */}
      {user && course && (
        <CourseCompletionModal
          open={showCompletionModal}
          onOpenChange={setShowCompletionModal}
          courseName={course.title}
          courseId={course.id}
          userId={user.id}
        />
      )}
    </div>
  );
}
