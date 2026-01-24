import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  FolderOpen, Loader2, CheckCircle2, XCircle, ArrowRight, 
  Sparkles, Upload, RefreshCw, Link2
} from "lucide-react";

interface Course {
  id: string;
  title: string;
  slug: string;
}

interface FolderMatch {
  folderId: string;
  folderName: string;
  matchedCourse: Course | null;
  matchConfidence: 'high' | 'medium' | 'low' | 'none';
  videoCount: number;
  structure: any;
}

interface BulkCourseImportProps {
  courses: Course[];
  onImportComplete: () => void;
}

export function BulkCourseImport({ courses, onImportComplete }: BulkCourseImportProps) {
  const [parentFolderUrl, setParentFolderUrl] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [folderMatches, setFolderMatches] = useState<FolderMatch[]>([]);
  const [importProgress, setImportProgress] = useState({ current: 0, total: 0 });

  // Fuzzy match folder name to course
  const findBestMatch = (folderName: string): { course: Course | null; confidence: 'high' | 'medium' | 'low' | 'none' } => {
    const cleanName = folderName.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();
    
    // Try exact match first
    const exactMatch = courses.find(c => 
      c.title.toLowerCase() === cleanName ||
      c.slug.toLowerCase().replace(/-/g, ' ') === cleanName
    );
    if (exactMatch) return { course: exactMatch, confidence: 'high' };

    // Try contains match
    const containsMatch = courses.find(c => {
      const courseClean = c.title.toLowerCase().replace(/[^a-z0-9\s]/g, '');
      return courseClean.includes(cleanName) || cleanName.includes(courseClean);
    });
    if (containsMatch) return { course: containsMatch, confidence: 'medium' };

    // Try word overlap (at least 2 common words)
    const folderWords = cleanName.split(/\s+/).filter(w => w.length > 2);
    let bestOverlap = { course: null as Course | null, overlap: 0 };
    
    for (const course of courses) {
      const courseWords = course.title.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(w => w.length > 2);
      const overlap = folderWords.filter(w => courseWords.some(cw => cw.includes(w) || w.includes(cw))).length;
      if (overlap > bestOverlap.overlap) {
        bestOverlap = { course, overlap };
      }
    }
    
    if (bestOverlap.overlap >= 2) return { course: bestOverlap.course, confidence: 'low' };
    
    return { course: null, confidence: 'none' };
  };

  const countVideos = (structure: any): number => {
    let count = structure.videos?.length || 0;
    for (const folder of structure.folders || []) {
      count += folder.videos?.length || 0;
      if (folder.folders) {
        count += countVideos({ folders: folder.folders, videos: [] });
      }
    }
    return count;
  };

  const handleScan = async () => {
    if (!parentFolderUrl.trim()) {
      toast.error("Please enter a Google Drive folder URL");
      return;
    }

    setIsScanning(true);
    setFolderMatches([]);

    try {
      // Scan the parent folder
      const { data, error } = await supabase.functions.invoke("scan-google-drive", {
        body: { folderId: parentFolderUrl, action: "scan" },
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error);

      // Each subfolder represents a course
      const matches: FolderMatch[] = [];
      
      for (const folder of data.structure.folders || []) {
        const match = findBestMatch(folder.name);
        matches.push({
          folderId: folder.id,
          folderName: folder.name,
          matchedCourse: match.course,
          matchConfidence: match.confidence,
          videoCount: countVideos(folder),
          structure: folder,
        });
      }

      // Sort by confidence
      matches.sort((a, b) => {
        const order = { high: 0, medium: 1, low: 2, none: 3 };
        return order[a.matchConfidence] - order[b.matchConfidence];
      });

      setFolderMatches(matches);
      
      const matched = matches.filter(m => m.matchedCourse).length;
      toast.success(`Found ${matches.length} course folders, ${matched} auto-matched`);
    } catch (err: any) {
      console.error("Scan error:", err);
      toast.error(err.message || "Failed to scan folder");
    } finally {
      setIsScanning(false);
    }
  };

  const updateMatch = (folderId: string, courseId: string) => {
    const course = courses.find(c => c.id === courseId) || null;
    setFolderMatches(prev => prev.map(m => 
      m.folderId === folderId 
        ? { ...m, matchedCourse: course, matchConfidence: course ? 'high' : 'none' }
        : m
    ));
  };

  const handleImportAll = async () => {
    const toImport = folderMatches.filter(m => m.matchedCourse);
    if (toImport.length === 0) {
      toast.error("No courses matched for import");
      return;
    }

    setIsImporting(true);
    setImportProgress({ current: 0, total: toImport.length });

    let successCount = 0;
    let totalLessons = 0;

    for (let i = 0; i < toImport.length; i++) {
      const match = toImport[i];
      setImportProgress({ current: i + 1, total: toImport.length });

      try {
        // Import directly using the already-scanned structure
        const { data, error } = await supabase.functions.invoke("scan-google-drive", {
          body: { 
            folderId: `https://drive.google.com/drive/folders/${match.folderId}`,
            courseId: match.matchedCourse!.id,
            action: "import" 
          },
        });

        if (!error && data.success) {
          successCount++;
          totalLessons += data.lessonsCreated || 0;
        }
      } catch (err) {
        console.error(`Failed to import ${match.folderName}:`, err);
      }
    }

    toast.success(`Imported ${successCount} courses with ${totalLessons} lessons!`);
    setFolderMatches([]);
    setParentFolderUrl("");
    onImportComplete();
    setIsImporting(false);
  };

  const handleScanDurations = async () => {
    toast.info("Scanning all courses for durations...");
    try {
      const { data, error } = await supabase.functions.invoke('auto-scan-courses', {
        body: { action: 'refresh-all' }
      });
      if (error) throw error;
      toast.success(`Scan complete: ${data.durationsUpdated} durations updated`);
    } catch (err: any) {
      toast.error("Scan failed: " + err.message);
    }
  };

  const matchedCount = folderMatches.filter(m => m.matchedCourse).length;
  const unmatchedCount = folderMatches.filter(m => !m.matchedCourse).length;

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5" />
          Bulk Course Import (AI Matching)
        </CardTitle>
        <CardDescription>
          Paste a parent folder containing multiple course folders. AI will automatically match folder names to your courses.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Input */}
        <div className="space-y-2">
          <Label>Parent Folder URL (contains course subfolders)</Label>
          <div className="flex gap-2">
            <Input
              placeholder="https://drive.google.com/drive/folders/..."
              value={parentFolderUrl}
              onChange={(e) => setParentFolderUrl(e.target.value)}
              disabled={isScanning || isImporting}
            />
            <Button onClick={handleScan} disabled={isScanning || isImporting}>
              {isScanning ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Scanning...
                </>
              ) : (
                <>
                  <FolderOpen className="mr-2 h-4 w-4" />
                  Scan
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Results */}
        {folderMatches.length > 0 && (
          <div className="space-y-4">
            {/* Summary */}
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div className="flex gap-4">
                <Badge variant="default" className="gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  {matchedCount} Matched
                </Badge>
                {unmatchedCount > 0 && (
                  <Badge variant="destructive" className="gap-1">
                    <XCircle className="h-3 w-3" />
                    {unmatchedCount} Unmatched
                  </Badge>
                )}
              </div>
              <div className="text-sm text-muted-foreground">
                {folderMatches.reduce((sum, m) => sum + m.videoCount, 0)} total videos
              </div>
            </div>

            {/* Folder Matches List */}
            <ScrollArea className="h-[400px] border rounded-lg p-2">
              <div className="space-y-2">
                {folderMatches.map((match) => (
                  <div 
                    key={match.folderId} 
                    className={`flex items-center gap-3 p-3 rounded-lg border ${
                      match.matchedCourse ? 'bg-primary/5 border-primary/20' : 'bg-muted/50'
                    }`}
                  >
                    {/* Folder name */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <FolderOpen className="h-4 w-4 text-primary shrink-0" />
                        <span className="font-medium truncate">{match.folderName}</span>
                        <Badge variant="outline" className="shrink-0">
                          {match.videoCount} videos
                        </Badge>
                      </div>
                      {match.matchConfidence !== 'none' && (
                        <div className="flex items-center gap-1 mt-1">
                          <Badge 
                            variant={match.matchConfidence === 'high' ? 'default' : 'secondary'}
                            className="text-xs"
                          >
                            {match.matchConfidence} match
                          </Badge>
                        </div>
                      )}
                    </div>

                    <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />

                    {/* Course selector */}
                    <Select 
                      value={match.matchedCourse?.id || ""} 
                      onValueChange={(val) => updateMatch(match.folderId, val)}
                    >
                      <SelectTrigger className="w-[250px]">
                        <SelectValue placeholder="Select course..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">-- None --</SelectItem>
                        {courses.map(c => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {match.matchedCourse ? (
                      <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
                    ) : (
                      <XCircle className="h-5 w-5 text-muted-foreground shrink-0" />
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>

            {/* Actions */}
            <div className="flex items-center justify-between pt-2 border-t">
              <Button variant="outline" onClick={() => setFolderMatches([])}>
                Clear
              </Button>
              
              <div className="flex gap-2">
                <Button 
                  variant="outline"
                  onClick={handleScanDurations}
                  disabled={isImporting}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Scan Durations
                </Button>
                
                <Button 
                  onClick={handleImportAll}
                  disabled={isImporting || matchedCount === 0}
                >
                  {isImporting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Importing {importProgress.current}/{importProgress.total}...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Import {matchedCount} Courses
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
