import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { 
  Search, Pencil, Trash2, ChevronUp, ChevronDown, 
  Loader2, RefreshCw, Eye, EyeOff, Star, Image as ImageIcon, 
  FolderX, CheckSquare, Square, ArrowUpDown, Filter,
  BookOpen, Layers, Clock, AlertCircle, CheckCircle2,
  TrendingUp, Package, X
} from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CourseEditDialog } from './CourseEditDialog';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

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
  total_lessons: number | null;
}

interface CourseContent {
  moduleCount: number;
  lessonCount: number;
  totalHours: number;
}

type SortOption = 'order' | 'name' | 'price' | 'content' | 'empty-first' | 'content-first' | 'published' | 'draft' | 'featured' | 'recently-updated';
type FilterOption = 'all' | 'published' | 'draft' | 'featured' | 'highlighted' | 'empty' | 'has-content' | 'no-thumbnail';

export function CourseManagement() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [refreshingAll, setRefreshingAll] = useState(false);
  const [deletingContent, setDeletingContent] = useState<string | null>(null);
  const [selectedCourses, setSelectedCourses] = useState<Set<string>>(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>('order');
  const [activeFilters, setActiveFilters] = useState<Set<FilterOption>>(new Set(['all']));
  const [courseContent, setCourseContent] = useState<Record<string, CourseContent>>({});
  const [loadingContent, setLoadingContent] = useState(false);

  useEffect(() => {
    fetchCourses();
  }, []);

  useEffect(() => {
    if (courses.length > 0) {
      fetchCourseContent();
    }
  }, [courses]);

  const fetchCourses = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('courses')
      .select('id, title, slug, description, short_description, price_inr, price_usd, is_published, is_featured, is_highlighted, order_index, thumbnail_url, level, duration_hours, total_lessons')
      .order('order_index', { ascending: true });
    
    if (error) {
      toast.error('Failed to fetch courses');
    } else {
      setCourses(data || []);
    }
    setLoading(false);
  };

  const fetchCourseContent = async () => {
    setLoadingContent(true);
    try {
      // Fetch modules with lesson counts in a single query
      const { data: modulesData } = await supabase
        .from('modules')
        .select('course_id, id');
      
      const { data: lessonsData } = await supabase
        .from('lessons')
        .select('module_id, duration_minutes');

      // Build content map
      const contentMap: Record<string, CourseContent> = {};
      
      courses.forEach(course => {
        contentMap[course.id] = { moduleCount: 0, lessonCount: 0, totalHours: 0 };
      });

      // Count modules per course
      const modulesByCourse: Record<string, string[]> = {};
      (modulesData || []).forEach(mod => {
        if (!modulesByCourse[mod.course_id]) {
          modulesByCourse[mod.course_id] = [];
        }
        modulesByCourse[mod.course_id].push(mod.id);
        if (contentMap[mod.course_id]) {
          contentMap[mod.course_id].moduleCount++;
        }
      });

      // Count lessons per module
      const lessonsByModule: Record<string, { count: number; duration: number }> = {};
      (lessonsData || []).forEach(lesson => {
        if (!lessonsByModule[lesson.module_id]) {
          lessonsByModule[lesson.module_id] = { count: 0, duration: 0 };
        }
        lessonsByModule[lesson.module_id].count++;
        lessonsByModule[lesson.module_id].duration += lesson.duration_minutes || 0;
      });

      // Map lessons to courses
      Object.entries(modulesByCourse).forEach(([courseId, moduleIds]) => {
        if (contentMap[courseId]) {
          moduleIds.forEach(modId => {
            const lessonData = lessonsByModule[modId];
            if (lessonData) {
              contentMap[courseId].lessonCount += lessonData.count;
              contentMap[courseId].totalHours += lessonData.duration / 60;
            }
          });
        }
      });

      setCourseContent(contentMap);
    } catch (err) {
      console.error('Failed to fetch course content:', err);
    } finally {
      setLoadingContent(false);
    }
  };

  const handleMoveUp = async (index: number) => {
    if (index === 0) return;
    
    const sortedCourses = [...processedCourses];
    const temp = sortedCourses[index];
    sortedCourses[index] = sortedCourses[index - 1];
    sortedCourses[index - 1] = temp;
    
    await Promise.all([
      supabase.from('courses').update({ order_index: index - 1 }).eq('id', temp.id),
      supabase.from('courses').update({ order_index: index }).eq('id', sortedCourses[index].id),
    ]);
    
    fetchCourses();
    toast.success('Course order updated');
  };

  const handleMoveDown = async (index: number) => {
    if (index === processedCourses.length - 1) return;
    
    const sortedCourses = [...processedCourses];
    const temp = sortedCourses[index];
    sortedCourses[index] = sortedCourses[index + 1];
    sortedCourses[index + 1] = temp;
    
    await Promise.all([
      supabase.from('courses').update({ order_index: index + 1 }).eq('id', temp.id),
      supabase.from('courses').update({ order_index: index }).eq('id', sortedCourses[index].id),
    ]);
    
    fetchCourses();
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
    
    const { data: modules } = await supabase
      .from('modules')
      .select('id')
      .eq('course_id', courseId);
    
    const moduleIds = modules?.map(m => m.id) || [];
    
    if (moduleIds.length > 0) {
      const { data: lessons } = await supabase
        .from('lessons')
        .select('id')
        .in('module_id', moduleIds);
      
      const lessonIds = lessons?.map(l => l.id) || [];
      
      if (lessonIds.length > 0) {
        await supabase.from('lesson_resources').delete().in('lesson_id', lessonIds);
        await supabase.from('lessons').delete().in('module_id', moduleIds);
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

  const handleDeleteAllContent = async (courseId: string) => {
    setDeletingContent(courseId);
    try {
      const { data: modules } = await supabase
        .from('modules')
        .select('id')
        .eq('course_id', courseId);
      
      const moduleIds = modules?.map(m => m.id) || [];
      
      if (moduleIds.length === 0) {
        toast.info('Course has no content to delete');
        return;
      }

      const { data: lessons } = await supabase
        .from('lessons')
        .select('id')
        .in('module_id', moduleIds);
      
      const lessonIds = lessons?.map(l => l.id) || [];
      
      if (lessonIds.length > 0) {
        await supabase.from('lesson_resources').delete().in('lesson_id', lessonIds);
        await supabase.from('lessons').delete().in('module_id', moduleIds);
      }
      await supabase.from('modules').delete().eq('course_id', courseId);
      
      await supabase.from('courses').update({
        total_lessons: 0,
        duration_hours: null
      }).eq('id', courseId);
      
      // Update local content state
      setCourseContent(prev => ({
        ...prev,
        [courseId]: { moduleCount: 0, lessonCount: 0, totalHours: 0 }
      }));
      
      toast.success(`Deleted ${moduleIds.length} modules and ${lessonIds.length} lessons`);
      fetchCourses();
    } catch (err: any) {
      toast.error('Failed to delete content');
    } finally {
      setDeletingContent(null);
    }
  };

  const toggleCourseSelection = (courseId: string) => {
    setSelectedCourses(prev => {
      const newSet = new Set(prev);
      if (newSet.has(courseId)) {
        newSet.delete(courseId);
      } else {
        newSet.add(courseId);
      }
      return newSet;
    });
  };

  const toggleSelectAll = () => {
    if (selectedCourses.size === processedCourses.length) {
      setSelectedCourses(new Set());
    } else {
      setSelectedCourses(new Set(processedCourses.map(c => c.id)));
    }
  };

  const handleBulkDeleteContent = async () => {
    if (selectedCourses.size === 0) return;
    
    setBulkDeleting(true);
    let totalModules = 0;
    let totalLessons = 0;
    
    try {
      const results = await Promise.allSettled(
        Array.from(selectedCourses).map(async (courseId) => {
          const { data: modules } = await supabase
            .from('modules')
            .select('id')
            .eq('course_id', courseId);
          
          const moduleIds = modules?.map(m => m.id) || [];
          if (moduleIds.length === 0) return { modules: 0, lessons: 0 };

          const { data: lessons } = await supabase
            .from('lessons')
            .select('id')
            .in('module_id', moduleIds);
          
          const lessonIds = lessons?.map(l => l.id) || [];
          
          if (lessonIds.length > 0) {
            await supabase.from('lesson_resources').delete().in('lesson_id', lessonIds);
            await supabase.from('lessons').delete().in('module_id', moduleIds);
          }
          await supabase.from('modules').delete().eq('course_id', courseId);
          
          await supabase.from('courses').update({
            total_lessons: 0,
            duration_hours: null
          }).eq('id', courseId);
          
          return { modules: moduleIds.length, lessons: lessonIds.length };
        })
      );
      
      results.forEach((result) => {
        if (result.status === 'fulfilled') {
          totalModules += result.value.modules;
          totalLessons += result.value.lessons;
        }
      });
      
      toast.success(`Cleaned ${selectedCourses.size} courses: ${totalModules} modules, ${totalLessons} lessons deleted`);
      setSelectedCourses(new Set());
      fetchCourses();
    } catch (err: any) {
      toast.error('Failed to bulk delete content');
    } finally {
      setBulkDeleting(false);
    }
  };

  const toggleFilter = (filter: FilterOption) => {
    setActiveFilters(prev => {
      const newFilters = new Set(prev);
      if (filter === 'all') {
        return new Set(['all']);
      }
      newFilters.delete('all');
      if (newFilters.has(filter)) {
        newFilters.delete(filter);
        if (newFilters.size === 0) newFilters.add('all');
      } else {
        newFilters.add(filter);
      }
      return newFilters;
    });
  };

  // Process courses with filtering and sorting
  const processedCourses = useMemo(() => {
    let result = [...courses];

    // Apply search filter
    if (searchTerm) {
      result = result.filter(course =>
        course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.slug.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply active filters
    if (!activeFilters.has('all')) {
      result = result.filter(course => {
        const content = courseContent[course.id];
        const hasContent = content && (content.moduleCount > 0 || content.lessonCount > 0);
        
        let passes = true;
        
        if (activeFilters.has('published')) passes = passes && course.is_published;
        if (activeFilters.has('draft')) passes = passes && !course.is_published;
        if (activeFilters.has('featured')) passes = passes && course.is_featured;
        if (activeFilters.has('highlighted')) passes = passes && course.is_highlighted;
        if (activeFilters.has('empty')) passes = passes && !hasContent;
        if (activeFilters.has('has-content')) passes = passes && hasContent;
        if (activeFilters.has('no-thumbnail')) passes = passes && !course.thumbnail_url;
        
        return passes;
      });
    }

    // Apply sorting
    result.sort((a, b) => {
      const contentA = courseContent[a.id] || { moduleCount: 0, lessonCount: 0, totalHours: 0 };
      const contentB = courseContent[b.id] || { moduleCount: 0, lessonCount: 0, totalHours: 0 };
      const hasContentA = contentA.moduleCount > 0 || contentA.lessonCount > 0;
      const hasContentB = contentB.moduleCount > 0 || contentB.lessonCount > 0;

      switch (sortBy) {
        case 'name':
          return a.title.localeCompare(b.title);
        case 'price':
          return (b.price_inr || 0) - (a.price_inr || 0);
        case 'content':
          return contentB.lessonCount - contentA.lessonCount;
        case 'empty-first':
          if (hasContentA === hasContentB) return (a.order_index || 0) - (b.order_index || 0);
          return hasContentA ? 1 : -1;
        case 'content-first':
          if (hasContentA === hasContentB) return (a.order_index || 0) - (b.order_index || 0);
          return hasContentB ? 1 : -1;
        case 'published':
          if (a.is_published === b.is_published) return (a.order_index || 0) - (b.order_index || 0);
          return a.is_published ? -1 : 1;
        case 'draft':
          if (a.is_published === b.is_published) return (a.order_index || 0) - (b.order_index || 0);
          return a.is_published ? 1 : -1;
        case 'featured':
          if (a.is_featured === b.is_featured) return (a.order_index || 0) - (b.order_index || 0);
          return a.is_featured ? -1 : 1;
        default:
          return (a.order_index || 0) - (b.order_index || 0);
      }
    });

    return result;
  }, [courses, searchTerm, sortBy, activeFilters, courseContent]);

  // Stats calculations
  const stats = useMemo(() => {
    const emptyCourses = courses.filter(c => {
      const content = courseContent[c.id];
      return !content || (content.moduleCount === 0 && content.lessonCount === 0);
    }).length;
    
    const coursesWithContent = courses.length - emptyCourses;
    const totalModules = Object.values(courseContent).reduce((sum, c) => sum + c.moduleCount, 0);
    const totalLessons = Object.values(courseContent).reduce((sum, c) => sum + c.lessonCount, 0);
    const noThumbnail = courses.filter(c => !c.thumbnail_url).length;

    return {
      total: courses.length,
      published: courses.filter(c => c.is_published).length,
      draft: courses.filter(c => !c.is_published).length,
      featured: courses.filter(c => c.is_featured).length,
      empty: emptyCourses,
      withContent: coursesWithContent,
      totalModules,
      totalLessons,
      noThumbnail,
    };
  }, [courses, courseContent]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Grid - Enhanced */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-primary" />
              <span className="text-2xl font-bold">{stats.total}</span>
            </div>
            <div className="text-xs text-muted-foreground">Total Courses</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span className="text-2xl font-bold">{stats.published}</span>
            </div>
            <div className="text-xs text-muted-foreground">Published</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-amber-500/10 to-amber-500/5 border-amber-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Star className="h-4 w-4 text-amber-500" />
              <span className="text-2xl font-bold">{stats.featured}</span>
            </div>
            <div className="text-xs text-muted-foreground">Featured</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4 text-blue-500" />
              <span className="text-2xl font-bold">{stats.totalModules}</span>
            </div>
            <div className="text-xs text-muted-foreground">Total Modules</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-purple-500/10 to-purple-500/5 border-purple-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-purple-500" />
              <span className="text-2xl font-bold">{stats.totalLessons}</span>
            </div>
            <div className="text-xs text-muted-foreground">Total Lessons</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-destructive/10 to-destructive/5 border-destructive/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-destructive" />
              <span className="text-2xl font-bold">{stats.empty}</span>
            </div>
            <div className="text-xs text-muted-foreground">Empty Courses</div>
          </CardContent>
        </Card>
      </div>

      {/* Controls Bar */}
      <Card className="border-border/50">
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search courses..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-background"
              />
            </div>

            {/* Sort & Filter Controls */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Sort Dropdown */}
              <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
                <SelectTrigger className="w-[180px] bg-background">
                  <ArrowUpDown className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Sort by..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="order">Default Order</SelectItem>
                  <SelectItem value="name">Name (A-Z)</SelectItem>
                  <SelectItem value="price">Price (High-Low)</SelectItem>
                  <SelectItem value="content">Most Content</SelectItem>
                  <SelectItem value="empty-first">Empty First</SelectItem>
                  <SelectItem value="content-first">With Content First</SelectItem>
                  <SelectItem value="published">Published First</SelectItem>
                  <SelectItem value="draft">Drafts First</SelectItem>
                  <SelectItem value="featured">Featured First</SelectItem>
                </SelectContent>
              </Select>

              {/* Filter Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <Filter className="h-4 w-4" />
                    Filters
                    {!activeFilters.has('all') && (
                      <Badge variant="secondary" className="ml-1 h-5 px-1.5">
                        {activeFilters.size}
                      </Badge>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuLabel>Filter Courses</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuCheckboxItem
                    checked={activeFilters.has('all')}
                    onCheckedChange={() => toggleFilter('all')}
                  >
                    Show All
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuCheckboxItem
                    checked={activeFilters.has('published')}
                    onCheckedChange={() => toggleFilter('published')}
                  >
                    <CheckCircle2 className="h-3 w-3 mr-2 text-green-500" />
                    Published
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={activeFilters.has('draft')}
                    onCheckedChange={() => toggleFilter('draft')}
                  >
                    <EyeOff className="h-3 w-3 mr-2 text-muted-foreground" />
                    Draft
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={activeFilters.has('featured')}
                    onCheckedChange={() => toggleFilter('featured')}
                  >
                    <Star className="h-3 w-3 mr-2 text-amber-500" />
                    Featured
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuCheckboxItem
                    checked={activeFilters.has('empty')}
                    onCheckedChange={() => toggleFilter('empty')}
                  >
                    <AlertCircle className="h-3 w-3 mr-2 text-destructive" />
                    Empty (No Content)
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={activeFilters.has('has-content')}
                    onCheckedChange={() => toggleFilter('has-content')}
                  >
                    <Layers className="h-3 w-3 mr-2 text-blue-500" />
                    Has Content
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={activeFilters.has('no-thumbnail')}
                    onCheckedChange={() => toggleFilter('no-thumbnail')}
                  >
                    <ImageIcon className="h-3 w-3 mr-2 text-muted-foreground" />
                    No Thumbnail
                  </DropdownMenuCheckboxItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Separator orientation="vertical" className="h-8 hidden lg:block" />

              {/* Actions */}
              {selectedCourses.size > 0 && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm" disabled={bulkDeleting}>
                      {bulkDeleting ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <FolderX className="h-4 w-4 mr-2" />
                      )}
                      Clean {selectedCourses.size}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Bulk Delete Content?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently delete ALL modules, lessons, and resources from {selectedCourses.size} selected course{selectedCourses.size > 1 ? 's' : ''}.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction 
                        onClick={handleBulkDeleteContent}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Delete All Content
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}

              <Button 
                variant="outline" 
                size="sm"
                onClick={handleRefreshAllLinks}
                disabled={refreshingAll}
              >
                {refreshingAll ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                Refresh Links
              </Button>
            </div>
          </div>

          {/* Active Filters Tags */}
          {!activeFilters.has('all') && (
            <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-border/50">
              <span className="text-xs text-muted-foreground">Active filters:</span>
              {Array.from(activeFilters).map(filter => (
                <Badge 
                  key={filter} 
                  variant="secondary" 
                  className="gap-1 pr-1 cursor-pointer hover:bg-secondary/80"
                  onClick={() => toggleFilter(filter)}
                >
                  {filter.replace('-', ' ')}
                  <X className="h-3 w-3" />
                </Badge>
              ))}
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-6 px-2 text-xs"
                onClick={() => setActiveFilters(new Set(['all']))}
              >
                Clear all
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Course List */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between py-4">
          <CardTitle className="text-lg">
            Courses ({processedCourses.length})
            {loadingContent && <Loader2 className="inline h-4 w-4 ml-2 animate-spin" />}
          </CardTitle>
          <Button 
            variant="outline" 
            size="sm"
            onClick={toggleSelectAll}
            className="gap-2"
          >
            {selectedCourses.size === processedCourses.length && processedCourses.length > 0 ? (
              <>
                <CheckSquare className="h-4 w-4" />
                Deselect
              </>
            ) : (
              <>
                <Square className="h-4 w-4" />
                Select All
              </>
            )}
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border">
            {processedCourses.map((course, index) => {
              const content = courseContent[course.id] || { moduleCount: 0, lessonCount: 0, totalHours: 0 };
              const hasContent = content.moduleCount > 0 || content.lessonCount > 0;
              
              return (
                <div 
                  key={course.id} 
                  className={`flex items-center gap-3 p-3 transition-colors hover:bg-muted/30 ${
                    selectedCourses.has(course.id) 
                      ? 'bg-primary/5' 
                      : ''
                  }`}
                >
                  {/* Selection */}
                  <Checkbox
                    checked={selectedCourses.has(course.id)}
                    onCheckedChange={() => toggleCourseSelection(course.id)}
                    className="shrink-0"
                  />

                  {/* Reorder */}
                  <div className="flex flex-col gap-0.5 shrink-0">
                    <Button 
                      variant="ghost"
                      size="icon" 
                      className="h-5 w-5"
                      onClick={() => handleMoveUp(index)}
                      disabled={index === 0}
                    >
                      <ChevronUp className="h-3 w-3" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-5 w-5"
                      onClick={() => handleMoveDown(index)}
                      disabled={index === processedCourses.length - 1}
                    >
                      <ChevronDown className="h-3 w-3" />
                    </Button>
                  </div>

                  {/* Thumbnail */}
                  <div className="w-14 h-10 rounded bg-muted flex items-center justify-center overflow-hidden shrink-0 border border-border">
                    {course.thumbnail_url ? (
                      <img src={course.thumbnail_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <ImageIcon className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium truncate max-w-[200px]">{course.title}</span>
                      {course.is_featured && (
                        <Star className="h-3 w-3 text-amber-500 fill-amber-500 shrink-0" />
                      )}
                      {!course.is_published && (
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0">Draft</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                      <span>₹{course.price_inr || 0}</span>
                      <span className="capitalize">{course.level || 'beginner'}</span>
                    </div>
                  </div>

                  {/* Content Badge */}
                  <div className="shrink-0">
                    {hasContent ? (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/30 gap-1">
                            <Layers className="h-3 w-3" />
                            {content.moduleCount}M / {content.lessonCount}L
                          </Badge>
                        </TooltipTrigger>
                        <TooltipContent>
                          {content.moduleCount} modules, {content.lessonCount} lessons
                          {content.totalHours > 0 && ` (${content.totalHours.toFixed(1)}h)`}
                        </TooltipContent>
                      </Tooltip>
                    ) : (
                      <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/30 gap-1">
                        <AlertCircle className="h-3 w-3" />
                        Empty
                      </Badge>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleTogglePublish(course)}
                        >
                          {course.is_published ? (
                            <Eye className="h-4 w-4 text-green-500" />
                          ) : (
                            <EyeOff className="h-4 w-4 text-muted-foreground" />
                          )}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>{course.is_published ? 'Unpublish' : 'Publish'}</TooltipContent>
                    </Tooltip>
                    
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleToggleFeatured(course)}
                        >
                          <Star className={`h-4 w-4 ${course.is_featured ? 'text-amber-500 fill-amber-500' : 'text-muted-foreground'}`} />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>{course.is_featured ? 'Remove from featured' : 'Feature course'}</TooltipContent>
                    </Tooltip>
                    
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => setEditingCourse(course)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Edit course</TooltipContent>
                    </Tooltip>
                    
                    {hasContent && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            className="h-8 w-8"
                            disabled={deletingContent === course.id}
                          >
                            {deletingContent === course.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <FolderX className="h-4 w-4 text-orange-500" />
                            )}
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Course Content?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will delete {content.moduleCount} modules and {content.lessonCount} lessons from "{course.title}". The course itself will remain.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={() => handleDeleteAllContent(course.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Delete Content
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleDeleteCourse(course.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Delete course</TooltipContent>
                    </Tooltip>
                  </div>
                </div>
              );
            })}

            {processedCourses.length === 0 && (
              <div className="p-8 text-center text-muted-foreground">
                <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No courses found matching your criteria</p>
              </div>
            )}
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
