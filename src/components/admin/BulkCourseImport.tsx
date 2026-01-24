import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  FolderOpen, Loader2, CheckCircle2, XCircle, ArrowRight, 
  Sparkles, Upload, RefreshCw, Link2, Unlink, Search,
  ArrowUpDown, Filter, Database, CloudIcon, Check, X,
  AlertCircle, FolderSync, RotateCcw
} from "lucide-react";

interface Course {
  id: string;
  title: string;
  slug: string;
  total_lessons?: number;
  duration_hours?: number;
}

interface FolderMatch {
  folderId: string;
  folderName: string;
  folderUrl: string;
  matchedCourse: Course | null;
  matchConfidence: 'high' | 'medium' | 'low' | 'none';
  matchScore: number;
  videoCount: number;
  structure: any;
  isManuallyLinked: boolean;
}

interface BulkCourseImportProps {
  courses: Course[];
  onImportComplete: () => void;
}

// Levenshtein distance for fuzzy matching
const levenshteinDistance = (str1: string, str2: string): number => {
  const m = str1.length;
  const n = str2.length;
  const dp: number[][] = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
      }
    }
  }
  return dp[m][n];
};

// Calculate similarity score (0-100)
const calculateSimilarity = (str1: string, str2: string): number => {
  const maxLen = Math.max(str1.length, str2.length);
  if (maxLen === 0) return 100;
  const distance = levenshteinDistance(str1, str2);
  return Math.round((1 - distance / maxLen) * 100);
};

