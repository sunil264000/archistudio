import { useState } from 'react';
import { StudioProjectNote } from '@/hooks/useStudioProjects';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Trash2, StickyNote } from 'lucide-react';
import { format } from 'date-fns';

interface StudioNotesTabProps {
  notes: StudioProjectNote[];
  onAdd: (title: string, content: string) => void;
  onDelete: (noteId: string) => void;
}

export function StudioNotesTab({ notes, onAdd, onDelete }: StudioNotesTabProps) {
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  const handleAdd = () => {
    if (!content.trim()) return;
    onAdd(title.trim(), content.trim());
    setTitle('');
    setContent('');
    setAdding(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-medium text-muted-foreground">Concept Notes</h3>
        <Button size="sm" variant="outline" onClick={() => setAdding(true)} className="gap-1.5">
          <Plus className="h-3.5 w-3.5" /> Add Note
        </Button>
      </div>

      {adding && (
        <Card className="p-4 space-y-3 border-accent/30">
          <Input
            placeholder="Note title (optional)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <Textarea
            placeholder="Write your concept note, ideas, observations..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={4}
          />
          <div className="flex gap-2">
            <Button size="sm" onClick={handleAdd} disabled={!content.trim()} className="bg-accent text-accent-foreground hover:bg-accent/90">
              Save Note
            </Button>
            <Button size="sm" variant="outline" onClick={() => { setAdding(false); setTitle(''); setContent(''); }}>
              Cancel
            </Button>
          </div>
        </Card>
      )}

      {notes.length === 0 && !adding ? (
        <div className="text-center py-12 text-muted-foreground">
          <StickyNote className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>No notes yet. Capture your concept ideas and observations.</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {notes.map(note => (
            <Card key={note.id}>
              <CardContent className="pt-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    {note.title && <h4 className="font-semibold text-foreground">{note.title}</h4>}
                    <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">{note.content}</p>
                    <span className="text-xs text-muted-foreground mt-2 block">
                      {format(new Date(note.created_at), 'MMM d, yyyy h:mm a')}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-destructive flex-shrink-0"
                    onClick={() => { if (confirm('Delete this note?')) onDelete(note.id); }}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
