import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useProjectDetail } from '@/hooks/useStudioProjects';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Eye, EyeOff, Edit2, Save, FileImage, MessageSquare as ForumIcon } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { StudioFilesTab } from './tabs/StudioFilesTab';
import { StudioNotesTab } from './tabs/StudioNotesTab';
import { StudioTimelineTab } from './tabs/StudioTimelineTab';
import { StudioCommentsTab } from './tabs/StudioCommentsTab';
import { StudioTasksTab } from './tabs/StudioTasksTab';
import { StudioMilestonesTab } from './tabs/StudioMilestonesTab';
import { ShareButtons } from '@/components/social/ShareButtons';

interface StudioProjectDetailProps {
  projectId: string;
  onBack: () => void;
}

export function StudioProjectDetail({ projectId, onBack }: StudioProjectDetailProps) {
  const {
    project, files, notes, timeline, comments, loading,
    fetchAll, uploadFile, deleteFile, addNote, deleteNote, addComment, addTimelineEntry,
  } = useProjectDetail(projectId);

  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');

  if (loading || !project) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-1/2" />
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  const handleSaveEdit = async () => {
    await supabase.from('studio_projects').update({
      title: editTitle, description: editDesc,
    } as any).eq('id', projectId);
    setEditing(false);
    fetchAll();
  };

  const toggleVisibility = async () => {
    const newVis = project.visibility === 'public' ? 'private' : 'public';
    await supabase.from('studio_projects').update({ visibility: newVis } as any).eq('id', projectId);
    fetchAll();
  };

  const updateStatus = async (status: string) => {
    await supabase.from('studio_projects').update({ status } as any).eq('id', projectId);
    fetchAll();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="flex-1">
          {editing ? (
            <div className="space-y-2">
              <Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} className="text-2xl font-bold" />
              <Textarea value={editDesc} onChange={(e) => setEditDesc(e.target.value)} rows={2} />
              <div className="flex gap-2">
                <Button size="sm" onClick={handleSaveEdit} className="gap-1.5 bg-accent text-accent-foreground">
                  <Save className="h-3.5 w-3.5" /> Save
                </Button>
                <Button size="sm" variant="outline" onClick={() => setEditing(false)}>Cancel</Button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-display font-bold text-foreground">{project.title}</h1>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => {
                  setEditTitle(project.title);
                  setEditDesc(project.description || '');
                  setEditing(true);
                }}>
                  <Edit2 className="h-3.5 w-3.5" />
                </Button>
              </div>
              {project.description && (
                <p className="text-muted-foreground mt-1">{project.description}</p>
              )}
            </>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Select value={project.status} onValueChange={updateStatus}>
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="paused">Paused</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" size="sm" onClick={toggleVisibility} className="gap-1.5">
            {project.visibility === 'public' ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
            {project.visibility === 'public' ? 'Public' : 'Private'}
          </Button>
          
          {/* Cross-link: Submit sheet for review */}
          <Link to="/sheets">
            <Button variant="outline" size="sm" className="gap-1.5">
              <FileImage className="h-3.5 w-3.5" /> Submit Sheet
            </Button>
          </Link>
          
          {/* Cross-link: Ask for help on forum */}
          <Link to="/forum">
            <Button variant="outline" size="sm" className="gap-1.5">
              <ForumIcon className="h-3.5 w-3.5" /> Ask Help
            </Button>
          </Link>

          {project.visibility === 'public' && (
            <ShareButtons url={`/studio`} title={project.title} description={project.description || undefined} />
          )}
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="tasks" className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
          <TabsTrigger value="milestones">Milestones</TabsTrigger>
          <TabsTrigger value="files">Files ({files.length})</TabsTrigger>
          <TabsTrigger value="notes">Notes ({notes.length})</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="comments">Comments</TabsTrigger>
        </TabsList>

        <TabsContent value="tasks" className="mt-4">
          <StudioTasksTab projectId={projectId} />
        </TabsContent>

        <TabsContent value="milestones" className="mt-4">
          <StudioMilestonesTab projectId={projectId} />
        </TabsContent>

        <TabsContent value="files" className="mt-4">
          <StudioFilesTab files={files} onUpload={uploadFile} onDelete={deleteFile} />
        </TabsContent>

        <TabsContent value="notes" className="mt-4">
          <StudioNotesTab notes={notes} onAdd={addNote} onDelete={deleteNote} />
        </TabsContent>

        <TabsContent value="timeline" className="mt-4">
          <StudioTimelineTab timeline={timeline} onAdd={addTimelineEntry} />
        </TabsContent>

        <TabsContent value="comments" className="mt-4">
          <StudioCommentsTab comments={comments} onAdd={addComment} isPublic={project.visibility === 'public'} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
