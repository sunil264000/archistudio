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
import { STUDIO_CATEGORIES, STUDIO_SKILLS, STUDIO_TOOLS, formatBudget, calculatePayout } from '@/hooks/useStudioHub';
import { toast } from 'sonner';
import { Loader2, X, Plus, ArrowRight, ArrowLeft, CheckCircle2, FileText, Clock, IndianRupee, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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

const steps = [
  { label: 'Details', icon: FileText },
  { label: 'Budget', icon: IndianRupee },
  { label: 'Review', icon: CheckCircle2 },
];

export default function PostProject() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(0);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [budgetType, setBudgetType] = useState<'fixed' | 'range' | 'hourly'>('fixed');
  const [budgetMin, setBudgetMin] = useState('');
  const [budgetMax, setBudgetMax] = useState('');
  const [deadline, setDeadline] = useState('');
  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState('');
  const [tools, setTools] = useState<string[]>([]);
  const [toolInput, setToolInput] = useState('');

  const addSkill = (s: string) => {
    const v = s.trim();
    if (!v || skills.includes(v) || skills.length >= 15) return;
    setSkills([...skills, v]);
    setSkillInput('');
  };

  const addTool = (t: string) => {
    const v = t.trim();
    if (!v || tools.includes(v) || tools.length >= 15) return;
    setTools([...tools, v]);
    setToolInput('');
  };

  const validateStep = (s: number): string | null => {
    if (s === 0) {
      if (title.trim().length < 8) return 'Title must be at least 8 characters';
      if (description.trim().length < 40) return 'Description needs at least 40 characters';
      if (!category) return 'Pick a category';
      return null;
    }
    if (s === 1) {
      if (!budgetMin || parseFloat(budgetMin) <= 0) return 'Enter a valid budget';
      if (budgetType === 'range' && budgetMax && parseFloat(budgetMax) <= parseFloat(budgetMin)) return 'Max budget must be greater than min';
      return null;
    }
    return null;
  };

  const goNext = () => {
    const err = validateStep(step);
    if (err) { toast.error(err); return; }
    setStep(Math.min(2, step + 1));
  };

  const goBack = () => setStep(Math.max(0, step - 1));

  const payout = budgetMin ? calculatePayout(parseFloat(budgetMin) || 0) : null;

  const handleSubmit = async () => {
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
      skills_required: [...skills, ...tools],
    });

    if (!parsed.success) { toast.error(parsed.error.issues[0].message); return; }

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
        {/* Step indicator */}
        <div className="flex items-center justify-center gap-0 mb-12">
          {steps.map((s, i) => (
            <div key={s.label} className="flex items-center">
              <button
                onClick={() => { if (i < step) setStep(i); }}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm transition-all ${
                  i === step
                    ? 'bg-foreground text-background font-medium'
                    : i < step
                      ? 'bg-accent/10 text-accent cursor-pointer hover:bg-accent/20'
                      : 'text-muted-foreground/50 cursor-default'
                }`}
              >
                {i < step ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  <s.icon className="h-4 w-4" />
                )}
                <span className="hidden sm:inline">{s.label}</span>
                <span className="sm:hidden">{i + 1}</span>
              </button>
              {i < steps.length - 1 && (
                <div className={`w-8 md:w-16 h-px mx-1 ${i < step ? 'bg-accent' : 'bg-border/40'}`} />
              )}
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25 }}
          >
            {/* Step 0: Details */}
            {step === 0 && (
              <div className="space-y-7">
                <div>
                  <p className="text-[11px] tracking-[0.18em] text-muted-foreground/70 uppercase mb-3">Step 1 of 3</p>
                  <h1 className="font-display text-3xl font-semibold tracking-tight mb-2">Describe your project.</h1>
                  <p className="text-sm text-muted-foreground">A clear brief gets better proposals faster.</p>
                </div>

                <div>
                  <Label htmlFor="title" className="text-xs uppercase tracking-wider text-muted-foreground">Project title</Label>
                  <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="3D rendering for a residential project" maxLength={140} className="mt-2 h-12 rounded-xl border-border/60 text-base" />
                  <p className="text-xs text-muted-foreground mt-1.5">{title.length}/140</p>
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

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label className="text-xs uppercase tracking-wider text-muted-foreground">Core Skills Needed</Label>
                      <div className="flex flex-wrap gap-1.5 mt-2 mb-2 min-h-[32px]">
                        {skills.map((s) => (
                          <Badge key={s} variant="secondary" className="gap-1 rounded-full">{s}<button type="button" onClick={() => setSkills(skills.filter((x) => x !== s))}><X className="h-3 w-3" /></button></Badge>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <Input list="skill-suggestions" value={skillInput} onChange={(e) => setSkillInput(e.target.value)}
                          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSkill(skillInput); } }} placeholder="e.g. 3D Modelling" className="h-11 rounded-xl border-border/60" />
                        <datalist id="skill-suggestions">{STUDIO_SKILLS.map((s) => <option key={s} value={s} />)}</datalist>
                        <Button type="button" variant="outline" size="icon" onClick={() => addSkill(skillInput)} className="h-11 w-11 rounded-xl"><Plus className="h-4 w-4" /></Button>
                      </div>
                    </div>

                    <div>
                      <Label className="text-xs uppercase tracking-wider text-muted-foreground">Software Tools Needed</Label>
                      <div className="flex flex-wrap gap-1.5 mt-2 mb-2 min-h-[32px]">
                        {tools.map((t) => (
                          <Badge key={t} variant="outline" className="gap-1 rounded-full bg-accent/10 text-accent border-accent/20">{t}<button type="button" onClick={() => setTools(tools.filter((x) => x !== t))}><X className="h-3 w-3" /></button></Badge>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <Input list="tool-suggestions" value={toolInput} onChange={(e) => setToolInput(e.target.value)}
                          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTool(toolInput); } }} placeholder="e.g. Revit" className="h-11 rounded-xl border-border/60" />
                        <datalist id="tool-suggestions">{STUDIO_TOOLS.map((t) => <option key={t} value={t} />)}</datalist>
                        <Button type="button" variant="outline" size="icon" onClick={() => addTool(toolInput)} className="h-11 w-11 rounded-xl"><Plus className="h-4 w-4" /></Button>
                      </div>
                    </div>
                  </div>
              </div>
            )}

            {/* Step 1: Budget & Timeline */}
            {step === 1 && (
              <div className="space-y-7">
                <div>
                  <p className="text-[11px] tracking-[0.18em] text-muted-foreground/70 uppercase mb-3">Step 2 of 3</p>
                  <h1 className="font-display text-3xl font-semibold tracking-tight mb-2">Set your budget.</h1>
                  <p className="text-sm text-muted-foreground">Members see your budget and propose accordingly.</p>
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

                {/* Payout preview */}
                {payout && payout.payout > 0 && (
                  <div className="border border-border/40 rounded-2xl p-5 bg-muted/20">
                    <p className="text-xs uppercase tracking-wider text-muted-foreground mb-3">Fee breakdown</p>
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <p className="font-display text-xl font-semibold">₹{(parseFloat(budgetMin) || 0).toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">You pay</p>
                      </div>
                      <div>
                        <p className="font-display text-xl font-semibold text-amber-500">₹{payout.fee.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">Platform fee ({payout.feePercent}%)</p>
                      </div>
                      <div>
                        <p className="font-display text-xl font-semibold text-accent">₹{payout.payout.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">Member receives</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Step 2: Review */}
            {step === 2 && (
              <div className="space-y-7">
                <div>
                  <p className="text-[11px] tracking-[0.18em] text-muted-foreground/70 uppercase mb-3">Step 3 of 3</p>
                  <h1 className="font-display text-3xl font-semibold tracking-tight mb-2">Review & post.</h1>
                  <p className="text-sm text-muted-foreground">Check everything looks right, then publish.</p>
                </div>

                <div className="border border-border/40 rounded-2xl overflow-hidden">
                  {/* Title & Description */}
                  <div className="p-6 border-b border-border/30">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div>
                        <Badge variant="outline" className="text-[10px] uppercase tracking-wider font-normal mb-2">{category}</Badge>
                        <h3 className="font-display text-xl font-semibold">{title}</h3>
                      </div>
                      <button onClick={() => setStep(0)} className="text-xs text-accent hover:underline shrink-0">Edit</button>
                    </div>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed line-clamp-4">{description}</p>
                  </div>

                  {/* Skills */}
                  {skills.length > 0 && (
                    <div className="p-6 border-b border-border/30">
                      <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Skills</p>
                      <div className="flex flex-wrap gap-1.5">
                        {skills.map(s => <Badge key={s} variant="secondary" className="rounded-full">{s}</Badge>)}
                      </div>
                    </div>
                  )}

                  {/* Budget & Deadline */}
                  <div className="p-6 bg-muted/20">
                    <div className="flex items-start justify-between gap-3">
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
                        <div>
                          <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Budget</p>
                          <p className="font-display text-lg font-semibold">
                            {formatBudget({ budget_type: budgetType, budget_min: parseFloat(budgetMin) || null, budget_max: budgetType === 'range' ? parseFloat(budgetMax) || null : null, currency: 'INR' })}
                          </p>
                          <p className="text-xs text-muted-foreground capitalize">{budgetType} price</p>
                        </div>
                        {deadline && (
                          <div>
                            <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Deadline</p>
                            <p className="font-display text-lg font-semibold">{new Date(deadline).toLocaleDateString()}</p>
                          </div>
                        )}
                      </div>
                      <button onClick={() => setStep(1)} className="text-xs text-accent hover:underline shrink-0">Edit</button>
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-2 p-4 rounded-xl bg-accent/5 border border-accent/20">
                  <Sparkles className="h-4 w-4 text-accent shrink-0 mt-0.5" />
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Once posted, Studio Members will start sending proposals. You can review bids, check member profiles, and hire when ready.
                  </p>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="pt-8 flex flex-col sm:flex-row gap-3 sm:justify-between">
          <div>
            {step > 0 && (
              <Button type="button" variant="ghost" onClick={goBack} className="rounded-full gap-1.5">
                <ArrowLeft className="h-4 w-4" /> Back
              </Button>
            )}
          </div>
          <div className="flex gap-3">
            <Button type="button" variant="ghost" onClick={() => navigate('/studio-hub')} className="rounded-full">Cancel</Button>
            {step < 2 ? (
              <Button type="button" onClick={goNext} className="rounded-full bg-foreground text-background hover:bg-foreground/90 px-8 gap-1.5">
                Next <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button type="button" onClick={handleSubmit} disabled={loading} className="rounded-full bg-foreground text-background hover:bg-foreground/90 px-8">
                {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Post project
              </Button>
            )}
          </div>
        </div>
      </div>
    </StudioHubLayout>
  );
}
