import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { courses, courseCategories, categoryImages } from '@/data/courses';
import { useDynamicCourseData } from '@/hooks/useDynamicCourseData';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Clock, BookOpen, Star, CheckCircle, Play, ArrowLeft, CreditCard, Loader2, Users, Award, FileText, Lock, Eye, ChevronDown, Video, ShoppingCart } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { useCashfreePayment } from '@/hooks/useCashfreePayment';
import { useCourseModules } from '@/hooks/useCourseModules';
import { useToast } from '@/hooks/use-toast';
import { CourseReviews } from '@/components/course/CourseReviews';
import { DemoReviews } from '@/components/course/DemoReviews';
import { SEOHead, generateCourseSchema } from '@/components/seo/SEOHead';
import { LiveViewerCounter } from '@/components/social-proof/LiveViewerCounter';
import { useSaleDiscount } from '@/hooks/useSaleDiscount';
import { AnimatedBackground } from '@/components/layout/AnimatedBackground';
import { supabase } from '@/integrations/supabase/client';
import { PhoneNumberDialog } from '@/components/payment/PhoneNumberDialog';

// Add to Cart Button Component
function AddToCartButton({ course }: { course: any }) {
  const { addToCart, isInCart, removeFromCart } = useCart();
  const inCart = isInCart(course.slug);
  
  const handleClick = () => {
    if (inCart) {
      removeFromCart(course.slug);
    } else {
      addToCart({
        courseId: course.slug,
        slug: course.slug,
        title: course.title,
        price: course.priceInr,
        thumbnail: course.thumbnail,
      });
    }
  };
  
  return (
    <Button 
      variant={inCart ? "secondary" : "outline"}
      onClick={handleClick}
      className="w-full"
    >
      <ShoppingCart className="h-4 w-4 mr-2" />
      {inCart ? 'Remove from Cart' : 'Add to Cart'}
    </Button>
  );
}

// Expandable Module Component
interface ExpandableModuleProps {
  index: number;
  title: string;
  lessonCount: number;
  duration: string;
  hasFreePreview: boolean;
  courseSlug: string;
  lessons: {
    id: string;
    title: string;
    duration_minutes: number | null;
    is_free_preview: boolean;
    video_url: string | null;
  }[];
}

