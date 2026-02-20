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
import { useAccessControl } from '@/hooks/useAccessControl';
import { useToast } from '@/hooks/use-toast';
import { CourseReviews } from '@/components/course/CourseReviews';
import { DemoReviews } from '@/components/course/DemoReviews';
import { AccessBadge } from '@/components/course/AccessBadge';
import { SEOHead, generateCourseSchema, generateBreadcrumbSchema } from '@/components/seo/SEOHead';
import { LiveViewerCounter } from '@/components/social-proof/LiveViewerCounter';
import { useSaleDiscount } from '@/hooks/useSaleDiscount';
import { AnimatedBackground } from '@/components/layout/AnimatedBackground';
import { supabase } from '@/integrations/supabase/client';
import { PhoneNumberDialog } from '@/components/payment/PhoneNumberDialog';
import { analytics } from '@/hooks/useGoogleAnalytics';
import { LinkedEbooksHighlight } from '@/components/course/LinkedEbooksHighlight';
import { EMIPaymentOptions } from '@/components/course/EMIPaymentOptions';
import { useExitDiscount } from '@/hooks/useExitDiscount';

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
  defaultOpen?: boolean;
}

function ExpandableModule({ index, title, lessonCount, duration, hasFreePreview, courseSlug, lessons, defaultOpen = false }: ExpandableModuleProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const navigate = useNavigate();
  
  const handleLessonClick = (lesson: typeof lessons[0]) => {
    if (lesson.is_free_preview) {
      navigate(`/learn/${courseSlug}?lesson=${lesson.id}`);
    }
  };
  
  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-all cursor-pointer border border-transparent hover:border-border/50">
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold transition-colors ${
              hasFreePreview ? 'bg-success/10 text-success' : 'bg-accent/10 text-accent'
            }`}>
              {index + 1}
            </div>
            <div className="min-w-0">
              <p className="font-medium text-sm leading-snug">{title}</p>
              <p className="text-xs text-muted-foreground">
                {lessonCount} {lessonCount === 1 ? 'lesson' : 'lessons'}{duration && ` • ${duration}`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {hasFreePreview && (
              <Badge variant="outline" className="text-xs gap-1 border-success/30 text-success bg-success/5">
                <Eye className="h-3 w-3" /> Free Preview
              </Badge>
            )}
            <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
          </div>
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent className="animate-accordion-down">
        <div className="ml-11 mt-1 space-y-0.5 pb-2 border-l-2 border-muted pl-4">
          {lessons.length === 0 ? (
            <p className="text-xs text-muted-foreground py-2 italic">No lessons in this module yet</p>
          ) : (
            lessons.map((lesson) => (
              <div 
                key={lesson.id}
                onClick={() => handleLessonClick(lesson)}
                className={`flex items-center justify-between py-2.5 px-3 rounded-lg text-sm transition-all ${
                  lesson.is_free_preview 
                    ? 'cursor-pointer hover:bg-success/10 hover:text-success group' 
                    : 'hover:bg-muted/30 text-muted-foreground'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  {lesson.video_url ? (
                    <Video className={`h-4 w-4 shrink-0 ${lesson.is_free_preview ? 'text-success' : 'text-muted-foreground'}`} />
                  ) : (
                    <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                  )}
                  <span className={`block leading-snug break-words whitespace-normal ${lesson.is_free_preview ? 'text-foreground group-hover:text-success' : ''}`}>
                    {lesson.title}
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-2">
                  {lesson.duration_minutes && lesson.duration_minutes > 0 && (
                    <span className="text-[10px] text-muted-foreground tabular-nums">
                      {lesson.duration_minutes} min
                    </span>
                  )}
                  {lesson.is_free_preview ? (
                    <Badge className="text-[9px] px-1.5 py-0.5 flex items-center gap-1 bg-success/15 text-success border-0 font-medium">
                      <Play className="h-2.5 w-2.5 fill-current" />
                      Play Free
                    </Badge>
                  ) : (
                    <Lock className="h-3 w-3 text-muted-foreground/60" />
                  )}
                </div>
              </div>
            ))
          )}
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
  const { isActive: exitDiscountActive, discountPercent: exitDiscountPercent } = useExitDiscount();
  
  // Fetch real modules from database
  const { modules: dbModules, loading: modulesLoading, totalLessons: dbTotalLessons, totalDuration } = useCourseModules(slug);
  
  // Fetch database course ID + public meta for correct stats display (even for guests)
  const [dbCourseId, setDbCourseId] = useState<string | null>(null);
  const [dbCourseMeta, setDbCourseMeta] = useState<{ total_lessons: number | null; duration_hours: number | null } | null>(null);
  // DB-only course fallback (for courses not in local data/courses.ts)
  const [dbOnlyCourse, setDbOnlyCourse] = useState<import('@/data/courses').Course | null>(null);
  const [dbCourseLoading, setDbCourseLoading] = useState(true);
  
  // Use access control hook for enrollment/gift/EMI status
  const accessInfo = useAccessControl(user?.id, dbCourseId || undefined);
  
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
  
  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [slug]);

  useEffect(() => {
    if (slug) {
      setDbCourseLoading(true);
      supabase
        .from('courses')
        .select('id, title, slug, description, short_description, level, duration_hours, total_lessons, price_inr, price_usd, thumbnail_url, is_featured, is_published')
        .eq('slug', slug)
        .single()
        .then(({ data }) => {
          if (data) {
            setDbCourseId(data.id);
            setDbCourseMeta({
              total_lessons: data.total_lessons ?? null,
              duration_hours: data.duration_hours ?? null,
            });
            // Build a fallback Course object for DB-only courses
            const staticCourse = courses.find(c => c.slug === slug);
            if (!staticCourse) {
              const categoryImages = {
                'autocad': 'autocad', 'sketchup': 'sketchup', '3ds-max': '3ds-max',
                'revit-bim': 'revit-bim', 'corona-vray': 'corona-vray',
              };
              const guessCategory = (): string => {
                const t = (data.title || '').toLowerCase();
                if (t.includes('autocad')) return 'autocad';
                if (t.includes('sketchup') || t.includes('sketch')) return 'sketchup';
                if (t.includes('3ds max') || t.includes('3ds-max')) return '3ds-max';
                if (t.includes('revit') || t.includes('bim')) return 'revit-bim';
                if (t.includes('corona') || t.includes('v-ray') || t.includes('vray')) return 'corona-vray';
                if (t.includes('rhino')) return 'rhino';
                if (t.includes('lumion') || t.includes('twinmotion') || t.includes('d5')) return 'visualization';
                return 'fundamentals';
              };
              const cat = guessCategory();
              setDbOnlyCourse({
                id: data.id,
                title: data.title,
                slug: data.slug,
                shortDescription: data.short_description || data.description || '',
                description: data.description || data.short_description || '',
                category: cat,
                subcategory: cat,
                level: (data.level as any) || 'beginner',
                durationHours: data.duration_hours || 0,
                totalLessons: data.total_lessons || 0,
                priceInr: data.price_inr || 0,
                priceUsd: data.price_usd || undefined,
                thumbnail: data.thumbnail_url || '',
                isFeatured: data.is_featured || false,
                isPublished: data.is_published || false,
                tags: [],
              });
            }
          }
          setDbCourseLoading(false);
        });
    }
  }, [slug]);

  const staticCourse = courses.find(c => c.slug === slug);
  const course = staticCourse || dbOnlyCourse;
  

  // Track studio view in analytics — fires once when course data is available
  useEffect(() => {
    if (slug && course) {
      analytics.viewStudio(slug, course.title, effectivePriceInr);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug, course?.slug]);

  if (dbCourseLoading && !staticCourse) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

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
  // Apply exit discount on top of the base price (for Buy Now flow)
  const buyNowPrice = exitDiscountActive && effectivePriceInr > 0
    ? Math.round(effectivePriceInr * (1 - exitDiscountPercent / 100))
    : effectivePriceInr;

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

    // Anti-double-purchase: Check if user already has access
    if (accessInfo.hasAccess && !accessInfo.canPurchase) {
      toast({
        title: "Already Enrolled",
        description: "You already have full access to this course!",
      });
      navigate(`/learn/${course.slug}`);
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
        amount: buyNowPrice,
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
      amount: buyNowPrice,
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

  const courseUrl = `https://archistudio.shop/course/${course.slug}`;
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
       <section className="pt-20 pb-2 relative">
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
                {/* Access Badge - shows enrollment/gift/partial status */}
                {accessInfo.accessType !== 'none' && (
                  <AccessBadge 
                    accessType={accessInfo.accessType}
                    unlockedPercent={accessInfo.unlockedPercent}
                    expiryDate={accessInfo.giftExpiry || accessInfo.launchFreeExpiry}
                  />
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

              {/* Linked eBooks - inside left column */}
              <LinkedEbooksHighlight courseId={dbCourseId} courseTitle={course.title} />

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
            </div>

            {/* Purchase Card */}
            <div className="lg:col-span-1">
              <Card className="sticky top-24 overflow-hidden border-accent/20 shadow-lg">
                <div className="aspect-[3/2] relative group bg-muted">
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
                  
                  {/* CTA Button - changes based on access status */}
                  {accessInfo.hasAccess && !accessInfo.canPurchase ? (
                    // User has full access - show Continue Learning
                    <Button 
                      onClick={() => navigate(`/learn/${course.slug}`)}
                      className="w-full h-12 text-lg"
                      size="lg"
                    >
                      <Play className="h-5 w-5 mr-2" />
                      Continue Learning
                    </Button>
                  ) : accessInfo.hasAccess && accessInfo.canPurchase ? (
                    // User has partial/gift access - show both options
                    <div className="space-y-2">
                      <Button 
                        onClick={() => navigate(`/learn/${course.slug}`)}
                        className="w-full h-12 text-lg"
                        size="lg"
                        variant="secondary"
                      >
                        <Play className="h-5 w-5 mr-2" />
                        Continue Learning
                      </Button>
                      {effectivePriceInr > 0 && (
                        <Button 
                          onClick={handleBuyNow} 
                          disabled={isLoading}
                          className="w-full"
                          variant="outline"
                        >
                          {isLoading ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Processing...
                            </>
                          ) : (
                            <>
                              <CreditCard className="h-4 w-4 mr-2" />
                              Unlock Full Access
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  ) : (
                    // No access - show Buy/Enroll button
                    <>
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
                    </>
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

              {/* EMI Payment Options - Show when user doesn't have full access and price > 0 */}
              {effectivePriceInr > 0 && (!accessInfo.hasAccess || accessInfo.canPurchase) && dbCourseId && (
                <EMIPaymentOptions
                  courseId={dbCourseId}
                  courseSlug={course.slug}
                  courseTitle={course.title}
                  coursePrice={saleActive && discountPercent > 0 
                    ? calculateDiscountedPrice(effectivePriceInr) 
                    : effectivePriceInr}
                  modules={dbModules.map(m => ({ 
                    id: m.id, 
                    title: m.title, 
                    order_index: m.order_index 
                  }))}
                  onPhoneRequired={() => {
                    setPendingPaymentData({
                      courseId: course.slug,
                      amount: effectivePriceInr,
                      customerName: profile?.full_name || user?.email?.split('@')[0] || 'Customer',
                      customerEmail: user?.email || '',
                      courseTitle: course.title,
                    });
                    setShowPhoneDialog(true);
                  }}
                  customerPhone={profile?.phone || undefined}
                />
              )}
            </div>
          </div>
        </div>
      </section>


      {/* Course Description */}
      <section className="py-8">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">

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
                <CardContent className="space-y-2">
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
                          defaultOpen={i === 0} // First module open by default
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
