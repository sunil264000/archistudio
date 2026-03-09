import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, Circle, ChevronRight, Sparkles } from 'lucide-react';

interface Task {
  key: string;
  title: string;
  description: string | null;
  points: number;
  icon: string;
  order_index: number;
}

export function ProfileCompletion() {
  const { user, profile } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [completedKeys, setCompletedKeys] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetch = async () => {
      const [tasksRes, completedRes] = await Promise.all([
        supabase.from('profile_completion_tasks').select('*').order('order_index'),
        supabase.from('user_completed_tasks').select('task_key').eq('user_id', user.id),
      ]);

      if (tasksRes.data) setTasks(tasksRes.data as Task[]);
      if (completedRes.data) setCompletedKeys(new Set(completedRes.data.map(c => c.task_key)));

      // Auto-detect completed tasks based on profile data
      const autoComplete: string[] = [];
      if (profile?.avatar_url) autoComplete.push('avatar');
      if ((profile as any)?.bio) autoComplete.push('bio');
      if ((profile as any)?.college) autoComplete.push('college');
      if ((profile as any)?.skills?.length > 0) autoComplete.push('skills');

      // Check for username
      const { data: usernameData } = await supabase
        .from('usernames')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();
      if (usernameData) autoComplete.push('username');

      // Insert auto-detected tasks
      const newCompletes = autoComplete.filter(k => !completedRes.data?.some(c => c.task_key === k));
      if (newCompletes.length > 0) {
        await supabase.from('user_completed_tasks').insert(
          newCompletes.map(key => ({ user_id: user.id, task_key: key }))
        );
        setCompletedKeys(prev => {
          const next = new Set(prev);
          newCompletes.forEach(k => next.add(k));
          return next;
        });
      }

      setLoading(false);
    };

    fetch();
  }, [user, profile]);

  if (loading || tasks.length === 0) return null;

  const completedCount = tasks.filter(t => completedKeys.has(t.key)).length;
  const percentage = Math.round((completedCount / tasks.length) * 100);
  const totalPoints = tasks.filter(t => completedKeys.has(t.key)).reduce((acc, t) => acc + t.points, 0);

  if (percentage === 100) return null;

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-accent" />
          Profile {percentage}% Complete
          <span className="text-xs font-normal text-muted-foreground ml-auto">{totalPoints} pts earned</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Progress value={percentage} className="h-2" />

        <div className="space-y-2">
          {tasks.map(task => {
            const done = completedKeys.has(task.key);
            return (
              <div
                key={task.key}
                className={`flex items-center gap-3 p-2.5 rounded-lg transition-colors ${
                  done ? 'bg-muted/30' : 'bg-muted/10 hover:bg-muted/20'
                }`}
              >
                {done ? (
                  <CheckCircle2 className="h-4 w-4 text-accent shrink-0" />
                ) : (
                  <Circle className="h-4 w-4 text-muted-foreground/40 shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className={`text-sm ${done ? 'text-muted-foreground line-through' : 'text-foreground font-medium'}`}>
                    {task.title}
                  </p>
                </div>
                <span className="text-xs text-muted-foreground">+{task.points}</span>
              </div>
            );
          })}
        </div>

        <Link
          to="/dashboard"
          className="flex items-center justify-center gap-1.5 text-xs text-accent hover:text-accent/80 font-medium"
        >
          Complete your profile <ChevronRight className="h-3 w-3" />
        </Link>
      </CardContent>
    </Card>
  );
}
