import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Navbar } from '@/components/layout/Navbar';
import { SecureVideoPlayer } from '@/components/video/SecureVideoPlayer';
import { CourseQA } from '@/components/course/CourseQA';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ChevronLeft, Play, CheckCircle, Lock, Clock, 
  BookOpen, Award, ChevronRight, CheckCircle2, MessageCircle
} from 'lucide-react';
import { toast } from 'sonner';

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
  const { user } = useAuth();
  const navigate = useNavigate();

  const [course, setCourse] = useState<any>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);
  const [progress, setProgress] = useState<Record<string, LessonProgress>>({});
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [watchProgress, setWatchProgress] = useState(0);
  const [showFinishButton, setShowFinishButton] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    fetchCourseData();
  }, [slug, user]);

  const fetchCourseData = async () => {
    if (!slug || !user) return;

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

      // Check enrollment
      const { data: enrollment } = await supabase
        .from('enrollments')
        .select('id')
        .eq('user_id', user.id)
        .eq('course_id', courseData.id)
        .eq('status', 'active')
        .maybeSingle();

      setIsEnrolled(!!enrollment);

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

      // Fetch user progress
      const allLessonIds = sortedModules.flatMap(m => m.lessons.map(l => l.id));
      if (allLessonIds.length > 0) {
        const { data: progressData } = await supabase
          .from('progress')
          .select('lesson_id, completed, last_position_seconds')
          .eq('user_id', user.id)
          .in('lesson_id', allLessonIds);

        const progressMap: Record<string, LessonProgress> = {};
        (progressData || []).forEach(p => {
          progressMap[p.lesson_id] = p;
        });
        setProgress(progressMap);
      }

      // Set initial lesson
      if (sortedModules.length > 0 && sortedModules[0].lessons.length > 0) {
        setCurrentLesson(sortedModules[0].lessons[0]);
      }
    } catch (error) {
      console.error('Error fetching course:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLessonSelect = (lesson: Lesson) => {
    if (!isEnrolled && !lesson.is_free_preview) {
      toast.error('Please enroll to access this lesson');
      return;
    }
    setCurrentLesson(lesson);
  };

  const handleProgress = useCallback(async (progressPercent: number, currentTime: number) => {
    if (!currentLesson || !user) return;

    // Update watch progress state for UI
    setWatchProgress(progressPercent);
    
    // Show finish button at 95% or more
    if (progressPercent >= 95 && !progress[currentLesson.id]?.completed) {
      setShowFinishButton(true);
    }

    // Save progress every 10 seconds
    const roundedTime = Math.floor(currentTime / 10) * 10;
    
    await supabase.from('progress').upsert({
      user_id: user.id,
      lesson_id: currentLesson.id,
      last_position_seconds: roundedTime,
      watch_time_seconds: roundedTime,
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'user_id,lesson_id',
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

    toast.success('Lesson completed! 🎉');
    
    // Check for course completion
    const allLessons = modules.flatMap(m => m.lessons);
    const newCompletedCount = Object.values(progress).filter(p => p.completed).length + 1;
    if (newCompletedCount >= allLessons.length) {
      toast.success('🏆 Congratulations! You completed the course!');
      // Trigger certificate generation
      supabase.functions.invoke('check-course-completion', {
        body: { userId: user.id, courseId: course?.id }
      }).catch(console.error);
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
          <div className="animate-pulse">Loading course...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="flex h-[calc(100vh-4rem)]">
        {/* Sidebar - Course Content */}
        <aside className="w-80 border-r bg-card flex flex-col">
          <div className="p-4 border-b">
            <Link to={`/course/${slug}`}>
              <Button variant="ghost" size="sm" className="gap-2 mb-2">
                <ChevronLeft className="h-4 w-4" />
                Back to Course
              </Button>
            </Link>
            <h2 className="font-semibold truncate">{course?.title}</h2>
            <div className="mt-2">
              <div className="flex justify-between text-sm mb-1">
                <span>Progress</span>
                <span>{Math.round(overallProgress)}%</span>
              </div>
              <Progress value={overallProgress} className="h-2" />
            </div>
          </div>

          <ScrollArea className="flex-1">
            <Accordion type="multiple" defaultValue={modules.map(m => m.id)} className="p-2">
              {modules.map((module, modIdx) => (
                <AccordionItem key={module.id} value={module.id} className="border-b-0">
                  <AccordionTrigger className="hover:no-underline px-2 py-3">
                    <span className="text-sm font-medium text-left">
                      Module {modIdx + 1}: {module.title}
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="pb-2">
                    <div className="space-y-1">
                      {module.lessons.map((lesson, lessonIdx) => {
                        const isCompleted = progress[lesson.id]?.completed;
                        const isLocked = !isEnrolled && !lesson.is_free_preview;
                        const isCurrent = currentLesson?.id === lesson.id;

                        return (
                          <button
                            key={lesson.id}
                            onClick={() => handleLessonSelect(lesson)}
                            disabled={isLocked}
                            className={`w-full flex items-center gap-2 p-2 rounded text-left text-sm transition-colors ${
                              isCurrent 
                                ? 'bg-primary text-primary-foreground' 
                                : isLocked 
                                  ? 'text-muted-foreground cursor-not-allowed'
                                  : 'hover:bg-muted'
                            }`}
                          >
                            <span className="w-5 h-5 flex items-center justify-center shrink-0">
                              {isLocked ? (
                                <Lock className="h-3 w-3" />
                              ) : isCompleted ? (
                                <CheckCircle className="h-4 w-4 text-green-500" />
                              ) : (
                                <Play className="h-3 w-3" />
                              )}
                            </span>
                            <span className="flex-1 truncate">{lesson.title}</span>
                            {lesson.is_free_preview && !isEnrolled && (
                              <Badge variant="secondary" className="text-xs">Free</Badge>
                            )}
                            <span className="text-xs opacity-60">
                              {lesson.duration_minutes}m
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </ScrollArea>
        </aside>

        {/* Main Content - Video Player */}
        <main className="flex-1 flex flex-col overflow-auto">
          {currentLesson ? (
            <ScrollArea className="flex-1">
              <div className="bg-black flex items-center justify-center p-4">
                {currentLesson.video_url ? (
                  <div className="w-full max-w-5xl">
                    <SecureVideoPlayer
                      lessonId={currentLesson.id}
                      videoPath={currentLesson.video_url}
                      onProgress={handleProgress}
                      onComplete={handleComplete}
                      initialPosition={progress[currentLesson.id]?.last_position_seconds || 0}
                      allowExternal={currentLesson.is_free_preview && !isEnrolled}
                    />
                  </div>
                ) : (
                  <div className="text-center text-white py-16">
                    <BookOpen className="h-16 w-16 mx-auto mb-4 opacity-50" />
                    <p>No video available for this lesson</p>
                    {currentLesson.description && (
                      <p className="mt-4 text-sm opacity-75 max-w-md">
                        {currentLesson.description}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Lesson Info Bar */}
              <div className="border-t p-4 bg-card">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold truncate">{currentLesson.title}</h3>
                      {progress[currentLesson.id]?.completed && (
                        <Badge variant="secondary" className="bg-success/10 text-success shrink-0">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Completed
                        </Badge>
                      )}
                    </div>
                    {currentLesson.description && (
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                        {currentLesson.description}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button variant="outline" size="sm" onClick={goToPrevLesson}>
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>
                    
                    {/* Finish Lesson Button - Shows at 95%+ watch time */}
                    {showFinishButton && !progress[currentLesson.id]?.completed && (
                      <Button 
                        size="sm" 
                        onClick={handleFinishLesson}
                        className="bg-success hover:bg-success/90 text-success-foreground animate-pulse"
                      >
                        <CheckCircle2 className="h-4 w-4 mr-1" />
                        Finish Lesson
                      </Button>
                    )}
                    
                    <Button size="sm" onClick={goToNextLesson}>
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Q&A Section Below Video */}
              {course && (
                <div className="p-4 border-t">
                  <Tabs defaultValue="qa" className="w-full">
                    <TabsList className="mb-4">
                      <TabsTrigger value="qa" className="gap-2">
                        <MessageCircle className="h-4 w-4" />
                        Questions & Answers
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
            <div className="flex-1 flex items-center justify-center">
              <p className="text-muted-foreground">Select a lesson to start learning</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
