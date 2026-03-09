import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, GripVertical, CheckCircle2, Clock, AlertCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

interface Task {
  id: string;
  title: string;
  status: string;
  priority: string;
  order_index: number;
}

const COLUMNS = [
  { key: 'todo', label: 'To Do', icon: Clock, color: 'text-muted-foreground' },
  { key: 'in_progress', label: 'In Progress', icon: AlertCircle, color: 'text-amber-500' },
  { key: 'done', label: 'Done', icon: CheckCircle2, color: 'text-emerald-500' },
];

const PRIORITY_BADGE: Record<string, string> = {
  high: 'bg-red-500/10 text-red-400 border-red-500/20',
  medium: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  low: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
};

export function StudioKanbanBoard({ projectId }: { projectId: string }) {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newPriority, setNewPriority] = useState('medium');
  const [newStatus, setNewStatus] = useState('todo');

  const fetchTasks = useCallback(async () => {
    const { data } = await (supabase as any)
      .from('studio_project_tasks')
      .select('*')
      .eq('project_id', projectId)
      .order('order_index');
    setTasks((data as Task[]) || []);
    setLoading(false);
  }, [projectId]);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  const addTask = async () => {
    if (!user || !newTitle.trim()) return;
    await (supabase as any).from('studio_project_tasks').insert({
      project_id: projectId,
      user_id: user.id,
      title: newTitle.trim(),
      status: newStatus,
      priority: newPriority,
      order_index: tasks.length,
    });
    setNewTitle('');
    setAddOpen(false);
    toast.success('Task added');
    fetchTasks();
  };

  const moveTask = async (taskId: string, newStatusVal: string) => {
    await (supabase as any).from('studio_project_tasks')
      .update({ status: newStatusVal })
      .eq('id', taskId);
    fetchTasks();
  };

  if (loading) return <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Kanban Board</h3>
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline" className="gap-1.5">
              <Plus className="h-3.5 w-3.5" /> Add Task
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader><DialogTitle>New Task</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <Input placeholder="Task title" value={newTitle} onChange={e => setNewTitle(e.target.value)} />
              <div className="grid grid-cols-2 gap-2">
                <Select value={newPriority} onValueChange={setNewPriority}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {COLUMNS.map(c => <SelectItem key={c.key} value={c.key}>{c.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={addTask} disabled={!newTitle.trim()} className="w-full">Create</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {COLUMNS.map(col => {
          const colTasks = tasks.filter(t => t.status === col.key);
          const Icon = col.icon;
          return (
            <div key={col.key} className="space-y-2">
              <div className="flex items-center gap-2 px-1">
                <Icon className={`h-4 w-4 ${col.color}`} />
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{col.label}</span>
                <Badge variant="outline" className="text-[10px] ml-auto">{colTasks.length}</Badge>
              </div>
              <div className="min-h-[120px] rounded-xl border border-dashed border-border/50 p-2 space-y-2 bg-muted/20">
                <AnimatePresence>
                  {colTasks.map(task => (
                    <motion.div
                      key={task.id}
                      layout
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                    >
                      <Card className="bg-card/80 hover:border-accent/20 transition-colors">
                        <CardContent className="p-3">
                          <div className="flex items-start gap-2">
                            <GripVertical className="h-4 w-4 text-muted-foreground/30 mt-0.5 shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-foreground line-clamp-2">{task.title}</p>
                              <div className="flex items-center gap-2 mt-1.5">
                                <Badge variant="outline" className={`text-[10px] ${PRIORITY_BADGE[task.priority] || ''}`}>
                                  {task.priority}
                                </Badge>
                                <Select value={task.status} onValueChange={v => moveTask(task.id, v)}>
                                  <SelectTrigger className="h-5 text-[10px] border-0 bg-transparent p-0 px-1 w-auto">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {COLUMNS.map(c => <SelectItem key={c.key} value={c.key}>{c.label}</SelectItem>)}
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </AnimatePresence>
                {colTasks.length === 0 && (
                  <p className="text-xs text-muted-foreground/50 text-center py-6">No tasks</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
