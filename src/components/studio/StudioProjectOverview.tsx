import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { FileImage, StickyNote, CheckCircle2, Clock, BarChart3, MessageSquare } from 'lucide-react';

interface OverviewProps {
  projectId: string;
  filesCount: number;
  notesCount: number;
  commentsCount: number;
}

export function StudioProjectOverview({ projectId, filesCount, notesCount, commentsCount }: OverviewProps) {
  const [taskStats, setTaskStats] = useState({ total: 0, done: 0 });
  const [milestoneStats, setMilestoneStats] = useState({ total: 0, completed: 0 });

  useEffect(() => {
    const fetch = async () => {
      const [tasksRes, milestonesRes] = await Promise.all([
        (supabase as any).from('studio_project_tasks').select('status').eq('project_id', projectId),
        (supabase as any).from('studio_project_milestones').select('is_completed').eq('project_id', projectId),
      ]);
      const tasks = tasksRes.data || [];
      const milestones = milestonesRes.data || [];
      setTaskStats({ total: tasks.length, done: tasks.filter((t: any) => t.status === 'done').length });
      setMilestoneStats({ total: milestones.length, completed: milestones.filter((m: any) => m.is_completed).length });
    };
    fetch();
  }, [projectId]);

  const taskProgress = taskStats.total > 0 ? Math.round((taskStats.done / taskStats.total) * 100) : 0;

  const stats = [
    { icon: CheckCircle2, label: 'Tasks', value: `${taskStats.done}/${taskStats.total}`, color: 'text-emerald-500' },
    { icon: BarChart3, label: 'Milestones', value: `${milestoneStats.completed}/${milestoneStats.total}`, color: 'text-accent' },
    { icon: FileImage, label: 'Files', value: String(filesCount), color: 'text-blue-400' },
    { icon: StickyNote, label: 'Notes', value: String(notesCount), color: 'text-amber-400' },
    { icon: MessageSquare, label: 'Comments', value: String(commentsCount), color: 'text-purple-400' },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {stats.map(s => {
          const Icon = s.icon;
          return (
            <Card key={s.label} className="bg-card/50">
              <CardContent className="p-4 text-center">
                <Icon className={`h-5 w-5 mx-auto mb-1.5 ${s.color}`} />
                <p className="text-lg font-bold text-foreground">{s.value}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{s.label}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {taskStats.total > 0 && (
        <Card className="bg-card/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-muted-foreground">Overall Progress</span>
              <Badge variant="outline" className="text-[10px]">{taskProgress}%</Badge>
            </div>
            <Progress value={taskProgress} className="h-2" />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
