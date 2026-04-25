import { useEffect, useState } from 'react';
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
import { useMyWorkerProfile, MARKETPLACE_SKILLS } from '@/hooks/useMarketplace';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, X, Plus, CheckCircle2 } from 'lucide-react';

const profileSchema = z.object({
  display_name: z.string().trim().min(2, 'Name must be at least 2 characters').max(80),
  headline: z.string().trim().min(8, 'Headline too short').max(120),
  bio: z.string().trim().min(40, 'Bio must be at least 40 characters').max(2000),
  experience_level: z.enum(['beginner', 'intermediate', 'advanced']),
  hourly_rate: z.number().positive().nullable().optional(),
  location: z.string().trim().max(80).optional().nullable(),
  skills: z.array(z.string()).min(1, 'Add at least 1 skill').max(20),
});

export default function BecomeWorker() {
  const { user, profile: userProfile } = useAuth();
  const navigate = useNavigate();
  const { profile, loading: loadingProfile, refetch } = useMyWorkerProfile();
  const [saving, setSaving] = useState(false);

  const [displayName, setDisplayName] = useState('');
  const [headline, setHeadline] = useState('');
  const [bio, setBio] = useState('');
  const [experience, setExperience] = useState<'beginner'|'intermediate'|'advanced'>('beginner');
  const [hourlyRate, setHourlyRate] = useState('');
  const [location, setLocation] = useState('');
  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState('');

  // Hydrate form from existing profile
  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name || '');
      setHeadline(profile.headline || '');
      setBio(profile.bio || '');
      setExperience(profile.experience_level);
      setHourlyRate(profile.hourly_rate ? String(profile.hourly_rate) : '');
      setLocation(profile.location || '');
      setSkills(profile.skills || []);
    } else if (userProfile?.full_name && !displayName) {
      setDisplayName(userProfile.full_name);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile, userProfile]);

  const addSkill = (s: string) => {
    const v = s.trim();
    if (!v || skills.includes(v) || skills.length >= 20) return;
    setSkills([...skills, v]);
    setSkillInput('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      navigate('/auth?redirect=/marketplace/become-worker');
      return;
    }

    const parsed = profileSchema.safeParse({
      display_name: displayName,
      headline,
      bio,
      experience_level: experience,
      hourly_rate: hourlyRate ? parseFloat(hourlyRate) : null,
      location: location || null,
      skills,
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }

    setSaving(true);
    const payload = { user_id: user.id, ...parsed.data };
    const { error } = await (supabase as any)
      .from('worker_profiles')
      .upsert(payload, { onConflict: 'user_id' });
    setSaving(false);

    if (error) { toast.error(error.message); return; }
    toast.success(profile ? 'Profile updated!' : 'Worker profile created!');
    refetch();
  };

  if (loadingProfile) {
    return (
      <MarketplaceLayout>
        <div className="container-wide py-12 flex justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </MarketplaceLayout>
    );
  }

  return (
    <MarketplaceLayout>
      <SEOHead title="Become a Worker — Archi Studio Marketplace" description="Set up your worker profile and start earning from architecture freelance jobs." url="https://archistudio.shop/marketplace/become-worker" />
      <div className="container-narrow py-8 md:py-12 max-w-3xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="font-display text-3xl md:text-4xl font-bold mb-2">
            {profile ? 'Edit your worker profile' : 'Become a worker'}
          </h1>
          <p className="text-muted-foreground">
            {profile
              ? 'Keep your profile updated to land more jobs.'
              : 'Set up your profile to start submitting proposals to clients.'}
          </p>
          {profile && (
            <Badge variant="outline" className="gap-1 mt-3 text-accent border-accent/30">
              <CheckCircle2 className="h-3 w-3" /> Active worker since {new Date(profile.created_at).toLocaleDateString()}
            </Badge>
          )}
        </div>

        {!user ? (
          <Card className="p-8 text-center">
            <p className="mb-4 text-muted-foreground">Please sign in to create your worker profile.</p>
            <Button onClick={() => navigate('/auth?redirect=/marketplace/become-worker')}>Sign in</Button>
          </Card>
        ) : (
          <form onSubmit={handleSubmit}>
            <Card className="p-6 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="display_name">Display name *</Label>
                  <Input id="display_name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} maxLength={80} className="mt-1.5" />
                </div>
                <div>
                  <Label htmlFor="location">Location (optional)</Label>
                  <Input id="location" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. Mumbai, India" className="mt-1.5" />
                </div>
              </div>

              <div>
                <Label htmlFor="headline">Headline *</Label>
                <Input id="headline" value={headline} onChange={(e) => setHeadline(e.target.value)} placeholder="e.g. Architecture student · 3D & V-Ray rendering" maxLength={120} className="mt-1.5" />
              </div>

              <div>
                <Label htmlFor="bio">About you *</Label>
                <Textarea id="bio" value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Year of study, software you use, types of projects you've worked on, your strengths…" rows={5} maxLength={2000} className="mt-1.5" />
                <p className="text-xs text-muted-foreground mt-1">{bio.length}/2000</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="experience">Experience level *</Label>
                  <Select value={experience} onValueChange={(v) => setExperience(v as 'beginner'|'intermediate'|'advanced')}>
                    <SelectTrigger id="experience" className="mt-1.5"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beginner">Beginner (0–1 yr)</SelectItem>
                      <SelectItem value="intermediate">Intermediate (1–3 yrs)</SelectItem>
                      <SelectItem value="advanced">Advanced (3+ yrs)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="hourly_rate">Hourly rate (₹, optional)</Label>
                  <Input id="hourly_rate" type="number" min="0" step="any" value={hourlyRate} onChange={(e) => setHourlyRate(e.target.value)} placeholder="e.g. 250" className="mt-1.5" />
                </div>
              </div>

              <div>
                <Label>Skills *</Label>
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
                    list="worker-skill-suggestions"
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSkill(skillInput); } }}
                    placeholder="Type or pick a skill…"
                  />
                  <datalist id="worker-skill-suggestions">
                    {MARKETPLACE_SKILLS.map((s) => <option key={s} value={s} />)}
                  </datalist>
                  <Button type="button" variant="outline" size="icon" onClick={() => addSkill(skillInput)}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row gap-3 sm:justify-end">
                <Button type="button" variant="outline" onClick={() => navigate('/marketplace')}>Cancel</Button>
                <Button type="submit" disabled={saving} className="bg-accent text-accent-foreground hover:bg-accent/90">
                  {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  {profile ? 'Save changes' : 'Create worker profile'}
                </Button>
              </div>
            </Card>
          </form>
        )}
      </div>
    </MarketplaceLayout>
  );
}
