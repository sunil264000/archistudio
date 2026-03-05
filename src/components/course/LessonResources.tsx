import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Download, FileText, File, Image, FileArchive, Loader2,
  Eye, Subtitles, FileSpreadsheet, Presentation, FileCode,
  ExternalLink
} from 'lucide-react';
import { toast } from 'sonner';

interface LessonResource {
  id: string;
  title: string;
  file_url: string;
  file_type: string | null;
  file_size_bytes: number | null;
}

interface LessonResourcesProps {
  lessonId: string;
  isEnrolled: boolean;
}

const VIDEO_TYPES = [
  'video/mp4', 'video/avi', 'video/mkv', 'video/quicktime',
  'video/x-ms-wmv', 'video/x-flv', 'video/webm', 'video/x-m4v',
  'video/mpeg', 'video/3gpp', 'video/ogg'
];
const VIDEO_EXTENSIONS = ['.mp4', '.avi', '.mkv', '.mov', '.wmv', '.flv', '.webm', '.m4v', '.mpeg', '.mpg', '.3gp'];

function isVideoResource(resource: LessonResource): boolean {
  if (resource.file_type && VIDEO_TYPES.includes(resource.file_type)) return true;
  const lowerName = resource.title.toLowerCase();
  return VIDEO_EXTENSIONS.some(ext => lowerName.endsWith(ext));
}

type FileCategory = 'pdf' | 'archive' | 'subtitle' | 'document' | 'presentation' | 'image' | 'spreadsheet' | 'other';

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

function getFileIcon(category: FileCategory) {
  switch (category) {
    case 'pdf': return <FileText className="h-4 w-4 text-red-500" />;
    case 'archive': return <FileArchive className="h-4 w-4 text-amber-500" />;
    case 'subtitle': return <Subtitles className="h-4 w-4 text-blue-500" />;
    case 'image': return <Image className="h-4 w-4 text-emerald-500" />;
    case 'document': return <FileText className="h-4 w-4 text-blue-600" />;
    case 'presentation': return <Presentation className="h-4 w-4 text-orange-500" />;
    case 'spreadsheet': return <FileSpreadsheet className="h-4 w-4 text-green-600" />;
    default: return <File className="h-4 w-4 text-muted-foreground" />;
  }
}

function getCategoryLabel(category: FileCategory): string {
  const labels: Record<FileCategory, string> = {
    pdf: 'PDF', archive: 'Archive', subtitle: 'Subtitle', image: 'Image',
    document: 'Document', presentation: 'Slides', spreadsheet: 'Spreadsheet', other: 'File'
  };
  return labels[category];
}

function formatFileSize(bytes: number | null): string {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function SRTPreview({ url, title }: { url: string; title: string }) {
  const [content, setContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(url);
        if (res.ok) setContent(await res.text());
      } catch { /* ignore */ }
      setLoading(false);
    })();
  }, [url]);

  if (loading) return <div className="flex items-center justify-center py-8"><Loader2 className="h-5 w-5 animate-spin" /></div>;
  if (!content) return <p className="text-sm text-muted-foreground py-4">Could not load subtitle file.</p>;

  return (
    <ScrollArea className="h-[60vh]">
      <pre className="text-xs whitespace-pre-wrap font-mono p-4 bg-muted/30 rounded-lg">{content}</pre>
    </ScrollArea>
  );
}

export function LessonResources({ lessonId, isEnrolled }: LessonResourcesProps) {
  const [resources, setResources] = useState<LessonResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [previewResource, setPreviewResource] = useState<LessonResource | null>(null);

  useEffect(() => {
    fetchResources();
  }, [lessonId]);

  const fetchResources = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('lesson_resources')
      .select('id, title, file_url, file_type, file_size_bytes')
      .eq('lesson_id', lessonId);

    if (!error) {
      setResources((data || []).filter(r => !isVideoResource(r)));
    }
    setLoading(false);
  };

  const handleDownload = async (resource: LessonResource) => {
    if (!isEnrolled) {
      toast.error('Please enroll in this course to download resources');
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
      toast.success('Download started');
    } catch (error: any) {
      toast.error('Download failed: ' + error.message);
    } finally {
      setDownloading(null);
    }
  };

  const canPreview = (resource: LessonResource): boolean => {
    const cat = getFileCategory(resource.file_type, resource.title);
    return cat === 'subtitle' || cat === 'image';
  };

  if (loading) {
    return <div className="flex items-center justify-center py-4"><Loader2 className="h-4 w-4 animate-spin" /></div>;
  }

  if (resources.length === 0) return null;

  // Group by category
  const grouped = resources.reduce((acc, r) => {
    const cat = getFileCategory(r.file_type, r.title);
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(r);
    return acc;
  }, {} as Record<FileCategory, LessonResource[]>);

  return (
    <Card className="mt-4 border-border/50">
      <CardHeader className="py-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Download className="h-4 w-4" />
          Lesson Resources
          <Badge variant="secondary" className="text-[10px]">{resources.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-3">
          {Object.entries(grouped).map(([category, items]) => (
            <div key={category}>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1.5">
                {getCategoryLabel(category as FileCategory)}s
              </p>
              <div className="space-y-1">
                {items.map((resource) => {
                  const cat = getFileCategory(resource.file_type, resource.title);
                  return (
                    <div
                      key={resource.id}
                      className="flex items-center justify-between p-2.5 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors border border-transparent hover:border-border/30"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {getFileIcon(cat)}
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{resource.title}</p>
                          <div className="flex items-center gap-2">
                            {resource.file_size_bytes && (
                              <p className="text-[10px] text-muted-foreground">{formatFileSize(resource.file_size_bytes)}</p>
                            )}
                            <Badge variant="outline" className="text-[9px] px-1.5 py-0">
                              {getCategoryLabel(cat)}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        {canPreview(resource) && isEnrolled && (
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setPreviewResource(resource)}>
                                <Eye className="h-3.5 w-3.5" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                              <DialogHeader>
                                <DialogTitle className="text-sm flex items-center gap-2">
                                  {getFileIcon(cat)}
                                  {resource.title}
                                </DialogTitle>
                              </DialogHeader>
                              {cat === 'subtitle' && <SRTPreview url={resource.file_url} title={resource.title} />}
                              {cat === 'image' && (
                                <div className="flex items-center justify-center p-4">
                                  <img src={resource.file_url} alt={resource.title} className="max-h-[60vh] rounded-lg object-contain" />
                                </div>
                              )}
                            </DialogContent>
                          </Dialog>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => handleDownload(resource)}
                          disabled={downloading === resource.id || !isEnrolled}
                        >
                          {downloading === resource.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Download className="h-3.5 w-3.5" />
                          )}
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
        {!isEnrolled && (
          <p className="text-xs text-muted-foreground mt-3 text-center">
            Enroll to download resources
          </p>
        )}
      </CardContent>
    </Card>
  );
}
