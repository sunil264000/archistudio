import { useState } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { SEOHead } from '@/components/seo/SEOHead';
import { useStudioProjects, StudioProject } from '@/hooks/useStudioProjects';
import { StudioProjectList } from '@/components/studio/StudioProjectList';
import { StudioProjectDetail } from '@/components/studio/StudioProjectDetail';
import { CreateProjectDialog } from '@/components/studio/CreateProjectDialog';
import { Button } from '@/components/ui/button';
import { Plus, ArrowLeft, Briefcase } from 'lucide-react';

export default function Studio() {
  const { projects, loading, createProject, updateProject, deleteProject } = useStudioProjects();
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const handleCreate = async (title: string, description: string) => {
    const project = await createProject(title, description);
    if (project) {
      setSelectedProjectId(project.id);
      setShowCreate(false);
    }
  };

  return (
    <>
      <SEOHead
        title="Studio Workspace | Archistudio"
        description="Manage your architecture design projects — upload sketches, write concept notes, track progress, and share with the community."
      />
      <Navbar />
      <main className="min-h-screen bg-background pt-8 pb-20">
        <div className="container-wide">
          {selectedProjectId ? (
            <>
              <Button
                variant="ghost"
                size="sm"
                className="mb-4 gap-1.5"
                onClick={() => setSelectedProjectId(null)}
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Projects
              </Button>
              <StudioProjectDetail
                projectId={selectedProjectId}
                onBack={() => setSelectedProjectId(null)}
              />
            </>
          ) : (
            <>
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h1 className="text-3xl font-display font-bold text-foreground flex items-center gap-3">
                    <Briefcase className="h-8 w-8 text-accent" />
                    Studio Workspace
                  </h1>
                  <p className="text-muted-foreground mt-1">
                    Manage your design projects, sketches, and concept notes
                  </p>
                </div>
                <Button onClick={() => setShowCreate(true)} className="gap-2 bg-accent text-accent-foreground hover:bg-accent/90">
                  <Plus className="h-4 w-4" />
                  New Project
                </Button>
              </div>

              <StudioProjectList
                projects={projects}
                loading={loading}
                onSelect={setSelectedProjectId}
                onDelete={deleteProject}
                onUpdate={updateProject}
              />

              <CreateProjectDialog
                open={showCreate}
                onOpenChange={setShowCreate}
                onCreate={handleCreate}
              />
            </>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
