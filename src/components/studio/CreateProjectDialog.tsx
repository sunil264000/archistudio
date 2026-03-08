import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface CreateProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (title: string, description: string) => void;
}

export function CreateProjectDialog({ open, onOpenChange, onCreate }: CreateProjectDialogProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!title.trim()) return;
    setSubmitting(true);
    await onCreate(title.trim(), description.trim());
    setTitle('');
    setDescription('');
    setSubmitting(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New Studio Project</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <div>
            <Label htmlFor="project-title">Project Title</Label>
            <Input
              id="project-title"
              placeholder="e.g., Community Cultural Centre"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={100}
            />
          </div>
          <div>
            <Label htmlFor="project-desc">Description (optional)</Label>
            <Textarea
              id="project-desc"
              placeholder="Brief overview of your project concept..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={500}
              rows={3}
            />
          </div>
          <Button
            onClick={handleSubmit}
            disabled={!title.trim() || submitting}
            className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
          >
            {submitting ? 'Creating...' : 'Create Project'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
