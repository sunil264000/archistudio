import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { 
  Search, Pencil, Trash2, GripVertical, ChevronUp, ChevronDown, 
  Loader2, RefreshCw, Eye, EyeOff, Star, Image as ImageIcon
} from 'lucide-react';
import { CourseEditDialog } from './CourseEditDialog';

interface Course {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  short_description: string | null;
  price_inr: number | null;
  price_usd: number | null;
  is_published: boolean;
  is_featured: boolean;
  is_highlighted: boolean;
  order_index: number | null;
  thumbnail_url: string | null;
  level: string | null;
  duration_hours: number | null;
}

export function CourseManagement() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [refreshingAll, setRefreshingAll] = useState(false);

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('courses')
      .select('id, title, slug, description, short_description, price_inr, price_usd, is_published, is_featured, is_highlighted, order_index, thumbnail_url, level, duration_hours')
      .order('order_index', { ascending: true });
    
    if (error) {
      toast.error('Failed to fetch courses');
    } else {
      setCourses(data || []);
    }
    setLoading(false);
  };

  const handleMoveUp = async (index: number) => {
    if (index === 0) return;
    
    const newCourses = [...courses];
    const temp = newCourses[index];
    newCourses[index] = newCourses[index - 1];
    newCourses[index - 1] = temp;
    
    // Update order_index for both
    await Promise.all([
      supabase.from('courses').update({ order_index: index - 1 }).eq('id', temp.id),
      supabase.from('courses').update({ order_index: index }).eq('id', newCourses[index].id),
    ]);
    
    setCourses(newCourses);
    toast.success('Course order updated');
  };

  const handleMoveDown = async (index: number) => {
    if (index === courses.length - 1) return;
    
    const newCourses = [...courses];
    const temp = newCourses[index];
    newCourses[index] = newCourses[index + 1];
    newCourses[index + 1] = temp;
    
    // Update order_index for both
    await Promise.all([
      supabase.from('courses').update({ order_index: index + 1 }).eq('id', temp.id),
      supabase.from('courses').update({ order_index: index }).eq('id', newCourses[index].id),
    ]);
    
    setCourses(newCourses);
    toast.success('Course order updated');
  };

  const handleTogglePublish = async (course: Course) => {
    const { error } = await supabase
      .from('courses')
      .update({ is_published: !course.is_published })
      .eq('id', course.id);
    
    if (error) {
      toast.error('Failed to update course');
    } else {
      setCourses(prev => prev.map(c => 
        c.id === course.id ? { ...c, is_published: !c.is_published } : c
      ));
      toast.success(course.is_published ? 'Course unpublished' : 'Course published');
    }
  };

  const handleToggleFeatured = async (course: Course) => {
    const { error } = await supabase
      .from('courses')
      .update({ is_featured: !course.is_featured })
      .eq('id', course.id);
    
    if (error) {
      toast.error('Failed to update course');
    } else {
      setCourses(prev => prev.map(c => 
        c.id === course.id ? { ...c, is_featured: !c.is_featured } : c
      ));
    }
  };

  const handleRefreshAllLinks = async () => {
    setRefreshingAll(true);
    try {
      const { data, error } = await supabase.functions.invoke('auto-scan-courses', {
        body: { action: 'refresh-all' }
      });
      
      if (error) throw error;
      toast.success(data.message || 'Refresh completed');
    } catch (err: any) {
      toast.error(err.message || 'Failed to refresh links');
    } finally {
      setRefreshingAll(false);
    }
  };

  const handleDeleteCourse = async (courseId: string) => {
    if (!confirm('Are you sure you want to delete this course? This will also delete all modules and lessons.')) return;
    
    // Delete in order: lessons -> modules -> course
    const { data: modules } = await supabase
      .from('modules')
      .select('id')
      .eq('course_id', courseId);
    
    if (modules) {
      for (const mod of modules) {
        await supabase.from('lessons').delete().eq('module_id', mod.id);
      }
      await supabase.from('modules').delete().eq('course_id', courseId);
    }
    
    const { error } = await supabase.from('courses').delete().eq('id', courseId);
    
    if (error) {
      toast.error('Failed to delete course');
    } else {
      setCourses(prev => prev.filter(c => c.id !== courseId));
      toast.success('Course deleted');
    }
  };

  const filteredCourses = courses.filter(course =>
    course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    course.slug.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search courses..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={handleRefreshAllLinks}
            disabled={refreshingAll}
          >
            {refreshingAll ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Refresh All Links
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{courses.length}</div>
            <div className="text-sm text-muted-foreground">Total Courses</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{courses.filter(c => c.is_published).length}</div>
            <div className="text-sm text-muted-foreground">Published</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{courses.filter(c => c.is_featured).length}</div>
            <div className="text-sm text-muted-foreground">Featured</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{courses.filter(c => !c.is_published).length}</div>
            <div className="text-sm text-muted-foreground">Draft</div>
          </CardContent>
        </Card>
      </div>

      {/* Course List */}
      <Card>
        <CardHeader>
          <CardTitle>All Courses ({filteredCourses.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {filteredCourses.map((course, index) => (
              <div 
                key={course.id} 
                className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
              >
                {/* Reorder Controls */}
                <div className="flex flex-col gap-0.5">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-6 w-6"
                    onClick={() => handleMoveUp(index)}
                    disabled={index === 0}
                  >
                    <ChevronUp className="h-3 w-3" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-6 w-6"
                    onClick={() => handleMoveDown(index)}
                    disabled={index === filteredCourses.length - 1}
                  >
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                </div>

                {/* Thumbnail */}
                <div className="w-16 h-10 rounded bg-muted flex items-center justify-center overflow-hidden shrink-0">
                  {course.thumbnail_url ? (
                    <img src={course.thumbnail_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <ImageIcon className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>

                {/* Course Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium truncate">{course.title}</span>
                    {course.is_featured && (
                      <Star className="h-3 w-3 text-yellow-500 fill-yellow-500 shrink-0" />
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>₹{course.price_inr || 0}</span>
                    <span>•</span>
                    <span className="capitalize">{course.level || 'beginner'}</span>
                  </div>
                </div>

                {/* Status & Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  <Badge variant={course.is_published ? 'default' : 'secondary'}>
                    {course.is_published ? 'Published' : 'Draft'}
                  </Badge>
                  
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => handleTogglePublish(course)}
                    title={course.is_published ? 'Unpublish' : 'Publish'}
                  >
                    {course.is_published ? (
                      <Eye className="h-4 w-4" />
                    ) : (
                      <EyeOff className="h-4 w-4" />
                    )}
                  </Button>
                  
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => handleToggleFeatured(course)}
                    title={course.is_featured ? 'Remove from featured' : 'Add to featured'}
                  >
                    <Star className={`h-4 w-4 ${course.is_featured ? 'text-yellow-500 fill-yellow-500' : ''}`} />
                  </Button>
                  
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => setEditingCourse(course)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => handleDeleteCourse(course.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      {editingCourse && (
        <CourseEditDialog
          course={editingCourse}
          open={!!editingCourse}
          onOpenChange={(open) => !open && setEditingCourse(null)}
          onSave={() => {
            fetchCourses();
            setEditingCourse(null);
          }}
        />
      )}
    </div>
  );
}
