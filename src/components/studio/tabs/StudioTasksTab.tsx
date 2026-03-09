import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Trash2, Flag, AlertCircle, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  due_date: string | null;
  completed_at: string | null;
  order_index: number;
  created_at: string;
}

interface StudioTasksTabProps {
  projectId: string;
}

const PRIORITY_COLORS: Record<string, string> = {
  high: 'text-red-500',
  medium: 'text-yellow-500',
  low: 'text-green-500',
};

export function StudioTasksTab({ projectId }: StudioTasksTabProps) {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTitle, setNewTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTasks = async () => {
    setError(null);
    const { data, error: fetchError } = await (supabase as any)
      .from('studio_project_tasks')
      .select('*')
      .eq('project_id', projectId)
      .order('order_index')
      .order('created_at');
    if (fetchError) {
      console.error('Failed to load tasks:', fetchError);
      setError('Failed to load tasks');
      toast.error('Failed to load tasks');
    }
    setTasks(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchTasks(); }, [projectId]);

  const addTask = async () => {
    if (!newTitle.trim() || !user) return;
    const { error } = await (supabase as any).from('studio_project_tasks').insert({
      project_id: projectId,
      user_id: user.id,
      title: newTitle.trim(),
    });
    if (error) { toast.error('Failed to add task'); return; }
    setNewTitle('');
    fetchTasks();
  };

  const toggleTask = async (task: Task) => {
    const newStatus = task.status === 'done' ? 'todo' : 'done';
    const { error } = await (supabase as any).from('studio_project_tasks').update({
      status: newStatus,
      completed_at: newStatus === 'done' ? new Date().toISOString() : null,
    }).eq('id', task.id);
    if (error) { toast.error('Failed to update task'); return; }
    fetchTasks();
  };

  const updatePriority = async (id: string, priority: string) => {
    const { error } = await (supabase as any).from('studio_project_tasks').update({ priority }).eq('id', id);
    if (error) { toast.error('Failed to update priority'); return; }
    fetchTasks();
  };

  const deleteTask = async (id: string) => {
    const { error } = await (supabase as any).from('studio_project_tasks').delete().eq('id', id);
    if (error) { toast.error('Failed to delete task'); return; }
    fetchTasks();
  };

  const todoTasks = tasks.filter(t => t.status !== 'done');
  const doneTasks = tasks.filter(t => t.status === 'done');

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full rounded-lg" />)}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 space-y-3">
        <AlertCircle className="h-8 w-8 text-destructive mx-auto" />
        <p className="text-sm text-destructive">{error}</p>
        <Button variant="outline" size="sm" onClick={fetchTasks} className="gap-1.5">
          <RefreshCw className="h-3.5 w-3.5" /> Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Add task */}
      <div className="flex gap-2">
        <Input
          placeholder="Add a task..."
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && addTask()}
          className="flex-1"
        />
        <Button onClick={addTask} size="sm" className="gap-1.5 bg-accent text-accent-foreground hover:bg-accent/90">
          <Plus className="h-4 w-4" /> Add
        </Button>
      </div>

      {todoTasks.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-6">No tasks yet. Add one above!</p>
      )}

      <div className="space-y-1">
        {todoTasks.map((task) => (
          <div key={task.id} className="flex items-center gap-2 p-2.5 rounded-lg border border-border/50 hover:bg-muted/30 group transition-colors">
            <Checkbox checked={false} onCheckedChange={() => toggleTask(task)} className="shrink-0" />
            <span className="flex-1 text-sm text-foreground">{task.title}</span>
            <Flag className={`h-3.5 w-3.5 shrink-0 ${PRIORITY_COLORS[task.priority] || PRIORITY_COLORS.medium}`} />
            <Select value={task.priority} onValueChange={(v) => updatePriority(task.id, v)}>
              <SelectTrigger className="w-20 h-7 text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Med</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="ghost" size="icon"
              className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-destructive"
              onClick={() => deleteTask(task.id)}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        ))}
      </div>

      {doneTasks.length > 0 && (
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Completed ({doneTasks.length})</p>
          {doneTasks.map((task) => (
            <div key={task.id} className="flex items-center gap-2 p-2.5 rounded-lg border border-border/30 opacity-60 group">
              <Checkbox checked onCheckedChange={() => toggleTask(task)} className="shrink-0" />
              <span className="flex-1 text-sm text-muted-foreground line-through">{task.title}</span>
              <Button
                variant="ghost" size="icon"
                className="h-7 w-7 opacity-0 group-hover:opacity-100 text-destructive"
                onClick={() => deleteTask(task.id)}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
