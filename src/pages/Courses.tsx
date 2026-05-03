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
import { LiveActivityTicker } from '@/components/ui/LiveActivityTicker';
import { Clock, BookOpen, Search, Star, Filter, ShoppingCart, CreditCard, Loader2, Sparkles, GraduationCap, Flame, Play } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
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
import { HighlightedCourseSection } from '@/components/home/HighlightedCourseSection';

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

import { useLiveStats } from '@/hooks/useLiveStats';

export default function Courses() {
  const stats = useLiveStats();
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
        title="Architecture & Design Courses | Archistudio Academy"
        description="Elevate your architecture practice with professional-grade courses. Master 3ds Max, Revit, SketchUp, and site execution from industry experts."
        url="https://archistudio.shop/courses"
      />

      <Navbar />
      <LiveActivityTicker />

      {/* Bundle Discount Banner */}
      <div className="container mx-auto px-4 pt-20 sm:pt-24">
        <BundleDiscountBanner />
      </div>

      {/* Highlighted Flagship Course */}
      <HighlightedCourseSection />

      {/* Hero — calm editorial style */}
      <section className="pt-8 sm:pt-12 pb-10 sm:pb-14 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-accent/[0.02] via-transparent to-transparent" />
        <div className="absolute inset-0 dot-grid opacity-10 pointer-events-none" />
        <div className="container mx-auto px-4 text-center relative">
          <Badge variant="outline" className="mb-5 gap-1.5 text-xs font-medium border-border/50">
            <GraduationCap className="h-3 w-3 text-accent" />
            {loading ? '...' : `${allCourses.length}`} Programs Available
          </Badge>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 tracking-tight">
            Architecture & Design
            <br />
            <span className="text-hero-gradient font-medium text-[0.85em]">Course Catalog</span>
          </h1>

          <p className="text-muted-foreground text-base md:text-lg max-w-xl mx-auto mb-8 leading-relaxed">
            Professional programs covering 3ds Max, Revit, SketchUp, AutoCAD, and more — taught the way offices actually work.
          </p>

          {/* Search Bar */}
          <div className="max-w-lg mx-auto relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, tool, or topic..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-11 h-12 text-sm border-border/40 bg-card/50 focus:bg-card transition-colors duration-300 shadow-[var(--shadow-soft)] focus:shadow-[0_0_0_2px_hsl(var(--accent)/0.2)] rounded-xl"
            />
          </div>
        </div>
      </section>

      {/* Categories — horizontal pill bar */}
      <section className="border-y border-border/30 bg-background/80 backdrop-blur-sm sticky top-14 sm:top-16 z-40">
        <div className="container mx-auto px-4 py-3">
          <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0 sm:flex-wrap">
            <Button
              variant={selectedCategory === null ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setSelectedCategory(null)}
              className="shrink-0 text-xs font-medium h-8 px-3"
            >
              All
            </Button>
            {courseCategories.map((cat) => (
              <Button
                key={cat.id}
                variant={selectedCategory === cat.id ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setSelectedCategory(cat.id)}
                className="shrink-0 text-xs font-medium h-8 px-3 whitespace-nowrap gap-1.5"
              >
                <span className="text-xs">{cat.icon}</span> {cat.name}
              </Button>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Courses — only on default view */}
      {!selectedCategory && !searchQuery && featuredCourses.length > 0 && (
        <section className="py-10 sm:py-14">
          <div className="container mx-auto px-4">
            <div className="flex items-center gap-2.5 mb-6">
              <div className="h-5 w-0.5 bg-accent rounded-full" />
              <h2 className="text-lg sm:text-xl font-semibold tracking-tight">Featured Programs</h2>
            </div>
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {[1, 2, 3].map(i => <CourseCardSkeleton key={i} />)}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
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
      <section className={`py-10 sm:py-14 ${!selectedCategory && !searchQuery ? 'bg-muted/20 border-t border-border/20' : ''}`}>
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-2.5 mb-6">
            <div className="h-5 w-0.5 bg-foreground/20 rounded-full" />
            <h2 className="text-lg sm:text-xl font-semibold tracking-tight">
              {selectedCategory
                ? courseCategories.find(c => c.id === selectedCategory)?.name
                : searchQuery
                  ? `Results (${filteredCourses.length})`
                  : 'All Programs'}
            </h2>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {Array.from({ length: 12 }).map((_, i) => <CourseCardSkeleton key={i} />)}
            </div>
          ) : sortedCourses.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-muted-foreground">No courses found matching your criteria.</p>
              <Button variant="outline" className="mt-4" onClick={() => { setSelectedCategory(null); setSearchQuery(''); }}>
                Clear Filters
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
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
    <Card className="overflow-hidden border-border/30 bg-card/50">
      <Skeleton className="aspect-[16/10] w-full" />
      <div className="p-4 space-y-3">
        <div className="flex gap-2">
          <Skeleton className="h-5 w-14 rounded-full" />
          <Skeleton className="h-5 w-18 rounded-full" />
        </div>
        <Skeleton className="h-4 w-full rounded" />
        <Skeleton className="h-4 w-4/5 rounded" />
        <Skeleton className="h-3 w-full rounded" />
        <div className="flex items-center justify-between pt-2">
          <Skeleton className="h-6 w-20 rounded" />
          <Skeleton className="h-8 w-20 rounded-lg" />
        </div>
      </div>
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
  const { addToCart, removeFromCart, isInCart } = useCart();
  const { initiatePayment, isLoading } = useCashfreePayment();
  const { toast } = useToast();
  const [showPhoneDialog, setShowPhoneDialog] = useState(false);
  const [pendingPaymentData, setPendingPaymentData] = useState<any>(null);

  const inCart = isInCart(course.id);

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
      toast({ title: 'Login Required', description: 'Please login to enroll in this course', variant: 'destructive' });
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
    return { text: `Enroll Now - ₹${discountedPrice.toLocaleString()}`, icon: CreditCard, action: handleBuyNow, disabled: isLoading };
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (inCart) {
      removeFromCart(course.id);
      toast({ title: 'Removed from cart', description: `"${course.title}" removed from your bundle.` });
    } else {
      addToCart({
        courseId: course.id,
        slug: course.slug,
        title: course.title,
        price: discountedPrice,
        thumbnail: course.thumbnail
      });
      toast({ 
        title: 'Added to cart!', 
        description: `"${course.title}" added. Enroll in more to save up to 20%!`,
        action: <Button variant="outline" size="sm" onClick={() => (document.querySelector('[aria-label="Open cart"]') as any)?.click()}>View Cart</Button>
      });
    }
  };

  const ctaContent = getCTAContent();
  
  // Robust duration logic
  const displayHours = course.durationHours > (course.totalLessons / 10) 
    ? `${course.durationHours}h` 
    : (course.totalLessons > 0 ? `${Math.ceil(course.totalLessons * 0.4)}h` : 'Self-paced');

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
      className={`group overflow-hidden transition-all duration-500 border-border/30 bg-card/50 hover:bg-card/80 hover:shadow-[var(--shadow-elevated)] hover:-translate-y-1 ${
        featured ? 'border-accent/20' : ''
      } ${course.isHighlighted ? 'ring-1 ring-accent/30' : ''}`}
    >
      {/* Thumbnail */}
      <div className="aspect-[16/10] relative overflow-hidden bg-muted/30">
        <CourseThumbnail
          src={course.thumbnail || thumbnailFallback}
          alt={course.title}
          slug={course.slug}
          category={course.category}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
        />
        
        {/* Subtle gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-card/60 via-transparent to-transparent" />

        {/* Badges */}
        <div className="absolute top-3 left-3 flex gap-1.5">
          {course.isHighlighted && (
            <Badge className="bg-accent/90 text-accent-foreground border-0 text-[10px] px-2 py-0.5 backdrop-blur-sm">
              <Sparkles className="h-2.5 w-2.5 mr-1" /> Recommended
            </Badge>
          )}
          {featured && !course.isHighlighted && (
            <Badge className="bg-foreground/80 text-background border-0 text-[10px] px-2 py-0.5 backdrop-blur-sm">
              <Star className="h-2.5 w-2.5 mr-1 fill-current" /> Featured
            </Badge>
          )}
        </div>

        {accessInfo.accessType !== 'none' && (
          <div className="absolute top-3 right-3">
            <AccessBadge
              accessType={accessInfo.accessType}
              unlockedPercent={accessInfo.unlockedPercent}
              expiryDate={accessInfo.giftExpiry || accessInfo.launchFreeExpiry}
            />
          </div>
        )}

        {/* Hover overlay with CTA */}
        <div className="absolute inset-0 flex items-center justify-center bg-background/60 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-all duration-400 pointer-events-none group-hover:pointer-events-auto">
          <div className="flex flex-col gap-2 p-4 w-full max-w-[160px]">
            <Button
              onClick={ctaContent.action}
              disabled={ctaContent.disabled}
              size="sm"
              className={`shadow-lg w-full ${accessInfo.hasAccess ? 'bg-success hover:bg-success/90 text-success-foreground' : 'bg-accent hover:bg-accent/90 text-accent-foreground'}`}
            >
              {ctaContent.disabled && isLoading ? (
                <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />Processing</>
              ) : (
                <><ctaContent.icon className="h-3.5 w-3.5 mr-1.5" />{ctaContent.text.split(' - ')[0]}</>
              )}
            </Button>
            
            {!accessInfo.hasAccess && (
              <Button 
                variant={inCart ? "destructive" : "secondary"} 
                size="sm" 
                className="w-full shadow-lg"
                onClick={handleAddToCart}
              >
                {inCart ? <><X className="h-3.5 w-3.5 mr-1.5" />Remove</> : <><ShoppingCart className="h-3.5 w-3.5 mr-1.5" />Add to Cart</>}
              </Button>
            )}

            <Button variant="outline" size="sm" className="bg-background/80 text-xs w-full" onClick={() => navigate(`/course/${course.slug}`)}>
              View Details
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Tags */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <Badge variant="outline" className={`text-[10px] px-1.5 py-0 font-medium ${levelColors[course.level]}`}>
            {course.level}
          </Badge>
          <span className="text-[10px] text-muted-foreground/60">•</span>
          <span className="text-[10px] text-muted-foreground font-medium">
            {courseCategories.find(c => c.id === course.category)?.name || course.category}
          </span>
        </div>

        {/* Title */}
        <h3 className="text-sm font-semibold leading-snug line-clamp-2 text-foreground group-hover:text-accent transition-colors duration-300">
          <Link to={`/course/${course.slug}`}>{course.title}</Link>
        </h3>

        {/* Description */}
        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
          {course.shortDescription}
        </p>

        {/* Meta */}
        <div className="flex items-center gap-3 text-[11px] text-muted-foreground/70">
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" /> {displayHours}
          </span>
          <span className="flex items-center gap-1">
            <BookOpen className="h-3 w-3" /> {course.totalLessons || '–'} lessons
          </span>
        </div>

        {/* Price + CTA */}
        <div className="flex items-center justify-between pt-2 border-t border-border/20">
          <div>
            {saleActive && discountPercent > 0 ? (
              <div className="flex items-baseline gap-1.5">
                <span className="font-bold text-base text-foreground">₹{discountedPrice.toLocaleString()}</span>
                <span className="text-[11px] line-through text-muted-foreground/50">₹{effectivePriceInr.toLocaleString()}</span>
                <Badge variant="destructive" className="text-[9px] px-1 py-0 h-4 font-semibold">
                  {discountPercent}% OFF
                </Badge>
              </div>
            ) : (
              <span className="font-bold text-base text-foreground">
                {effectivePriceInr > 0 ? `₹${effectivePriceInr.toLocaleString()}` : 'Free'}
              </span>
            )}
          </div>
          <Button
            size="sm"
            variant={accessInfo.hasAccess ? 'default' : 'outline'}
            onClick={ctaContent.action}
            disabled={ctaContent.disabled}
            className={`text-xs h-8 px-3 ${accessInfo.hasAccess ? 'bg-success hover:bg-success/90 border-0' : 'hover:bg-accent hover:text-accent-foreground hover:border-accent'}`}
          >
            {ctaContent.disabled && isLoading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <>{accessInfo.hasAccess ? 'Continue' : 'Enroll'}</>
            )}
          </Button>
        </div>
      </div>

      <PhoneNumberDialog
        open={showPhoneDialog}
        onOpenChange={setShowPhoneDialog}
        onSubmit={handlePhoneSubmit}
        isLoading={isLoading}
      />
    </Card>
  );
}