function ExpandableModule({ index, title, lessonCount, duration, hasFreePreview, courseSlug, lessons }: ExpandableModuleProps) {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  
  const handleLessonClick = (lesson: typeof lessons[0]) => {
    if (lesson.is_free_preview) {
      navigate(`/learn/${courseSlug}?lesson=${lesson.id}`);
    }
  };
  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <div className="flex items-center justify-between p-2.5 rounded-lg bg-muted/40 hover:bg-muted/60 transition-colors cursor-pointer">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-full bg-accent/10 flex items-center justify-center text-sm font-medium text-accent">
              {index + 1}
            </div>
            <div>
              <p className="font-medium text-sm">{title}</p>
              <p className="text-xs text-muted-foreground">
                {lessonCount} lessons{duration && ` • ${duration}`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {hasFreePreview && (
              <Badge variant="outline" className="text-xs gap-1 border-success/30 text-success">
                <Eye className="h-3 w-3" /> Free Preview
              </Badge>
            )}
            <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </div>
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="ml-10 mt-0.5 space-y-0 pb-1.5">
          {lessons.map((lesson, lessonIdx) => (
            <div 
              key={lesson.id}
              onClick={() => handleLessonClick(lesson)}
              className={`flex items-center justify-between py-2 px-3 rounded text-sm transition-colors ${
                lesson.is_free_preview 
                  ? 'cursor-pointer hover:bg-accent/10 hover:text-accent' 
                  : 'hover:bg-muted/30'
              }`}
            >
              <div className="flex items-center gap-2">
                {lesson.video_url ? (
                  <Video className="h-3.5 w-3.5 text-accent" />
                ) : (
                  <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                )}
                <span className={lesson.is_free_preview ? 'text-foreground' : 'text-muted-foreground'}>
                  {lesson.title}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {lesson.duration_minutes && lesson.duration_minutes > 0 && (
                  <span className="text-xs text-muted-foreground">
                    {lesson.duration_minutes} min
                  </span>
                )}
                {lesson.is_free_preview ? (
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0 flex items-center gap-1 bg-success/10 text-success border-0">
                    <Play className="h-2.5 w-2.5" />
                    Free
                  </Badge>
                ) : (
                  <Lock className="h-3 w-3 text-muted-foreground" />
                )}
              </div>
            </div>
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

export default function CourseDetail() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { initiatePayment, isLoading } = useCashfreePayment();
  const { toast } = useToast();
  const { getThumbnail, getPriceInr } = useDynamicCourseData();
  const { isActive: saleActive, discountPercent, calculateDiscountedPrice } = useSaleDiscount();
  
  // Fetch real modules from database
  const { modules: dbModules, loading: modulesLoading, totalLessons: dbTotalLessons, totalDuration } = useCourseModules(slug);
  
  // Fetch database course ID + public meta for correct stats display (even for guests)
  const [dbCourseId, setDbCourseId] = useState<string | null>(null);
  const [dbCourseMeta, setDbCourseMeta] = useState<{ total_lessons: number | null; duration_hours: number | null } | null>(null);
  
  // Phone number dialog state
  const [showPhoneDialog, setShowPhoneDialog] = useState(false);
  const [pendingPaymentData, setPendingPaymentData] = useState<{
    courseId: string;
    amount: number;
    customerName: string;
    customerEmail: string;
    courseTitle: string;
    courseShortDescription?: string;
    courseDescription?: string;
    courseLevel?: string;
  } | null>(null);
  
  useEffect(() => {
    if (slug) {
      supabase
        .from('courses')
        .select('id, total_lessons, duration_hours')
        .eq('slug', slug)
        .single()
        .then(({ data }) => {
          setDbCourseId(data?.id || null);
          setDbCourseMeta({
            total_lessons: (data as any)?.total_lessons ?? null,
            duration_hours: (data as any)?.duration_hours ?? null,
          });
        });
    }
  }, [slug]);

  const course = courses.find(c => c.slug === slug);

  if (!course) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-24 pb-16 container mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold mb-4">Course Not Found</h1>
          <p className="text-muted-foreground mb-8">The course you're looking for doesn't exist.</p>
          <Button onClick={() => navigate('/courses')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Browse All Courses
          </Button>
        </div>
        <Footer />
      </div>
    );
  }

  const category = courseCategories.find(c => c.id === course.category);

  const effectivePriceInr = getPriceInr(course.slug, course.priceInr);

  const handleBuyNow = async () => {
    if (!user) {
      toast({
        title: "Login Required",
        description: "Please login to purchase this course",
        variant: "destructive",
      });
      navigate('/auth');
      return;
    }

    // Handle free courses
    if (effectivePriceInr === 0) {
      await handleFreeEnrollment();
      return;
    }

    const customerPhone = profile?.phone?.replace(/[\s-]/g, '');
    const hasValidPhone = customerPhone && customerPhone.length >= 10;

    if (!hasValidPhone) {
      // Show phone dialog and store payment data
      setPendingPaymentData({
        courseId: course.slug,
        amount: effectivePriceInr,
        customerName: profile?.full_name || user.email?.split('@')[0] || 'Customer',
        customerEmail: user.email || '',
        courseTitle: course.title,
        courseShortDescription: course.shortDescription,
        courseDescription: course.description,
        courseLevel: course.level,
      });
      setShowPhoneDialog(true);
      return;
    }

    await initiatePayment({
      courseId: course.slug,
      amount: effectivePriceInr,
      customerName: profile?.full_name || user.email?.split('@')[0] || 'Customer',
      customerEmail: user.email || '',
      customerPhone: customerPhone,
      courseTitle: course.title,
      courseShortDescription: course.shortDescription,
      courseDescription: course.description,
      courseLevel: course.level,
    });
  };

  const handlePhoneSubmit = async (phone: string) => {
    if (!pendingPaymentData) return;
    
    // Update profile with phone number
    if (user) {
      await supabase
        .from('profiles')
        .update({ phone: phone })
        .eq('user_id', user.id);
    }
    
    setShowPhoneDialog(false);
    
    await initiatePayment({
      ...pendingPaymentData,
      customerPhone: phone,
    });
    
    setPendingPaymentData(null);
  };

  const handleFreeEnrollment = async () => {
    try {
      const { supabase } = await import('@/integrations/supabase/client');
      
      // Get or create course in database
      let { data: dbCourse } = await supabase
        .from('courses')
        .select('id')
        .eq('slug', course.slug)
        .single();

      if (!dbCourse) {
        const { data: newCourse, error: createError } = await supabase
          .from('courses')
          .insert({
            slug: course.slug,
            title: course.title,
            description: course.description,
            short_description: course.shortDescription,
            level: course.level,
            price_inr: 0,
            price_usd: null,
            is_published: true,
          })
          .select('id')
          .single();

        if (createError) throw createError;
        dbCourse = newCourse;
      }

      // Create enrollment
      const { error: enrollError } = await supabase
        .from('enrollments')
        .insert({
          user_id: user!.id,
          course_id: dbCourse!.id,
          status: 'active',
        });

      if (enrollError) {
        if (enrollError.code === '23505') {
          toast({
            title: "Already Enrolled",
            description: "You're already enrolled in this course!",
          });
          navigate(`/course/${course.slug}/learn`);
          return;
        }
        throw enrollError;
      }

      // Send enrollment email (fire and forget)
      supabase.functions.invoke('send-enrollment-email', {
        body: {
          email: user!.email,
          name: profile?.full_name || user!.email?.split('@')[0],
          courseName: course.title,
          courseSlug: course.slug,
          isFree: true,
        }
      }).catch(err => console.error('Enrollment email error:', err));

      toast({
        title: "Enrolled Successfully! 🎉",
        description: "You can now access all course content.",
      });

      navigate(`/course/${course.slug}/learn`);
    } catch (error: any) {
      console.error('Free enrollment error:', error);
      toast({
        title: "Enrollment Failed",
        description: error.message || "Failed to enroll. Please try again.",
        variant: "destructive",
      });
    }
  };

  const levelColors: Record<string, string> = {
    beginner: 'bg-success/10 text-success border-success/30',
    intermediate: 'bg-warning/10 text-warning border-warning/30',
    advanced: 'bg-destructive/10 text-destructive border-destructive/30',
  };

  // Use correct totals:
  // - For guests, RLS restricts lesson reads to free previews, so totals must come from the course meta.
  // - For enrolled users, totals can be calculated from lessons.
  const hasRealContent = dbModules.length > 0;
  const displayTotalLessons = dbCourseMeta?.total_lessons 
    ? dbCourseMeta.total_lessons 
    : (hasRealContent ? dbTotalLessons : course.totalLessons);
  const displayTotalHours = user
    ? (hasRealContent ? Math.round(totalDuration / 60) : (dbCourseMeta?.duration_hours ?? course.durationHours))
    : (dbCourseMeta?.duration_hours ?? 0);
  
  // Format duration for display - hide if 0
  const formatDuration = (minutes: number) => {
    if (minutes === 0) return '';
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  const courseUrl = `https://archistudio.lovable.app/courses/${course.slug}`;
  const courseSchema = generateCourseSchema({
    title: course.title,
    description: course.description,
    price: effectivePriceInr,
    currency: 'INR',
    image: categoryImages[course.category],
    url: courseUrl,
    duration: `${course.durationHours} hours`,
    level: course.level,
  });

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      <SEOHead 
        title={`${course.title} - Archistudio`}
        description={course.shortDescription}
        type="product"
        price={course.priceInr}
        url={courseUrl}
        keywords={`${course.title}, ${category?.name}, architecture course, 3D visualization`}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(courseSchema) }}
      />
      
      <Navbar />
      
      {/* Animated Background */}
      <AnimatedBackground intensity="light" />
      
       {/* Hero Section */}
       <section className="pt-20 pb-6 relative">
        <div className="container mx-auto px-4">
           <Link to="/courses" className="inline-flex items-center text-muted-foreground hover:text-foreground mb-4 transition-colors">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Studios
          </Link>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Course Info */}
            <div className="lg:col-span-2 space-y-6">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className={levelColors[course.level]}>
                  {course.level}
                </Badge>
                <Badge variant="secondary">
                  {category?.icon} {category?.name}
                </Badge>
                {course.isFeatured && (
                  <Badge className="bg-warning text-warning-foreground">
                    <Star className="h-3 w-3 mr-1 fill-current" /> Featured
                  </Badge>
                )}
              </div>

              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold leading-tight">
                {course.title}
              </h1>

              <p className="text-xl text-muted-foreground">
                {course.shortDescription}
              </p>

              {/* Live viewer counter */}
              <LiveViewerCounter courseSlug={slug} variant="course" />

              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4" />
                  {displayTotalHours > 0 ? `${displayTotalHours} hours` : 'Self-paced (learn anytime)'}
                </span>
                <span className="flex items-center gap-1.5">
                  <BookOpen className="h-4 w-4" />
                  {displayTotalLessons} sessions
                </span>
                <span className="flex items-center gap-1.5">
                  <Users className="h-4 w-4" />
                  500+ students
                </span>
                <span className="flex items-center gap-1.5">
                  <Award className="h-4 w-4" />
                  Proof of Completion included
                </span>
              </div>
            </div>

            {/* Purchase Card */}
            <div className="lg:col-span-1">
              <Card className="sticky top-24 overflow-hidden border-accent/20 shadow-lg">
                <div className="aspect-video relative group">
                  <img 
                    src={getThumbnail(course.slug, categoryImages[course.category] || '/placeholder.svg')} 
                    alt={course.title}
                    loading="eager"
                    decoding="async"
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    onError={(e) => {
                      e.currentTarget.src = categoryImages[course.category] || '/placeholder.svg';
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-transparent flex items-center justify-center">
                    <Button 
                      size="lg" 
                      variant="secondary" 
                      className="gap-2 shadow-xl hover:scale-105 transition-transform"
                      onClick={() => navigate(`/learn/${course.slug}`)}
                    >
                      <Play className="h-5 w-5 fill-current" />
                      Preview Studio
                    </Button>
                  </div>
                </div>
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-baseline gap-2">
                    {effectivePriceInr === 0 ? (
                      <span className="text-3xl font-bold text-success">Free</span>
                    ) : saleActive && discountPercent > 0 ? (
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-3xl font-bold text-success">₹{calculateDiscountedPrice(effectivePriceInr).toLocaleString()}</span>
                          <span className="text-lg line-through text-muted-foreground">₹{effectivePriceInr.toLocaleString()}</span>
                        </div>
                        <span className="inline-block px-2 py-0.5 bg-destructive text-destructive-foreground text-xs font-bold rounded">{discountPercent}% OFF</span>
                      </div>
                    ) : (
                      <span className="text-3xl font-bold">₹{effectivePriceInr.toLocaleString()}</span>
                    )}
                  </div>
                  
                  <Button 
                    onClick={handleBuyNow} 
                    disabled={isLoading}
                    className="w-full h-12 text-lg"
                    size="lg"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : effectivePriceInr === 0 ? (
                      <>
                        <BookOpen className="h-5 w-5 mr-2" />
                        Enroll for Free
                      </>
                    ) : (
                      <>
                        <CreditCard className="h-5 w-5 mr-2" />
                        Buy Now
                      </>
                    )}
                  </Button>

                  {effectivePriceInr > 0 && (
                    <AddToCartButton course={{ ...course, priceInr: effectivePriceInr }} />
                  )}


                  <Separator />

                  <div className="space-y-3 text-sm">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-success" />
                      Lifetime access
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-success" />
                      Downloadable resources
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-success" />
                      Proof of Completion included
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-success" />
                      Project files included
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Course Description */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              {/* About */}
              <Card>
                <CardHeader>
                  <CardTitle>About This Studio</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground leading-relaxed">
                    {course.description}
                  </p>
                </CardContent>
              </Card>

              {/* What You'll Learn */}
              <Card>
                <CardHeader>
                  <CardTitle>What You'll Learn</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {[
                      'Master core concepts and fundamentals',
                      'Build real-world professional projects',
                      'Industry-standard workflows and techniques',
                      'Advanced tips and best practices',
                      'Optimize your workflow for efficiency',
                      'Create portfolio-ready work',
                      'Understand professional standards',
                      'Troubleshoot common issues',
                    ].map((item, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <CheckCircle className="h-5 w-5 text-success flex-shrink-0 mt-0.5" />
                        <span className="text-sm">{item}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Curriculum */}
              <Card className="border-accent/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-accent" />
                    Course Curriculum
                  </CardTitle>
                  <CardDescription className="flex items-center gap-4">
                    <span>{displayTotalLessons} lessons</span>
                    {displayTotalHours > 0 && <span>•</span>}
                    {displayTotalHours > 0 && <span>{displayTotalHours} hours total</span>}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-1.5">
                  {modulesLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : hasRealContent ? (
                    // Real modules from database - EXPANDABLE
                    dbModules.map((module, i) => {
                      const moduleDuration = module.lessons.reduce((sum, l) => sum + (l.duration_minutes || 0), 0);
                      const hasFreePreview = module.lessons.some(l => l.is_free_preview);
                      
                      return (
                        <ExpandableModule
                          key={module.id}
                          index={i}
                          title={module.title}
                          lessonCount={module.lessons.length}
                          duration={formatDuration(moduleDuration)}
                          hasFreePreview={hasFreePreview}
                          courseSlug={course.slug}
                          lessons={module.lessons}
                        />
                      );
                    })
                  ) : (
                    // Fake placeholder modules when no content imported yet (not expandable)
                    [
                      { title: 'Introduction & Setup', lessons: 3, duration: '45 min', freePreview: true },
                      { title: 'Core Concepts', lessons: 5, duration: '1.5 hrs', freePreview: false },
                      { title: 'Practical Application', lessons: 6, duration: '2 hrs', freePreview: false },
                      { title: 'Advanced Techniques', lessons: 4, duration: '1.5 hrs', freePreview: false },
                      { title: 'Real-World Projects', lessons: 5, duration: '2 hrs', freePreview: false },
                      { title: 'Final Project & Certificate', lessons: 2, duration: '1 hr', freePreview: false },
                    ].map((module, i) => (
                      <div 
                        key={i}
                        className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted/70 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-7 h-7 rounded-full bg-accent/10 flex items-center justify-center text-sm font-medium text-accent">
                            {i + 1}
                          </div>
                          <div>
                            <p className="font-medium text-sm">{module.title}</p>
                            <p className="text-xs text-muted-foreground">
                              {module.lessons} lessons • {module.duration}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {module.freePreview ? (
                            <Badge variant="outline" className="text-xs gap-1 border-success/30 text-success">
                              <Eye className="h-3 w-3" /> Free Preview
                            </Badge>
                          ) : (
                            <Lock className="h-4 w-4 text-muted-foreground" />
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>

              {/* Real User Reviews - only for enrolled users */}
              {dbCourseId && (
                <CourseReviews courseId={dbCourseId} />
              )}

              {/* Demo Reviews with Indian Names - for non-enrolled / no real reviews yet */}
              <DemoReviews courseTitle={course.title} courseSlug={course.slug} />
            </div>

            {/* Sidebar - Related Courses */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Tags</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {course.tags.map(tag => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Related Courses</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {courses
                    .filter(c => c.category === course.category && c.id !== course.id && c.isPublished)
                    .slice(0, 3)
                    .map(relatedCourse => {
                      const relatedPrice = getPriceInr(relatedCourse.slug, relatedCourse.priceInr);
                      return (
                        <Link 
                          key={relatedCourse.id}
                          to={`/course/${relatedCourse.slug}`}
                          className="block group"
                        >
                          <div className="flex gap-3">
                            <img 
                              src={getThumbnail(relatedCourse.slug, categoryImages[relatedCourse.category] || '/placeholder.svg')}
                              alt={relatedCourse.title}
                              loading="lazy"
                              decoding="async"
                              className="w-20 h-14 object-cover rounded"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm line-clamp-2 group-hover:text-accent transition-colors">
                                {relatedCourse.title}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                ₹{relatedPrice.toLocaleString()}
                              </p>
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      <Footer />
      
      <PhoneNumberDialog
        open={showPhoneDialog}
        onOpenChange={setShowPhoneDialog}
        onSubmit={handlePhoneSubmit}
        isLoading={isLoading}
      />
    </div>
  );
}
