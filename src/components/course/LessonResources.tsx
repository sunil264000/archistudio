import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, FileText, File, Image, FileArchive, Loader2 } from 'lucide-react';
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

// Video file types that should NOT be downloadable
const VIDEO_TYPES = [
  'video/mp4', 'video/avi', 'video/mkv', 'video/quicktime', 
  'video/x-ms-wmv', 'video/x-flv', 'video/webm', 'video/x-m4v', 
  'video/mpeg', 'video/3gpp', 'video/ogg'
];

const VIDEO_EXTENSIONS = ['.mp4', '.avi', '.mkv', '.mov', '.wmv', '.flv', '.webm', '.m4v', '.mpeg', '.mpg', '.3gp'];

function isVideoResource(resource: LessonResource): boolean {
  // Check by mime type
  if (resource.file_type && VIDEO_TYPES.includes(resource.file_type)) {
    return true;
  }
  // Check by extension
  const lowerName = resource.title.toLowerCase();
  return VIDEO_EXTENSIONS.some(ext => lowerName.endsWith(ext));
}

function getFileIcon(fileType: string | null, fileName: string) {
  const type = fileType?.toLowerCase() || '';
  const name = fileName.toLowerCase();
  
  if (type.includes('pdf') || name.endsWith('.pdf')) {
    return <FileText className="h-4 w-4 text-destructive" />;
  }
  if (type.includes('image') || name.match(/\.(jpg|jpeg|png|gif|webp|svg)$/)) {
    return <Image className="h-4 w-4 text-primary" />;
  }
  if (type.includes('zip') || name.match(/\.(zip|rar|7z|tar|gz)$/)) {
    return <FileArchive className="h-4 w-4 text-warning" />;
  }
  return <File className="h-4 w-4 text-muted-foreground" />;
}

function formatFileSize(bytes: number | null): string {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function LessonResources({ lessonId, isEnrolled }: LessonResourcesProps) {
  const [resources, setResources] = useState<LessonResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState<string | null>(null);

  useEffect(() => {
    fetchResources();
  }, [lessonId]);

  const fetchResources = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('lesson_resources')
      .select('id, title, file_url, file_type, file_size_bytes')
      .eq('lesson_id', lessonId);

    if (error) {
      console.error('Failed to fetch resources:', error);
    } else {
      // Filter out video files
      const nonVideoResources = (data || []).filter(r => !isVideoResource(r));
      setResources(nonVideoResources);
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
      // If it's a Google Drive URL, open directly
      if (resource.file_url.includes('drive.google.com')) {
        window.open(resource.file_url, '_blank');
      } else {
        // For Supabase storage
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2 className="h-4 w-4 animate-spin" />
      </div>
    );
  }

  if (resources.length === 0) {
    return null; // Don't show anything if no resources
  }

  return (
    <Card className="mt-4">
      <CardHeader className="py-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Download className="h-4 w-4" />
          Downloadable Resources
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-2">
          {resources.map((resource) => (
            <div 
              key={resource.id}
              className="flex items-center justify-between p-2 rounded-md bg-muted/50 hover:bg-muted transition-colors"
            >
              <div className="flex items-center gap-2 min-w-0">
                {getFileIcon(resource.file_type, resource.title)}
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{resource.title}</p>
                  {resource.file_size_bytes && (
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(resource.file_size_bytes)}
                    </p>
                  )}
                </div>
              </div>
              <Button 
                variant="ghost" 
                size="sm"
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
          ))}
        </div>
        {!isEnrolled && (
          <p className="text-xs text-muted-foreground mt-2 text-center">
            Enroll to download resources
          </p>
        )}
      </CardContent>
    </Card>
  );
}
