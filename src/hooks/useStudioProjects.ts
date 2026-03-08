import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface StudioProject {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  status: string;
  visibility: string;
  cover_image_url: string | null;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export interface StudioProjectFile {
  id: string;
  project_id: string;
  user_id: string;
  file_url: string;
  file_name: string;
  file_type: string | null;
  file_size_bytes: number | null;
  category: string;
  caption: string | null;
  order_index: number;
  created_at: string;
}

export interface StudioProjectNote {
  id: string;
  project_id: string;
  user_id: string;
  title: string | null;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface StudioTimelineEntry {
  id: string;
  project_id: string;
  user_id: string;
  entry_type: string;
  title: string;
  description: string | null;
  image_url: string | null;
  created_at: string;
}

export interface StudioComment {
  id: string;
  project_id: string;
  user_id: string;
  content: string;
  parent_id: string | null;
  created_at: string;
  updated_at: string;
  author_name?: string;
}

export function useStudioProjects() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [projects, setProjects] = useState<StudioProject[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProjects = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('studio_projects')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false });
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      setProjects((data as any[]) || []);
    }
    setLoading(false);
  }, [user, toast]);

  useEffect(() => { fetchProjects(); }, [fetchProjects]);

  const createProject = async (title: string, description?: string) => {
    if (!user) return null;
    const { data, error } = await supabase
      .from('studio_projects')
      .insert({ user_id: user.id, title, description: description || null } as any)
      .select()
      .single();
    if (error) {
      toast({ title: 'Error creating project', description: error.message, variant: 'destructive' });
      return null;
    }
    await supabase.from('studio_project_timeline').insert({
      project_id: (data as any).id,
      user_id: user.id,
      entry_type: 'created',
      title: 'Project created',
      description: `Started "${title}"`,
    } as any);
    await fetchProjects();
    return data as any as StudioProject;
  };

  const updateProject = async (id: string, updates: Partial<StudioProject>) => {
    const { error } = await supabase
      .from('studio_projects')
      .update(updates as any)
      .eq('id', id);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      return false;
    }
    await fetchProjects();
    return true;
  };

  const deleteProject = async (id: string) => {
    const { error } = await supabase.from('studio_projects').delete().eq('id', id);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      return false;
    }
    await fetchProjects();
    return true;
  };

  return { projects, loading, fetchProjects, createProject, updateProject, deleteProject };
}

export function useProjectDetail(projectId: string | undefined) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [project, setProject] = useState<StudioProject | null>(null);
  const [files, setFiles] = useState<StudioProjectFile[]>([]);
  const [notes, setNotes] = useState<StudioProjectNote[]>([]);
  const [timeline, setTimeline] = useState<StudioTimelineEntry[]>([]);
  const [comments, setComments] = useState<StudioComment[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);

    const [projRes, filesRes, notesRes, timelineRes, commentsRes] = await Promise.all([
      supabase.from('studio_projects').select('*').eq('id', projectId).single(),
      supabase.from('studio_project_files').select('*').eq('project_id', projectId).order('order_index'),
      supabase.from('studio_project_notes').select('*').eq('project_id', projectId).order('created_at', { ascending: false }),
      supabase.from('studio_project_timeline').select('*').eq('project_id', projectId).order('created_at', { ascending: false }),
      supabase.from('studio_project_comments').select('*').eq('project_id', projectId).order('created_at', { ascending: true }),
    ]);

    if (projRes.data) setProject(projRes.data as any);
    setFiles((filesRes.data as any[]) || []);
    setNotes((notesRes.data as any[]) || []);
    setTimeline((timelineRes.data as any[]) || []);

    // Fetch author names for comments
    const commentsData = (commentsRes.data as any[]) || [];
    if (commentsData.length > 0) {
      const userIds = [...new Set(commentsData.map(c => c.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name')
        .in('user_id', userIds);
      const nameMap = new Map((profiles || []).map((p: any) => [p.user_id, p.full_name]));
      setComments(commentsData.map(c => ({ ...c, author_name: nameMap.get(c.user_id) || 'Anonymous' })));
    } else {
      setComments([]);
    }

    setLoading(false);
  }, [projectId]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const uploadFile = async (file: File, category: string) => {
    if (!user || !projectId) return null;
    const ext = file.name.split('.').pop();
    const path = `${user.id}/${projectId}/${Date.now()}.${ext}`;
    const { error: uploadError } = await supabase.storage.from('studio-uploads').upload(path, file);
    if (uploadError) {
      toast({ title: 'Upload failed', description: uploadError.message, variant: 'destructive' });
      return null;
    }
    const { data: urlData } = supabase.storage.from('studio-uploads').getPublicUrl(path);
    const { data, error } = await supabase.from('studio_project_files').insert({
      project_id: projectId,
      user_id: user.id,
      file_url: urlData.publicUrl,
      file_name: file.name,
      file_type: file.type,
      file_size_bytes: file.size,
      category,
    } as any).select().single();

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      return null;
    }

    await supabase.from('studio_project_timeline').insert({
      project_id: projectId, user_id: user.id,
      entry_type: 'file_upload', title: `Uploaded ${category}`,
      description: file.name, image_url: file.type.startsWith('image/') ? urlData.publicUrl : null,
    } as any);

    await fetchAll();
    return data;
  };

  const deleteFile = async (fileId: string) => {
    await supabase.from('studio_project_files').delete().eq('id', fileId);
    await fetchAll();
  };

  const addNote = async (title: string, content: string) => {
    if (!user || !projectId) return;
    await supabase.from('studio_project_notes').insert({
      project_id: projectId, user_id: user.id, title, content,
    } as any);
    await supabase.from('studio_project_timeline').insert({
      project_id: projectId, user_id: user.id,
      entry_type: 'note', title: 'Added note', description: title || content.slice(0, 100),
    } as any);
    await fetchAll();
  };

  const deleteNote = async (noteId: string) => {
    await supabase.from('studio_project_notes').delete().eq('id', noteId);
    await fetchAll();
  };

  const addComment = async (content: string) => {
    if (!user || !projectId) return;
    await supabase.from('studio_project_comments').insert({
      project_id: projectId, user_id: user.id, content,
    } as any);
    await fetchAll();
  };

  const addTimelineEntry = async (title: string, description?: string, imageUrl?: string) => {
    if (!user || !projectId) return;
    await supabase.from('studio_project_timeline').insert({
      project_id: projectId, user_id: user.id,
      entry_type: 'update', title, description, image_url: imageUrl,
    } as any);
    await fetchAll();
  };

  return {
    project, files, notes, timeline, comments, loading,
    fetchAll, uploadFile, deleteFile, addNote, deleteNote, addComment, addTimelineEntry,
  };
}
