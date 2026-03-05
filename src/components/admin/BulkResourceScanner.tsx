import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import {
  FolderSync, Loader2, CheckCircle2, AlertTriangle, FileArchive,
  Play, Pause, RotateCcw, Info
} from 'lucide-react';

interface Course {
  id: string;
  title: string;
  slug: string;
}

interface ScanResult {
  courseId: string;
  courseTitle: string;
  resourcesCreated: number;
  skipped: number;
  modulesMatched: number;
  errors: string[];
  status: 'pending' | 'scanning' | 'done' | 'error';
}

interface BulkResourceScannerProps {
  courses: Course[];
}

export function BulkResourceScanner({ courses }: BulkResourceScannerProps) {
  const [parentFolderUrl, setParentFolderUrl] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [scanResults, setScanResults] = useState<ScanResult[]>([]);
  const [progress, setProgress] = useState({ current: 0, total: 0 });

  const handleBulkScan = async () => {
    if (!parentFolderUrl.trim()) {
      toast.error('Please paste the parent Google Drive folder URL');
      return;
    }

    setIsScanning(true);
    setScanResults([]);

    try {
      // First scan the parent folder to get subfolders
      const { data: scanData, error: scanError } = await supabase.functions.invoke('scan-google-drive', {
        body: { folderId: parentFolderUrl, scanMode: 'bulk-parent', maxDepth: 4 },
      });

      if (scanError || !scanData?.success) {
        throw new Error(scanData?.error || scanError?.message || 'Scan failed');
      }

      const folders = scanData.structure.folders || [];
      
      // Match folders to courses
      const matchedPairs: { folderId: string; folderName: string; course: Course }[] = [];
      
      for (const folder of folders) {
        const normalizedFolder = folder.name.toLowerCase().trim().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ');
        
        const match = courses.find(c => {
          const normalizedTitle = c.title.toLowerCase().trim().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ');
          const normalizedSlug = c.slug.replace(/-/g, ' ');
          return normalizedTitle === normalizedFolder || normalizedSlug === normalizedFolder
            || normalizedTitle.includes(normalizedFolder) || normalizedFolder.includes(normalizedTitle);
        });

        if (match) {
          matchedPairs.push({ folderId: folder.id, folderName: folder.name, course: match });
        }
      }

      if (matchedPairs.length === 0) {
        toast.warning('No folders matched any existing courses');
        setIsScanning(false);
        return;
      }

      // Initialize results
      const initialResults: ScanResult[] = matchedPairs.map(p => ({
        courseId: p.course.id,
        courseTitle: p.course.title,
        resourcesCreated: 0,
        skipped: 0,
        modulesMatched: 0,
        errors: [],
        status: 'pending',
      }));
      setScanResults(initialResults);
      setProgress({ current: 0, total: matchedPairs.length });

      // Process each matched pair sequentially
      for (let i = 0; i < matchedPairs.length; i++) {
        const pair = matchedPairs[i];
        
        setScanResults(prev => prev.map((r, idx) => 
          idx === i ? { ...r, status: 'scanning' } : r
        ));

        try {
          const { data, error } = await supabase.functions.invoke('scan-google-drive', {
            body: {
              folderId: pair.folderId,
              courseId: pair.course.id,
              action: 'sync-resources',
              maxDepth: 6,
            },
          });

          if (error || !data?.success) {
            throw new Error(data?.error || error?.message || 'Sync failed');
          }

          setScanResults(prev => prev.map((r, idx) =>
            idx === i ? {
              ...r,
              resourcesCreated: data.resourcesCreated || 0,
              skipped: data.skipped || 0,
              modulesMatched: data.modulesMatched || 0,
              errors: data.errors || [],
              status: 'done',
            } : r
          ));
        } catch (err: any) {
          setScanResults(prev => prev.map((r, idx) =>
            idx === i ? { ...r, errors: [err.message], status: 'error' } : r
          ));
        }

        setProgress({ current: i + 1, total: matchedPairs.length });
      }

      const totalCreated = matchedPairs.length; // will be updated by state
      toast.success(`Bulk resource scan complete for ${matchedPairs.length} courses`);
    } catch (err: any) {
      toast.error(err.message || 'Bulk scan failed');
    } finally {
      setIsScanning(false);
    }
  };

  const totalCreated = scanResults.reduce((s, r) => s + r.resourcesCreated, 0);
  const totalSkipped = scanResults.reduce((s, r) => s + r.skipped, 0);
  const totalDone = scanResults.filter(r => r.status === 'done').length;
  const totalErrors = scanResults.filter(r => r.status === 'error').length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FolderSync className="h-5 w-5 text-primary" />
          Bulk Resource Scanner
        </CardTitle>
        <CardDescription>
          Scan a parent Google Drive folder and automatically attach resources (PDFs, ZIPs, SRTs, etc.) to all matching courses.
          This only syncs resources — it won't touch existing videos or lessons.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-500/5 border border-blue-500/15">
          <Info className="h-4 w-4 text-blue-400 mt-0.5 shrink-0" />
          <p className="text-xs text-muted-foreground leading-relaxed">
            The parent folder should contain subfolders named after your courses. Each subfolder's resources (non-video files)
            will be automatically matched to the correct course module and linked to the first lesson of each module.
          </p>
        </div>

        <div className="flex gap-2">
          <Input
            placeholder="https://drive.google.com/drive/folders/... (parent folder)"
            value={parentFolderUrl}
            onChange={e => setParentFolderUrl(e.target.value)}
            disabled={isScanning}
            className="text-sm"
          />
          <Button
            onClick={handleBulkScan}
            disabled={isScanning || !parentFolderUrl.trim()}
            className="shrink-0 gap-2"
          >
            {isScanning ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Scanning...</>
            ) : (
              <><FolderSync className="h-4 w-4" /> Scan All Courses</>
            )}
          </Button>
        </div>

        {/* Progress */}
        {progress.total > 0 && (
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Progress: {progress.current}/{progress.total} courses</span>
              <span>{totalCreated} resources added, {totalSkipped} skipped</span>
            </div>
            <Progress value={(progress.current / progress.total) * 100} className="h-2" />
          </div>
        )}

        {/* Summary Stats */}
        {scanResults.length > 0 && !isScanning && (
          <div className="flex gap-3 p-3 rounded-lg bg-muted/30">
            <div className="text-center flex-1">
              <p className="text-xl font-bold text-primary">{totalCreated}</p>
              <p className="text-[10px] text-muted-foreground">Resources Added</p>
            </div>
            <div className="text-center flex-1">
              <p className="text-xl font-bold text-muted-foreground">{totalSkipped}</p>
              <p className="text-[10px] text-muted-foreground">Already Synced</p>
            </div>
            <div className="text-center flex-1">
              <p className="text-xl font-bold text-green-500">{totalDone}</p>
              <p className="text-[10px] text-muted-foreground">Courses Done</p>
            </div>
            {totalErrors > 0 && (
              <div className="text-center flex-1">
                <p className="text-xl font-bold text-destructive">{totalErrors}</p>
                <p className="text-[10px] text-muted-foreground">Errors</p>
              </div>
            )}
          </div>
        )}

        {/* Results List */}
        {scanResults.length > 0 && (
          <ScrollArea className="max-h-[400px]">
            <div className="space-y-1">
              {scanResults.map((result) => (
                <div
                  key={result.courseId}
                  className={`flex items-center justify-between p-2.5 rounded-lg border transition-colors ${
                    result.status === 'scanning' ? 'border-primary/30 bg-primary/5' :
                    result.status === 'done' && result.resourcesCreated > 0 ? 'border-green-500/20 bg-green-500/5' :
                    result.status === 'error' ? 'border-destructive/20 bg-destructive/5' :
                    'border-border/30 bg-muted/10'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    {result.status === 'scanning' && <Loader2 className="h-4 w-4 animate-spin text-primary shrink-0" />}
                    {result.status === 'done' && <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />}
                    {result.status === 'error' && <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />}
                    {result.status === 'pending' && <FileArchive className="h-4 w-4 text-muted-foreground shrink-0" />}
                    <span className="text-sm truncate">{result.courseTitle}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {result.status === 'done' && (
                      <>
                        {result.resourcesCreated > 0 && (
                          <Badge variant="secondary" className="text-[10px] bg-green-500/10 text-green-500">
                            +{result.resourcesCreated}
                          </Badge>
                        )}
                        {result.skipped > 0 && (
                          <Badge variant="outline" className="text-[10px]">
                            {result.skipped} existed
                          </Badge>
                        )}
                      </>
                    )}
                    {result.status === 'error' && (
                      <Badge variant="destructive" className="text-[10px]">Error</Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
