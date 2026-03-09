import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Plus, Trash2, CheckCircle2, Circle, Milestone } from 'lucide-react';

interface MilestoneItem {
  id: string;
  title: string;
  description: string | null;
  target_date: string | null;
  completed: boolean;
  completed_at: string | null;
  order_index: number;
  created_at: string;
}

interface StudioMilestonesTabProps {
  projectId: string;
}

export function StudioMilestonesTab({ projectId }: StudioMilestonesTabProps) {
  const { user } = useAuth();
  const [milestones, setMilestones] = useState<MilestoneItem[]>([]);
  const [newTitle, setNewTitle] = useState('');
  const [newDate, setNewDate] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchMilestones = async () => {
    const { data } = await (supabase as any)
      .from('studio_project_milestones')
      .select('*')
      .eq('project_id', projectId)
      .order('order_index')
      .order('created_at');
    setMilestones(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchMilestones(); }, [projectId]);

  const addMilestone = async () => {
    if (!newTitle.trim() || !user) return;
    await (supabase as any).from('studio_project_milestones').insert({
      project_id: projectId,
      user_id: user.id,
      title: newTitle.trim(),
      target_date: newDate || null,
    });
    setNewTitle('');
    setNewDate('');
    fetchMilestones();
  };

  const toggleMilestone = async (m: MilestoneItem) => {
    await (supabase as any).from('studio_project_milestones').update({
      completed: !m.completed,
      completed_at: !m.completed ? new Date().toISOString() : null,
    }).eq('id', m.id);
    fetchMilestones();
  };

  const deleteMilestone = async (id: string) => {
    await (supabase as any).from('studio_project_milestones').delete().eq('id', id);
    fetchMilestones();
  };

  const completedCount = milestones.filter(m => m.completed).length;
  const progress = milestones.length > 0 ? Math.round((completedCount / milestones.length) * 100) : 0;

  return (
    <div className="space-y-4">
      {/* Progress bar */}
      {milestones.length > 0 && (
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{completedCount}/{milestones.length} milestones</span>
            <span>{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      )}

      {/* Add milestone */}
      <div className="flex gap-2">
        <Input
          placeholder="Milestone title..."
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && addMilestone()}
          className="flex-1"
        />
        <Input
          type="date"
          value={newDate}
          onChange={(e) => setNewDate(e.target.value)}
          className="w-36"
        />
        <Button onClick={addMilestone} size="sm" className="gap-1.5 bg-accent text-accent-foreground hover:bg-accent/90">
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {milestones.length === 0 && !loading && (
        <p className="text-sm text-muted-foreground text-center py-6">No milestones yet. Track your project progress!</p>
      )}

      {/* Milestone list */}
      <div className="space-y-2">
        {milestones.map((m) => (
          <div key={m.id} className={`flex items-start gap-3 p-3 rounded-lg border transition-colors group ${m.completed ? 'border-accent/20 bg-accent/5' : 'border-border/50 hover:bg-muted/30'}`}>
            <button onClick={() => toggleMilestone(m)} className="mt-0.5 shrink-0">
              {m.completed ? (
                <CheckCircle2 className="h-5 w-5 text-accent" />
              ) : (
                <Circle className="h-5 w-5 text-muted-foreground hover:text-accent transition-colors" />
              )}
            </button>
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-medium ${m.completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                {m.title}
              </p>
              {m.target_date && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  Target: {new Date(m.target_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </p>
              )}
            </div>
            <Button
              variant="ghost" size="icon"
              className="h-7 w-7 opacity-0 group-hover:opacity-100 text-destructive"
              onClick={() => deleteMilestone(m.id)}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
