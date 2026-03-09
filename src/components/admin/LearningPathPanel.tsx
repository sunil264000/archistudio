import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { Route, Plus, GripVertical, Trash2, Loader2, RefreshCw, BookOpen } from 'lucide-react';
import { toast } from 'sonner';

interface LearningPath {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  is_published: boolean;
  order_index: number;
  courses?: { id: string; title: string; order_index: number }[];
}

interface Course {
  id: string;
  title: string;
  slug: string;
}

export function LearningPathPanel() {
  const [paths, setPaths] = useState<LearningPath[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [adding, setAdding] = useState(false);
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [addCourseId, setAddCourseId] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [pathsRes, coursesRes] = await Promise.all([
      supabase.from('learning_paths').select('*').order('order_index'),
      supabase.from('courses').select('id, title, slug').eq('is_published', true).order('title'),
    ]);

    const pathsData = (pathsRes.data as LearningPath[]) || [];

    // Fetch courses for each path
    for (const path of pathsData) {
      const { data: pathCourses } = await supabase
        .from('learning_path_courses')
        .select('course_id, order_index')
        .eq('path_id', path.id)
        .order('order_index');

      if (pathCourses) {
        const courseIds = pathCourses.map(pc => pc.course_id);
        const { data: courseDetails } = await supabase
          .from('courses')
          .select('id, title')
          .in('id', courseIds.length > 0 ? courseIds : ['__none__']);

        path.courses = pathCourses.map(pc => {
          const course = courseDetails?.find(c => c.id === pc.course_id);
          return { id: pc.course_id, title: course?.title || 'Unknown', order_index: pc.order_index };
        });
      }
    }

    setPaths(pathsData);
    setCourses(coursesRes.data || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const addPath = async () => {
    if (!newTitle.trim()) return;
    setAdding(true);
    const slug = newTitle.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const { error } = await supabase.from('learning_paths').insert({
      title: newTitle.trim(),
      slug,
      description: newDesc.trim() || null,
    });
    if (error) toast.error(error.message);
    else { toast.success('Path created'); setNewTitle(''); setNewDesc(''); fetchData(); }
    setAdding(false);
  };

  const togglePublish = async (id: string, published: boolean) => {
    await supabase.from('learning_paths').update({ is_published: published }).eq('id', id);
    toast.success(published ? 'Published' : 'Unpublished');
    setPaths(prev => prev.map(p => p.id === id ? { ...p, is_published: published } : p));
  };

  const addCourseTo = async (pathId: string) => {
    if (!addCourseId) return;
    const maxOrder = Math.max(0, ...(paths.find(p => p.id === pathId)?.courses?.map(c => c.order_index) || [0]));
    const { error } = await supabase.from('learning_path_courses').insert({
      path_id: pathId,
      course_id: addCourseId,
      order_index: maxOrder + 1,
    });
    if (error) toast.error(error.message);
    else { toast.success('Course added'); setAddCourseId(''); fetchData(); }
  };

  const removeCourse = async (pathId: string, courseId: string) => {
    await supabase.from('learning_path_courses').delete().eq('path_id', pathId).eq('course_id', courseId);
    toast.success('Removed');
    fetchData();
  };

  const deletePath = async (id: string) => {
    if (!confirm('Delete this learning path?')) return;
    await supabase.from('learning_paths').delete().eq('id', id);
    toast.success('Deleted');
    fetchData();
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base"><Plus className="h-4 w-4" /> Create Learning Path</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input placeholder="Path title" value={newTitle} onChange={e => setNewTitle(e.target.value)} className="flex-1" />
            <Input placeholder="Description" value={newDesc} onChange={e => setNewDesc(e.target.value)} className="flex-1" />
            <Button onClick={addPath} disabled={adding || !newTitle.trim()}>
              {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2"><Route className="h-5 w-5 text-accent" /> Learning Paths</CardTitle>
              <CardDescription>{paths.length} paths configured</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={fetchData} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} /> Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">{[1,2].map(i => <Skeleton key={i} className="h-24 w-full" />)}</div>
          ) : paths.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">No learning paths yet</p>
          ) : (
            <ScrollArea className="max-h-[600px]">
              <div className="space-y-4">
                {paths.map(path => (
                  <div key={path.id} className="p-4 rounded-xl border bg-muted/20 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{path.title}</span>
                          <Badge variant={path.is_published ? 'default' : 'secondary'} className="text-[10px]">
                            {path.is_published ? 'Published' : 'Draft'}
                          </Badge>
                        </div>
                        {path.description && <p className="text-xs text-muted-foreground mt-0.5">{path.description}</p>}
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch checked={path.is_published} onCheckedChange={v => togglePublish(path.id, v)} />
                        <Button variant="ghost" size="icon" className="text-destructive" onClick={() => deletePath(path.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Courses in path */}
                    <div className="space-y-1">
                      {(path.courses || []).map((c, i) => (
                        <div key={c.id} className="flex items-center gap-2 p-2 rounded-lg bg-background border text-sm">
                          <GripVertical className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground w-6">{i + 1}.</span>
                          <BookOpen className="h-3.5 w-3.5 text-accent" />
                          <span className="flex-1 truncate">{c.title}</span>
                          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeCourse(path.id, c.id)}>
                            <Trash2 className="h-3 w-3 text-destructive" />
                          </Button>
                        </div>
                      ))}
                    </div>

                    {/* Add course */}
                    {selectedPath === path.id ? (
                      <div className="flex gap-2">
                        <Select value={addCourseId} onValueChange={setAddCourseId}>
                          <SelectTrigger className="flex-1"><SelectValue placeholder="Select course..." /></SelectTrigger>
                          <SelectContent>
                            {courses.filter(c => !path.courses?.some(pc => pc.id === c.id)).map(c => (
                              <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button size="sm" onClick={() => addCourseTo(path.id)} disabled={!addCourseId}>Add</Button>
                        <Button size="sm" variant="ghost" onClick={() => setSelectedPath(null)}>Cancel</Button>
                      </div>
                    ) : (
                      <Button variant="outline" size="sm" className="gap-1" onClick={() => setSelectedPath(path.id)}>
                        <Plus className="h-3 w-3" /> Add Course
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
