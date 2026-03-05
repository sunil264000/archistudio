import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { courseCategories, categoryImages } from '@/data/courses';
import { useSaleDiscount } from '@/hooks/useSaleDiscount';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Clock, BookOpen, Search, Star, Filter, ShoppingCart, CreditCard, Loader2, Sparkles, GraduationCap, Flame, Play } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useCashfreePayment } from '@/hooks/useCashfreePayment';
import { useToast } from '@/hooks/use-toast';
import { SEOHead } from '@/components/seo/SEOHead';
import { ContactSupportWidget } from '@/components/support/ContactSupportWidget';
import { supabase } from '@/integrations/supabase/client';
import { PhoneNumberDialog } from '@/components/payment/PhoneNumberDialog';
import { AccessBadge } from '@/components/course/AccessBadge';
import { useAccessControlBySlug } from '@/hooks/useAccessControlBySlug';
import { CourseThumbnail } from '@/components/course/CourseThumbnail';
import { BundleDiscountBanner } from '@/components/sales/BundleDiscountBanner';
import { useCart } from '@/contexts/CartContext';

// Unified course shape used throughout this page
export interface MergedCourse {
  id: string;
  title: string;
  slug: string;
  shortDescription: string;
  description: string;
  category: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  durationHours: number;
  totalLessons: number;
  priceInr: number;
  thumbnail: string;
  isFeatured: boolean;
  isHighlighted: boolean;
  tags: string[];
}

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

