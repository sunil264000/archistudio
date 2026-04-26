import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { StudioHubLayout } from '@/components/studio-hub/StudioHubLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { SEOHead } from '@/components/seo/SEOHead';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { STUDIO_CATEGORIES, STUDIO_SKILLS } from '@/hooks/useStudioHub';
import { toast } from 'sonner';
import { Loader2, X, Plus } from 'lucide-react';

const projectSchema = z.object({
  title: z.string().trim().min(8, 'Title must be at least 8 characters').max(140),
  description: z.string().trim().min(40, 'Tell us a bit more — at least 40 characters').max(5000),
  category: z.string().min(1, 'Pick a category'),
  budget_type: z.enum(['fixed', 'range', 'hourly']),
  budget_min: z.number().positive('Must be greater than 0'),
  budget_max: z.number().positive().optional().nullable(),
  deadline: z.string().optional().nullable(),
  skills_required: z.array(z.string()).max(15),
});

export default function PostProject() {
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
      toast.error('Please sign in to post a project');
      navigate('/auth?redirect=/studio-hub/post');
      return;
    }

    const parsed = projectSchema.safeParse({
      title, description, category,
      budget_type: budgetType,
      budget_min: parseFloat(budgetMin) || 0,
      budget_max: budgetType === 'range' ? parseFloat(budgetMax) || null : null,
      deadline: deadline || null,
      skills_required: skills,
    });

    if (!parsed.success) { toast.error(parsed.error.issues[0].message); return; }
    if (budgetType === 'range' && parsed.data.budget_max && parsed.data.budget_max <= parsed.data.budget_min) {
      toast.error('Max budget must be greater than min budget'); return;
    }

    setLoading(true);
    const { data, error } = await (supabase as any).from('marketplace_jobs').insert({
      client_id: user.id, ...parsed.data,
    }).select('id').single();
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    toast.success('Project posted — proposals will start arriving.');
    navigate(`/studio-hub/projects/${data.id}`);
  };

  return (
    <StudioHubLayout>
      <SEOHead title="Post a project — Studio Hub" description="Post your architecture project and receive proposals from verified Studio Members." url="https://archistudio.shop/studio-hub/post" />
      <div className="container-narrow py-10 md:py-16 max-w-2xl mx-auto px-4">
        <div className="mb-10">
          <p className="text-[11px] tracking-[0.18em] text-muted-foreground/70 uppercase mb-3">New brief</p>
          <h1 className="font-display text-3xl md:text-4xl font-semibold tracking-tight mb-3">Tell us what you need.</h1>
          <p className="text-sm text-muted-foreground">A clear brief gets better proposals. Add references, scope, and what success looks like.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-7">
          <div>
            <Label htmlFor="title" className="text-xs uppercase tracking-wider text-muted-foreground">Project title</Label>
            <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="3D rendering for a residential project" maxLength={140} className="mt-2 h-12 rounded-xl border-border/60 text-base" />
          </div>

          <div>
            <Label htmlFor="description" className="text-xs uppercase tracking-wider text-muted-foreground">The brief</Label>
            <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What needs to be done, what to deliver, references, software preference, deadline notes…" rows={7} maxLength={5000} className="mt-2 rounded-xl border-border/60" />
            <p className="text-xs text-muted-foreground mt-1.5">{description.length}/5000</p>
          </div>

          <div>
            <Label htmlFor="category" className="text-xs uppercase tracking-wider text-muted-foreground">Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger id="category" className="mt-2 h-12 rounded-xl border-border/60"><SelectValue placeholder="Pick a category" /></SelectTrigger>
              <SelectContent>{STUDIO_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Skills</Label>
            <div className="flex flex-wrap gap-1.5 mt-2 mb-2">
              {skills.map((s) => (
                <Badge key={s} variant="secondary" className="gap-1 rounded-full">
                  {s}
                  <button type="button" onClick={() => setSkills(skills.filter((x) => x !== s))}><X className="h-3 w-3" /></button>
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input list="skill-suggestions" value={skillInput} onChange={(e) => setSkillInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSkill(skillInput); } }}
                placeholder="Type a skill…" className="h-11 rounded-xl border-border/60" />
              <datalist id="skill-suggestions">{STUDIO_SKILLS.map((s) => <option key={s} value={s} />)}</datalist>
              <Button type="button" variant="outline" size="icon" onClick={() => addSkill(skillInput)} className="h-11 w-11 rounded-xl"><Plus className="h-4 w-4" /></Button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="budget_type" className="text-xs uppercase tracking-wider text-muted-foreground">Budget type</Label>
              <Select value={budgetType} onValueChange={(v) => setBudgetType(v as any)}>
                <SelectTrigger id="budget_type" className="mt-2 h-12 rounded-xl border-border/60"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="fixed">Fixed price</SelectItem>
                  <SelectItem value="range">Price range</SelectItem>
                  <SelectItem value="hourly">Hourly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="deadline" className="text-xs uppercase tracking-wider text-muted-foreground">Deadline (optional)</Label>
              <Input id="deadline" type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} min={new Date().toISOString().split('T')[0]} className="mt-2 h-12 rounded-xl border-border/60" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="budget_min" className="text-xs uppercase tracking-wider text-muted-foreground">{budgetType === 'range' ? 'Min budget (₹)' : budgetType === 'hourly' ? 'Hourly rate (₹)' : 'Budget (₹)'}</Label>
              <Input id="budget_min" type="number" min="1" step="any" value={budgetMin} onChange={(e) => setBudgetMin(e.target.value)} placeholder="2000" className="mt-2 h-12 rounded-xl border-border/60" />
            </div>
            {budgetType === 'range' && (
              <div>
                <Label htmlFor="budget_max" className="text-xs uppercase tracking-wider text-muted-foreground">Max budget (₹)</Label>
                <Input id="budget_max" type="number" min="1" step="any" value={budgetMax} onChange={(e) => setBudgetMax(e.target.value)} placeholder="5000" className="mt-2 h-12 rounded-xl border-border/60" />
              </div>
            )}
          </div>

          <div className="pt-4 flex flex-col sm:flex-row gap-3 sm:justify-end">
            <Button type="button" variant="ghost" onClick={() => navigate('/studio-hub')} className="rounded-full">Cancel</Button>
            <Button type="submit" disabled={loading} className="rounded-full bg-foreground text-background hover:bg-foreground/90 px-8">
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Post project
            </Button>
          </div>
        </form>
      </div>
    </StudioHubLayout>
  );
}
