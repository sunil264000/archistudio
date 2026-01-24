import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { courses, courseCategories, getFeaturedCourses, categoryImages } from '@/data/courses';
import { useDynamicCourseData } from '@/hooks/useDynamicCourseData';
import { useSaleDiscount } from '@/hooks/useSaleDiscount';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Clock, BookOpen, Search, Star, Filter, ShoppingCart, CreditCard, Loader2, Sparkles, GraduationCap, Flame } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useCashfreePayment } from '@/hooks/useCashfreePayment';
import { useToast } from '@/hooks/use-toast';
import { AnimatedBackground } from '@/components/layout/AnimatedBackground';
import { SEOHead } from '@/components/seo/SEOHead';
import { ContactSupportWidget } from '@/components/support/ContactSupportWidget';
import { supabase } from '@/integrations/supabase/client';
import { PhoneNumberDialog } from '@/components/payment/PhoneNumberDialog';
import { 
  staggerContainer, 
  staggerContainerFast, 
  fadeInUp,
  FloatingBadge,
  AnimatedUnderline
} from '@/components/animations/AnimatedSection';

export default function Courses() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [dbCourseCount, setDbCourseCount] = useState<number | null>(null);
  const [dbCourseStats, setDbCourseStats] = useState<Record<string, { totalLessons: number; totalDuration: number }>>({});
  const { getThumbnail, getPriceInr, isHighlighted, isFeatured } = useDynamicCourseData();
  const { isActive: saleActive, discountPercent, calculateDiscountedPrice } = useSaleDiscount();

  // Fetch actual course count and stats from database
  useEffect(() => {
    const fetchCourseData = async () => {
      // Get course count
      const { count } = await supabase
        .from('courses')
        .select('*', { count: 'exact', head: true })
        .eq('is_published', true);
      setDbCourseCount(count);

      // Get course stats (lessons and duration) for all courses
      const { data: coursesData } = await supabase
        .from('courses')
        .select('slug')
        .eq('is_published', true);

      if (coursesData) {
        const stats: Record<string, { totalLessons: number; totalDuration: number }> = {};
        
        for (const course of coursesData) {
          // Get modules for this course
          const { data: courseWithId } = await supabase
            .from('courses')
            .select('id')
            .eq('slug', course.slug)
            .single();
            
          if (courseWithId) {
            const { data: modules } = await supabase
              .from('modules')
              .select('id')
              .eq('course_id', courseWithId.id);
              
            if (modules && modules.length > 0) {
              const moduleIds = modules.map(m => m.id);
              const { data: lessons } = await supabase
                .from('lessons')
                .select('duration_minutes')
                .in('module_id', moduleIds);
                
              if (lessons) {
                stats[course.slug] = {
                  totalLessons: lessons.length,
                  totalDuration: lessons.reduce((sum, l) => sum + (l.duration_minutes || 0), 0)
                };
              }
            }
          }
        }
        setDbCourseStats(stats);
      }
    };
    fetchCourseData();
  }, []);

  const totalCourseCount = dbCourseCount ?? courses.length;

  const filteredCourses = courses.filter(course => {
    const matchesCategory = !selectedCategory || course.category === selectedCategory;
    const matchesSearch = !searchQuery || 
      course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.shortDescription.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch && course.isPublished;
  });

  // Sort highlighted courses first
  const sortedCourses = [...filteredCourses].sort((a, b) => {
    const aHighlighted = isHighlighted(a.slug);
    const bHighlighted = isHighlighted(b.slug);
    if (aHighlighted && !bHighlighted) return -1;
    if (!aHighlighted && bHighlighted) return 1;
    return 0;
  });

  const featuredCourses = getFeaturedCourses();

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      <SEOHead 
        title="All Studios - Archistudio"
        description="Browse our complete catalog of architecture and 3D visualization studio programs. Learn 3ds Max, AutoCAD, Revit, SketchUp and more."
        url="https://archistudio.lovable.app/courses"
      />
      
      <Navbar />
      
      {/* Animated Background */}
      <AnimatedBackground intensity="light" />
      
      {/* Hero Section with Advanced Animation */}
      <section className="pt-24 pb-12 relative overflow-hidden">
        {/* Background gradient orbs */}
        <motion.div 
          className="absolute top-0 left-1/4 w-96 h-96 bg-accent/10 rounded-full blur-[120px]"
          animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.2, 0.1] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        
        <div className="container mx-auto px-4 text-center relative">
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
          >
            {/* Floating Badge */}
            <motion.div variants={fadeInUp} className="mb-6">
              <FloatingBadge 
                icon={<GraduationCap className="h-4 w-4 text-accent" />}
                className="shadow-[0_0_40px_-10px_hsl(var(--accent)/0.4)]"
              >
                {totalCourseCount}+ Studio Programs
              </FloatingBadge>
            </motion.div>
            
            <motion.h1 
              variants={fadeInUp}
              className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4"
            >
              <motion.span
                className="bg-gradient-to-r from-foreground via-accent to-foreground bg-[length:200%_auto] bg-clip-text text-transparent"
                animate={{ backgroundPosition: ['0% center', '200% center'] }}
                transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
              >
                Master Architecture & Design
              </motion.span>
            </motion.h1>
            
            <motion.p 
              variants={fadeInUp}
              className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8"
            >
              Professional studio programs covering 3ds Max, Revit, SketchUp, AutoCAD, and more
            </motion.p>
          </motion.div>
          
          {/* Animated Search Bar */}
          <motion.div 
            className="max-w-xl mx-auto relative"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Search studios..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 h-14 text-lg border-2 border-border/50 focus:border-accent transition-all duration-300 bg-background/80 backdrop-blur-sm shadow-lg"
            />
          </motion.div>
          
          {/* Confused? Help Banner */}
          <motion.p 
            className="text-sm text-muted-foreground mt-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            Confused about which studio to pick? 
            <motion.span 
              className="text-accent font-medium ml-1"
              animate={{ opacity: [1, 0.6, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              Click the chat button below for help!
            </motion.span>
          </motion.p>
        </div>
      </section>

      {/* Categories with Smooth Transitions */}
      <section className="py-8 border-b border-border/50 backdrop-blur-sm bg-background/50 sticky top-16 z-40">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="h-5 w-5 text-accent" />
            <span className="font-medium">Filter by Category:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant={selectedCategory === null ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(null)}
              className="transition-all duration-300 hover:scale-105"
            >
              All Studios
            </Button>
            {courseCategories.map((cat, index) => (
              <Button
                key={cat.id}
                variant={selectedCategory === cat.id ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(cat.id)}
                className="transition-all duration-300 hover:scale-105"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                {cat.icon} {cat.name}
              </Button>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Courses with Stagger Animation */}
      {!selectedCategory && !searchQuery && (
        <section className="py-12">
          <div className="container mx-auto px-4">
            <div className="flex items-center gap-2 mb-4">
              <Star className="h-6 w-6 text-warning fill-warning" />
              <h2 className="text-2xl font-bold">Featured Studios</h2>
            </div>
            <motion.div 
              className="grid md:grid-cols-2 lg:grid-cols-3 gap-4"
              variants={staggerContainerFast}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-50px" }}
            >
              {featuredCourses.slice(0, 6).map((course, index) => (
                <CourseCard 
                  key={course.id} 
                  course={course} 
                  featured 
                  index={index} 
                  getThumbnail={getThumbnail}
                  getPriceInr={getPriceInr}
                  isHighlighted={isHighlighted(course.slug)}
                  saleActive={saleActive}
                  discountPercent={discountPercent}
                  calculateDiscountedPrice={calculateDiscountedPrice}
                  realStats={dbCourseStats[course.slug]}
                />
              ))}
            </motion.div>
          </div>
        </section>
      )}

      {/* All Courses with Grid Animation */}
      <section className="py-12 bg-muted/30 backdrop-blur-sm">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold mb-6 line-accent">
            {selectedCategory 
              ? courseCategories.find(c => c.id === selectedCategory)?.name 
              : searchQuery 
                ? `Search Results (${filteredCourses.length})`
                : 'All Studios'}
          </h2>
          
          {sortedCourses.length === 0 ? (
            <div className="text-center py-12 animate-fade-in">
              <p className="text-muted-foreground text-lg">No studios found matching your criteria.</p>
              <Button variant="outline" className="mt-4" onClick={() => { setSelectedCategory(null); setSearchQuery(''); }}>
                Clear Filters
              </Button>
            </div>
          ) : (
            <motion.div 
              className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
              variants={staggerContainerFast}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-50px" }}
            >
              {sortedCourses.map((course, index) => (
                <CourseCard 
                  key={course.id}
                  course={course} 
                  index={index} 
                  getThumbnail={getThumbnail}
                  getPriceInr={getPriceInr}
                  isHighlighted={isHighlighted(course.slug)}
                  saleActive={saleActive}
                  discountPercent={discountPercent}
                  calculateDiscountedPrice={calculateDiscountedPrice}
                  realStats={dbCourseStats[course.slug]}
                />
              ))}
            </motion.div>
          )}
        </div>
      </section>

      <Footer />
      
      {/* Floating Contact Widget */}
      <ContactSupportWidget />
    </div>
  );
}

interface CourseCardProps {
  course: typeof courses[0];
  featured?: boolean;
  index?: number;
  getThumbnail: (slug: string, fallback: string) => string;
  getPriceInr: (slug: string, fallbackPrice: number) => number;
  isHighlighted?: boolean;
  saleActive?: boolean;
  discountPercent?: number;
  calculateDiscountedPrice?: (price: number) => number;
  realStats?: { totalLessons: number; totalDuration: number };
}

function CourseCard({ 
  course, 
  featured = false, 
  index = 0, 
  getThumbnail, 
  getPriceInr,
  isHighlighted = false,
  saleActive = false,
  discountPercent = 0,
  calculateDiscountedPrice = (p) => p,
  realStats
}: CourseCardProps) {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { initiatePayment, isLoading } = useCashfreePayment();
  const { toast } = useToast();
  const [isHovered, setIsHovered] = useState(false);
  const [showPhoneDialog, setShowPhoneDialog] = useState(false);
  const [pendingPaymentData, setPendingPaymentData] = useState<any>(null);

  const effectivePriceInr = getPriceInr(course.slug, course.priceInr);
  const discountedPrice = calculateDiscountedPrice(effectivePriceInr);
  
  // Use real stats if available, otherwise fallback to static data
  const displayLessons = realStats?.totalLessons || course.totalLessons;
  const displayDuration = realStats ? Math.round(realStats.totalDuration / 60) : course.durationHours;

  const levelColors: Record<string, string> = {
    beginner: 'bg-success/10 text-success border-success/30',
    intermediate: 'bg-warning/10 text-warning border-warning/30',
    advanced: 'bg-destructive/10 text-destructive border-destructive/30',
  };

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

    const customerPhone = profile?.phone?.replace(/[\s-]/g, '');
    const hasValidPhone = customerPhone && customerPhone.length >= 10;

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
      customerPhone: customerPhone,
      courseTitle: course.title,
      courseShortDescription: course.shortDescription,
      courseDescription: course.description,
      courseLevel: course.level,
    });
  };

  const handlePhoneSubmit = async (phone: string) => {
    if (!pendingPaymentData) return;
    
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

  return (
    <Card 
      className={`group overflow-hidden transition-all duration-500 hover:shadow-xl border-border/50 bg-card/80 backdrop-blur-sm ${
        featured ? 'border-accent/50 shadow-accent/10' : ''
      } ${isHighlighted ? 'ring-2 ring-warning/50 shadow-warning/20' : ''}`}
      style={{ 
        animationDelay: `${index * 0.1}s`,
        transform: isHovered ? 'translateY(-8px) scale(1.02)' : 'translateY(0) scale(1)',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="aspect-video relative overflow-hidden">
        <img 
          src={getThumbnail(course.slug, categoryImages[course.category] || '/placeholder.svg')} 
          alt={course.title}
          loading="lazy"
          decoding="async"
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          onError={(e) => {
            e.currentTarget.src = categoryImages[course.category] || '/placeholder.svg';
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        {/* Highlighted badge */}
        {isHighlighted && (
          <div className="absolute top-2 left-2">
            <Badge className="bg-warning text-warning-foreground border-0 shadow-lg">
              <Sparkles className="h-3 w-3 mr-1" /> Recommended
            </Badge>
          </div>
        )}
        
        {featured && !isHighlighted && (
          <div className="absolute top-2 right-2">
            <Badge className="bg-warning text-warning-foreground border-0 animate-pulse">
              <Star className="h-3 w-3 mr-1 fill-current" /> Featured
            </Badge>
          </div>
        )}
        
        {/* Quick buy overlay */}
        <div className={`absolute inset-0 flex items-center justify-center bg-background/60 backdrop-blur-sm transition-all duration-300 ${
          isHovered ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}>
          <div className="flex flex-col gap-2">
            <Button 
              onClick={handleBuyNow} 
              disabled={isLoading}
              className="bg-accent hover:bg-accent/90 text-accent-foreground shadow-lg"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CreditCard className="h-4 w-4 mr-2" />
                  Buy Now - ₹{effectivePriceInr.toLocaleString()}
                </>
              )}
            </Button>
            <Button variant="outline" className="bg-background/80" onClick={() => navigate(`/course/${course.slug}`)}>
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
            {courseCategories.find(c => c.id === course.category)?.name}
          </Badge>
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
            <Clock className="h-4 w-4" /> {displayDuration > 0 ? `${displayDuration}h` : 'Self-paced'}
          </span>
          <span className="flex items-center gap-1">
            <BookOpen className="h-4 w-4" /> {displayLessons} sessions
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
                ₹{effectivePriceInr.toLocaleString()}
              </div>
            )}
          </div>
          <Button 
            size="sm" 
            onClick={handleBuyNow}
            disabled={isLoading}
            className="transition-all duration-300 hover:scale-105"
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShoppingCart className="h-4 w-4 mr-1" />}
            Buy
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
