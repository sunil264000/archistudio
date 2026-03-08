import { StudioProject } from '@/hooks/useStudioProjects';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Trash2, Eye, EyeOff, Clock, FolderOpen } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';

interface StudioProjectListProps {
  projects: StudioProject[];
  loading: boolean;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onUpdate: (id: string, updates: Partial<StudioProject>) => void;
}

const statusColors: Record<string, string> = {
  in_progress: 'bg-accent/10 text-accent border-accent/20',
  completed: 'bg-green-500/10 text-green-600 border-green-500/20',
  paused: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
  archived: 'bg-muted text-muted-foreground border-border',
};

export function StudioProjectList({ projects, loading, onSelect, onDelete, onUpdate }: StudioProjectListProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <Skeleton key={i} className="h-48 rounded-2xl" />
        ))}
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="text-center py-20">
        <FolderOpen className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-foreground">No projects yet</h3>
        <p className="text-muted-foreground mt-1">Create your first studio project to get started</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {projects.map((project) => (
        <Card
          key={project.id}
          className="cursor-pointer group"
          onClick={() => onSelect(project.id)}
        >
          {project.cover_image_url && (
            <div className="aspect-video overflow-hidden rounded-t-2xl">
              <img
                src={project.cover_image_url}
                alt={project.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
            </div>
          )}
          <CardContent className={project.cover_image_url ? 'pt-4' : 'pt-6'}>
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-foreground truncate">{project.title}</h3>
                {project.description && (
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{project.description}</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 mt-3 flex-wrap">
              <Badge variant="outline" className={statusColors[project.status] || statusColors.in_progress}>
                {project.status.replace('_', ' ')}
              </Badge>
              <Badge variant="outline" className="gap-1 text-xs">
                {project.visibility === 'public' ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                {project.visibility}
              </Badge>
            </div>

            <div className="flex items-center justify-between mt-4">
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {format(new Date(project.updated_at), 'MMM d, yyyy')}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                onClick={(e) => {
                  e.stopPropagation();
                  if (confirm('Delete this project?')) onDelete(project.id);
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
