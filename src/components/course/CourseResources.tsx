import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Download, FileText, File, Image, FileArchive, Loader2,
  Subtitles, FileSpreadsheet, Presentation, Search, Filter
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

interface CourseResource {
  id: string;
  title: string;
  file_url: string;
  file_type: string | null;
  file_size_bytes: number | null;
  lesson_title: string;
  module_title: string;
}

interface CourseResourcesProps {
  courseId: string;
  isEnrolled: boolean;
}

type FileCategory = 'pdf' | 'archive' | 'subtitle' | 'document' | 'presentation' | 'image' | 'spreadsheet' | 'other';

const VIDEO_EXTENSIONS = ['.mp4', '.avi', '.mkv', '.mov', '.wmv', '.flv', '.webm', '.m4v', '.mpeg', '.mpg', '.3gp'];

function isVideoFile(name: string, type: string | null): boolean {
  if (type?.startsWith('video/')) return true;
  return VIDEO_EXTENSIONS.some(ext => name.toLowerCase().endsWith(ext));
}

function getFileCategory(fileType: string | null, fileName: string): FileCategory {
  const type = fileType?.toLowerCase() || '';
  const name = fileName.toLowerCase();
  if (type.includes('pdf') || name.endsWith('.pdf')) return 'pdf';
  if (type.includes('zip') || name.match(/\.(zip|rar|7z|tar|gz)$/)) return 'archive';
  if (name.match(/\.(srt|vtt|sub|ass|ssa)$/)) return 'subtitle';
  if (type.includes('image') || name.match(/\.(jpg|jpeg|png|gif|webp|svg|bmp)$/)) return 'image';
  if (type.includes('word') || name.match(/\.(doc|docx)$/)) return 'document';
  if (type.includes('presentation') || name.match(/\.(ppt|pptx)$/)) return 'presentation';
  if (type.includes('spreadsheet') || name.match(/\.(xls|xlsx|csv)$/)) return 'spreadsheet';
  return 'other';
}

function getFileIcon(category: FileCategory, size = 'h-4 w-4') {
  const iconMap: Record<FileCategory, JSX.Element> = {
    pdf: <FileText className={`${size} text-red-500`} />,
    archive: <FileArchive className={`${size} text-amber-500`} />,
    subtitle: <Subtitles className={`${size} text-blue-500`} />,
    image: <Image className={`${size} text-emerald-500`} />,
    document: <FileText className={`${size} text-blue-600`} />,
    presentation: <Presentation className={`${size} text-orange-500`} />,
    spreadsheet: <FileSpreadsheet className={`${size} text-green-600`} />,
    other: <File className={`${size} text-muted-foreground`} />,
  };
  return iconMap[category];
}

const CATEGORY_LABELS: Record<FileCategory, string> = {
  pdf: 'PDFs', archive: 'Project Files', subtitle: 'Subtitles', image: 'Images',
  document: 'Documents', presentation: 'Presentations', spreadsheet: 'Spreadsheets', other: 'Other Files'
};

