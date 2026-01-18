import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { courses, courseCategories, getFeaturedCourses, categoryImages } from '@/data/courses';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Clock, BookOpen, Search, Star, Filter, ShoppingCart, CreditCard, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useCashfreePayment } from '@/hooks/useCashfreePayment';
import { useToast } from '@/hooks/use-toast';

export default function Courses() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredCourses = courses.filter(course => {
    const matchesCategory = !selectedCategory || course.category === selectedCategory;
    const matchesSearch = !searchQuery || 
      course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.shortDescription.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch && course.isPublished;
  });

  const featuredCourses = getFeaturedCourses();

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      <Navbar />
      
      {/* 3D Background with Grid Pattern */}
      <div className="fixed inset-0 -z-10">
        {/* Animated gradient orbs */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-accent/20 rounded-full blur-3xl animate-pulse" 
             style={{ animationDuration: '4s' }} />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-primary/10 rounded-full blur-3xl animate-pulse" 
             style={{ animationDuration: '6s', animationDelay: '2s' }} />
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-blueprint/10 rounded-full blur-3xl animate-pulse" 
             style={{ animationDuration: '5s', animationDelay: '1s' }} />
        
        {/* Grid pattern overlay */}
        <div className="absolute inset-0 grid-pattern opacity-30" />
        
        {/* Perspective lines for 3D effect */}
        <svg className="absolute inset-0 w-full h-full opacity-10" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="perspective-grid" width="100" height="100" patternUnits="userSpaceOnUse">
              <path d="M 100 0 L 0 100" stroke="currentColor" strokeWidth="0.5" fill="none" />
              <path d="M 0 0 L 100 100" stroke="currentColor" strokeWidth="0.5" fill="none" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#perspective-grid)" />
        </svg>
      </div>
      
      {/* Hero Section with Animation */}
      <section className="pt-24 pb-12 relative">
        <div className="container mx-auto px-4 text-center">
          <div className="animate-fade-in">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 bg-gradient-to-r from-foreground via-accent to-foreground bg-clip-text text-transparent">
              Master Architecture & Design
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
              {courses.length}+ professional courses covering 3ds Max, Revit, SketchUp, AutoCAD, and more
            </p>
          </div>
          
          {/* Animated Search Bar */}
          <div className="max-w-xl mx-auto relative animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Search courses..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 h-14 text-lg border-2 border-border/50 focus:border-accent transition-all duration-300 bg-background/80 backdrop-blur-sm"
            />
          </div>
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
              All Courses
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
            <div className="flex items-center gap-2 mb-6">
              <Star className="h-6 w-6 text-warning fill-warning" />
              <h2 className="text-2xl font-bold">Featured Courses</h2>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 stagger-children">
              {featuredCourses.slice(0, 6).map((course, index) => (
                <CourseCard key={course.id} course={course} featured index={index} />
              ))}
            </div>
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
                : 'All Courses'}
          </h2>
          
          {filteredCourses.length === 0 ? (
            <div className="text-center py-12 animate-fade-in">
              <p className="text-muted-foreground text-lg">No courses found matching your criteria.</p>
              <Button variant="outline" className="mt-4" onClick={() => { setSelectedCategory(null); setSearchQuery(''); }}>
                Clear Filters
              </Button>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredCourses.map((course, index) => (
                <CourseCard key={course.id} course={course} index={index} />
              ))}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}

interface CourseCardProps {
  course: typeof courses[0];
  featured?: boolean;
  index?: number;
}

function CourseCard({ course, featured = false, index = 0 }: CourseCardProps) {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { initiatePayment, isLoading } = useCashfreePayment();
  const { toast } = useToast();
  const [isHovered, setIsHovered] = useState(false);

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

     await initiatePayment({
       courseId: course.slug,
       amount: course.priceInr,
       customerName: profile?.full_name || user.email?.split('@')[0] || 'Customer',
       customerEmail: user.email || '',
       customerPhone: profile?.phone || '9999999999',
     });
  };

  return (
    <Card 
      className={`group overflow-hidden transition-all duration-500 hover:shadow-xl border-border/50 bg-card/80 backdrop-blur-sm ${
        featured ? 'border-accent/50 shadow-accent/10' : ''
      }`}
      style={{ 
        animationDelay: `${index * 0.1}s`,
        transform: isHovered ? 'translateY(-8px) scale(1.02)' : 'translateY(0) scale(1)',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="aspect-video relative overflow-hidden">
        <img 
          src={categoryImages[course.category] || '/placeholder.svg'} 
          alt={course.title}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        {featured && (
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
                  Buy Now - ₹{course.priceInr.toLocaleString()}
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
            <Clock className="h-4 w-4" /> {course.durationHours}h
          </span>
          <span className="flex items-center gap-1">
            <BookOpen className="h-4 w-4" /> {course.totalLessons} lessons
          </span>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <div className="font-bold text-xl text-foreground">
              ₹{course.priceInr.toLocaleString()}
            </div>
            <div className="text-xs text-muted-foreground">
              ${course.priceUsd}
            </div>
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
    </Card>
  );
}
