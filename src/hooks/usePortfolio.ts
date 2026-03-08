import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

export interface Portfolio {
  id: string;
  user_id: string;
  title: string;
  slug: string;
  subtitle: string | null;
  bio: string | null;
  contact_email: string | null;
  accent_color: string;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

export interface PortfolioPage {
  id: string;
  portfolio_id: string;
  title: string;
  description: string | null;
  order_index: number;
  created_at: string;
}

export interface PortfolioSection {
  id: string;
  page_id: string;
  section_type: 'image' | 'text' | 'heading';
  content: string | null;
  image_url: string | null;
  caption: string | null;
  layout: 'full' | 'half-left' | 'half-right';
  order_index: number;
}

export function useMyPortfolio() {
  const { user } = useAuth();
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [pages, setPages] = useState<PortfolioPage[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPortfolio = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    setLoading(true);

    const { data } = await (supabase as any).from('portfolios')
      .select('*').eq('user_id', user.id).maybeSingle();

    if (data) {
      setPortfolio(data);
      const { data: pagesData } = await (supabase as any).from('portfolio_pages')
        .select('*').eq('portfolio_id', data.id).order('order_index');
      setPages(pagesData || []);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchPortfolio(); }, [fetchPortfolio]);

  const createPortfolio = async (title: string) => {
    if (!user) return null;
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + Math.random().toString(36).slice(2, 6);
    const { data, error } = await (supabase as any).from('portfolios').insert({
      user_id: user.id, title, slug,
    }).select().single();
    if (error) { toast({ title: 'Error', description: error.message, variant: 'destructive' }); return null; }
    setPortfolio(data);
    return data;
  };

  const updatePortfolio = async (updates: Partial<Portfolio>) => {
    if (!portfolio) return;
    const { error } = await (supabase as any).from('portfolios')
      .update({ ...updates, updated_at: new Date().toISOString() }).eq('id', portfolio.id);
    if (error) { toast({ title: 'Error', description: error.message, variant: 'destructive' }); return; }
    setPortfolio({ ...portfolio, ...updates } as Portfolio);
  };

  const addPage = async (title: string) => {
    if (!portfolio) return;
    const { data, error } = await (supabase as any).from('portfolio_pages').insert({
      portfolio_id: portfolio.id, title, order_index: pages.length,
    }).select().single();
    if (error) { toast({ title: 'Error', description: error.message, variant: 'destructive' }); return; }
    setPages([...pages, data]);
    return data;
  };

  const updatePage = async (pageId: string, updates: Partial<PortfolioPage>) => {
    await (supabase as any).from('portfolio_pages').update(updates).eq('id', pageId);
    setPages(pages.map(p => p.id === pageId ? { ...p, ...updates } : p));
  };

  const deletePage = async (pageId: string) => {
    await (supabase as any).from('portfolio_pages').delete().eq('id', pageId);
    setPages(pages.filter(p => p.id !== pageId));
  };

  const reorderPages = async (fromIdx: number, toIdx: number) => {
    const updated = [...pages];
    const [moved] = updated.splice(fromIdx, 1);
    updated.splice(toIdx, 0, moved);
    const reindexed = updated.map((p, i) => ({ ...p, order_index: i }));
    setPages(reindexed);
    for (const p of reindexed) {
      await (supabase as any).from('portfolio_pages').update({ order_index: p.order_index }).eq('id', p.id);
    }
  };

  return { portfolio, pages, loading, createPortfolio, updatePortfolio, addPage, updatePage, deletePage, reorderPages, refetch: fetchPortfolio };
}

export function usePortfolioSections(pageId: string | undefined) {
  const [sections, setSections] = useState<PortfolioSection[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSections = useCallback(async () => {
    if (!pageId) { setSections([]); setLoading(false); return; }
    setLoading(true);
    const { data } = await (supabase as any).from('portfolio_sections')
      .select('*').eq('page_id', pageId).order('order_index');
    setSections(data || []);
    setLoading(false);
  }, [pageId]);

  useEffect(() => { fetchSections(); }, [fetchSections]);

  const addSection = async (type: PortfolioSection['section_type'], content?: string, imageUrl?: string) => {
    if (!pageId) return;
    const { data, error } = await (supabase as any).from('portfolio_sections').insert({
      page_id: pageId, section_type: type, content, image_url: imageUrl, order_index: sections.length,
    }).select().single();
    if (error) { toast({ title: 'Error', description: error.message, variant: 'destructive' }); return; }
    setSections([...sections, data]);
  };

  const updateSection = async (sectionId: string, updates: Partial<PortfolioSection>) => {
    await (supabase as any).from('portfolio_sections').update(updates).eq('id', sectionId);
    setSections(sections.map(s => s.id === sectionId ? { ...s, ...updates } : s));
  };

  const deleteSection = async (sectionId: string) => {
    await (supabase as any).from('portfolio_sections').delete().eq('id', sectionId);
    setSections(sections.filter(s => s.id !== sectionId));
  };

  const reorderSections = async (fromIdx: number, toIdx: number) => {
    const updated = [...sections];
    const [moved] = updated.splice(fromIdx, 1);
    updated.splice(toIdx, 0, moved);
    const reindexed = updated.map((s, i) => ({ ...s, order_index: i }));
    setSections(reindexed);
    for (const s of reindexed) {
      await (supabase as any).from('portfolio_sections').update({ order_index: s.order_index }).eq('id', s.id);
    }
  };

  const uploadImage = async (file: File, userId: string) => {
    const ext = file.name.split('.').pop();
    const path = `${userId}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('portfolio-uploads').upload(path, file);
    if (error) { toast({ title: 'Upload failed', description: error.message, variant: 'destructive' }); return null; }
    const { data: { publicUrl } } = supabase.storage.from('portfolio-uploads').getPublicUrl(path);
    return publicUrl;
  };

  return { sections, loading, addSection, updateSection, deleteSection, reorderSections, uploadImage, refetch: fetchSections };
}

export function usePublicPortfolio(slug: string | undefined) {
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [pages, setPages] = useState<(PortfolioPage & { sections: PortfolioSection[] })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    const fetch = async () => {
      setLoading(true);
      const { data: p } = await (supabase as any).from('portfolios')
        .select('*').eq('slug', slug).eq('is_public', true).maybeSingle();
      if (!p) { setLoading(false); return; }
      setPortfolio(p);

      const { data: pagesData } = await (supabase as any).from('portfolio_pages')
        .select('*').eq('portfolio_id', p.id).order('order_index');

      const pagesWithSections = [];
      for (const page of (pagesData || [])) {
        const { data: secs } = await (supabase as any).from('portfolio_sections')
          .select('*').eq('page_id', page.id).order('order_index');
        pagesWithSections.push({ ...page, sections: secs || [] });
      }
      setPages(pagesWithSections);
      setLoading(false);
    };
    fetch();
  }, [slug]);

  return { portfolio, pages, loading };
}
