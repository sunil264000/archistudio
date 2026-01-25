import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Rocket, Plus, Pencil, Trash2, Loader2, Calendar } from 'lucide-react';
import { format } from 'date-fns';

interface LaunchFreeCourse {
  id: string;
  course_id: string;
  name: string | null;
  start_at: string;
  end_at: string | null;
  is_active: boolean;
  auto_enroll_all: boolean;
  created_at: string;
  course?: {
    title: string;
    slug: string;
  };
}

interface Course {
  id: string;
  title: string;
  slug: string;
}

export function LaunchFreeCourseManagement() {
  const [launchCourses, setLaunchCourses] = useState<LaunchFreeCourse[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<LaunchFreeCourse | null>(null);

  // Form state
  const [form, setForm] = useState({
    course_id: '',
    name: '',
    start_at: '',
    end_at: '',
    is_active: true,
    auto_enroll_all: true,
    is_lifetime: false,
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch launch free courses with course details
      const { data: launchData } = await supabase
        .from('launch_free_courses')
        .select(`
          *,
          course:courses(title, slug)
        `)
        .order('created_at', { ascending: false });

      setLaunchCourses(launchData || []);

      // Fetch all published courses
      const { data: coursesData } = await supabase
        .from('courses')
        .select('id, title, slug')
        .eq('is_published', true)
        .order('title');
      setCourses(coursesData || []);
    } catch (error: any) {
      toast.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const resetForm = () => {
    setForm({
      course_id: '',
      name: '',
      start_at: '',
      end_at: '',
      is_active: true,
      auto_enroll_all: true,
      is_lifetime: false,
    });
    setEditingEntry(null);
  };

  const handleEdit = (entry: LaunchFreeCourse) => {
    setEditingEntry(entry);
    setForm({
      course_id: entry.course_id,
      name: entry.name || '',
      start_at: entry.start_at.slice(0, 16),
      end_at: entry.end_at?.slice(0, 16) || '',
      is_active: entry.is_active,
      auto_enroll_all: entry.auto_enroll_all,
      is_lifetime: !entry.end_at,
    });
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.course_id || !form.start_at) {
      toast.error('Please fill in all required fields');
      return;
    }

    // Check if course already has a launch free entry
    const existing = launchCourses.find(lc => 
      lc.course_id === form.course_id && lc.id !== editingEntry?.id
    );
    if (existing) {
      toast.error('This course already has a launch free configuration');
      return;
    }

    setSaving(true);
    try {
      const data = {
        course_id: form.course_id,
        name: form.name || null,
        start_at: new Date(form.start_at).toISOString(),
        end_at: form.is_lifetime ? null : (form.end_at ? new Date(form.end_at).toISOString() : null),
        is_active: form.is_active,
        auto_enroll_all: form.auto_enroll_all,
      };

      if (editingEntry) {
        const { error } = await supabase
          .from('launch_free_courses')
          .update(data)
          .eq('id', editingEntry.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('launch_free_courses')
          .insert(data);
        if (error) throw error;
      }

      toast.success(editingEntry ? 'Updated successfully' : 'Launch free course created');
      setDialogOpen(false);
      resetForm();
      fetchData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this launch free configuration?')) return;

    try {
      const { error } = await supabase
        .from('launch_free_courses')
        .delete()
        .eq('id', id);
      if (error) throw error;
      toast.success('Deleted successfully');
      fetchData();
    } catch (error: any) {
      toast.error('Failed to delete');
    }
  };

  const getStatus = (entry: LaunchFreeCourse) => {
    const now = new Date();
    const start = new Date(entry.start_at);
    const end = entry.end_at ? new Date(entry.end_at) : null;

    if (!entry.is_active) return { label: 'Inactive', variant: 'secondary' as const };
    if (now < start) return { label: 'Scheduled', variant: 'outline' as const };
    if (end && now > end) return { label: 'Ended', variant: 'secondary' as const };
    if (!end) return { label: 'Lifetime Free', variant: 'default' as const };
    return { label: 'Active', variant: 'default' as const };
  };

  // Filter out courses that already have launch free config
  const availableCourses = courses.filter(c => 
    !launchCourses.some(lc => lc.course_id === c.id && lc.id !== editingEntry?.id)
  );

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12 flex justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Rocket className="h-5 w-5 text-accent" />
                Launch Free Courses
              </CardTitle>
              <CardDescription>
                Mark courses as free for a limited time or permanently for launch promotions
              </CardDescription>
            </div>
            <Dialog open={dialogOpen} onOpenChange={(open) => {
              setDialogOpen(open);
              if (!open) resetForm();
            }}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add Launch Free
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>
                    {editingEntry ? 'Edit Launch Free Course' : 'Add Launch Free Course'}
                  </DialogTitle>
                  <DialogDescription>
                    Configure a course to be freely accessible during a launch period
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                  {/* Select Course */}
                  <div className="space-y-2">
                    <Label>Select Course *</Label>
                    <Select
                      value={form.course_id}
                      onValueChange={(v) => setForm(prev => ({ ...prev, course_id: v }))}
                      disabled={!!editingEntry}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a course" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableCourses.map(course => (
                          <SelectItem key={course.id} value={course.id}>
                            {course.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Campaign Name */}
                  <div className="space-y-2">
                    <Label htmlFor="name">Campaign Name (optional)</Label>
                    <Input
                      id="name"
                      value={form.name}
                      onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="e.g., Summer Launch Promo"
                    />
                  </div>

                  {/* Start Date */}
                  <div className="space-y-2">
                    <Label htmlFor="start_at">Start Date & Time *</Label>
                    <Input
                      id="start_at"
                      type="datetime-local"
                      value={form.start_at}
                      onChange={(e) => setForm(prev => ({ ...prev, start_at: e.target.value }))}
                    />
                  </div>

                  {/* Lifetime Toggle */}
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div>
                      <Label>Lifetime Free</Label>
                      <p className="text-xs text-muted-foreground">No expiry date</p>
                    </div>
                    <Switch
                      checked={form.is_lifetime}
                      onCheckedChange={(checked) => setForm(prev => ({ 
                        ...prev, 
                        is_lifetime: checked,
                        end_at: checked ? '' : prev.end_at 
                      }))}
                    />
                  </div>

                  {/* End Date (if not lifetime) */}
                  {!form.is_lifetime && (
                    <div className="space-y-2">
                      <Label htmlFor="end_at">End Date & Time</Label>
                      <Input
                        id="end_at"
                        type="datetime-local"
                        value={form.end_at}
                        onChange={(e) => setForm(prev => ({ ...prev, end_at: e.target.value }))}
                      />
                    </div>
                  )}

                  {/* Auto Enroll Toggle */}
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div>
                      <Label>Auto-Enroll All Users</Label>
                      <p className="text-xs text-muted-foreground">
                        Automatically give access to all existing users
                      </p>
                    </div>
                    <Switch
                      checked={form.auto_enroll_all}
                      onCheckedChange={(checked) => setForm(prev => ({ ...prev, auto_enroll_all: checked }))}
                    />
                  </div>

                  {/* Active Toggle */}
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div>
                      <Label>Active</Label>
                      <p className="text-xs text-muted-foreground">
                        Enable or disable this launch free config
                      </p>
                    </div>
                    <Switch
                      checked={form.is_active}
                      onCheckedChange={(checked) => setForm(prev => ({ ...prev, is_active: checked }))}
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSubmit} disabled={saving}>
                    {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    {editingEntry ? 'Update' : 'Create'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {launchCourses.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Rocket className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No launch free courses configured</p>
              <p className="text-sm">Add a course to make it freely accessible</p>
            </div>
          ) : (
            <div className="space-y-4">
              {launchCourses.map((entry) => {
                const status = getStatus(entry);
                return (
                  <div
                    key={entry.id}
                    className="border rounded-xl p-4 hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{entry.course?.title || 'Unknown Course'}</h3>
                          <Badge variant={status.variant}>{status.label}</Badge>
                        </div>
                        {entry.name && (
                          <p className="text-sm text-muted-foreground">{entry.name}</p>
                        )}
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {format(new Date(entry.start_at), 'MMM d, yyyy')}
                            {entry.end_at ? ` - ${format(new Date(entry.end_at), 'MMM d, yyyy')}` : ' - Forever'}
                          </span>
                          {entry.auto_enroll_all && (
                            <Badge variant="outline" className="text-xs">Auto-enroll</Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(entry)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(entry.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
