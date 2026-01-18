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
import { toast } from 'sonner';
import { 
  Plus, Pencil, Trash2, Upload, Video, FileText, 
  GripVertical, Loader2, ChevronRight, FolderPlus 
} from 'lucide-react';
import { GoogleDriveImport } from './GoogleDriveImport';

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

export function LessonManagement() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [lessons, setLessons] = useState<Record<string, Lesson[]>>({});
  const [loading, setLoading] = useState(false);

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
    
    await supabase.from('lessons').delete().eq('id', lessonId);
    toast.success('Lesson deleted');
    if (selectedCourse) fetchModules(selectedCourse);
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

  return (
    <div className="space-y-6">
      {/* Course Selector */}
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <Label>Select Course</Label>
          <Select value={selectedCourse || ''} onValueChange={setSelectedCourse}>
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
          <Button onClick={handleAddModule} className="mt-6 gap-2">
            <FolderPlus className="h-4 w-4" />
            Add Module
          </Button>
        )}
      </div>

      {/* Google Drive Import */}
      {selectedCourse && selectedCourseData && (
        <GoogleDriveImport
          courseId={selectedCourse}
          courseName={selectedCourseData.title}
          onImportComplete={() => fetchModules(selectedCourse)}
        />
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
          {modules.map((module, idx) => (
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
                <div className="flex gap-2 mb-4">
                  <Button variant="outline" size="sm" onClick={() => handleEditModule(module)}>
                    <Pencil className="h-3 w-3 mr-1" /> Edit
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleDeleteModule(module.id)}>
                    <Trash2 className="h-3 w-3 mr-1" /> Delete
                  </Button>
                  <Button size="sm" onClick={() => handleAddLesson(module.id)}>
                    <Plus className="h-3 w-3 mr-1" /> Add Lesson
                  </Button>
                </div>

                {/* Lessons List */}
                <div className="space-y-2">
                  {(lessons[module.id] || []).map((lesson, lessonIdx) => (
                    <Card key={lesson.id} className="bg-muted/30">
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className="text-sm text-muted-foreground">
                              {idx + 1}.{lessonIdx + 1}
                            </span>
                            {lesson.video_url ? (
                              <Video className="h-4 w-4 text-green-500" />
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
                            {/* Free Preview Toggle */}
                            <div 
                              className="flex items-center gap-1.5 cursor-pointer"
                              onClick={async () => {
                                await supabase
                                  .from('lessons')
                                  .update({ is_free_preview: !lesson.is_free_preview })
                                  .eq('id', lesson.id);
                                toast.success(lesson.is_free_preview ? 'Removed free preview' : 'Marked as free preview');
                                if (selectedCourse) fetchModules(selectedCourse);
                              }}
                            >
                              <Switch
                                checked={lesson.is_free_preview}
                                className="scale-75"
                              />
                              <span className={`text-xs ${lesson.is_free_preview ? 'text-green-500' : 'text-muted-foreground'}`}>
                                Free
                              </span>
                            </div>
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
