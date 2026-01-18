import { useParams, useNavigate, Link } from 'react-router-dom';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { courses, courseCategories, categoryImages } from '@/data/courses';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Clock, BookOpen, Star, CheckCircle, Play, ArrowLeft, CreditCard, Loader2, Users, Award, FileText } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useCashfreePayment } from '@/hooks/useCashfreePayment';
import { useToast } from '@/hooks/use-toast';

export default function CourseDetail() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { initiatePayment, isLoading } = useCashfreePayment();
  const { toast } = useToast();

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

  const levelColors: Record<string, string> = {
    beginner: 'bg-success/10 text-success border-success/30',
    intermediate: 'bg-warning/10 text-warning border-warning/30',
    advanced: 'bg-destructive/10 text-destructive border-destructive/30',
  };

  // Generate sample curriculum based on course
  const curriculum = [
    { title: 'Introduction & Setup', lessons: 3, duration: '45 min' },
    { title: 'Core Concepts', lessons: 5, duration: '1.5 hrs' },
    { title: 'Practical Application', lessons: 6, duration: '2 hrs' },
    { title: 'Advanced Techniques', lessons: 4, duration: '1.5 hrs' },
    { title: 'Real-World Projects', lessons: 5, duration: '2 hrs' },
    { title: 'Final Project & Certificate', lessons: 2, duration: '1 hr' },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero Section */}
      <section className="pt-24 pb-12 bg-gradient-to-br from-primary/5 via-background to-accent/5">
        <div className="container mx-auto px-4">
          <Link to="/courses" className="inline-flex items-center text-muted-foreground hover:text-foreground mb-6 transition-colors">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Courses
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

              <div className="flex flex-wrap items-center gap-6 text-muted-foreground">
                <span className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  {course.durationHours} hours
                </span>
                <span className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  {course.totalLessons} lessons
                </span>
                <span className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  500+ students
                </span>
                <span className="flex items-center gap-2">
                  <Award className="h-5 w-5" />
                  Certificate included
                </span>
              </div>
            </div>

            {/* Purchase Card */}
            <div className="lg:col-span-1">
              <Card className="sticky top-24 overflow-hidden">
                <div className="aspect-video relative">
                  <img 
                    src={categoryImages[course.category] || '/placeholder.svg'} 
                    alt={course.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <Button size="lg" variant="secondary" className="gap-2">
                      <Play className="h-5 w-5" />
                      Preview Course
                    </Button>
                  </div>
                </div>
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold">₹{course.priceInr.toLocaleString()}</span>
                    <span className="text-muted-foreground">(${course.priceUsd})</span>
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
                    ) : (
                      <>
                        <CreditCard className="h-5 w-5 mr-2" />
                        Buy Now
                      </>
                    )}
                  </Button>

                  <p className="text-center text-sm text-muted-foreground">
                    7-day money-back guarantee
                  </p>

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
                      Certificate of completion
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
                  <CardTitle>About This Course</CardTitle>
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
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Course Curriculum
                  </CardTitle>
                  <CardDescription>
                    {course.totalLessons} lessons • {course.durationHours} hours total
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {curriculum.map((module, i) => (
                    <div 
                      key={i}
                      className="flex items-center justify-between p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium">
                          {i + 1}
                        </div>
                        <div>
                          <p className="font-medium">{module.title}</p>
                          <p className="text-sm text-muted-foreground">
                            {module.lessons} lessons • {module.duration}
                          </p>
                        </div>
                      </div>
                      {i === 0 && (
                        <Badge variant="outline" className="text-xs">Free Preview</Badge>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
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
                    .map(relatedCourse => (
                      <Link 
                        key={relatedCourse.id}
                        to={`/course/${relatedCourse.slug}`}
                        className="block group"
                      >
                        <div className="flex gap-3">
                          <img 
                            src={categoryImages[relatedCourse.category] || '/placeholder.svg'}
                            alt={relatedCourse.title}
                            className="w-20 h-14 object-cover rounded"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm line-clamp-2 group-hover:text-accent transition-colors">
                              {relatedCourse.title}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              ₹{relatedCourse.priceInr.toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </Link>
                    ))}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
