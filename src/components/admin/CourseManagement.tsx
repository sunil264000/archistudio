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
  Package, X, Link2, Unlink, FolderSync, ExternalLink,
  ChevronRight, Video, FileText
} from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  drive_folder_id?: string | null;
}

interface CourseContent {
  moduleCount: number;
  lessonCount: number;
  totalHours: number;
}

interface ModuleWithLessons {
  id: string;
  title: string;
  order_index: number;
  lessons: {
    id: string;
    title: string;
    duration_minutes: number | null;
    video_url: string | null;
    order_index: number;
  }[];
}

type SortOption = 'order' | 'name' | 'price' | 'content' | 'empty-first' | 'content-first' | 'published' | 'draft' | 'featured' | 'linked' | 'unlinked';
type FilterOption = 'all' | 'published' | 'draft' | 'featured' | 'highlighted' | 'empty' | 'has-content' | 'no-thumbnail' | 'linked' | 'unlinked';

export function CourseManagement() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [refreshingAll, setRefreshingAll] = useState(false);
  const [deletingContent, setDeletingContent] = useState<string | null>(null);
  const [selectedCourses, setSelectedCourses] = useState<Set<string>>(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [deletingEmptyCourses, setDeletingEmptyCourses] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>('order');
  const [activeFilters, setActiveFilters] = useState<Set<FilterOption>>(new Set(['all']));
  const [courseContent, setCourseContent] = useState<Record<string, CourseContent>>({});
  const [loadingContent, setLoadingContent] = useState(false);
  
  // Quick toggle to hide empty courses
  const [hideEmpty, setHideEmpty] = useState(false);
  
  // Folder linking state
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [linkingCourse, setLinkingCourse] = useState<Course | null>(null);
  const [folderUrl, setFolderUrl] = useState('');
  const [linking, setLinking] = useState(false);
  const [syncingCourse, setSyncingCourse] = useState<string | null>(null);
  const [scanningCourse, setScanningCourse] = useState<string | null>(null);
  
  // Expanded course content preview
  const [expandedCourse, setExpandedCourse] = useState<string | null>(null);
  const [expandedModules, setExpandedModules] = useState<ModuleWithLessons[]>([]);
  const [loadingExpanded, setLoadingExpanded] = useState(false);

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
      // Check for linked folders in site_settings
      const { data: settings } = await supabase
        .from('site_settings')
        .select('key, value')
        .like('key', 'course_folder_%');
      
      const folderMap: Record<string, string> = {};
      (settings || []).forEach(s => {
        const courseId = s.key.replace('course_folder_', '');
        folderMap[courseId] = s.value || '';
      });
      
      const coursesWithFolders = (data || []).map(c => ({
        ...c,
        drive_folder_id: folderMap[c.id] || null
      }));
      
      setCourses(coursesWithFolders);
    }
    setLoading(false);
  };

  const fetchCourseContent = async () => {
    setLoadingContent(true);
    try {
      const { data: modulesData } = await supabase
        .from('modules')
        .select('course_id, id');
      
      const { data: lessonsData } = await supabase
        .from('lessons')
        .select('module_id, duration_minutes');

      const contentMap: Record<string, CourseContent> = {};
      
      courses.forEach(course => {
        contentMap[course.id] = { moduleCount: 0, lessonCount: 0, totalHours: 0 };
      });

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

      const lessonsByModule: Record<string, { count: number; duration: number }> = {};
      (lessonsData || []).forEach(lesson => {
        if (!lessonsByModule[lesson.module_id]) {
          lessonsByModule[lesson.module_id] = { count: 0, duration: 0 };
        }
        lessonsByModule[lesson.module_id].count++;
        lessonsByModule[lesson.module_id].duration += lesson.duration_minutes || 0;
      });

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

  // Fetch expanded course modules/lessons
  const fetchExpandedCourseContent = async (courseId: string) => {
    if (expandedCourse === courseId) {
      // Collapse if already expanded
      setExpandedCourse(null);
      setExpandedModules([]);
      return;
    }
    
    setExpandedCourse(courseId);
    setLoadingExpanded(true);
    setExpandedModules([]);
    
    try {
      // Fetch modules for this course
      const { data: modules, error: modulesError } = await supabase
        .from('modules')
        .select('id, title, order_index')
        .eq('course_id', courseId)
        .order('order_index', { ascending: true });
      
      if (modulesError) throw modulesError;
      
      if (!modules || modules.length === 0) {
        setExpandedModules([]);
        return;
      }
      
      // Fetch lessons for all modules
      const { data: lessons, error: lessonsError } = await supabase
        .from('lessons')
        .select('id, title, duration_minutes, video_url, module_id, order_index')
        .in('module_id', modules.map(m => m.id))
        .order('order_index', { ascending: true });
      
      if (lessonsError) throw lessonsError;
      
      // Group lessons by module
      const modulesWithLessons: ModuleWithLessons[] = modules.map(mod => ({
        id: mod.id,
        title: mod.title,
        order_index: mod.order_index || 0,
        lessons: (lessons || [])
          .filter(l => l.module_id === mod.id)
          .map(l => ({
            id: l.id,
            title: l.title,
            duration_minutes: l.duration_minutes,
            video_url: l.video_url,
            order_index: l.order_index || 0
          }))
          .sort((a, b) => a.order_index - b.order_index)
      }));
      
      setExpandedModules(modulesWithLessons);
    } catch (err) {
      console.error('Failed to fetch course content:', err);
      toast.error('Failed to load course content');
    } finally {
      setLoadingExpanded(false);
    }
  };

  // Quick-scan a linked folder to verify it is readable and has content
  const handleQuickScanFolder = async (course: Course) => {
    if (!course.drive_folder_id) {
      toast.error('No folder linked to this course');
      return;
    }

    setScanningCourse(course.id);
    try {
      const { data, error } = await supabase.functions.invoke('scan-google-drive', {
        body: {
          folderId: course.drive_folder_id,
          action: 'quick-scan',
          maxDepth: 12, // Ultra-deep scan for complete content discovery
        },
      });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Quick scan failed');

      toast.success(`Folder scan: ${data.videoCount} videos, ${data.folderCount} folders`, {
        description: data.resourceCount ? `${data.resourceCount} resources` : undefined,
      });
    } catch (err: any) {
      toast.error(err?.message || 'Failed to scan folder');
    } finally {
      setScanningCourse(null);
    }
  };

  // Link folder to course
  const handleLinkFolder = async () => {
    if (!linkingCourse || !folderUrl.trim()) return;
    
    setLinking(true);
    try {
      // Extract folder ID from URL
      let folderId = folderUrl.trim();
      if (folderId.includes('drive.google.com')) {
        const match = folderId.match(/folders\/([a-zA-Z0-9_-]+)/);
        if (match) folderId = match[1];
      }
      
      // Save to site_settings
      const { error } = await supabase
        .from('site_settings')
        .upsert({
          key: `course_folder_${linkingCourse.id}`,
          value: folderId,
          description: `Google Drive folder for ${linkingCourse.title}`,
          updated_at: new Date().toISOString()
        }, { onConflict: 'key' });
      
      if (error) throw error;
      
      // Update local state
      const updatedCourse: Course = { ...linkingCourse, drive_folder_id: folderId };
      setCourses(prev => prev.map(c => (c.id === linkingCourse.id ? updatedCourse : c)));

      toast.success('Folder linked. Starting sync…');
      setLinkDialogOpen(false);
      setFolderUrl('');
      setLinkingCourse(null);

      // Immediately sync/import so it doesn't remain "Empty" after linking
      // (If Drive permissions/API are wrong, the sync toast will show the error)
      await handleSyncCourse(updatedCourse);
    } catch (err: any) {
      toast.error(err.message || 'Failed to link folder');
    } finally {
      setLinking(false);
    }
  };

  // Unlink folder from course
  const handleUnlinkFolder = async (course: Course) => {
    try {
      await supabase
        .from('site_settings')
        .delete()
        .eq('key', `course_folder_${course.id}`);
      
      setCourses(prev => prev.map(c => 
        c.id === course.id ? { ...c, drive_folder_id: null } : c
      ));
      
      toast.success('Folder unlinked');
    } catch (err) {
      toast.error('Failed to unlink folder');
    }
  };

  // Sync course from linked folder
  const handleSyncCourse = async (course: Course) => {
    if (!course.drive_folder_id) {
      toast.error('No folder linked to this course');
      return;
    }
    
    setSyncingCourse(course.id);
    try {
      const { data, error } = await supabase.functions.invoke('scan-google-drive', {
        body: {
          folderId: course.drive_folder_id,
          courseId: course.id,
          action: 'sync',
          maxDepth: 12 // Ultra-deep scan up to 12 levels
        }
      });
      
      if (error) throw error;
      
      if (data.success) {
        toast.success(`Synced: ${data.modulesCreated} modules, ${data.lessonsCreated} lessons`);
        fetchCourses();
        fetchCourseContent();
      } else {
        throw new Error(data.error || 'Sync failed');
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to sync course');
    } finally {
      setSyncingCourse(null);
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
    
    // Delete linked folder setting
    await supabase.from('site_settings').delete().eq('key', `course_folder_${courseId}`);
    
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

  // Get list of empty courses dynamically
  const emptyCourses = useMemo(() => {
    return courses.filter(course => {
      const content = courseContent[course.id];
      return !content || (content.moduleCount === 0 && content.lessonCount === 0);
    });
  }, [courses, courseContent]);

  // Delete all empty courses (courses with no modules/lessons)
  const handleDeleteEmptyCourses = async () => {
    if (emptyCourses.length === 0) {
      toast.info('No empty courses to delete');
      return;
    }

    setDeletingEmptyCourses(true);
    let deletedCount = 0;
    let failedCount = 0;

    try {
      const results = await Promise.allSettled(
        emptyCourses.map(async (course) => {
          // Delete any linked folder setting
          await supabase
            .from('site_settings')
            .delete()
            .eq('key', `course_folder_${course.id}`);
          
          // Delete course (modules/lessons already don't exist for empty courses)
          const { error } = await supabase
            .from('courses')
            .delete()
            .eq('id', course.id);
          
          if (error) throw error;
          return course.id;
        })
      );

      results.forEach((result) => {
        if (result.status === 'fulfilled') {
          deletedCount++;
        } else {
          failedCount++;
        }
      });

      if (deletedCount > 0) {
        toast.success(`Deleted ${deletedCount} empty course${deletedCount > 1 ? 's' : ''}`);
        fetchCourses();
      }
      if (failedCount > 0) {
        toast.error(`Failed to delete ${failedCount} course${failedCount > 1 ? 's' : ''}`);
      }
    } catch (err: any) {
      toast.error('Failed to delete empty courses');
    } finally {
      setDeletingEmptyCourses(false);
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

  const processedCourses = useMemo(() => {
    let result = [...courses];

    // Apply hide empty toggle first
    if (hideEmpty) {
      result = result.filter(course => {
        const content = courseContent[course.id];
        return content && (content.moduleCount > 0 || content.lessonCount > 0);
      });
    }

    if (searchTerm) {
      result = result.filter(course =>
        course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.slug.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

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
        if (activeFilters.has('linked')) passes = passes && !!course.drive_folder_id;
        if (activeFilters.has('unlinked')) passes = passes && !course.drive_folder_id;
        
        return passes;
      });
    }

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
        case 'linked':
          const linkedA = !!a.drive_folder_id;
          const linkedB = !!b.drive_folder_id;
          if (linkedA === linkedB) return (a.order_index || 0) - (b.order_index || 0);
          return linkedA ? -1 : 1;
        case 'unlinked':
          const unlinkedA = !a.drive_folder_id;
          const unlinkedB = !b.drive_folder_id;
          if (unlinkedA === unlinkedB) return (a.order_index || 0) - (b.order_index || 0);
          return unlinkedA ? -1 : 1;
        default:
          return (a.order_index || 0) - (b.order_index || 0);
      }
    });

    return result;
  }, [courses, searchTerm, sortBy, activeFilters, courseContent, hideEmpty]);

  const stats = useMemo(() => {
    const emptyCourses = courses.filter(c => {
      const content = courseContent[c.id];
      return !content || (content.moduleCount === 0 && content.lessonCount === 0);
    }).length;
    
    const coursesWithContent = courses.length - emptyCourses;
    const totalModules = Object.values(courseContent).reduce((sum, c) => sum + c.moduleCount, 0);
    const totalLessons = Object.values(courseContent).reduce((sum, c) => sum + c.lessonCount, 0);
    const linkedCourses = courses.filter(c => c.drive_folder_id).length;

    return {
      total: courses.length,
      published: courses.filter(c => c.is_published).length,
      draft: courses.filter(c => !c.is_published).length,
      featured: courses.filter(c => c.is_featured).length,
      empty: emptyCourses,
      withContent: coursesWithContent,
      totalModules,
      totalLessons,
      linked: linkedCourses,
      unlinked: courses.length - linkedCourses,
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
      {/* Stats Grid */}
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
        <Card className="bg-gradient-to-br from-green-600/10 to-green-600/5 border-green-600/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <span className="text-2xl font-bold">{stats.published}</span>
            </div>
            <div className="text-xs text-muted-foreground">Published</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-amber-600/10 to-amber-600/5 border-amber-600/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Star className="h-4 w-4 text-amber-600" />
              <span className="text-2xl font-bold">{stats.featured}</span>
            </div>
            <div className="text-xs text-muted-foreground">Featured</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-blue-600/10 to-blue-600/5 border-blue-600/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Link2 className="h-4 w-4 text-blue-600" />
              <span className="text-2xl font-bold">{stats.linked}</span>
            </div>
            <div className="text-xs text-muted-foreground">Linked</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-purple-600/10 to-purple-600/5 border-purple-600/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-purple-600" />
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
            <div className="text-xs text-muted-foreground">Empty</div>
          </CardContent>
        </Card>
      </div>

      {/* Controls Bar */}
      <Card className="border-border/50">
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search courses..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-background"
              />
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Hide Empty Toggle */}
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-muted/50 border border-border/50">
                <Switch 
                  id="hide-empty"
                  checked={hideEmpty}
                  onCheckedChange={setHideEmpty}
                  className="scale-90"
                />
                <Label htmlFor="hide-empty" className="text-xs font-medium cursor-pointer whitespace-nowrap">
                  Hide Empty ({stats.empty})
                </Label>
              </div>

              <Separator orientation="vertical" className="h-8 hidden lg:block" />

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
                  <SelectItem value="linked">Linked First</SelectItem>
                  <SelectItem value="unlinked">Unlinked First</SelectItem>
                </SelectContent>
              </Select>

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
                    <CheckCircle2 className="h-3 w-3 mr-2 text-green-600" />
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
                    <Star className="h-3 w-3 mr-2 text-amber-600" />
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
                    <Layers className="h-3 w-3 mr-2 text-blue-600" />
                    Has Content
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuCheckboxItem
                    checked={activeFilters.has('linked')}
                    onCheckedChange={() => toggleFilter('linked')}
                  >
                    <Link2 className="h-3 w-3 mr-2 text-green-600" />
                    Linked to Drive
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={activeFilters.has('unlinked')}
                    onCheckedChange={() => toggleFilter('unlinked')}
                  >
                    <Unlink className="h-3 w-3 mr-2 text-muted-foreground" />
                    Not Linked
                  </DropdownMenuCheckboxItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Separator orientation="vertical" className="h-8 hidden lg:block" />

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

              {/* Delete Empty Courses Button - shown when there are empty courses */}
              {emptyCourses.length > 0 && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="gap-2 border-destructive/50 text-destructive hover:bg-destructive/10"
                      disabled={deletingEmptyCourses}
                    >
                      {deletingEmptyCourses ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                      Delete Empty ({emptyCourses.length})
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete All Empty Courses?</AlertDialogTitle>
                      <AlertDialogDescription className="space-y-2">
                        <span className="block">
                          This will permanently delete <span className="font-semibold text-destructive">{emptyCourses.length}</span> course{emptyCourses.length > 1 ? 's' : ''} that have no modules or lessons.
                        </span>
                        <span className="block text-xs text-muted-foreground mt-2">
                          Courses to be deleted:
                        </span>
                        <div className="max-h-32 overflow-y-auto bg-muted/50 rounded-md p-2 text-xs">
                          {emptyCourses.slice(0, 10).map(c => (
                            <div key={c.id} className="py-0.5 truncate">{c.title}</div>
                          ))}
                          {emptyCourses.length > 10 && (
                            <div className="py-0.5 text-muted-foreground">...and {emptyCourses.length - 10} more</div>
                          )}
                        </div>
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction 
                        onClick={handleDeleteEmptyCourses}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Delete {emptyCourses.length} Empty Course{emptyCourses.length > 1 ? 's' : ''}
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
              const isLinked = !!course.drive_folder_id;
              const isExpanded = expandedCourse === course.id;
              
              return (
                <div key={course.id} className="border-b border-border last:border-b-0">
                  <div 
                    className={`flex items-center gap-3 p-3 transition-colors hover:bg-muted/30 ${
                      selectedCourses.has(course.id) ? 'bg-primary/5' : ''
                    }`}
                  >
                    <Checkbox
                      checked={selectedCourses.has(course.id)}
                      onCheckedChange={() => toggleCourseSelection(course.id)}
                      className="shrink-0"
                    />

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

                    {/* Expand/Collapse Button */}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0"
                      onClick={() => fetchExpandedCourseContent(course.id)}
                    >
                      {loadingExpanded && isExpanded ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <ChevronRight className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                      )}
                    </Button>

                    <div className="w-14 h-10 rounded bg-muted flex items-center justify-center overflow-hidden shrink-0 border border-border">
                      {course.thumbnail_url ? (
                        <img src={course.thumbnail_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <ImageIcon className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium truncate max-w-[200px]">{course.title}</span>
                        {course.is_featured && (
                          <Star className="h-3 w-3 text-amber-600 fill-amber-600 shrink-0" />
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

                    {/* Content Badge - Clickable to expand */}
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div 
                          className="shrink-0 cursor-pointer"
                          onClick={() => fetchExpandedCourseContent(course.id)}
                        >
                          {hasContent ? (
                            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30 gap-1 hover:bg-primary/20 transition-colors">
                              <Layers className="h-3 w-3" />
                              {content.moduleCount}M / {content.lessonCount}L
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/30 gap-1">
                              <AlertCircle className="h-3 w-3" />
                              Empty
                            </Badge>
                          )}
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        {hasContent 
                          ? `Click to ${isExpanded ? 'collapse' : 'view'} content: ${content.moduleCount} modules, ${content.lessonCount} lessons`
                          : 'No content imported yet'
                        }
                      </TooltipContent>
                    </Tooltip>

                    {/* Link Status Badge */}
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="shrink-0">
                          {isLinked ? (
                            <Badge variant="outline" className="bg-green-600/10 text-green-600 border-green-600/30 gap-1 cursor-pointer" onClick={() => window.open(`https://drive.google.com/drive/folders/${course.drive_folder_id}`, '_blank')}>
                              <Link2 className="h-3 w-3" />
                              Linked
                              <ExternalLink className="h-2.5 w-2.5 ml-0.5" />
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-muted text-muted-foreground border-border gap-1">
                              <Unlink className="h-3 w-3" />
                              Unlinked
                            </Badge>
                          )}
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        {isLinked ? 'Click to open linked folder' : 'No Google Drive folder linked'}
                      </TooltipContent>
                    </Tooltip>

                    {/* Actions */}
                    <div className="flex items-center gap-1 shrink-0">
                      {/* Link/Unlink folder */}
                      {isLinked ? (
                        <>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleQuickScanFolder(course)}
                              disabled={scanningCourse === course.id}
                            >
                              {scanningCourse === course.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Search className="h-4 w-4 text-muted-foreground" />
                              )}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Scan folder (counts videos)</TooltipContent>
                        </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => handleSyncCourse(course)}
                                disabled={syncingCourse === course.id}
                              >
                                {syncingCourse === course.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <FolderSync className="h-4 w-4 text-green-600" />
                                )}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Sync from Drive (6 levels deep)</TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => handleUnlinkFolder(course)}
                              >
                                <Unlink className="h-4 w-4 text-muted-foreground" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Unlink folder</TooltipContent>
                          </Tooltip>
                        </>
                      ) : (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => {
                                setLinkingCourse(course);
                                setLinkDialogOpen(true);
                              }}
                            >
                              <Link2 className="h-4 w-4 text-primary" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Link Google Drive folder</TooltipContent>
                        </Tooltip>
                      )}

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleTogglePublish(course)}
                          >
                            {course.is_published ? (
                              <Eye className="h-4 w-4 text-green-600" />
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
                            <Star className={`h-4 w-4 ${course.is_featured ? 'text-amber-600 fill-amber-600' : 'text-muted-foreground'}`} />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>{course.is_featured ? 'Remove featured' : 'Feature'}</TooltipContent>
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
                                <FolderX className="h-4 w-4 text-orange-600" />
                              )}
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Course Content?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will delete {content.moduleCount} modules and {content.lessonCount} lessons from "{course.title}".
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
                  
                  {/* Expanded Content Preview */}
                  {isExpanded && (
                    <div className="bg-muted/30 border-t border-border px-4 py-3">
                      {loadingExpanded ? (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground py-4 justify-center">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Loading content...
                        </div>
                      ) : expandedModules.length === 0 ? (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground py-4 justify-center">
                          <AlertCircle className="h-4 w-4" />
                          No modules or lessons found for this course
                        </div>
                      ) : (
                        <div className="space-y-3 max-h-[400px] overflow-y-auto">
                          {expandedModules.map((module, modIndex) => (
                            <div key={module.id} className="bg-background rounded-lg border border-border overflow-hidden">
                              <div className="flex items-center gap-3 p-3 bg-muted/50">
                                <Badge variant="outline" className="shrink-0 bg-primary/10 text-primary border-primary/30">
                                  M{modIndex + 1}
                                </Badge>
                                <span className="font-medium text-sm flex-1 truncate">{module.title}</span>
                                <Badge variant="secondary" className="text-xs">
                                  {module.lessons.length} lessons
                                </Badge>
                              </div>
                              {module.lessons.length > 0 && (
                                <div className="divide-y divide-border">
                                  {module.lessons.map((lesson, lessonIndex) => (
                                    <div key={lesson.id} className="flex items-center gap-3 p-2 pl-4 text-sm hover:bg-muted/30 transition-colors">
                                      <div className="flex items-center gap-2 shrink-0 w-16 text-muted-foreground">
                                        <span className="text-xs">{modIndex + 1}.{lessonIndex + 1}</span>
                                      </div>
                                      <div className="flex items-center gap-2 shrink-0">
                                        {lesson.video_url ? (
                                          <Video className="h-3.5 w-3.5 text-green-600" />
                                        ) : (
                                          <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                                        )}
                                      </div>
                                      <span className="flex-1 truncate">{lesson.title}</span>
                                      <span className="text-xs text-muted-foreground shrink-0">
                                        {lesson.duration_minutes ? `${lesson.duration_minutes} min` : '-'}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
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

      {/* Link Folder Dialog */}
      <Dialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Link Google Drive Folder</DialogTitle>
            <DialogDescription>
              Paste a Google Drive folder URL to link it to "{linkingCourse?.title}". 
              The scanner will traverse up to 6 levels deep to find all videos.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Input
              placeholder="https://drive.google.com/drive/folders/..."
              value={folderUrl}
              onChange={(e) => setFolderUrl(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Make sure the folder is shared with "Anyone with the link" permission.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLinkDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleLinkFolder} disabled={linking || !folderUrl.trim()}>
              {linking && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Link Folder
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
