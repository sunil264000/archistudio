import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  FolderOpen, Loader2, CheckCircle2, XCircle, ArrowRight, 
  Sparkles, Upload, RefreshCw, Search, ArrowUpDown, Filter, 
  Database, CloudIcon, Check, X, AlertCircle, FolderSync, Trash2,
  Link2, RotateCcw, Unlink
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
  const [cleaningCourseId, setCleaningCourseId] = useState<string | null>(null);
  const [isBulkCleaning, setIsBulkCleaning] = useState(false);
  const [selectedForClean, setSelectedForClean] = useState<Set<string>>(new Set());
  
  // Courses with content info (modules, lessons, hours)
  const [coursesWithContent, setCoursesWithContent] = useState<Record<string, { modules: number; lessons: number; hours: number }>>({});

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
    // Fetch modules with course_id
    const { data: modulesData } = await supabase
      .from('modules')
      .select('id, course_id');
    
    // Fetch lessons with duration
    const { data: lessonsData } = await supabase
      .from('lessons')
      .select('module_id, duration_minutes, modules!inner(course_id)')
      .returns<{ module_id: string; duration_minutes: number; modules: { course_id: string } }[]>();
    
    const contentMap: Record<string, { modules: number; lessons: number; hours: number }> = {};
    
    // Count modules per course
    if (modulesData) {
      for (const mod of modulesData) {
        if (!contentMap[mod.course_id]) {
          contentMap[mod.course_id] = { modules: 0, lessons: 0, hours: 0 };
        }
        contentMap[mod.course_id].modules++;
      }
    }
    
    // Count lessons and hours per course
    if (lessonsData) {
      for (const lesson of lessonsData) {
        const courseId = lesson.modules.course_id;
        if (!contentMap[courseId]) {
          contentMap[courseId] = { modules: 0, lessons: 0, hours: 0 };
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
      
      // Use bulk-parent mode with ultra-deep scanning (12 levels) for complete video discovery
      const { data, error } = await supabase.functions.invoke("scan-google-drive", {
        body: { folderId: parentFolderUrl, scanMode: "bulk-parent", maxDepth: 12 },
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

  // Clean course content (delete all modules/lessons/resources)
  const handleCleanCourse = async (courseId: string, courseTitle: string) => {
    if (!confirm(`Are you sure you want to delete ALL content from "${courseTitle}"? This cannot be undone.`)) {
      return;
    }
    
    setCleaningCourseId(courseId);
    try {
      // Get all modules for this course
      const { data: modules } = await supabase
        .from('modules')
        .select('id')
        .eq('course_id', courseId);
      
      if (modules && modules.length > 0) {
        const moduleIds = modules.map(m => m.id);
        
        // Get all lessons for these modules
        const { data: lessons } = await supabase
          .from('lessons')
          .select('id')
          .in('module_id', moduleIds);
        
        if (lessons && lessons.length > 0) {
          const lessonIds = lessons.map(l => l.id);
          // Delete resources first
          await supabase.from('lesson_resources').delete().in('lesson_id', lessonIds);
          // Delete lessons
          await supabase.from('lessons').delete().in('module_id', moduleIds);
        }
        
        // Delete modules
        await supabase.from('modules').delete().eq('course_id', courseId);
      }
      
      // Reset course stats
      await supabase.from('courses').update({ 
        total_lessons: 0, 
        duration_hours: null 
      }).eq('id', courseId);
      
      // Update local state
      setCoursesWithContent(prev => {
        const updated = { ...prev };
        delete updated[courseId];
        return updated;
      });
      
      // Log the clean action
      await supabase.from('import_activity_log').insert({
        course_id: courseId,
        course_title: courseTitle,
        folder_id: 'manual-clean',
        folder_name: 'Manual Clean',
        action: 'clean',
        status: 'success'
      });
      
      toast.success(`Cleaned all content from "${courseTitle}"`);
    } catch (err: any) {
      toast.error(`Failed to clean course: ${err.message}`);
    } finally {
      setCleaningCourseId(null);
    }
  };

  // Toggle selection for cleaning
  const toggleCleanSelection = (courseId: string) => {
    setSelectedForClean(prev => {
      const next = new Set(prev);
      if (next.has(courseId)) {
        next.delete(courseId);
      } else {
        next.add(courseId);
      }
      return next;
    });
  };

  // Get courses with content that can be cleaned
  const coursesWithContentToClean = useMemo(() => {
    return folderMatches
      .filter(m => m.matchedCourse && coursesWithContent[m.matchedCourse.id]?.lessons > 0)
      .map(m => ({ id: m.matchedCourse!.id, title: m.matchedCourse!.title }));
  }, [folderMatches, coursesWithContent]);

  // Select/deselect all for cleaning
  const toggleSelectAllForClean = () => {
    if (selectedForClean.size === coursesWithContentToClean.length) {
      setSelectedForClean(new Set());
    } else {
      setSelectedForClean(new Set(coursesWithContentToClean.map(c => c.id)));
    }
  };

  // Bulk clean selected courses
  const handleBulkClean = async () => {
    if (selectedForClean.size === 0) return;
    
    const coursesToClean = coursesWithContentToClean.filter(c => selectedForClean.has(c.id));
    if (!confirm(`Clean ALL content from ${coursesToClean.length} courses? This cannot be undone.`)) {
      return;
    }
    
    setIsBulkCleaning(true);
    let cleaned = 0;
    
    for (const course of coursesToClean) {
      try {
        const { data: modules } = await supabase
          .from('modules')
          .select('id')
          .eq('course_id', course.id);
        
        if (modules && modules.length > 0) {
          const moduleIds = modules.map(m => m.id);
          const { data: lessons } = await supabase
            .from('lessons')
            .select('id')
            .in('module_id', moduleIds);
          
          if (lessons && lessons.length > 0) {
            const lessonIds = lessons.map(l => l.id);
            await supabase.from('lesson_resources').delete().in('lesson_id', lessonIds);
            await supabase.from('lessons').delete().in('module_id', moduleIds);
          }
          await supabase.from('modules').delete().eq('course_id', course.id);
        }
        
        await supabase.from('courses').update({ total_lessons: 0, duration_hours: null }).eq('id', course.id);
        
        await supabase.from('import_activity_log').insert({
          course_id: course.id,
          course_title: course.title,
          folder_id: 'bulk-clean',
          folder_name: 'Bulk Clean',
          action: 'clean',
          status: 'success'
        });
        
        cleaned++;
      } catch (err) {
        console.error(`Failed to clean ${course.title}:`, err);
      }
    }
    
    // Update local state
    setCoursesWithContent(prev => {
      const updated = { ...prev };
      for (const id of selectedForClean) {
        delete updated[id];
      }
      return updated;
    });
    
    setSelectedForClean(new Set());
    setIsBulkCleaning(false);
    toast.success(`Cleaned ${cleaned} courses successfully`);
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
              action: "import-fast", // Use fast import mode
              maxDepth: 12 // Ultra-deep scan 12 levels for complex nested content
            },
          });

          if (error || !data?.success) {
            // Log failed import
            await supabase.from('import_activity_log').insert({
              course_id: match.matchedCourse!.id,
              course_title: match.matchedCourse!.title,
              folder_id: match.folderId,
              folder_name: match.folderName,
              action: 'import',
              status: 'error',
              error_message: error?.message || data?.error || 'Import failed'
            });
            throw new Error(match.folderName);
          }
          
          // Log successful import
          await supabase.from('import_activity_log').insert({
            course_id: match.matchedCourse!.id,
            course_title: match.matchedCourse!.title,
            folder_id: match.folderId,
            folder_name: match.folderName,
            action: 'import',
            modules_count: data.modulesCreated || 0,
            lessons_count: data.lessonsCreated || 0,
            resources_count: data.resourcesCreated || 0,
            status: 'success'
          });
          
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

            {/* Bulk Clean Bar - shows when courses have content */}
            {alreadyHasContentCount > 0 && (
              <div className="flex items-center justify-between p-3 bg-destructive/5 border border-destructive/20 rounded-lg">
                <div className="flex items-center gap-3">
                  <Checkbox
                    checked={selectedForClean.size === coursesWithContentToClean.length && coursesWithContentToClean.length > 0}
                    onCheckedChange={toggleSelectAllForClean}
                    disabled={isBulkCleaning}
                  />
                  <span className="text-sm">
                    {selectedForClean.size > 0 
                      ? `${selectedForClean.size} of ${alreadyHasContentCount} courses selected`
                      : `${alreadyHasContentCount} courses have existing content`
                    }
                  </span>
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleBulkClean}
                  disabled={selectedForClean.size === 0 || isBulkCleaning}
                >
                  {isBulkCleaning ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Cleaning...
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Clean {selectedForClean.size > 0 ? selectedForClean.size : ''} Selected
                    </>
                  )}
                </Button>
              </div>
            )}

            {/* Folder Matches List */}
            <ScrollArea className="h-[450px] border rounded-lg">
              <div className="divide-y">
                {filteredMatches.map((match) => {
                  const courseContent = match.matchedCourse ? coursesWithContent[match.matchedCourse.id] : null;
                  const hasExistingContent = courseContent && courseContent.lessons > 0;
                  const isSelected = match.matchedCourse && selectedForClean.has(match.matchedCourse.id);
                  
                  return (
                    <div 
                      key={match.folderId} 
                      className={`px-4 py-3 transition-colors ${
                        isSelected ? 'bg-destructive/10' : 
                        hasExistingContent ? 'bg-accent/5' : 
                        match.matchedCourse ? 'bg-primary/5' : ''
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        {/* Checkbox for cleaning */}
                        {hasExistingContent && match.matchedCourse && (
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => toggleCleanSelection(match.matchedCourse!.id)}
                            disabled={isBulkCleaning}
                            className="shrink-0"
                          />
                        )}
                        {!hasExistingContent && <div className="w-4 shrink-0" />}

                        {/* Drive Folder Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <CloudIcon className="h-4 w-4 text-muted-foreground shrink-0" />
                            <span className="font-medium truncate text-sm">{match.folderName}</span>
                            <Badge variant="outline" className="text-xs shrink-0">
                              {match.videoCount} videos
                            </Badge>
                            {getConfidenceBadge(match)}
                          </div>
                        </div>

                        <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />

                        {/* Course Select */}
                        <div className="w-[320px] shrink-0">
                          <Select
                            value={match.matchedCourse?.id || "none"} 
                            onValueChange={(val) => val === 'none' ? unlinkMatch(match.folderId) : updateMatch(match.folderId, val)}
                          >
                            <SelectTrigger className="h-9">
                              <SelectValue placeholder="Select course..." />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">
                                <span className="text-muted-foreground">-- Not Linked --</span>
                              </SelectItem>
                              {courses.map(c => {
                                const content = coursesWithContent[c.id];
                                const hasContent = content && (content.modules > 0 || content.lessons > 0);
                                return (
                                  <SelectItem key={c.id} value={c.id}>
                                    <span className="flex items-center gap-2">
                                      <span className="truncate">{c.title}</span>
                                      {hasContent && (
                                        <Badge variant="outline" className="text-xs">
                                          {content.modules}M / {content.lessons}L
                                        </Badge>
                                      )}
                                    </span>
                                  </SelectItem>
                                );
                              })}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Content Badge */}
                        {hasExistingContent ? (
                          <Badge variant="secondary" className="shrink-0 bg-accent/50 text-accent-foreground font-medium">
                            {courseContent.modules}M / {courseContent.lessons}L
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="shrink-0 text-muted-foreground">
                            Empty
                          </Badge>
                        )}
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

            {/* Actions Footer */}
            <div className="flex items-center justify-between pt-3 border-t">
              <Button variant="ghost" size="sm" onClick={() => setFolderMatches([])}>
                Clear All
              </Button>
              
              <div className="flex gap-2">
                <Button 
                  variant="outline"
                  size="sm"
                  onClick={handleScanDurations}
                  disabled={isImporting}
                >
                  <RefreshCw className="h-4 w-4 mr-1" />
                  Sync Durations
                </Button>
                
                <Button 
                  onClick={handleImportAll}
                  disabled={isImporting || matchedCount === 0}
                  size="sm"
                >
                  {isImporting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                      {importProgress.current}/{importProgress.total}
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-1" />
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