export default function Courses() {
  const [searchParams] = useSearchParams();
  const initialCategory = searchParams.get('category');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(initialCategory);
  const [searchQuery, setSearchQuery] = useState('');
  const [allCourses, setAllCourses] = useState<MergedCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const { isActive: saleActive, discountPercent, calculateDiscountedPrice } = useSaleDiscount();

  // Fetch ALL published courses from DB and merge with static enrichment data
  useEffect(() => {
    const fetchAllCourses = async () => {
      setLoading(true);
      const { data: dbCourses, error } = await supabase
        .from('courses')
        .select('id, title, slug, description, short_description, level, duration_hours, total_lessons, price_inr, thumbnail_url, is_featured, is_highlighted, order_index, category_id, tags')
        .eq('is_published', true)
        .order('order_index', { ascending: true });

      if (error) {
        console.error('Error fetching courses:', error);
        setLoading(false);
        return;
      }

      const merged: MergedCourse[] = (dbCourses || []).map((db: any) => {
        const category = db.category_id || guessCategory(db.title);
        return {
          id: db.id,
          title: db.title,
          slug: db.slug,
          shortDescription: db.short_description || db.description || '',
          description: db.description || '',
          category,
          level: (db.level as MergedCourse['level']) || 'beginner',
          durationHours: db.duration_hours || 0,
          totalLessons: db.total_lessons || 0,
          priceInr: db.price_inr || 0,
          thumbnail: db.thumbnail_url || (categoryImages[category] || ''),
          isFeatured: db.is_featured || false,
          isHighlighted: db.is_highlighted || false,
          tags: db.tags || [],
        };
      });

      setAllCourses(merged);
      setLoading(false);
    };

    fetchAllCourses();
  }, []);

  const filteredCourses = allCourses.filter(course => {
    const matchesCategory = !selectedCategory || course.category === selectedCategory;
    const matchesSearch = !searchQuery ||
      course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.shortDescription.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  // Sort: highlighted first, then featured, then rest
  const sortedCourses = [...filteredCourses].sort((a, b) => {
    if (a.isHighlighted && !b.isHighlighted) return -1;
    if (!a.isHighlighted && b.isHighlighted) return 1;
    return 0;
  });

  const featuredCourses = allCourses.filter(c => c.isFeatured);

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="All Courses - Archistudio"
        description="Browse our complete catalog of architecture and 3D visualization courses. Learn 3ds Max, AutoCAD, Revit, SketchUp and more."
        url="https://archistudio.shop/courses"
      />

      <Navbar />

      {/* Bundle Discount Banner */}
      <div className="container mx-auto px-4 pt-20 sm:pt-24">
        <BundleDiscountBanner />
      </div>

      {/* Hero Section */}
      <section className="pt-6 sm:pt-8 pb-8 sm:pb-12 relative overflow-hidden">
        <div className="container mx-auto px-4 text-center relative">
          <div className="mb-4 sm:mb-6">
            <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-secondary/60 text-foreground text-sm font-medium border border-accent/20">
              <GraduationCap className="h-3 w-3 sm:h-4 sm:w-4 text-accent" />
              {loading ? '...' : `${allCourses.length}+`} Courses
            </div>
          </div>

          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold mb-3 sm:mb-4">
            Master Architecture & Design
          </h1>

          <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-6 sm:mb-8 px-2">
            Professional studio programs covering 3ds Max, Revit, SketchUp, AutoCAD, and more
          </p>

          {/* Search Bar */}
          <div className="max-w-xl mx-auto relative">
            <Search className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
            <Input
              placeholder="Search courses..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 sm:pl-12 h-12 sm:h-14 text-base sm:text-lg border-2 border-border/50 focus:border-accent transition-colors duration-200 bg-background/80 shadow-lg"
            />
          </div>

          <p className="text-xs sm:text-sm text-muted-foreground mt-4 sm:mt-6 px-2">
            Confused about which studio to pick?{' '}
            <span className="text-accent font-medium ml-1">Click the chat button below for help!</span>
          </p>
        </div>
      </section>

      {/* Categories */}
      <section className="py-4 sm:py-6 md:py-8 border-b border-border/50 bg-background sticky top-14 sm:top-16 z-40">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-2 mb-3 sm:mb-4">
            <Filter className="h-4 w-4 sm:h-5 sm:w-5 text-accent shrink-0" />
            <span className="font-medium text-sm sm:text-base">Filter by Category:</span>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 hide-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0 sm:flex-wrap">
            <Button
              variant={selectedCategory === null ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory(null)}
              className="transition-all duration-300 hover:scale-105 shrink-0 min-h-[40px] text-sm"
            >
              All Courses
            </Button>
            {courseCategories.map((cat, index) => (
              <Button
                key={cat.id}
                variant={selectedCategory === cat.id ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(cat.id)}
                className="transition-all duration-300 hover:scale-105 shrink-0 min-h-[40px] text-sm whitespace-nowrap"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                {cat.icon} {cat.name}
              </Button>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Courses */}
      {!selectedCategory && !searchQuery && (
        <section className="py-8 sm:py-10 md:py-12">
          <div className="container mx-auto px-4">
            <div className="flex items-center gap-2 mb-3 sm:mb-4">
              <Star className="h-5 w-5 sm:h-6 sm:w-6 text-warning fill-warning" />
              <h2 className="text-xl sm:text-2xl font-bold">Featured Courses</h2>
            </div>
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3].map(i => <CourseCardSkeleton key={i} />)}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {featuredCourses.slice(0, 6).map((course, index) => (
                  <CourseCard
                    key={course.id}
                    course={course}
                    featured
                    index={index}
                    saleActive={saleActive}
                    discountPercent={discountPercent}
                    calculateDiscountedPrice={calculateDiscountedPrice}
                  />
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* All Courses */}
      <section className="py-8 sm:py-10 md:py-12 bg-muted/30">
        <div className="container mx-auto px-4">
          <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 line-accent">
            {selectedCategory
              ? courseCategories.find(c => c.id === selectedCategory)?.name
              : searchQuery
                ? `Search Results (${filteredCourses.length})`
                : 'All Courses'}
          </h2>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {Array.from({ length: 12 }).map((_, i) => <CourseCardSkeleton key={i} />)}
            </div>
          ) : sortedCourses.length === 0 ? (
            <div className="text-center py-8 sm:py-12">
              <p className="text-muted-foreground text-base sm:text-lg">No courses found matching your criteria.</p>
              <Button variant="outline" className="mt-4 min-h-[44px]" onClick={() => { setSelectedCategory(null); setSearchQuery(''); }}>
                Clear Filters
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {sortedCourses.map((course, index) => (
                <CourseCard
                  key={course.id}
                  course={course}
                  index={index}
                  saleActive={saleActive}
                  discountPercent={discountPercent}
                  calculateDiscountedPrice={calculateDiscountedPrice}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      <Footer />
      <ContactSupportWidget />
    </div>
  );
}

// ─── Skeleton ────────────────────────────────────────────────────────────────
function CourseCardSkeleton() {
  return (
    <Card className="overflow-hidden border-border/50 bg-card/80">
      <Skeleton className="aspect-video w-full" />
      <CardHeader className="pb-2 space-y-2">
        <div className="flex gap-2">
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-5 w-20 rounded-full" />
        </div>
        <Skeleton className="h-5 w-full rounded" />
        <Skeleton className="h-5 w-4/5 rounded" />
        <Skeleton className="h-4 w-full rounded" />
        <Skeleton className="h-4 w-3/4 rounded" />
      </CardHeader>
      <CardContent>
        <div className="flex gap-4 mb-4">
          <Skeleton className="h-4 w-16 rounded" />
          <Skeleton className="h-4 w-20 rounded" />
        </div>
        <div className="flex items-center justify-between">
          <Skeleton className="h-7 w-24 rounded" />
          <Skeleton className="h-9 w-16 rounded" />
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Course Card ──────────────────────────────────────────────────────────────
interface CourseCardProps {
  course: MergedCourse;
  featured?: boolean;
  index?: number;
  saleActive?: boolean;
  discountPercent?: number;
  calculateDiscountedPrice?: (price: number) => number;
}

function CourseCard({
  course,
  featured = false,
  index = 0,
  saleActive = false,
  discountPercent = 0,
  calculateDiscountedPrice = (p) => p,
}: CourseCardProps) {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { initiatePayment, isLoading } = useCashfreePayment();
  const { toast } = useToast();
  const [showPhoneDialog, setShowPhoneDialog] = useState(false);
  const [pendingPaymentData, setPendingPaymentData] = useState<any>(null);

  const accessInfo = useAccessControlBySlug(user?.id, course.slug);

  const effectivePriceInr = course.priceInr;
  const discountedPrice = calculateDiscountedPrice(effectivePriceInr);

  const levelColors: Record<string, string> = {
    beginner: 'bg-success/10 text-success border-success/30',
    intermediate: 'bg-warning/10 text-warning border-warning/30',
    advanced: 'bg-destructive/10 text-destructive border-destructive/30',
  };

  const handleBuyNow = async () => {
    if (!user) {
      toast({ title: 'Login Required', description: 'Please login to purchase this course', variant: 'destructive' });
      navigate(`/auth?redirect=/course/${course.slug}`);
      return;
    }

    if (accessInfo.hasAccess && !accessInfo.canPurchase) {
      toast({ title: 'Already Enrolled', description: 'You already have access to this course!' });
      navigate(`/learn/${course.slug}`);
      return;
    }

    const customerPhone = profile?.phone?.replace(/[\s-]/g, '');
    const hasValidPhone = customerPhone && /^[6-9]\d{9}$/.test(customerPhone.replace(/\s/g, ''));

    if (!hasValidPhone) {
      setPendingPaymentData({
        courseId: course.slug,
        amount: discountedPrice,
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
      amount: discountedPrice,
      customerName: profile?.full_name || user.email?.split('@')[0] || 'Customer',
      customerEmail: user.email || '',
      customerPhone,
      courseTitle: course.title,
      courseShortDescription: course.shortDescription,
      courseDescription: course.description,
      courseLevel: course.level,
    });
  };

  const [loadingTimedOut, setLoadingTimedOut] = useState(false);
  useEffect(() => {
    if (accessInfo.loading) {
      const timer = setTimeout(() => setLoadingTimedOut(true), 2000);
      return () => clearTimeout(timer);
    }
    setLoadingTimedOut(false);
  }, [accessInfo.loading]);

  const getCTAContent = () => {
    if (accessInfo.loading && !loadingTimedOut) return { text: 'Loading...', icon: Loader2, action: () => { }, disabled: true };
    if (accessInfo.accessType === 'full') return { text: 'Continue Learning', icon: Play, action: () => navigate(`/learn/${course.slug}`), disabled: false };
    if (accessInfo.accessType === 'gift' || accessInfo.accessType === 'launch_free') return { text: 'Access Now', icon: Play, action: () => navigate(`/learn/${course.slug}`), disabled: false };
    if (accessInfo.accessType === 'partial') return { text: 'Unlock More', icon: ShoppingCart, action: () => navigate(`/courses/${course.slug}`), disabled: false };
    return { text: `Buy Now - ₹${discountedPrice.toLocaleString()}`, icon: CreditCard, action: handleBuyNow, disabled: isLoading };
  };

  const ctaContent = getCTAContent();

  const handlePhoneSubmit = async (phone: string) => {
    if (!pendingPaymentData) return;
    if (user) await supabase.from('profiles').update({ phone }).eq('user_id', user.id);
    setShowPhoneDialog(false);
    await initiatePayment({ ...pendingPaymentData, customerPhone: phone });
    setPendingPaymentData(null);
  };

  const thumbnailFallback = categoryImages[course.category] || '/placeholder.svg';

  return (
    <Card
      className={`group overflow-hidden transition-shadow duration-300 hover:shadow-xl border-border/50 bg-card/80 hover:-translate-y-1 ${featured ? 'border-accent/50 shadow-accent/10' : ''
        } ${course.isHighlighted ? 'ring-2 ring-warning/50 shadow-warning/20' : ''}`}
    >
      <div className="aspect-video relative overflow-hidden bg-secondary">
        <CourseThumbnail
          src={course.thumbnail || thumbnailFallback}
          alt={course.title}
          slug={course.slug}
          category={course.category}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {course.isHighlighted && (
          <div className="absolute top-2 left-2">
            <Badge className="bg-warning text-warning-foreground border-0 shadow-lg">
              <Sparkles className="h-3 w-3 mr-1" /> Recommended
            </Badge>
          </div>
        )}

        {featured && !course.isHighlighted && (
          <div className="absolute top-2 right-2">
            <Badge className="bg-warning text-warning-foreground border-0 animate-pulse">
              <Star className="h-3 w-3 mr-1 fill-current" /> Featured
            </Badge>
          </div>
        )}

        <div className="absolute inset-0 flex items-center justify-center bg-background/70 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none group-hover:pointer-events-auto">
          <div className="flex flex-col gap-2">
            <Button
              onClick={ctaContent.action}
              disabled={ctaContent.disabled}
              className={`shadow-lg ${accessInfo.hasAccess ? 'bg-success hover:bg-success/90 text-success-foreground' : 'bg-accent hover:bg-accent/90 text-accent-foreground'}`}
            >
              {ctaContent.disabled && isLoading ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Processing...</>
              ) : (
                <><ctaContent.icon className="h-4 w-4 mr-2" />{ctaContent.text}</>
              )}
            </Button>
            <Button variant="outline" className="bg-background/80" onClick={() => navigate(`/courses/${course.slug}`)}>
              View Details
            </Button>
          </div>
        </div>
      </div>

      <CardHeader className="pb-2">
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <Badge variant="outline" className={`${levelColors[course.level]} transition-colors duration-300`}>
            {course.level}
          </Badge>
          <Badge variant="secondary" className="text-xs">
            {courseCategories.find(c => c.id === course.category)?.name || course.category}
          </Badge>
          {accessInfo.accessType !== 'none' && (
            <AccessBadge
              accessType={accessInfo.accessType}
              unlockedPercent={accessInfo.unlockedPercent}
              expiryDate={accessInfo.giftExpiry || accessInfo.launchFreeExpiry}
            />
          )}
        </div>
        <CardTitle className="text-lg line-clamp-2 group-hover:text-accent transition-colors duration-300">
          {course.title}
        </CardTitle>
        <CardDescription className="line-clamp-2">
          {course.shortDescription}
        </CardDescription>
      </CardHeader>

      <CardContent>
        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
          <span className="flex items-center gap-1">
            <Clock className="h-4 w-4" /> {course.durationHours > 0 ? `${course.durationHours}h` : 'Self-paced'}
          </span>
          <span className="flex items-center gap-1">
            <BookOpen className="h-4 w-4" /> {course.totalLessons || '–'} sessions
          </span>
        </div>
        <div className="flex items-center justify-between">
          <div>
            {saleActive && discountPercent > 0 ? (
              <>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-xl text-success">₹{discountedPrice.toLocaleString()}</span>
                  <span className="text-sm line-through text-muted-foreground">₹{effectivePriceInr.toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-1 text-xs">
                  <Flame className="h-3 w-3 text-destructive" />
                  <span className="text-destructive font-medium">{discountPercent}% OFF</span>
                </div>
              </>
            ) : (
              <div className="font-bold text-xl text-foreground">
                {effectivePriceInr > 0 ? `₹${effectivePriceInr.toLocaleString()}` : 'Free'}
              </div>
            )}
          </div>
          <Button
            size="sm"
            onClick={ctaContent.action}
            disabled={ctaContent.disabled}
            className={`transition-all duration-300 hover:scale-105 ${accessInfo.hasAccess ? 'bg-success hover:bg-success/90' : ''}`}
          >
            {ctaContent.disabled && isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <><ctaContent.icon className="h-4 w-4 mr-1" />{accessInfo.hasAccess ? 'Continue' : 'Buy'}</>
            )}
          </Button>
        </div>
      </CardContent>

      <PhoneNumberDialog
        open={showPhoneDialog}
        onOpenChange={setShowPhoneDialog}
        onSubmit={handlePhoneSubmit}
        isLoading={isLoading}
      />
    </Card>
  );
}
