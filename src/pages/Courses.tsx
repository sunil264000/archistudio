import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { courses, courseCategories, getFeaturedCourses, getCoursesByCategory, categoryImages } from '@/data/courses';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Clock, BookOpen, Search, Star, Filter } from 'lucide-react';

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
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero Section */}
      <section className="pt-24 pb-12 bg-gradient-to-br from-primary/10 via-background to-secondary/10">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Master Architecture & Design
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            {courses.length}+ professional courses covering 3ds Max, Revit, SketchUp, AutoCAD, and more
          </p>
          
          {/* Search Bar */}
          <div className="max-w-xl mx-auto relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Search courses..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 h-12 text-lg"
            />
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-8 border-b">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="h-5 w-5" />
            <span className="font-medium">Filter by Category:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant={selectedCategory === null ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(null)}
            >
              All Courses
            </Button>
            {courseCategories.map(cat => (
              <Button
                key={cat.id}
                variant={selectedCategory === cat.id ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(cat.id)}
              >
                {cat.icon} {cat.name}
              </Button>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Courses */}
      {!selectedCategory && !searchQuery && (
        <section className="py-12">
          <div className="container mx-auto px-4">
            <div className="flex items-center gap-2 mb-6">
              <Star className="h-6 w-6 text-yellow-500 fill-yellow-500" />
              <h2 className="text-2xl font-bold">Featured Courses</h2>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredCourses.slice(0, 6).map(course => (
                <CourseCard key={course.id} course={course} featured />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* All Courses */}
      <section className="py-12 bg-muted/30">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold mb-6">
            {selectedCategory 
              ? courseCategories.find(c => c.id === selectedCategory)?.name 
              : searchQuery 
                ? `Search Results (${filteredCourses.length})`
                : 'All Courses'}
          </h2>
          
          {filteredCourses.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground text-lg">No courses found matching your criteria.</p>
              <Button variant="outline" className="mt-4" onClick={() => { setSelectedCategory(null); setSearchQuery(''); }}>
                Clear Filters
              </Button>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredCourses.map(course => (
                <CourseCard key={course.id} course={course} />
              ))}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}

function CourseCard({ course, featured = false }: { course: typeof courses[0]; featured?: boolean }) {
  const levelColors = {
    beginner: 'bg-green-500/10 text-green-600',
    intermediate: 'bg-yellow-500/10 text-yellow-600',
    advanced: 'bg-red-500/10 text-red-600',
  };

  return (
    <Card className={`group hover:shadow-lg transition-all duration-300 ${featured ? 'border-primary/50' : ''}`}>
      <div className="aspect-video relative overflow-hidden">
        <img 
          src={categoryImages[course.category] || '/placeholder.svg'} 
          alt={course.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        {featured && (
          <Badge className="absolute top-2 right-2 bg-yellow-500">
            <Star className="h-3 w-3 mr-1 fill-current" /> Featured
          </Badge>
        )}
      </div>
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2 mb-2">
          <Badge variant="outline" className={levelColors[course.level]}>
            {course.level}
          </Badge>
          <Badge variant="secondary" className="text-xs">
            {courseCategories.find(c => c.id === course.category)?.name}
          </Badge>
        </div>
        <CardTitle className="text-lg line-clamp-2 group-hover:text-primary transition-colors">
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
          <div className="font-bold text-lg">
            ₹{course.priceInr.toLocaleString()}
          </div>
          <Button size="sm">View Course</Button>
        </div>
      </CardContent>
    </Card>
  );
}