// Normalize string for comparison
const normalizeString = (str: string): string => {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

// Get important words (filter out common words)
const getImportantWords = (str: string): string[] => {
  const stopWords = ['the', 'and', 'for', 'with', 'from', 'into', 'course', 'tutorial', 'lesson', 'module'];
  return normalizeString(str)
    .split(' ')
    .filter(w => w.length > 2 && !stopWords.includes(w));
};

export function BulkCourseImport({ courses, onImportComplete }: BulkCourseImportProps) {
  const [parentFolderUrl, setParentFolderUrl] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [folderMatches, setFolderMatches] = useState<FolderMatch[]>([]);
  const [importProgress, setImportProgress] = useState({ current: 0, total: 0 });
  
  // Filter & Sort states
  const [searchFilter, setSearchFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<'all' | 'matched' | 'unmatched'>('all');
  const [contentFilter, setContentFilter] = useState<'all' | 'has-content' | 'empty'>('all');
  const [sortBy, setSortBy] = useState<'confidence' | 'name' | 'videos'>('confidence');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  // Courses with content info
  const [coursesWithContent, setCoursesWithContent] = useState<Record<string, { lessons: number; hours: number }>>({});

  // Advanced fuzzy matching with multiple algorithms
  const findBestMatch = (folderName: string): { course: Course | null; confidence: 'high' | 'medium' | 'low' | 'none'; score: number } => {
    const normalized = normalizeString(folderName);
    const folderWords = getImportantWords(folderName);
    
    let bestMatch: { course: Course | null; score: number } = { course: null, score: 0 };
    
    for (const course of courses) {
      const courseNormalized = normalizeString(course.title);
      const courseWords = getImportantWords(course.title);
      const slugNormalized = course.slug.replace(/-/g, ' ');
      
      // 1. Exact match (100 points)
      if (normalized === courseNormalized || normalized === slugNormalized) {
        return { course, confidence: 'high', score: 100 };
      }
      
      // 2. Contains match (85 points)
      if (courseNormalized.includes(normalized) || normalized.includes(courseNormalized)) {
        const score = 85;
        if (score > bestMatch.score) bestMatch = { course, score };
        continue;
      }
      
      // 3. Levenshtein similarity (up to 80 points)
      const titleSimilarity = calculateSimilarity(normalized, courseNormalized);
      const slugSimilarity = calculateSimilarity(normalized, slugNormalized);
      const maxSimilarity = Math.max(titleSimilarity, slugSimilarity);
      
      // 4. Word overlap bonus (up to 20 points)
      const matchingWords = folderWords.filter(fw => 
        courseWords.some(cw => 
          cw.includes(fw) || fw.includes(cw) || calculateSimilarity(fw, cw) >= 70
        )
      );
      const wordOverlapScore = Math.min(20, matchingWords.length * 5);
      
      // Combined score
      const combinedScore = (maxSimilarity * 0.8) + wordOverlapScore;
      
      if (combinedScore > bestMatch.score) {
        bestMatch = { course, score: combinedScore };
      }
    }
    
    // Determine confidence based on score
    if (bestMatch.score >= 75) return { ...bestMatch, confidence: 'high' };
    if (bestMatch.score >= 50) return { ...bestMatch, confidence: 'medium' };
    if (bestMatch.score >= 30) return { ...bestMatch, confidence: 'low' };
    
    return { course: null, confidence: 'none', score: 0 };
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

  const fetchCoursesContent = async () => {
    const { data: modulesData } = await supabase
      .from('modules')
      .select('course_id');
    
    const { data: lessonsData } = await supabase
      .from('lessons')
      .select('module_id, duration_minutes, modules!inner(course_id)')
      .returns<{ module_id: string; duration_minutes: number; modules: { course_id: string } }[]>();
    
    const contentMap: Record<string, { lessons: number; hours: number }> = {};
    
    if (lessonsData) {
      for (const lesson of lessonsData) {
        const courseId = lesson.modules.course_id;
        if (!contentMap[courseId]) {
          contentMap[courseId] = { lessons: 0, hours: 0 };
        }
        contentMap[courseId].lessons++;
        contentMap[courseId].hours += (lesson.duration_minutes || 0) / 60;
      }
    }
    
    setCoursesWithContent(contentMap);
  };

  const handleScan = async () => {
    if (!parentFolderUrl.trim()) {
      toast.error("Please enter a Google Drive folder URL");
      return;
    }

    setIsScanning(true);
    setFolderMatches([]);

    try {
      // Fetch course content info
      await fetchCoursesContent();
      
      // Use bulk-parent mode for faster scanning of multiple course folders
      const { data, error } = await supabase.functions.invoke("scan-google-drive", {
        body: { folderId: parentFolderUrl, scanMode: "bulk-parent" },
      });

      if (error) {
        console.error("Edge function error:", error);
        throw new Error(error.message || "Failed to connect to scan service");
      }
      if (!data.success) throw new Error(data.error || "Scan failed");

      // Each subfolder represents a course - use the optimized folder data
      const matches: FolderMatch[] = [];
      
      for (const folder of data.structure.folders || []) {
        const match = findBestMatch(folder.name);
        matches.push({
          folderId: folder.id,
          folderName: folder.name,
          folderUrl: folder.url || `https://drive.google.com/drive/folders/${folder.id}`,
          matchedCourse: match.course,
          matchConfidence: match.confidence,
          matchScore: match.score,
          videoCount: folder.videoCount || 0,
          structure: folder,
          isManuallyLinked: false,
        });
      }

      // Sort by confidence
      matches.sort((a, b) => b.matchScore - a.matchScore);

      setFolderMatches(matches);
      
      const matched = matches.filter(m => m.matchedCourse).length;
      const totalVideos = matches.reduce((sum, m) => sum + m.videoCount, 0);
      toast.success(`Found ${matches.length} course folders (${totalVideos} total videos), ${matched} auto-matched`);
    } catch (err: any) {
      console.error("Scan error:", err);
      toast.error(err.message || "Failed to scan folder. Check if the folder is shared publicly.");
    } finally {
      setIsScanning(false);
    }
  };

  const updateMatch = (folderId: string, courseId: string) => {
    const course = courses.find(c => c.id === courseId) || null;
    setFolderMatches(prev => prev.map(m => 
      m.folderId === folderId 
        ? { ...m, matchedCourse: course, matchConfidence: course ? 'high' : 'none', matchScore: course ? 100 : 0, isManuallyLinked: !!course }
        : m
    ));
  };

  const unlinkMatch = (folderId: string) => {
    setFolderMatches(prev => prev.map(m => 
      m.folderId === folderId 
        ? { ...m, matchedCourse: null, matchConfidence: 'none', matchScore: 0, isManuallyLinked: false }
        : m
    ));
  };

  const resetToAutoMatch = (folderId: string) => {
    const folder = folderMatches.find(f => f.folderId === folderId);
    if (folder) {
      const match = findBestMatch(folder.folderName);
      setFolderMatches(prev => prev.map(m => 
        m.folderId === folderId 
          ? { ...m, matchedCourse: match.course, matchConfidence: match.confidence, matchScore: match.score, isManuallyLinked: false }
          : m
      ));
    }
  };

  const handleImportAll = async () => {
    const toImport = folderMatches.filter(m => m.matchedCourse);
    if (toImport.length === 0) {
      toast.error("No courses matched for import");
      return;
    }

    setIsImporting(true);
    setImportProgress({ current: 0, total: toImport.length });

    // PARALLEL IMPORT - Much faster! Process in batches of 10
    const BATCH_SIZE = 10;
    let successCount = 0;
    let totalLessons = 0;
    let failedCourses: string[] = [];
    let completed = 0;

    const processBatch = async (batch: typeof toImport) => {
      const results = await Promise.allSettled(
        batch.map(async (match) => {
          const { data, error } = await supabase.functions.invoke("scan-google-drive", {
            body: { 
              folderId: match.folderId,
              courseId: match.matchedCourse!.id,
              action: "import-fast" // Use fast import mode
            },
          });

          if (error || !data?.success) {
            throw new Error(match.folderName);
          }
          return { lessons: data.lessonsCreated || 0, name: match.folderName };
        })
      );

      for (const result of results) {
        completed++;
        setImportProgress({ current: completed, total: toImport.length });
        
        if (result.status === 'fulfilled') {
          successCount++;
          totalLessons += result.value.lessons;
        } else {
          failedCourses.push(result.reason?.message || 'Unknown');
        }
      }
    };

    // Process in parallel batches
    for (let i = 0; i < toImport.length; i += BATCH_SIZE) {
      const batch = toImport.slice(i, i + BATCH_SIZE);
      await processBatch(batch);
    }

    if (failedCourses.length > 0) {
      toast.warning(`Imported ${successCount} courses (${totalLessons} lessons). Failed: ${failedCourses.length}`);
    } else {
      toast.success(`⚡ Imported ${successCount} courses with ${totalLessons} lessons!`);
    }
    
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

  // Apply filters and sorting
  const filteredMatches = useMemo(() => {
    let result = [...folderMatches];
    
    // Text search
    if (searchFilter) {
      const search = searchFilter.toLowerCase();
      result = result.filter(m => 
        m.folderName.toLowerCase().includes(search) ||
        m.matchedCourse?.title.toLowerCase().includes(search)
      );
    }
    
    // Status filter
    if (statusFilter === 'matched') {
      result = result.filter(m => m.matchedCourse);
    } else if (statusFilter === 'unmatched') {
      result = result.filter(m => !m.matchedCourse);
    }
    
    // Content filter
    if (contentFilter === 'has-content') {
      result = result.filter(m => m.matchedCourse && coursesWithContent[m.matchedCourse.id]?.lessons > 0);
    } else if (contentFilter === 'empty') {
      result = result.filter(m => !m.matchedCourse || !coursesWithContent[m.matchedCourse.id]?.lessons);
    }
    
    // Sorting
    result.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'confidence':
          comparison = b.matchScore - a.matchScore;
          break;
        case 'name':
          comparison = a.folderName.localeCompare(b.folderName);
          break;
        case 'videos':
          comparison = b.videoCount - a.videoCount;
          break;
      }
      return sortOrder === 'asc' ? -comparison : comparison;
    });
    
    return result;
  }, [folderMatches, searchFilter, statusFilter, contentFilter, sortBy, sortOrder, coursesWithContent]);

  const matchedCount = folderMatches.filter(m => m.matchedCourse).length;
  const unmatchedCount = folderMatches.filter(m => !m.matchedCourse).length;
  const alreadyHasContentCount = folderMatches.filter(m => 
    m.matchedCourse && coursesWithContent[m.matchedCourse.id]?.lessons > 0
  ).length;

  const getConfidenceBadge = (match: FolderMatch) => {
    if (match.isManuallyLinked) {
      return <Badge variant="default" className="gap-1"><Link2 className="h-3 w-3" />Manual</Badge>;
    }
    switch (match.matchConfidence) {
      case 'high':
        return <Badge variant="default" className="gap-1"><Check className="h-3 w-3" />{match.matchScore}%</Badge>;
      case 'medium':
        return <Badge variant="secondary" className="gap-1">{match.matchScore}%</Badge>;
      case 'low':
        return <Badge variant="outline" className="gap-1">{match.matchScore}%</Badge>;
      default:
        return <Badge variant="destructive" className="gap-1"><X className="h-3 w-3" />No match</Badge>;
    }
  };

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5" />
          Bulk Course Import (AI Smart Matching)
        </CardTitle>
        <CardDescription>
          Paste a parent folder containing multiple course folders. AI will intelligently match folder names to your database courses using fuzzy matching.
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
                  <FolderSync className="mr-2 h-4 w-4" />
                  Scan & Match
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Results */}
        {folderMatches.length > 0 && (
          <div className="space-y-4">
            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Card className="bg-muted/50">
                <CardContent className="p-3 flex items-center gap-3">
                  <FolderOpen className="h-8 w-8 text-muted-foreground" />
                  <div>
                    <div className="text-xl font-bold">{folderMatches.length}</div>
                    <div className="text-xs text-muted-foreground">Total Folders</div>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-primary/10 border-primary/30">
                <CardContent className="p-3 flex items-center gap-3">
                  <CheckCircle2 className="h-8 w-8 text-primary" />
                  <div>
                    <div className="text-xl font-bold text-primary">{matchedCount}</div>
                    <div className="text-xs text-muted-foreground">Matched</div>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-destructive/10 border-destructive/30">
                <CardContent className="p-3 flex items-center gap-3">
                  <XCircle className="h-8 w-8 text-destructive" />
                  <div>
                    <div className="text-xl font-bold text-destructive">{unmatchedCount}</div>
                    <div className="text-xs text-muted-foreground">Unmatched</div>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-accent/20 border-accent/40">
                <CardContent className="p-3 flex items-center gap-3">
                  <AlertCircle className="h-8 w-8 text-accent-foreground" />
                  <div>
                    <div className="text-xl font-bold">{alreadyHasContentCount}</div>
                    <div className="text-xs text-muted-foreground">Has Content</div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-3 p-3 bg-muted/30 rounded-lg border">
              <div className="flex-1 min-w-[200px]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search folders or courses..."
                    value={searchFilter}
                    onChange={(e) => setSearchFilter(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
              
              <Select value={statusFilter} onValueChange={(v: any) => setStatusFilter(v)}>
                <SelectTrigger className="w-[140px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="matched">Matched</SelectItem>
                  <SelectItem value="unmatched">Unmatched</SelectItem>
                </SelectContent>
              </Select>

              <Select value={contentFilter} onValueChange={(v: any) => setContentFilter(v)}>
                <SelectTrigger className="w-[160px]">
                  <Database className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Content</SelectItem>
                  <SelectItem value="has-content">Has Content</SelectItem>
                  <SelectItem value="empty">Empty Courses</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={(v: any) => setSortBy(v)}>
                <SelectTrigger className="w-[140px]">
                  <ArrowUpDown className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="confidence">Match Score</SelectItem>
                  <SelectItem value="name">Folder Name</SelectItem>
                  <SelectItem value="videos">Video Count</SelectItem>
                </SelectContent>
              </Select>

              <Button 
                variant="outline" 
                size="icon"
                onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
              >
                <ArrowUpDown className={`h-4 w-4 ${sortOrder === 'asc' ? 'rotate-180' : ''}`} />
              </Button>
            </div>

            {/* Folder Matches List */}
            <ScrollArea className="h-[500px] border rounded-lg">
              <div className="p-3 space-y-2">
                {filteredMatches.map((match) => {
                  const courseContent = match.matchedCourse ? coursesWithContent[match.matchedCourse.id] : null;
                  const hasExistingContent = courseContent && courseContent.lessons > 0;
                  
                  return (
                    <div 
                      key={match.folderId} 
                      className={`p-4 rounded-lg border transition-colors ${
                        match.matchedCourse 
                          ? hasExistingContent 
                            ? 'bg-accent/10 border-accent/40' 
                            : 'bg-primary/5 border-primary/30'
                          : 'bg-muted/30 border-muted'
                      }`}
                    >
                      {/* Mapping Row */}
                      <div className="flex items-center gap-3">
                        {/* Google Drive Folder */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <CloudIcon className="h-5 w-5 text-primary shrink-0" />
                            <div className="min-w-0">
                              <p className="font-medium truncate">{match.folderName}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="outline" className="text-xs shrink-0">
                                  {match.videoCount} videos
                                </Badge>
                                {getConfidenceBadge(match)}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Arrow */}
                        <div className="shrink-0 px-2">
                          <ArrowRight className={`h-5 w-5 ${match.matchedCourse ? 'text-primary' : 'text-muted-foreground'}`} />
                        </div>

                        {/* Database Course */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <Database className={`h-5 w-5 shrink-0 ${match.matchedCourse ? 'text-primary' : 'text-muted-foreground'}`} />
                            <Select
                              value={match.matchedCourse?.id || "none"} 
                              onValueChange={(val) => val === 'none' ? unlinkMatch(match.folderId) : updateMatch(match.folderId, val)}
                            >
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select course..." />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none">
                                  <span className="text-muted-foreground">-- Not Linked --</span>
                                </SelectItem>
                                {courses.map(c => {
                                  const content = coursesWithContent[c.id];
                                  return (
                                    <SelectItem key={c.id} value={c.id}>
                                      <span className="flex items-center gap-2">
                                        {c.title}
                                        {content?.lessons > 0 && (
                                          <Badge variant="outline" className="text-xs ml-auto">
                                            {content.lessons} lessons
                                          </Badge>
                                        )}
                                      </span>
                                    </SelectItem>
                                  );
                                })}
                              </SelectContent>
                            </Select>
                          </div>
                          {hasExistingContent && (
                            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                              <AlertCircle className="h-3 w-3" />
                              Already has {courseContent.lessons} lessons ({Math.round(courseContent.hours * 10) / 10}h)
                            </p>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1 shrink-0">
                          {match.isManuallyLinked && (
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => resetToAutoMatch(match.folderId)}
                              title="Reset to auto-match"
                            >
                              <RotateCcw className="h-4 w-4" />
                            </Button>
                          )}
                          {match.matchedCourse && (
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => unlinkMatch(match.folderId)}
                              title="Unlink"
                              className="text-destructive hover:text-destructive"
                            >
                              <Unlink className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
                
                {filteredMatches.length === 0 && (
                  <div className="text-center text-muted-foreground py-8">
                    No folders match the current filters
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* Actions */}
            <div className="flex items-center justify-between pt-2 border-t">
              <Button variant="outline" onClick={() => setFolderMatches([])}>
                Clear All
              </Button>
              
              <div className="flex gap-2">
                <Button 
                  variant="outline"
                  onClick={handleScanDurations}
                  disabled={isImporting}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Sync Durations
                </Button>
                
                <Button 
                  onClick={handleImportAll}
                  disabled={isImporting || matchedCount === 0}
                  className="gap-2"
                >
                  {isImporting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Importing {importProgress.current}/{importProgress.total}...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4" />
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
