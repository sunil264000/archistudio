// Studio Hub — replaces useMarketplace with cleaner names + escrow hooks
import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

// ============ Constants ============
export const PLATFORM_FEE_PERCENT = 15;
export const MEMBER_TERM = 'Studio Member';
export const MEMBER_TERM_PLURAL = 'Studio Members';

export const STUDIO_CATEGORIES = [
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

export const STUDIO_SKILLS = [
  'AutoCAD Drafting',
  '3D Modelling',
  'Photorealistic Rendering',
  'Interior Design',
  'Landscape Design',
  'Architectural Drawings',
  'Thesis & Academic Support',
  'Concept Design',
  'BIM Coordination',
  'Site Planning & Analysis',
  'Furniture Design',
  'Structural Detailing',
  '3D Animation',
] as const;

export const STUDIO_TOOLS = [
  'AutoCAD',
  'Revit',
  'SketchUp',
  '3ds Max',
  'Rhino',
  'Grasshopper',
  'V-Ray',
  'Corona Renderer',
  'Lumion',
  'Enscape',
  'Twinmotion',
  'D5 Render',
  'Photoshop',
  'Illustrator',
  'InDesign',
  'After Effects',
  'Blender',
] as const;

// ============ Types ============
export type ExperienceLevel = 'beginner' | 'intermediate' | 'advanced';
export type ProjectStatus = 'open' | 'in_progress' | 'completed' | 'cancelled' | 'closed';
export type BudgetType = 'fixed' | 'range' | 'hourly';
export type ProposalStatus = 'pending' | 'accepted' | 'rejected' | 'withdrawn';
export type ContractStatus =
  | 'awaiting_payment' | 'active' | 'submitted' | 'awaiting_admin_review'
  | 'delivered' | 'revision_requested' | 'completed' | 'disputed' | 'cancelled' | 'refunded';

export interface MemberProfile {
  id: string;
  user_id: string;
  display_name: string | null;
  headline: string | null;
  bio: string | null;
  skills: string[];
  tools: string[];
  experience_level: ExperienceLevel;
  hourly_rate: number | null;
  availability: string;
  avatar_url: string | null;
  cover_url: string | null;
  location: string | null;
  languages: string[] | null;
  total_jobs_completed: number;
  total_earnings: number;
  average_rating: number;
  total_reviews: number;
  is_active: boolean;
  created_at: string;
}

export interface StudioProject {
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
  status: ProjectStatus;
  proposals_count: number;
  views_count: number;
  created_at: string;
}

export interface StudioProposal {
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

export interface StudioContract {
  id: string;
  job_id: string;
  proposal_id: string;
  client_id: string;
  worker_id: string;
  agreed_amount: number;
  platform_fee_percent: number;
  platform_fee_amount: number;
  worker_payout: number;
  currency: string;
  delivery_days: number;
  due_date: string | null;
  status: ContractStatus;
  payment_status: 'pending' | 'held_in_escrow' | 'released' | 'refunded';
  client_files: string[];
  submitted_at: string | null;
  admin_approved_at: string | null;
  released_to_client_at: string | null;
  payout_released_at: string | null;
  created_at: string;
}

export interface Deliverable {
  id: string;
  contract_id: string;
  worker_id: string;
  client_id: string;
  version: number;
  title: string;
  description: string | null;
  file_urls: string[];
  status: 'pending_review' | 'approved' | 'rejected' | 'released_to_client';
  admin_notes: string | null;
  reviewed_at: string | null;
  released_at: string | null;
  created_at: string;
}

// ============ Hooks ============

export function useMemberProfile(userId?: string | null) {
  const [profile, setProfile] = useState<MemberProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    if (!userId) { setProfile(null); setLoading(false); return; }
    setLoading(true);
    const { data } = await (supabase as any)
      .from('worker_profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();
    setProfile(data as MemberProfile | null);
    setLoading(false);
  }, [userId]);

  useEffect(() => { void refetch(); }, [refetch]);
  return { profile, loading, refetch };
}

export function useMyMemberProfile() {
  const { user } = useAuth();
  return useMemberProfile(user?.id);
}

interface ProjectFilters { category?: string; minBudget?: number; maxBudget?: number; search?: string; }

export function useStudioProjects(filters: ProjectFilters = {}) {
  const [projects, setProjects] = useState<StudioProject[]>([]);
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
    setProjects((data || []) as StudioProject[]);
    setLoading(false);
  }, [filters.category, filters.search, filters.minBudget, filters.maxBudget]);

  useEffect(() => { void refetch(); }, [refetch]);
  return { projects, loading, refetch };
}

export function useStudioProject(jobId?: string) {
  const [project, setProject] = useState<StudioProject | null>(null);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    if (!jobId) return;
    setLoading(true);
    const { data } = await (supabase as any)
      .from('marketplace_jobs')
      .select('*')
      .eq('id', jobId)
      .maybeSingle();
    setProject(data as StudioProject | null);
    setLoading(false);
  }, [jobId]);

  useEffect(() => { void refetch(); }, [refetch]);
  return { project, loading, refetch };
}

