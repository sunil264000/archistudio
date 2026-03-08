import { useState } from 'react';
import { StudioTimelineEntry } from '@/hooks/useStudioProjects';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Clock, Upload, StickyNote, FolderPlus, FileImage } from 'lucide-react';
import { format } from 'date-fns';

interface StudioTimelineTabProps {
  timeline: StudioTimelineEntry[];
  onAdd: (title: string, description?: string) => void;
}

const typeIcons: Record<string, React.ReactNode> = {
  created: <FolderPlus className="h-4 w-4 text-accent" />,
  file_upload: <Upload className="h-4 w-4 text-blue-500" />,
  note: <StickyNote className="h-4 w-4 text-yellow-500" />,
  update: <Clock className="h-4 w-4 text-muted-foreground" />,
};

export function StudioTimelineTab({ timeline, onAdd }: StudioTimelineTabProps) {
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');

  const handleAdd = () => {
    if (!title.trim()) return;
    onAdd(title.trim(), desc.trim() || undefined);
    setTitle('');
    setDesc('');
    setAdding(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-medium text-muted-foreground">Progress Timeline</h3>
        <Button size="sm" variant="outline" onClick={() => setAdding(true)} className="gap-1.5">
          <Plus className="h-3.5 w-3.5" /> Add Update
        </Button>
      </div>

      {adding && (
        <div className="p-4 rounded-xl border border-accent/30 bg-card space-y-3">
          <Input placeholder="Update title" value={title} onChange={(e) => setTitle(e.target.value)} />
          <Textarea placeholder="Description (optional)" value={desc} onChange={(e) => setDesc(e.target.value)} rows={2} />
          <div className="flex gap-2">
            <Button size="sm" onClick={handleAdd} disabled={!title.trim()} className="bg-accent text-accent-foreground hover:bg-accent/90">
              Add to Timeline
            </Button>
            <Button size="sm" variant="outline" onClick={() => setAdding(false)}>Cancel</Button>
          </div>
        </div>
      )}

      {timeline.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Clock className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>No timeline entries yet. Your activity will be tracked automatically.</p>
        </div>
      ) : (
        <div className="relative pl-6 border-l-2 border-border space-y-6">
          {timeline.map((entry) => (
            <div key={entry.id} className="relative">
              <div className="absolute -left-[1.85rem] top-0 h-8 w-8 rounded-full bg-card border-2 border-border flex items-center justify-center">
                {typeIcons[entry.entry_type] || typeIcons.update}
              </div>
              <div className="ml-4">
                <p className="font-medium text-sm text-foreground">{entry.title}</p>
                {entry.description && (
                  <p className="text-xs text-muted-foreground mt-0.5">{entry.description}</p>
                )}
                {entry.image_url && (
                  <img src={entry.image_url} alt="" className="mt-2 rounded-lg max-h-32 object-cover" loading="lazy" />
                )}
                <span className="text-[10px] text-muted-foreground mt-1 block">
                  {format(new Date(entry.created_at), 'MMM d, yyyy h:mm a')}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
