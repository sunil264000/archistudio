import { useEffect, useState } from 'react';
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
import { useMyMemberProfile, STUDIO_SKILLS, STUDIO_TOOLS } from '@/hooks/useStudioHub';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, X, Plus, CheckCircle2, Camera, Link as LinkIcon, Instagram, Linkedin, FileText, Upload } from 'lucide-react';
import { compressAvatar } from '@/lib/imageCompression';
import { Link } from 'react-router-dom';
import { PortfolioWorks } from '@/components/studio-hub/PortfolioWorks';

const profileSchema = z.object({
  display_name: z.string().trim().min(2).max(80),
  headline: z.string().trim().min(8).max(120),
  bio: z.string().trim().min(40, 'Tell us a bit more — at least 40 characters').max(2000),
  experience_level: z.enum(['beginner', 'intermediate', 'advanced']),
  hourly_rate: z.number().positive().nullable().optional(),
  location: z.string().trim().max(80).optional().nullable(),
  skills: z.array(z.string()).min(1, 'Add at least 1 core skill').max(20),
  tools: z.array(z.string()).min(1, 'Add at least 1 software tool').max(20),
  google_drive_link: z.string().url().optional().or(z.literal('')),
  instagram_url: z.string().url().optional().or(z.literal('')),
  linkedin_url: z.string().url().optional().or(z.literal('')),
});