export function useMyProjects() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<StudioProject[]>([]);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    if (!user) { setProjects([]); setLoading(false); return; }
    setLoading(true);
    const { data } = await (supabase as any)
      .from('marketplace_jobs')
      .select('*')
      .eq('client_id', user.id)
      .order('created_at', { ascending: false });
    setProjects((data || []) as StudioProject[]);
    setLoading(false);
  }, [user]);

  useEffect(() => { void refetch(); }, [refetch]);
  return { projects, loading, refetch };
}

export function useProjectProposals(jobId?: string) {
  const [proposals, setProposals] = useState<StudioProposal[]>([]);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    if (!jobId) return;
    setLoading(true);
    const { data } = await (supabase as any)
      .from('job_proposals')
      .select('*')
      .eq('job_id', jobId)
      .order('created_at', { ascending: false });
    setProposals((data || []) as StudioProposal[]);
    setLoading(false);
  }, [jobId]);

  useEffect(() => { void refetch(); }, [refetch]);
  return { proposals, loading, refetch };
}

export function useMyContracts(role: 'client' | 'worker') {
  const { user } = useAuth();
  const [contracts, setContracts] = useState<StudioContract[]>([]);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    if (!user) { setContracts([]); setLoading(false); return; }
    setLoading(true);
    const col = role === 'client' ? 'client_id' : 'worker_id';
    const { data } = await (supabase as any)
      .from('marketplace_contracts')
      .select('*')
      .eq(col, user.id)
      .order('created_at', { ascending: false });
    setContracts((data || []) as StudioContract[]);
    setLoading(false);
  }, [user, role]);

  useEffect(() => { void refetch(); }, [refetch]);
  return { contracts, loading, refetch };
}

export function useContract(contractId?: string) {
  const [contract, setContract] = useState<StudioContract | null>(null);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    if (!contractId) return;
    setLoading(true);
    const { data } = await (supabase as any)
      .from('marketplace_contracts')
      .select('*')
      .eq('id', contractId)
      .maybeSingle();
    setContract(data as StudioContract | null);
    setLoading(false);
  }, [contractId]);

  useEffect(() => { void refetch(); }, [refetch]);
  return { contract, loading, refetch };
}

export function useContractDeliverables(contractId?: string) {
  const [deliverables, setDeliverables] = useState<Deliverable[]>([]);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    if (!contractId) return;
    setLoading(true);
    const { data } = await (supabase as any)
      .from('studio_hub_deliverables')
      .select('*')
      .eq('contract_id', contractId)
      .order('created_at', { ascending: false });
    setDeliverables((data || []) as Deliverable[]);
    setLoading(false);
  }, [contractId]);

  useEffect(() => { void refetch(); }, [refetch]);
  return { deliverables, loading, refetch };
}

export function useTopMembers(limit = 12) {
  const [members, setMembers] = useState<MemberProfile[]>([]);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    setLoading(true);
    const { data } = await (supabase as any)
      .from('worker_profiles')
      .select('*')
      .eq('is_active', true)
      .order('average_rating', { ascending: false })
      .order('total_jobs_completed', { ascending: false })
      .limit(limit);
    setMembers((data || []) as MemberProfile[]);
    setLoading(false);
  }, [limit]);

  useEffect(() => { void refetch(); }, [refetch]);
  return { members, loading, refetch };
}

// ============ Helpers ============

export function formatBudget(p: Pick<StudioProject, 'budget_type' | 'budget_min' | 'budget_max' | 'currency'>) {
  const symbol = p.currency === 'INR' ? '₹' : p.currency === 'USD' ? '$' : p.currency;
  if (p.budget_type === 'fixed' && p.budget_min) {
    return `${symbol}${Number(p.budget_min).toLocaleString()}`;
  }
  if (p.budget_type === 'hourly' && p.budget_min) {
    return `${symbol}${Number(p.budget_min).toLocaleString()}/hr`;
  }
  if (p.budget_type === 'range' && p.budget_min && p.budget_max) {
    return `${symbol}${Number(p.budget_min).toLocaleString()} – ${symbol}${Number(p.budget_max).toLocaleString()}`;
  }
  return 'Negotiable';
}

export function calculatePayout(amount: number) {
  const fee = +(amount * (PLATFORM_FEE_PERCENT / 100)).toFixed(2);
  const payout = +(amount - fee).toFixed(2);
  return { fee, payout, feePercent: PLATFORM_FEE_PERCENT };
}

export function statusLabel(s: ContractStatus) {
  return ({
    awaiting_payment: 'Awaiting payment',
    active: 'In progress',
    submitted: 'Submitted',
    awaiting_admin_review: 'In review by Studio',
    delivered: 'Delivered',
    revision_requested: 'Revision requested',
    completed: 'Completed',
    disputed: 'Disputed',
    cancelled: 'Cancelled',
    refunded: 'Refunded',
  } as const)[s];
}
