import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import {
  ArrowUp, ArrowDown, CheckSquare, FileArchive, Link, X, Languages
} from 'lucide-react';
import { GoogleDriveImport } from './GoogleDriveImport';
import { QuickLessonAdd } from './QuickLessonAdd';
import { BulkCourseImport } from './BulkCourseImport';
import { ImportActivityLog } from './ImportActivityLog';
import { SyncResourcesButton } from './SyncResourcesButton';

interface Course {
  id: string;
  title: string;
  slug: string;
}

interface Module {
  id: string;
  title: string;
  description: string | null;
  order_index: number;
  course_id: string;
}

interface Lesson {
  id: string;
  title: string;
  description: string | null;
  video_url: string | null;
  duration_minutes: number | null;
  order_index: number;
  is_free_preview: boolean;
  module_id: string;
}

interface LessonResource {
  id: string;
  title: string;
  file_url: string;
  file_type: string | null;
}

export function LessonManagement() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [lessonResources, setLessonResources] = useState<Record<string, LessonResource[]>>({});
  const [resourceForm, setResourceForm] = useState<Record<string, { title: string; file_url: string; file_type: string }>>({});
  const [addingResource, setAddingResource] = useState<string | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [lessons, setLessons] = useState<Record<string, Lesson[]>>({});
  const [loading, setLoading] = useState(false);
  const [translating, setTranslating] = useState(false);

  const translateText = async (text: string) => {
    if (!text || text.length < 3) return text;
    try {
      const res = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=en&dt=t&q=${encodeURIComponent(text)}`);
      const data = await res.json();
      return data[0].map((item: any) => item[0]).join('');
    } catch (e) {
      console.error('Translation failed', e);
      return text;
    }
  };

  const handleEnglishifyFullCourse = async () => {
    if (!selectedCourse) return;
    setTranslating(true);
    toast.info("Englishifying all modules and lessons... this may take a moment.");
    
    try {
      // 1. Translate Modules
      for (const mod of modules) {
        const newTitle = await translateText(mod.title);
        const newDesc = await translateText(mod.description || "");
        if (newTitle !== mod.title || newDesc !== (mod.description || "")) {
          await supabase.from('modules').update({ title: newTitle, description: newDesc }).eq('id', mod.id);
        }
      }
      
      // 2. Translate Lessons
      const allLessons = Object.values(lessons).flat();
      for (const lesson of allLessons) {
        const newTitle = await translateText(lesson.title);
        const newDesc = await translateText(lesson.description || "");
        if (newTitle !== lesson.title || newDesc !== (lesson.description || "")) {
          await supabase.from('lessons').update({ title: newTitle, description: newDesc }).eq('id', lesson.id);
        }
      }
      
      toast.success("Full course translated to English!");
      fetchModules(selectedCourse);
    } catch (err: any) {
      toast.error("Translation failed: " + err.message);
    } finally {
      setTranslating(false);
    }
  };

  // Dialog states
  const [moduleDialogOpen, setModuleDialogOpen] = useState(false);
  const [lessonDialogOpen, setLessonDialogOpen] = useState(false);
  const [editingModule, setEditingModule] = useState<Module | null>(null);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);

  // Form states
  const [moduleForm, setModuleForm] = useState({ title: '', description: '' });
  const [lessonForm, setLessonForm] = useState({
    title: '',
    description: '',
    duration_minutes: 0,
    is_free_preview: false,
  });
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Batch free preview changes
  const [pendingFreePreviewChanges, setPendingFreePreviewChanges] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);
  const [hideEmptyModules, setHideEmptyModules] = useState(false);

  // Bulk selection for lesson deletion
  const [selectedLessons, setSelectedLessons] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchCourses();
  }, []);

  useEffect(() => {
    if (selectedCourse) {
      fetchModules(selectedCourse);
    }
  }, [selectedCourse]);

  const fetchCourses = async () => {
    const { data } = await supabase
      .from('courses')
      .select('id, title, slug')
      .order('title');
    setCourses(data || []);
  };

  const fetchModules = async (courseId: string) => {
    setLoading(true);
    const { data: modulesData } = await supabase
      .from('modules')
      .select('*')
      .eq('course_id', courseId)
      .order('order_index');

    setModules(modulesData || []);

    // Fetch lessons for each module
    if (modulesData) {
      const lessonsMap: Record<string, Lesson[]> = {};
      for (const mod of modulesData) {
        const { data: lessonsData } = await supabase
          .from('lessons')
          .select('*')
          .eq('module_id', mod.id)
          .order('order_index');
        lessonsMap[mod.id] = lessonsData || [];
      }
      setLessons(lessonsMap);

      // Fetch resources for all lessons
      const allLessonIds = Object.values(lessonsMap).flat().map(l => l.id);
      if (allLessonIds.length > 0) {
        const { data: resData } = await supabase
          .from('lesson_resources')
          .select('id, lesson_id, title, file_url, file_type')
          .in('lesson_id', allLessonIds);
        const resMap: Record<string, LessonResource[]> = {};
        (resData || []).forEach((r: any) => {
          if (!resMap[r.lesson_id]) resMap[r.lesson_id] = [];
          resMap[r.lesson_id].push(r);
        });
        setLessonResources(resMap);
      }
    }
    setLoading(false);
  };

  const handleAddModule = () => {
    setEditingModule(null);
    setModuleForm({ title: '', description: '' });
    setModuleDialogOpen(true);
  };

  const handleEditModule = (module: Module) => {
    setEditingModule(module);
    setModuleForm({ title: module.title, description: module.description || '' });
    setModuleDialogOpen(true);
  };

  const handleSaveModule = async () => {
    if (!selectedCourse || !moduleForm.title) return;

    try {
      if (editingModule) {
        await supabase
          .from('modules')
          .update({
            title: moduleForm.title,
            description: moduleForm.description,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingModule.id);
        toast.success('Module updated');
      } else {
        const maxOrder = modules.reduce((max, m) => Math.max(max, m.order_index), 0);
        await supabase.from('modules').insert({
          course_id: selectedCourse,
          title: moduleForm.title,
          description: moduleForm.description,
          order_index: maxOrder + 1,
        });
        toast.success('Module created');
      }
      setModuleDialogOpen(false);
      fetchModules(selectedCourse);
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleDeleteModule = async (moduleId: string) => {
    if (!confirm('Delete this module and all its lessons?')) return;

    await supabase.from('lessons').delete().eq('module_id', moduleId);
    await supabase.from('modules').delete().eq('id', moduleId);
    toast.success('Module deleted');
    if (selectedCourse) fetchModules(selectedCourse);
  };

  const handleAddLesson = (moduleId: string) => {
    setSelectedModuleId(moduleId);
    setEditingLesson(null);
    setLessonForm({ title: '', description: '', duration_minutes: 0, is_free_preview: false });
    setLessonDialogOpen(true);
  };

  const handleEditLesson = (lesson: Lesson) => {
    setSelectedModuleId(lesson.module_id);
    setEditingLesson(lesson);
    setLessonForm({
      title: lesson.title,
      description: lesson.description || '',
      duration_minutes: lesson.duration_minutes || 0,
      is_free_preview: lesson.is_free_preview || false,
    });
    setLessonDialogOpen(true);
  };

  const handleSaveLesson = async () => {
    if (!selectedModuleId || !lessonForm.title) return;

    try {
      if (editingLesson) {
        await supabase
          .from('lessons')
          .update({
            title: lessonForm.title,
            description: lessonForm.description,
            duration_minutes: lessonForm.duration_minutes,
            is_free_preview: lessonForm.is_free_preview,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingLesson.id);
        toast.success('Lesson updated');
      } else {
        const currentLessons = lessons[selectedModuleId] || [];
        const maxOrder = currentLessons.reduce((max, l) => Math.max(max, l.order_index || 0), 0);
        await supabase.from('lessons').insert({
          module_id: selectedModuleId,
          title: lessonForm.title,
          description: lessonForm.description,
          duration_minutes: lessonForm.duration_minutes,
          is_free_preview: lessonForm.is_free_preview,
          order_index: maxOrder + 1,
        });
        toast.success('Lesson created');
      }
      setLessonDialogOpen(false);
      if (selectedCourse) fetchModules(selectedCourse);
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleDeleteLesson = async (lessonId: string) => {
    if (!confirm('Delete this lesson?')) return;

    await supabase.from('lesson_resources').delete().eq('lesson_id', lessonId);
    await supabase.from('lessons').delete().eq('id', lessonId);
    toast.success('Lesson deleted');
    setSelectedLessons(prev => { const n = new Set(prev); n.delete(lessonId); return n; });
    if (selectedCourse) fetchModules(selectedCourse);
  };

  const handleBulkDeleteLessons = async () => {
    if (selectedLessons.size === 0) return;
    if (!confirm(`Delete ${selectedLessons.size} selected lessons? This cannot be undone.`)) return;

    const ids = Array.from(selectedLessons);
    for (const id of ids) {
      await supabase.from('lesson_resources').delete().eq('lesson_id', id);
    }
    await supabase.from('lessons').delete().in('id', ids);
    toast.success(`${ids.length} lessons deleted`);
    setSelectedLessons(new Set());
    if (selectedCourse) fetchModules(selectedCourse);
  };

  const toggleLessonSelection = (lessonId: string) => {
    setSelectedLessons(prev => {
      const next = new Set(prev);
      if (next.has(lessonId)) next.delete(lessonId); else next.add(lessonId);
      return next;
    });
  };

  const handleMoveLesson = async (lessonId: string, moduleId: string, direction: 'up' | 'down') => {
    const moduleLessons = [...(lessons[moduleId] || [])];
    const idx = moduleLessons.findIndex(l => l.id === lessonId);
    if (idx < 0) return;
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= moduleLessons.length) return;

    const a = moduleLessons[idx];
    const b = moduleLessons[swapIdx];

    await Promise.all([
      supabase.from('lessons').update({ order_index: b.order_index }).eq('id', a.id),
      supabase.from('lessons').update({ order_index: a.order_index }).eq('id', b.id),
    ]);
    if (selectedCourse) fetchModules(selectedCourse);
  };

  const handleMoveModule = async (moduleId: string, direction: 'up' | 'down') => {
    const idx = modules.findIndex(m => m.id === moduleId);
    if (idx < 0) return;
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= modules.length) return;

    const a = modules[idx];
    const b = modules[swapIdx];

    await Promise.all([
      supabase.from('modules').update({ order_index: b.order_index }).eq('id', a.id),
      supabase.from('modules').update({ order_index: a.order_index }).eq('id', b.id),
    ]);
    if (selectedCourse) fetchModules(selectedCourse);
  };

  const handleAddResource = async (lessonId: string) => {
    const form = resourceForm[lessonId];
    if (!form?.title || !form?.file_url) {
      toast.error('Title and URL are required');
      return;
    }
    setAddingResource(lessonId);
    try {
      const { data, error } = await supabase.from('lesson_resources').insert({
        lesson_id: lessonId,
        title: form.title,
        file_url: form.file_url,
        file_type: form.file_type || null,
      }).select('id, title, file_url, file_type').single();

      if (error) throw error;

      setLessonResources(prev => ({
        ...prev,
        [lessonId]: [...(prev[lessonId] || []), data],
      }));
      setResourceForm(prev => ({ ...prev, [lessonId]: { title: '', file_url: '', file_type: '' } }));
      toast.success('Resource added');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setAddingResource(null);
    }
  };

  const handleDeleteResource = async (lessonId: string, resourceId: string) => {
    await supabase.from('lesson_resources').delete().eq('id', resourceId);
    setLessonResources(prev => ({
      ...prev,
      [lessonId]: (prev[lessonId] || []).filter(r => r.id !== resourceId),
    }));
    toast.success('Resource removed');
  };

  const handleVideoUpload = async (lessonId: string, file: File) => {
    if (!file.type.startsWith('video/')) {
      toast.error('Please select a video file');
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      const fileName = `${lessonId}/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;

      const { error: uploadError } = await supabase.storage
        .from('course-videos')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (uploadError) throw uploadError;

      // Update lesson with video path
      await supabase
        .from('lessons')
        .update({ video_url: fileName })
        .eq('id', lessonId);

      toast.success('Video uploaded successfully');
      if (selectedCourse) fetchModules(selectedCourse);
    } catch (error: any) {
      toast.error('Upload failed: ' + error.message);
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const selectedCourseData = courses.find(c => c.id === selectedCourse);

  // Get effective free preview value (pending change or original)
  const getEffectiveFreePreview = (lessonId: string, original: boolean) => {
    return pendingFreePreviewChanges.hasOwnProperty(lessonId)
      ? pendingFreePreviewChanges[lessonId]
      : original;
  };

  // Toggle free preview locally
  const toggleFreePreview = (lessonId: string, currentValue: boolean) => {
    const originalValue = lessons[Object.keys(lessons).find(k =>
      lessons[k].some(l => l.id === lessonId)
    ) || '']?.find(l => l.id === lessonId)?.is_free_preview ?? false;

    const newValue = !currentValue;

    if (newValue === originalValue) {
      // Remove from pending if back to original
      setPendingFreePreviewChanges(prev => {
        const updated = { ...prev };
        delete updated[lessonId];
        return updated;
      });
    } else {
      setPendingFreePreviewChanges(prev => ({ ...prev, [lessonId]: newValue }));
    }
  };

  // Save all pending changes
  const saveAllChanges = async () => {
    if (Object.keys(pendingFreePreviewChanges).length === 0) return;

    setSaving(true);
    try {
      const updates = Object.entries(pendingFreePreviewChanges).map(([lessonId, isFreePreview]) =>
        supabase.from('lessons').update({ is_free_preview: isFreePreview }).eq('id', lessonId)
      );

      await Promise.all(updates);
      toast.success(`Saved ${Object.keys(pendingFreePreviewChanges).length} changes`);
      setPendingFreePreviewChanges({});
      if (selectedCourse) fetchModules(selectedCourse);
    } catch (error: any) {
      toast.error('Failed to save changes: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const hasPendingChanges = Object.keys(pendingFreePreviewChanges).length > 0;

  return (
    <div className="space-y-6">
      {/* Bulk Import Tools with Activity Log */}
      <Tabs defaultValue="import" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="import" className="gap-2">
            <FolderSync className="h-4 w-4" />
            Bulk Import
          </TabsTrigger>
          <TabsTrigger value="activity" className="gap-2">
            <Clock className="h-4 w-4" />
            Recent Activities
          </TabsTrigger>
        </TabsList>

        <TabsContent value="import" className="mt-4">
          <BulkCourseImport
            courses={courses}
            onImportComplete={() => {
              fetchCourses();
              if (selectedCourse) fetchModules(selectedCourse);
            }}
          />
        </TabsContent>

        <TabsContent value="activity" className="mt-4">
          <ImportActivityLog
            onCourseClean={() => {
              fetchCourses();
              if (selectedCourse) fetchModules(selectedCourse);
            }}
          />
        </TabsContent>
      </Tabs>

      {/* Course Selector */}
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <Label>Select Course (for single course management)</Label>
          <Select value={selectedCourse || ''} onValueChange={(val) => {
            setSelectedCourse(val);
            setPendingFreePreviewChanges({}); // Clear pending when switching course
          }}>
            <SelectTrigger>
              <SelectValue placeholder="Choose a course to manage" />
            </SelectTrigger>
            <SelectContent>
              {courses.map(course => (
                <SelectItem key={course.id} value={course.id}>
                  {course.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {selectedCourse && (
          <div className="mt-6 flex gap-2">
            <Button 
              variant="outline" 
              onClick={handleEnglishifyFullCourse} 
              disabled={translating}
              className="gap-2 border-accent/20 text-accent hover:bg-accent/5"
            >
              {translating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Languages className="h-4 w-4" />}
              Englishify Course Content
            </Button>
            <Button onClick={handleAddModule} className="gap-2">
              <FolderPlus className="h-4 w-4" />
              Add Module
            </Button>
          </div>
        )}
      </div>

      {/* Save Changes Button */}
      {hasPendingChanges && (
        <div className="flex items-center justify-between p-3 bg-accent/10 border border-accent/30 rounded-lg">
          <span className="text-sm">
            {Object.keys(pendingFreePreviewChanges).length} unsaved changes
          </span>
          <Button onClick={saveAllChanges} disabled={saving} className="gap-2">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save All Changes
          </Button>
        </div>
      )}

      {/* Sync Resources from Drive - only available when a course is selected */}
      {selectedCourse && selectedCourseData && (
        <SyncResourcesButton
          courseId={selectedCourse}
          courseName={selectedCourseData.title}
        />
      )}

      {/* Quick Add Lessons (Direct Link Input) */}
      {selectedCourse && selectedCourseData && modules.length > 0 && (
        <QuickLessonAdd
          courseId={selectedCourse}
          courseName={selectedCourseData.title}
          modules={modules}
          onLessonsAdded={() => fetchModules(selectedCourse)}
        />
      )}

      {/* Google Drive Import (Folder Structure) */}
      {selectedCourse && selectedCourseData && (
        <GoogleDriveImport
          courseId={selectedCourse}
          courseName={selectedCourseData.title}
          onImportComplete={() => fetchModules(selectedCourse)}
        />
      )}

      {/* Module Controls */}
      {selectedCourse && modules.length > 0 && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-muted/50 border border-border/50">
            <Switch
              id="hide-empty-modules"
              checked={hideEmptyModules}
              onCheckedChange={setHideEmptyModules}
              className="scale-90"
            />
            <Label htmlFor="hide-empty-modules" className="text-xs font-medium cursor-pointer whitespace-nowrap flex items-center gap-1.5">
              <EyeOff className="h-3 w-3" />
              Hide Empty Modules ({modules.filter(m => !lessons[m.id]?.length).length})
            </Label>
          </div>
        </div>
      )}

      {/* Bulk Delete Bar */}
      {selectedLessons.size > 0 && (
        <div className="flex items-center justify-between p-3 bg-destructive/10 border border-destructive/30 rounded-lg">
          <span className="text-sm font-medium">{selectedLessons.size} lessons selected</span>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={() => setSelectedLessons(new Set())}>Clear</Button>
            <Button variant="destructive" size="sm" onClick={handleBulkDeleteLessons} className="gap-1">
              <Trash2 className="h-3 w-3" /> Delete Selected
            </Button>
          </div>
        </div>
      )}

      {/* Modules & Lessons */}
      {loading ? (
        <div className="text-center py-8">
          <Loader2 className="h-8 w-8 animate-spin mx-auto" />
        </div>
      ) : !selectedCourse ? (
        <p className="text-center text-muted-foreground py-8">
          Select a course to manage its content
        </p>
      ) : modules.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">
          No modules yet. Add your first module to get started.
        </p>
      ) : (
        <Accordion type="multiple" className="space-y-2">
          {modules
            .filter(module => !hideEmptyModules || (lessons[module.id]?.length || 0) > 0)
            .map((module, idx) => (
              <AccordionItem key={module.id} value={module.id} className="border rounded-lg">
                <AccordionTrigger className="px-4 hover:no-underline">
                  <div className="flex items-center gap-3 flex-1">
                    <GripVertical className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">
                      Module {idx + 1}: {module.title}
                    </span>
                    <span className="text-sm text-muted-foreground ml-2">
                      ({lessons[module.id]?.length || 0} lessons)
                    </span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4">
                  <div className="flex gap-2 mb-4 flex-wrap">
                    <Button variant="outline" size="sm" onClick={() => handleEditModule(module)}>
                      <Pencil className="h-3 w-3 mr-1" /> Edit
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleDeleteModule(module.id)}>
                      <Trash2 className="h-3 w-3 mr-1" /> Delete
                    </Button>
                    <Button size="sm" onClick={() => handleAddLesson(module.id)}>
                      <Plus className="h-3 w-3 mr-1" /> Add Lesson
                    </Button>
                    {idx > 0 && (
                      <Button variant="ghost" size="sm" onClick={() => handleMoveModule(module.id, 'up')}>↑ Move Up</Button>
                    )}
                    {idx < modules.length - 1 && (
                      <Button variant="ghost" size="sm" onClick={() => handleMoveModule(module.id, 'down')}>↓ Move Down</Button>
                    )}
                  </div>

                  {/* Lessons List */}
                  <div className="space-y-2">
                    {(lessons[module.id] || []).map((lesson, lessonIdx) => (
                      <Card key={lesson.id} className={`bg-muted/30 ${selectedLessons.has(lesson.id) ? 'ring-2 ring-destructive/50' : ''}`}>
                        <CardContent className="p-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <input
                                type="checkbox"
                                checked={selectedLessons.has(lesson.id)}
                                onChange={() => toggleLessonSelection(lesson.id)}
                                className="h-4 w-4 rounded border-border"
                              />
                              <span className="text-sm text-muted-foreground">
                                {idx + 1}.{lessonIdx + 1}
                              </span>
                              {lesson.video_url ? (
                                <Video className="h-4 w-4 text-primary" />
                              ) : (
                                <FileText className="h-4 w-4 text-muted-foreground" />
                              )}
                              <div>
                                <p className="font-medium text-sm">{lesson.title}</p>
                                <p className="text-xs text-muted-foreground">
                                  {lesson.duration_minutes} min
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {/* Free Preview Toggle - batch save */}
                              {(() => {
                                const effectiveValue = getEffectiveFreePreview(lesson.id, lesson.is_free_preview);
                                const hasChange = pendingFreePreviewChanges.hasOwnProperty(lesson.id);
                                return (
                                  <div
                                    className={`flex items-center gap-1.5 cursor-pointer px-2 py-1 rounded ${hasChange ? 'bg-accent/20 border border-accent/40' : ''}`}
                                    onClick={() => toggleFreePreview(lesson.id, effectiveValue)}
                                  >
                                    <Switch
                                      checked={effectiveValue}
                                      className="scale-75"
                                    />
                                    <span className={`text-xs ${effectiveValue ? 'text-green-500' : 'text-muted-foreground'}`}>
                                      Free
                                    </span>
                                  </div>
                                );
                              })()}
                              <label className="cursor-pointer">
                                <input
                                  type="file"
                                  accept="video/*"
                                  className="hidden"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) handleVideoUpload(lesson.id, file);
                                  }}
                                  disabled={uploading}
                                />
                                <Button variant="ghost" size="icon" asChild disabled={uploading}>
                                  <span>
                                    {uploading ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                      <Upload className="h-4 w-4" />
                                    )}
                                  </span>
                                </Button>
                              </label>
                              <Button variant="ghost" size="icon" onClick={() => handleEditLesson(lesson)}>
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => handleDeleteLesson(lesson.id)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>

                          {/* Resources Section */}
                          <div className="mt-3 pt-3 border-t border-border/30">
                            <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                              <FileArchive className="h-3 w-3" /> Resources ({(lessonResources[lesson.id] || []).length})
                            </p>
                            {(lessonResources[lesson.id] || []).map(res => (
                              <div key={res.id} className="flex items-center justify-between py-1 px-2 rounded bg-muted/30 mb-1 text-xs">
                                <span className="truncate flex-1 font-medium">{res.title}</span>
                                <span className="text-muted-foreground mx-2 text-[10px]">{res.file_type || 'link'}</span>
                                <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => handleDeleteResource(lesson.id, res.id)}>
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                            ))}
                            {/* Add Resource Form */}
                            <div className="flex flex-col gap-1.5 mt-2">
                              <Input
                                placeholder="Resource title (e.g. Project Files.zip)"
                                className="h-7 text-xs"
                                value={resourceForm[lesson.id]?.title || ''}
                                onChange={e => setResourceForm(prev => ({ ...prev, [lesson.id]: { ...prev[lesson.id] || { file_url: '', file_type: '' }, title: e.target.value } }))}
                              />
                              <Input
                                placeholder="URL (Google Drive, direct link...)"
                                className="h-7 text-xs"
                                value={resourceForm[lesson.id]?.file_url || ''}
                                onChange={e => setResourceForm(prev => ({ ...prev, [lesson.id]: { ...prev[lesson.id] || { title: '', file_type: '' }, file_url: e.target.value } }))}
                              />
                              <div className="flex gap-1.5">
                                <Input
                                  placeholder="Type (zip, pdf, image...)"
                                  className="h-7 text-xs flex-1"
                                  value={resourceForm[lesson.id]?.file_type || ''}
                                  onChange={e => setResourceForm(prev => ({ ...prev, [lesson.id]: { ...prev[lesson.id] || { title: '', file_url: '' }, file_type: e.target.value } }))}
                                />
                                <Button size="sm" className="h-7 text-xs gap-1" onClick={() => handleAddResource(lesson.id)} disabled={addingResource === lesson.id}>
                                  {addingResource === lesson.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}
                                  Add
                                </Button>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
        </Accordion>
      )}

      {/* Module Dialog */}
      <Dialog open={moduleDialogOpen} onOpenChange={setModuleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingModule ? 'Edit Module' : 'Add Module'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Title</Label>
              <Input
                value={moduleForm.title}
                onChange={(e) => setModuleForm(prev => ({ ...prev, title: e.target.value }))}
              />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                value={moduleForm.description}
                onChange={(e) => setModuleForm(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModuleDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveModule}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Lesson Dialog */}
      <Dialog open={lessonDialogOpen} onOpenChange={setLessonDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingLesson ? 'Edit Lesson' : 'Add Lesson'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Title</Label>
              <Input
                value={lessonForm.title}
                onChange={(e) => setLessonForm(prev => ({ ...prev, title: e.target.value }))}
              />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                value={lessonForm.description}
                onChange={(e) => setLessonForm(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>
            <div>
              <Label>Duration (minutes)</Label>
              <Input
                type="number"
                value={lessonForm.duration_minutes}
                onChange={(e) => setLessonForm(prev => ({ ...prev, duration_minutes: parseInt(e.target.value) || 0 }))}
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={lessonForm.is_free_preview}
                onCheckedChange={(checked) => setLessonForm(prev => ({ ...prev, is_free_preview: checked }))}
              />
              <Label>Free Preview</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLessonDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveLesson}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