export default function BecomeMember() {
  const { user, profile: userProfile } = useAuth();
  const navigate = useNavigate();
  const { profile, loading: loadingProfile, refetch } = useMyMemberProfile();
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const [displayName, setDisplayName] = useState('');
  const [headline, setHeadline] = useState('');
  const [bio, setBio] = useState('');
  const [experience, setExperience] = useState<'beginner'|'intermediate'|'advanced'>('beginner');
  const [hourlyRate, setHourlyRate] = useState('');
  const [location, setLocation] = useState('');
  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState('');
  const [tools, setTools] = useState<string[]>([]);
  const [toolInput, setToolInput] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  
  // New fields
  const [googleDriveLink, setGoogleDriveLink] = useState('');
  const [instagramUrl, setInstagramUrl] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [portfolioPdfUrl, setPortfolioPdfUrl] = useState<string | null>(null);
  const [uploadingPdf, setUploadingPdf] = useState(false);

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name || '');
      setHeadline(profile.headline || '');
      setBio(profile.bio || '');
      setExperience(profile.experience_level);
      setHourlyRate(profile.hourly_rate ? String(profile.hourly_rate) : '');
      setLocation(profile.location || '');
      setSkills(profile.skills || []);
      setTools(profile.tools || []);
      setAvatarUrl(profile.avatar_url);
      setGoogleDriveLink((profile as any).google_drive_link || '');
      setInstagramUrl((profile as any).instagram_url || '');
      setLinkedinUrl((profile as any).linkedin_url || '');
      setPortfolioPdfUrl((profile as any).portfolio_pdf_url || null);
    } else if (userProfile?.full_name && !displayName) {
      setDisplayName(userProfile.full_name);
      setAvatarUrl(userProfile.avatar_url);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile, userProfile]);

  const addSkill = (s: string) => {
    const v = s.trim();
    if (!v || skills.includes(v) || skills.length >= 20) return;
    setSkills([...skills, v]);
    setSkillInput('');
  };

  const addTool = (s: string) => {
    const v = s.trim();
    if (!v || tools.includes(v) || tools.length >= 20) return;
    setTools([...tools, v]);
    setToolInput('');
  };

  const handleAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (file.size > 12 * 1024 * 1024) { toast.error('Image must be under 12MB'); return; }

    setUploadingAvatar(true);
    let optimized = file;
    try { optimized = await compressAvatar(file); } catch { /* fallback to original */ }
    const path = `${user.id}/avatar-${Date.now()}.jpg`;
    const { error: upErr } = await supabase.storage.from('marketplace-uploads').upload(path, optimized, { upsert: true, contentType: 'image/jpeg' });
    if (upErr) { setUploadingAvatar(false); toast.error(upErr.message); return; }
    const { data: pub } = supabase.storage.from('marketplace-uploads').getPublicUrl(path);
    const url = pub.publicUrl;
    // Persist on both profiles and worker_profiles
    await supabase.from('profiles').update({ avatar_url: url }).eq('user_id', user.id);
    if (profile) await (supabase as any).from('worker_profiles').update({ avatar_url: url }).eq('user_id', user.id);
    setAvatarUrl(url);
    setUploadingAvatar(false);
    toast.success('Photo updated');
  };

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (file.type !== 'application/pdf') { toast.error('Only PDF files are allowed'); return; }
    if (file.size > 20 * 1024 * 1024) { toast.error('PDF must be under 20MB'); return; }

    setUploadingPdf(true);
    const path = `${user.id}/portfolio-${Date.now()}.pdf`;
    const { error: upErr } = await supabase.storage.from('studio-hub-deliverables').upload(path, file);
    if (upErr) { setUploadingPdf(false); toast.error(upErr.message); return; }
    
    const { data: pub } = supabase.storage.from('studio-hub-deliverables').getPublicUrl(path);
    setPortfolioPdfUrl(pub.publicUrl);
    setUploadingPdf(false);
    toast.success('PDF Portfolio uploaded successfully');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { navigate('/auth?redirect=/studio-hub/become-member'); return; }
    const parsed = profileSchema.safeParse({
      display_name: displayName, headline, bio,
      experience_level: experience,
      hourly_rate: hourlyRate ? parseFloat(hourlyRate) : null,
      location: location || null,
      skills,
      tools,
      google_drive_link: googleDriveLink || null,
      instagram_url: instagramUrl || null,
      linkedin_url: linkedinUrl || null,
    });
    if (!parsed.success) { toast.error(parsed.error.issues[0].message); return; }
    setSaving(true);
    const { error } = await (supabase as any).from('worker_profiles').upsert(
      { 
        user_id: user.id, 
        ...parsed.data, 
        avatar_url: avatarUrl,
        portfolio_pdf_url: portfolioPdfUrl 
      },
      { onConflict: 'user_id' }
    );
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success(profile ? 'Profile updated' : 'Welcome to the Studio!');
    refetch();
    if (!profile) navigate(`/studio-hub/members/${user.id}`);
  };

  if (loadingProfile) {
    return (
      <StudioHubLayout>
        <div className="container-wide py-16 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      </StudioHubLayout>
    );
  }

  return (
    <StudioHubLayout>
      <SEOHead 
        title="Join the Elite: Become a Studio Member | Archistudio" 
        description="The premier marketplace for architectural talent. Build your professional profile, showcase your portfolio, and collaborate on high-end project briefs." 
        url="https://archistudio.shop/studio-hub/become-member" 
      />
      <div className="container-narrow py-10 md:py-16 max-w-2xl mx-auto px-4">
        <div className="mb-10">
          <p className="text-[11px] tracking-[0.18em] text-muted-foreground/70 uppercase mb-3">{profile ? 'Edit profile' : 'Join the Studio'}</p>
          <h1 className="font-display text-3xl md:text-4xl font-semibold tracking-tight mb-3">
            {profile ? 'Keep your profile sharp.' : 'Become a future architect, today.'}
          </h1>
          <p className="text-sm text-muted-foreground">{profile ? 'Updated profiles win more briefs.' : 'A complete profile gets you the first project faster.'}</p>
          {profile && <Badge variant="outline" className="gap-1.5 mt-4 rounded-full text-accent border-accent/30"><CheckCircle2 className="h-3 w-3" /> Active member</Badge>}
        </div>

        {!user ? (
          <div className="border border-border/40 rounded-2xl p-10 text-center">
            <p className="mb-4 text-muted-foreground">Sign in to set up your member profile.</p>
            <Button onClick={() => navigate('/auth?redirect=/studio-hub/become-member')} className="rounded-full">Sign in</Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-7">
            {/* Avatar */}
            <div className="flex items-center gap-5">
              <div className="relative">
                <div className="h-24 w-24 rounded-full bg-muted/60 overflow-hidden border border-border/40">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-2xl font-display text-muted-foreground">
                      {(displayName || user.email || '?').slice(0, 1).toUpperCase()}
                    </div>
                  )}
                </div>
                <label className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full bg-foreground text-background flex items-center justify-center cursor-pointer hover:scale-105 transition-transform">
                  {uploadingAvatar ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Camera className="h-3.5 w-3.5" />}
                  <input type="file" accept="image/*" className="hidden" onChange={handleAvatar} disabled={uploadingAvatar} />
                </label>
              </div>
              <div>
                <p className="font-medium">Profile photo</p>
                <p className="text-xs text-muted-foreground">A real photo gets ~3× more responses.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">Display name</Label>
                <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} maxLength={80} className="mt-2 h-12 rounded-xl border-border/60" />
              </div>
              <div>
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">Location</Label>
                <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Mumbai, India" className="mt-2 h-12 rounded-xl border-border/60" />
              </div>
            </div>

            <div>
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Headline</Label>
              <Input value={headline} onChange={(e) => setHeadline(e.target.value)} placeholder="Architecture student · 3D & V-Ray rendering" maxLength={120} className="mt-2 h-12 rounded-xl border-border/60" />
            </div>

            <div>
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">About you</Label>
              <Textarea value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Year of study, software, types of projects, your strengths…" rows={6} maxLength={2000} className="mt-2 rounded-xl border-border/60" />
              <p className="text-xs text-muted-foreground mt-1.5">{bio.length}/2000</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">Experience</Label>
                <Select value={experience} onValueChange={(v) => setExperience(v as any)}>
                  <SelectTrigger className="mt-2 h-12 rounded-xl border-border/60"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">Beginner (0–1 yr)</SelectItem>
                    <SelectItem value="intermediate">Intermediate (1–3 yrs)</SelectItem>
                    <SelectItem value="advanced">Advanced (3+ yrs)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">Hourly rate (₹, optional)</Label>
                <Input type="number" min="0" step="any" value={hourlyRate} onChange={(e) => setHourlyRate(e.target.value)} placeholder="250" className="mt-2 h-12 rounded-xl border-border/60" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">Core Skills</Label>
                <div className="flex flex-wrap gap-1.5 mt-2 mb-2 min-h-[32px]">
                  {skills.map((s) => (
                    <Badge key={s} variant="secondary" className="gap-1 rounded-full">{s}<button type="button" onClick={() => setSkills(skills.filter((x) => x !== s))}><X className="h-3 w-3" /></button></Badge>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input list="member-skill-suggestions" value={skillInput} onChange={(e) => setSkillInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSkill(skillInput); } }} placeholder="e.g. 3D Modelling" className="h-11 rounded-xl border-border/60" />
                  <datalist id="member-skill-suggestions">{STUDIO_SKILLS.map((s) => <option key={s} value={s} />)}</datalist>
                  <Button type="button" variant="outline" size="icon" onClick={() => addSkill(skillInput)} className="h-11 w-11 rounded-xl"><Plus className="h-4 w-4" /></Button>
                </div>
              </div>

              <div>
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">Software Tools</Label>
                <div className="flex flex-wrap gap-1.5 mt-2 mb-2 min-h-[32px]">
                  {tools.map((t) => (
                    <Badge key={t} variant="accent" className="gap-1 rounded-full bg-accent/10 text-accent border-accent/20 hover:bg-accent/20">{t}<button type="button" onClick={() => setTools(tools.filter((x) => x !== t))}><X className="h-3 w-3" /></button></Badge>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input list="member-tool-suggestions" value={toolInput} onChange={(e) => setToolInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTool(toolInput); } }} placeholder="e.g. Revit" className="h-11 rounded-xl border-border/60" />
                  <datalist id="member-tool-suggestions">{STUDIO_TOOLS.map((t) => <option key={t} value={t} />)}</datalist>
                  <Button type="button" variant="outline" size="icon" onClick={() => addTool(toolInput)} className="h-11 w-11 rounded-xl"><Plus className="h-4 w-4" /></Button>
                </div>
              </div>
            </div>

            <div className="border-t border-border/40 pt-6 mt-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <LinkIcon className="h-4 w-4 text-accent" /> Socials & Links
              </h3>
              
              <div className="space-y-4">
                <div>
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-2 mb-2">
                    <LinkIcon className="h-3 w-3" /> Google Drive Portfolio Link
                  </Label>
                  <Input type="url" value={googleDriveLink} onChange={(e) => setGoogleDriveLink(e.target.value)} placeholder="https://drive.google.com/..." className="h-12 rounded-xl border-border/60" />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-2 mb-2">
                      <Instagram className="h-3 w-3" /> Instagram URL
                    </Label>
                    <Input type="url" value={instagramUrl} onChange={(e) => setInstagramUrl(e.target.value)} placeholder="https://instagram.com/..." className="h-12 rounded-xl border-border/60" />
                  </div>
                  <div>
                    <Label className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-2 mb-2">
                      <Linkedin className="h-3 w-3" /> LinkedIn URL
                    </Label>
                    <Input type="url" value={linkedinUrl} onChange={(e) => setLinkedinUrl(e.target.value)} placeholder="https://linkedin.com/in/..." className="h-12 rounded-xl border-border/60" />
                  </div>
                </div>
                
                <div className="pt-2">
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-2 mb-2">
                    <FileText className="h-3 w-3" /> Upload PDF Portfolio
                  </Label>
                  
                  {portfolioPdfUrl ? (
                    <div className="flex items-center justify-between p-4 rounded-xl border border-border/60 bg-muted/20">
                      <div className="flex items-center gap-3">
                        <div className="bg-rose-500/10 p-2 rounded-lg">
                          <FileText className="h-5 w-5 text-rose-500" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">Portfolio Document</p>
                          <a href={portfolioPdfUrl} target="_blank" rel="noreferrer" className="text-xs text-accent hover:underline">View current PDF</a>
                        </div>
                      </div>
                      <Button type="button" variant="outline" size="sm" onClick={() => setPortfolioPdfUrl(null)}>Remove</Button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center h-24 border-2 border-dashed border-border/60 rounded-xl cursor-pointer hover:bg-muted/10 transition-colors">
                      {uploadingPdf ? (
                        <div className="flex items-center gap-2 text-muted-foreground text-sm">
                          <Loader2 className="h-4 w-4 animate-spin" /> Uploading PDF...
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-1 text-muted-foreground">
                          <Upload className="h-5 w-5 mb-1 text-accent" />
                          <span className="text-sm font-medium">Click to upload PDF (Max 20MB)</span>
                        </div>
                      )}
                      <input type="file" accept="application/pdf" className="hidden" onChange={handlePdfUpload} disabled={uploadingPdf} />
                    </label>
                  )}
                </div>
              </div>
            </div>

            <div className="pt-3 flex flex-col sm:flex-row gap-3 sm:justify-end">
              <Button type="button" variant="ghost" onClick={() => navigate('/studio-hub')} className="rounded-full">Cancel</Button>
              <Button type="submit" disabled={saving} className="rounded-full bg-foreground text-background hover:bg-foreground/90 px-8">
                {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {profile ? 'Save changes' : 'Join the Studio'}
              </Button>
            </div>
          </form>
        )}

        {/* Portfolio (only after profile is created) */}
        {profile && user && (
          <div className="mt-14 pt-10 border-t border-border/40">
            <PortfolioWorks workerProfileId={profile.id} userId={user.id} editable />
            <div className="mt-6 text-right">
              <Link to={`/studio-hub/members/${user.id}`}>
                <Button variant="outline" size="sm" className="rounded-full">View public profile →</Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </StudioHubLayout>
  );
}
