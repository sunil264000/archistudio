import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

// ============ Types ============
export type ExperienceLevel = 'beginner' | 'intermediate' | 'advanced';
export type JobStatus = 'open' | 'in_progress' | 'completed' | 'cancelled' | 'closed';
export type BudgetType = 'fixed' | 'range' | 'hourly';
export type ProposalStatus = 'pending' | 'accepted' | 'rejected' | 'withdrawn';

export interface WorkerProfile {
  id: string;
  user_id: string;
  display_name: string | null;
  headline: string | null;
  bio: string | null;
  skills: string[];
  experience_level: ExperienceLevel;
  hourly_rate: number | null;
  availability: string;
  avatar_url: string | null;
  location: string | null;
  total_jobs_completed: number;
  average_rating: number;
  total_reviews: number;
  is_active: boolean;
  created_at: string;
}

export interface MarketplaceJob {
  id: string;
  client_id: string;
  title: string;
  description: string;
  category: string;
  skills_required: string[];
  budget_type: BudgetType;
  budget_min: number | null;
  budget_max: number | null;
  currency: string;
  deadline: string | null;
  attachments: string[];
  status: JobStatus;
  proposals_count: number;
  views_count: number;
  created_at: string;
}

export interface JobProposal {
  id: string;
  job_id: string;
  worker_id: string;
  bid_amount: number;
  delivery_days: number;
  cover_message: string;
  attachments: string[];
  status: ProposalStatus;
  created_at: string;
}

// ============ Constants ============
export const PLATFORM_FEE_PERCENT = 15;

export const MARKETPLACE_CATEGORIES = [
  'AutoCAD Drafting',
  '3D Modelling',
  'Rendering & Visualization',
  'Interior Design',
  'Thesis Help',
  'Architectural Drawings',
  'Concept Design',
  'BIM / Revit',
  'SketchUp Modelling',
  'Landscape Design',
  'Urban Design',
  'Other',
] as const;

export const MARKETPLACE_SKILLS = [
  'AutoCAD', 'Revit', 'SketchUp', 'Lumion', 'V-Ray', 'Corona Renderer',
  '3ds Max', 'Rhino', 'Grasshopper', 'Photoshop', 'Illustrator', 'InDesign',
  'Enscape', 'Twinmotion', 'BIM', 'Hand Sketching', 'Concept Design',
  'Working Drawings', 'Detailing', 'Interior Visualization', 'Exterior Visualization',
  'Landscape', 'Animation', 'Walk-through', 'Site Planning',
] as const;

// ============ Hooks ============

export function useWorkerProfile(userId?: string | null) {
  const [profile, setProfile] = useState<WorkerProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    if (!userId) {
      setProfile(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data } = await (supabase as any)
      .from('worker_profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();
    setProfile(data as WorkerProfile | null);
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  return { profile, loading, refetch };
}

export function useMyWorkerProfile() {
  const { user } = useAuth();
  return useWorkerProfile(user?.id);
}

interface JobFilters {
  category?: string;
  minBudget?: number;
  maxBudget?: number;
  search?: string;
}

export function useMarketplaceJobs(filters: JobFilters = {}) {
  const [jobs, setJobs] = useState<MarketplaceJob[]>([]);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    setLoading(true);
    let query = (supabase as any)
      .from('marketplace_jobs')
      .select('*')
      .eq('status', 'open')
      .eq('visibility', 'public')
      .order('created_at', { ascending: false })
      .limit(60);

    if (filters.category) query = query.eq('category', filters.category);
    if (filters.search) query = query.ilike('title', `%${filters.search}%`);
    if (filters.minBudget != null) query = query.gte('budget_max', filters.minBudget);
    if (filters.maxBudget != null) query = query.lte('budget_min', filters.maxBudget);

    const { data } = await query;
    setJobs((data || []) as MarketplaceJob[]);
    setLoading(false);
  }, [filters.category, filters.search, filters.minBudget, filters.maxBudget]);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  return { jobs, loading, refetch };
}

export function useMarketplaceJob(jobId?: string) {
  const [job, setJob] = useState<MarketplaceJob | null>(null);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    if (!jobId) return;
    setLoading(true);
    const { data } = await (supabase as any)
      .from('marketplace_jobs')
      .select('*')
      .eq('id', jobId)
      .maybeSingle();
    setJob(data as MarketplaceJob | null);
    setLoading(false);
  }, [jobId]);

  useEffect(() => { void refetch(); }, [refetch]);

  return { job, loading, refetch };
}

export function useMyJobs() {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<MarketplaceJob[]>([]);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    if (!user) { setJobs([]); setLoading(false); return; }
    setLoading(true);
    const { data } = await (supabase as any)
      .from('marketplace_jobs')
      .select('*')
      .eq('client_id', user.id)
      .order('created_at', { ascending: false });
    setJobs((data || []) as MarketplaceJob[]);
    setLoading(false);
  }, [user]);

  useEffect(() => { void refetch(); }, [refetch]);

  return { jobs, loading, refetch };
}

export function useJobProposals(jobId?: string) {
  const [proposals, setProposals] = useState<JobProposal[]>([]);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    if (!jobId) return;
    setLoading(true);
    const { data } = await (supabase as any)
      .from('job_proposals')
      .select('*')
      .eq('job_id', jobId)
      .order('created_at', { ascending: false });
    setProposals((data || []) as JobProposal[]);
    setLoading(false);
  }, [jobId]);

  useEffect(() => { void refetch(); }, [refetch]);

  return { proposals, loading, refetch };
}

// ============ Helpers ============

export function formatBudget(job: Pick<MarketplaceJob, 'budget_type' | 'budget_min' | 'budget_max' | 'currency'>) {
  const symbol = job.currency === 'INR' ? '₹' : job.currency === 'USD' ? '$' : job.currency;
  if (job.budget_type === 'fixed' && job.budget_min) {
    return `${symbol}${Number(job.budget_min).toLocaleString()}`;
  }
  if (job.budget_type === 'hourly' && job.budget_min) {
    return `${symbol}${Number(job.budget_min).toLocaleString()}/hr`;
  }
  if (job.budget_type === 'range' && job.budget_min && job.budget_max) {
    return `${symbol}${Number(job.budget_min).toLocaleString()} – ${symbol}${Number(job.budget_max).toLocaleString()}`;
  }
  return 'Negotiable';
}

export function calculatePayout(amount: number) {
  const fee = +(amount * (PLATFORM_FEE_PERCENT / 100)).toFixed(2);
  const payout = +(amount - fee).toFixed(2);
  return { fee, payout, feePercent: PLATFORM_FEE_PERCENT };
}
