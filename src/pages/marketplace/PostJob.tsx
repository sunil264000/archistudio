import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { MarketplaceLayout } from '@/components/marketplace/MarketplaceLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { SEOHead } from '@/components/seo/SEOHead';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { MARKETPLACE_CATEGORIES, MARKETPLACE_SKILLS } from '@/hooks/useMarketplace';
import { toast } from 'sonner';
import { Loader2, X, Plus } from 'lucide-react';

const jobSchema = z.object({
  title: z.string().trim().min(8, 'Title must be at least 8 characters').max(140),
  description: z.string().trim().min(40, 'Description must be at least 40 characters').max(5000),
  category: z.string().min(1, 'Pick a category'),
  budget_type: z.enum(['fixed', 'range', 'hourly']),
  budget_min: z.number().positive('Must be greater than 0'),
  budget_max: z.number().positive().optional().nullable(),
  deadline: z.string().optional().nullable(),
  skills_required: z.array(z.string()).max(15),
});

export default function PostJob() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [budgetType, setBudgetType] = useState<'fixed' | 'range' | 'hourly'>('fixed');
  const [budgetMin, setBudgetMin] = useState('');
  const [budgetMax, setBudgetMax] = useState('');
  const [deadline, setDeadline] = useState('');
  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState('');

  const addSkill = (s: string) => {
    const v = s.trim();
    if (!v || skills.includes(v) || skills.length >= 15) return;
    setSkills([...skills, v]);
    setSkillInput('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error('Please sign in to post a job');
      navigate('/auth?redirect=/marketplace/post-job');
      return;
    }

    const parsed = jobSchema.safeParse({
      title, description, category,
      budget_type: budgetType,
      budget_min: parseFloat(budgetMin) || 0,
      budget_max: budgetType === 'range' ? parseFloat(budgetMax) || null : null,
      deadline: deadline || null,
      skills_required: skills,
    });

    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }

    if (budgetType === 'range' && parsed.data.budget_max && parsed.data.budget_max <= parsed.data.budget_min) {
      toast.error('Max budget must be greater than min budget');
      return;
    }

    setLoading(true);
    const { data, error } = await (supabase as any).from('marketplace_jobs').insert({
      client_id: user.id,
      ...parsed.data,
    }).select('id').single();

    setLoading(false);

    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success('Job posted!');
    navigate(`/marketplace/jobs/${data.id}`);
  };

  return (
    <MarketplaceLayout>
      <SEOHead title="Post a Job — Archi Studio Marketplace" description="Post your architecture job and get proposals from talented students." url="https://archistudio.shop/marketplace/post-job" />
      <div className="container-narrow py-8 md:py-12 max-w-3xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="font-display text-3xl md:text-4xl font-bold mb-2">Post a job</h1>
          <p className="text-muted-foreground">Describe your project and get proposals from architecture students.</p>
        </div>

        <form onSubmit={handleSubmit}>
          <Card className="p-6 space-y-5">
            <div>
              <Label htmlFor="title">Job title *</Label>
              <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Need 3D rendering for residential project" maxLength={140} className="mt-1.5" />
            </div>

            <div>
              <Label htmlFor="description">Description *</Label>
              <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe scope, deliverables, references, software preferences…" rows={6} maxLength={5000} className="mt-1.5" />
              <p className="text-xs text-muted-foreground mt-1">{description.length}/5000</p>
            </div>

            <div>
              <Label htmlFor="category">Category *</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger id="category" className="mt-1.5"><SelectValue placeholder="Pick a category" /></SelectTrigger>
                <SelectContent>
                  {MARKETPLACE_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Skills required</Label>
              <div className="flex flex-wrap gap-1.5 mt-1.5 mb-2">
                {skills.map((s) => (
                  <Badge key={s} variant="secondary" className="gap-1">
                    {s}
                    <button type="button" onClick={() => setSkills(skills.filter((x) => x !== s))}>
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  list="skill-suggestions"
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSkill(skillInput); } }}
                  placeholder="Type or pick a skill…"
                />
                <datalist id="skill-suggestions">
                  {MARKETPLACE_SKILLS.map((s) => <option key={s} value={s} />)}
                </datalist>
                <Button type="button" variant="outline" size="icon" onClick={() => addSkill(skillInput)}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="budget_type">Budget type *</Label>
                <Select value={budgetType} onValueChange={(v) => setBudgetType(v as 'fixed'|'range'|'hourly')}>
                  <SelectTrigger id="budget_type" className="mt-1.5"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fixed">Fixed price</SelectItem>
                    <SelectItem value="range">Price range</SelectItem>
                    <SelectItem value="hourly">Hourly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="deadline">Deadline (optional)</Label>
                <Input id="deadline" type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} min={new Date().toISOString().split('T')[0]} className="mt-1.5" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="budget_min">{budgetType === 'range' ? 'Min budget (₹)' : budgetType === 'hourly' ? 'Hourly rate (₹)' : 'Budget (₹)'} *</Label>
                <Input id="budget_min" type="number" min="1" step="any" value={budgetMin} onChange={(e) => setBudgetMin(e.target.value)} placeholder="e.g. 2000" className="mt-1.5" />
              </div>
              {budgetType === 'range' && (
                <div>
                  <Label htmlFor="budget_max">Max budget (₹) *</Label>
                  <Input id="budget_max" type="number" min="1" step="any" value={budgetMax} onChange={(e) => setBudgetMax(e.target.value)} placeholder="e.g. 5000" className="mt-1.5" />
                </div>
              )}
            </div>

            <div className="pt-2 flex flex-col sm:flex-row gap-3 sm:justify-end">
              <Button type="button" variant="outline" onClick={() => navigate('/marketplace')}>Cancel</Button>
              <Button type="submit" disabled={loading} className="bg-accent text-accent-foreground hover:bg-accent/90">
                {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Post job
              </Button>
            </div>
          </Card>
        </form>
      </div>
    </MarketplaceLayout>
  );
}
