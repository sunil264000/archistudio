import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Link2, Loader2, Trash2, RefreshCw, Zap } from "lucide-react";

interface Module {
  id: string;
  title: string;
  order_index: number;
}

interface QuickLessonAddProps {
  courseId: string;
  courseName: string;
  modules: Module[];
  onLessonsAdded: () => void;
}

interface PendingLesson {
  id: string;
  title: string;
  video_url: string;
  module_id: string;
}

export function QuickLessonAdd({ courseId, courseName, modules, onLessonsAdded }: QuickLessonAddProps) {
  const [pendingLessons, setPendingLessons] = useState<PendingLesson[]>([]);
  const [bulkInput, setBulkInput] = useState("");
  const [selectedModuleId, setSelectedModuleId] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [scanning, setScanning] = useState(false);

  // Add a single lesson row
  const addLessonRow = () => {
    if (!selectedModuleId) {
      toast.error("Please select a module first");
      return;
    }
    setPendingLessons(prev => [...prev, {
      id: crypto.randomUUID(),
      title: `Lesson ${prev.length + 1}`,
      video_url: "",
      module_id: selectedModuleId
    }]);
  };

  // Parse bulk input (one URL per line, or "title | url" format)
  const parseBulkInput = () => {
    if (!selectedModuleId) {
      toast.error("Please select a module first");
      return;
    }
    
    const lines = bulkInput.trim().split('\n').filter(line => line.trim());
    const newLessons: PendingLesson[] = lines.map((line, idx) => {
      const parts = line.split('|').map(p => p.trim());
      if (parts.length >= 2) {
        return {
          id: crypto.randomUUID(),
          title: parts[0] || `Lesson ${pendingLessons.length + idx + 1}`,
          video_url: parts[1] || "",
          module_id: selectedModuleId
        };
      } else {
        // Just URL, auto-generate title
        return {
          id: crypto.randomUUID(),
          title: `Lesson ${pendingLessons.length + idx + 1}`,
          video_url: line.trim(),
          module_id: selectedModuleId
        };
      }
    });

    setPendingLessons(prev => [...prev, ...newLessons]);
    setBulkInput("");
    toast.success(`Added ${newLessons.length} lessons to queue`);
  };

  // Update a pending lesson
  const updatePendingLesson = (id: string, field: keyof PendingLesson, value: string) => {
    setPendingLessons(prev => prev.map(l => 
      l.id === id ? { ...l, [field]: value } : l
    ));
  };

  // Remove a pending lesson
  const removePendingLesson = (id: string) => {
    setPendingLessons(prev => prev.filter(l => l.id !== id));
  };

  // Save all pending lessons without scanning
  const saveAllLessons = async () => {
    if (pendingLessons.length === 0) {
      toast.error("No lessons to save");
      return;
    }

    setSaving(true);
    try {
      // Group by module and get max order_index for each
      const lessonsByModule = pendingLessons.reduce((acc, lesson) => {
        if (!acc[lesson.module_id]) acc[lesson.module_id] = [];
        acc[lesson.module_id].push(lesson);
        return acc;
      }, {} as Record<string, PendingLesson[]>);

      let totalAdded = 0;

      for (const [moduleId, moduleLessons] of Object.entries(lessonsByModule)) {
        // Get current max order_index
        const { data: existingLessons } = await supabase
          .from('lessons')
          .select('order_index')
          .eq('module_id', moduleId)
          .order('order_index', { ascending: false })
          .limit(1);
        
        let orderIndex = (existingLessons?.[0]?.order_index || 0) + 1;

        // Insert all lessons for this module
        const lessonsToInsert = moduleLessons.map(lesson => ({
          module_id: moduleId,
          title: lesson.title,
          video_url: lesson.video_url || null,
          duration_minutes: 0, // Will be updated on scan
          is_free_preview: false,
          order_index: orderIndex++
        }));

        const { error } = await supabase.from('lessons').insert(lessonsToInsert);
        if (error) throw error;
        totalAdded += lessonsToInsert.length;
      }

      toast.success(`Saved ${totalAdded} lessons! Press "Scan Course" to fetch durations.`);
      setPendingLessons([]);
      onLessonsAdded();
    } catch (error: any) {
      toast.error("Failed to save: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  // Manual scan for the course
  const scanCourse = async () => {
    setScanning(true);
    try {
      const { data, error } = await supabase.functions.invoke('auto-scan-courses', {
        body: { action: 'scan-single', courseId }
      });
      
      if (error) throw error;
      
      toast.success(`Scan complete: ${data.validLinks} valid, ${data.durationsUpdated} durations updated`);
      onLessonsAdded();
    } catch (error: any) {
      toast.error("Scan failed: " + error.message);
    } finally {
      setScanning(false);
    }
  };

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5" />
          Quick Add Lessons
        </CardTitle>
        <CardDescription>
          Paste Google Drive links directly. Save first, then scan to fetch durations.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Module selector */}
        <div className="space-y-2">
          <Label>Target Module</Label>
          <Select value={selectedModuleId} onValueChange={setSelectedModuleId}>
            <SelectTrigger>
              <SelectValue placeholder="Select module for new lessons" />
            </SelectTrigger>
            <SelectContent>
              {modules.map(mod => (
                <SelectItem key={mod.id} value={mod.id}>
                  Module {mod.order_index + 1}: {mod.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Bulk input area */}
        <div className="space-y-2">
          <Label>Bulk Add (paste URLs, one per line)</Label>
          <div className="flex gap-2">
            <Textarea
              placeholder="Paste Google Drive URLs here (one per line)&#10;Or use format: Lesson Title | URL"
              value={bulkInput}
              onChange={(e) => setBulkInput(e.target.value)}
              rows={4}
              className="flex-1"
            />
            <Button 
              variant="outline" 
              onClick={parseBulkInput}
              disabled={!bulkInput.trim() || !selectedModuleId}
              className="shrink-0"
            >
              <Plus className="h-4 w-4 mr-1" />
              Parse
            </Button>
          </div>
        </div>

        {/* Pending lessons list */}
        {pendingLessons.length > 0 && (
          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            <div className="flex items-center justify-between">
              <Label>Pending Lessons ({pendingLessons.length})</Label>
              <Button variant="ghost" size="sm" onClick={() => setPendingLessons([])}>
                Clear All
              </Button>
            </div>
            {pendingLessons.map((lesson, idx) => (
              <div key={lesson.id} className="flex items-center gap-2 p-2 border rounded bg-muted/30">
                <span className="text-xs text-muted-foreground w-6">{idx + 1}</span>
                <Input
                  placeholder="Title"
                  value={lesson.title}
                  onChange={(e) => updatePendingLesson(lesson.id, 'title', e.target.value)}
                  className="flex-[2]"
                />
                <Input
                  placeholder="Google Drive URL"
                  value={lesson.video_url}
                  onChange={(e) => updatePendingLesson(lesson.id, 'video_url', e.target.value)}
                  className="flex-[3]"
                />
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => removePendingLesson(lesson.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* Action buttons */}
        <div className="flex items-center gap-2 justify-between pt-2 border-t">
          <Button variant="outline" onClick={addLessonRow} disabled={!selectedModuleId}>
            <Plus className="h-4 w-4 mr-1" />
            Add Row
          </Button>
          
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={scanCourse}
              disabled={scanning}
            >
              {scanning ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Scan Course
            </Button>
            
            <Button 
              onClick={saveAllLessons}
              disabled={saving || pendingLessons.length === 0}
            >
              {saving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Link2 className="h-4 w-4 mr-2" />
              )}
              Save {pendingLessons.length} Lessons
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