function formatFileSize(bytes: number | null): string {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function CourseResources({ courseId, isEnrolled }: CourseResourcesProps) {
  const [resources, setResources] = useState<CourseResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FileCategory | 'all'>('all');
  const [resourceLink, setResourceLink] = useState<string | null>(null);
  const [requestPending, setRequestPending] = useState(false);
  const [requesting, setRequesting] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    fetchAllResources();
    fetchCourseResourceStatus();
  }, [courseId, user, isEnrolled]);

  const fetchCourseResourceStatus = async () => {
    if (!courseId) return;
    
    // Get course resource link
    const { data: course } = await supabase
      .from('courses')
      .select('resource_link')
      .eq('id', courseId)
      .single();
    
    setResourceLink(course?.resource_link || null);

    // If no link, check if already requested
    if (isEnrolled && user && !course?.resource_link) {
      const { data } = await supabase
        .from('course_resource_requests')
        .select('id')
        .eq('course_id', courseId)
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (data) setRequestPending(true);
    }
  };

  const handleRequestProjectFiles = async () => {
    if (!user || !isEnrolled) {
      toast.error('Please enroll to request project files');
      return;
    }
    setRequesting(true);
    try {
      const { error } = await supabase
        .from('course_resource_requests')
        .insert({ course_id: courseId, user_id: user.id });
      
      if (error) throw error;
      setRequestPending(true);
      toast.success('Project files requested successfully! The admin will provide the link soon.');
    } catch (err: any) {
      toast.error('Failed to request files');
    } finally {
      setRequesting(false);
    }
  };

  const fetchAllResources = async () => {
    setLoading(true);
    
    // Get all modules for this course
    const { data: modules } = await supabase
      .from('modules')
      .select('id, title')
      .eq('course_id', courseId)
      .order('order_index');

    if (!modules || modules.length === 0) {
      setLoading(false);
      return;
    }

    const moduleIds = modules.map(m => m.id);
    const moduleMap = Object.fromEntries(modules.map(m => [m.id, m.title]));

    // Get all lessons for these modules
    const { data: lessons } = await supabase
      .from('lessons')
      .select('id, title, module_id')
      .in('module_id', moduleIds)
      .order('order_index');

    if (!lessons || lessons.length === 0) {
      setLoading(false);
      return;
    }

    const lessonIds = lessons.map(l => l.id);
    const lessonMap = Object.fromEntries(lessons.map(l => [l.id, { title: l.title, module_id: l.module_id }]));

    // Get all resources
    const { data: resourceData } = await supabase
      .from('lesson_resources')
      .select('id, title, file_url, file_type, file_size_bytes, lesson_id')
      .in('lesson_id', lessonIds);

    const allResources: CourseResource[] = (resourceData || [])
      .filter(r => !isVideoFile(r.title, r.file_type))
      .map(r => {
        const lesson = lessonMap[r.lesson_id] || { title: 'Unknown', module_id: '' };
        return {
          id: r.id,
          title: r.title,
          file_url: r.file_url,
          file_type: r.file_type,
          file_size_bytes: r.file_size_bytes,
          lesson_title: lesson.title,
          module_title: moduleMap[lesson.module_id] || 'Unknown Module',
        };
      });

    setResources(allResources);
    setLoading(false);
  };

  const handleDownload = async (resource: CourseResource) => {
    if (!isEnrolled) {
      toast.error('Please enroll to download resources');
      return;
    }
    setDownloading(resource.id);
    try {
      if (resource.file_url.includes('drive.google.com')) {
        window.open(resource.file_url, '_blank');
      } else {
        const { data, error } = await supabase.storage
          .from('lesson-resources')
          .createSignedUrl(resource.file_url, 60);
        if (error) throw error;
        window.open(data.signedUrl, '_blank');
      }
    } catch (error: any) {
      toast.error('Download failed: ' + error.message);
    } finally {
      setDownloading(null);
    }
  };

  // Category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: resources.length };
    resources.forEach(r => {
      const cat = getFileCategory(r.file_type, r.title);
      counts[cat] = (counts[cat] || 0) + 1;
    });
    return counts;
  }, [resources]);

  // Filtered + searched
  const filteredResources = useMemo(() => {
    return resources.filter(r => {
      const cat = getFileCategory(r.file_type, r.title);
      if (activeFilter !== 'all' && cat !== activeFilter) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return r.title.toLowerCase().includes(q) || r.module_title.toLowerCase().includes(q) || r.lesson_title.toLowerCase().includes(q);
      }
      return true;
    });
  }, [resources, activeFilter, searchQuery]);

  // Group by module
  const groupedByModule = useMemo(() => {
    const grouped: Record<string, CourseResource[]> = {};
    filteredResources.forEach(r => {
      if (!grouped[r.module_title]) grouped[r.module_title] = [];
      grouped[r.module_title].push(r);
    });
    return grouped;
  }, [filteredResources]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (resources.length === 0) {
    return (
      <div className="text-center py-12">
        <FileArchive className="h-12 w-12 mx-auto mb-3 text-muted-foreground/40" />
        <p className="text-muted-foreground text-sm">No downloadable resources for this course yet.</p>
      </div>
    );
  }

  const activeCategories = Object.entries(categoryCounts).filter(([k, v]) => k !== 'all' && v > 0);

  return (
    <div className="space-y-6">
      {/* Course-wide Project Files Section */}
      {isEnrolled && (
        <div className="p-4 rounded-xl border border-accent/20 bg-accent/5 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-bold flex items-center gap-2">
                <FileArchive className="h-4 w-4 text-accent" />
                Course Project Files
              </h4>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                Full project folders, source files, and primary assets.
              </p>
            </div>
          </div>

          {resourceLink ? (
            <Button 
              className="w-full gap-2 shadow-lg shadow-accent/20 bg-accent hover:bg-accent/90" 
              onClick={() => window.open(resourceLink, '_blank')}
            >
              <Download className="h-4 w-4" />
              Download All Project Files
            </Button>
          ) : requestPending ? (
            <div className="text-center p-3 rounded-lg border border-dashed border-accent/30 bg-accent/5">
              <Loader2 className="h-5 w-5 text-accent mx-auto mb-1 animate-pulse" />
              <p className="text-xs font-medium text-accent">Request Pending</p>
              <p className="text-[9px] text-muted-foreground mt-1">
                The admin is preparing your files. You'll be notified soon.
              </p>
            </div>
          ) : (
            <Button 
              variant="outline" 
              className="w-full gap-2 border-accent/30 text-accent hover:bg-accent/10"
              onClick={handleRequestProjectFiles}
              disabled={requesting}
            >
              {requesting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              Request Access to Project Files
            </Button>
          )}
        </div>
      )}

      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-muted-foreground" />
          <h4 className="text-sm font-semibold">Lesson Attachments</h4>
        </div>
      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search resources..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-9 h-9 text-sm"
          />
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="flex flex-wrap gap-1.5">
        <button
          onClick={() => setActiveFilter('all')}
          className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
            activeFilter === 'all'
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted hover:bg-muted/80 text-muted-foreground'
          }`}
        >
          All ({categoryCounts.all})
        </button>
        {activeCategories.map(([cat, count]) => (
          <button
            key={cat}
            onClick={() => setActiveFilter(cat as FileCategory)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors flex items-center gap-1.5 ${
              activeFilter === cat
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted hover:bg-muted/80 text-muted-foreground'
            }`}
          >
            {getFileIcon(cat as FileCategory, 'h-3 w-3')}
            {CATEGORY_LABELS[cat as FileCategory]} ({count})
          </button>
        ))}
      </div>

      {/* Resources grouped by module */}
      <ScrollArea className="max-h-[60vh]">
        <div className="space-y-4">
          {Object.entries(groupedByModule).map(([moduleName, moduleResources]) => (
            <div key={moduleName}>
              <div className="flex items-center gap-2 mb-2">
                <div className="h-px flex-1 bg-border" />
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold px-2">
                  {moduleName}
                </span>
                <div className="h-px flex-1 bg-border" />
              </div>

              <div className="space-y-1">
                {moduleResources.map(resource => {
                  const cat = getFileCategory(resource.file_type, resource.title);
                  return (
                    <div
                      key={resource.id}
                      className="flex items-center justify-between p-2.5 rounded-lg bg-muted/20 hover:bg-muted/40 transition-colors group"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="w-9 h-9 rounded-lg bg-muted/50 flex items-center justify-center shrink-0">
                          {getFileIcon(cat)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium truncate">{resource.title}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] text-muted-foreground truncate">{resource.lesson_title}</span>
                            {resource.file_size_bytes && (
                              <>
                                <span className="text-[10px] text-muted-foreground">•</span>
                                <span className="text-[10px] text-muted-foreground">{formatFileSize(resource.file_size_bytes)}</span>
                              </>
                            )}
                            <Badge variant="outline" className="text-[8px] px-1 py-0 shrink-0">
                              {CATEGORY_LABELS[cat]}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 opacity-60 group-hover:opacity-100 shrink-0"
                        onClick={() => handleDownload(resource)}
                        disabled={downloading === resource.id || !isEnrolled}
                      >
                        {downloading === resource.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Download className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      {!isEnrolled && (
        <div className="text-center p-4 rounded-lg bg-muted/20 border border-border/30">
          <p className="text-sm text-muted-foreground">Enroll in this course to download all resources</p>
        </div>
      )}
    </div>
  );
}
