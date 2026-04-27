// Portfolio Works manager — used inside Studio Hub member profile editing.
// Members can upload work covers (auto-compressed), titles, descriptions, skills.
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Loader2, Plus, Trash2, ImagePlus, Pencil, X } from 'lucide-react';
import { compressImage } from '@/lib/imageCompression';
import { STUDIO_SKILLS, STUDIO_CATEGORIES } from '@/hooks/useStudioHub';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

interface PortfolioItem {
  id: string;
  worker_id: string;
  title: string;
  description: string | null;
  category: string | null;
  skills: string[];
  cover_image_url: string | null;
  external_link: string | null;
  display_order: number;
  created_at: string;
}

interface Props {
  workerProfileId: string; // worker_profiles.id (NOT user_id)
  userId: string;
  editable?: boolean;
}

export function PortfolioWorks({ workerProfileId, userId, editable = false }: Props) {
  const [items, setItems] = useState<PortfolioItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<PortfolioItem | null>(null);

  // form
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [skillInput, setSkillInput] = useState('');
  const [skills, setSkills] = useState<string[]>([]);
  const [externalLink, setExternalLink] = useState('');
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data } = await (supabase as any)
      .from('worker_portfolio_items')
      .select('*')
      .eq('worker_id', workerProfileId)
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: false });
    setItems((data || []) as PortfolioItem[]);
    setLoading(false);
  };

  useEffect(() => { void load(); /* eslint-disable-next-line */ }, [workerProfileId]);

  const reset = () => {
    setEditing(null);
    setTitle(''); setDescription(''); setCategory('');
    setSkills([]); setSkillInput(''); setExternalLink('');
    setCoverFile(null); setCoverPreview(null);
  };

  const openCreate = () => { reset(); setOpen(true); };

  const openEdit = (item: PortfolioItem) => {
    setEditing(item);
    setTitle(item.title);
    setDescription(item.description || '');
    setCategory(item.category || '');
    setSkills(item.skills || []);
    setExternalLink(item.external_link || '');
    setCoverPreview(item.cover_image_url);
    setCoverFile(null);
    setOpen(true);
  };

  const onCoverChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 15 * 1024 * 1024) { toast.error('Image must be under 15MB'); return; }
    setCoverFile(f);
    setCoverPreview(URL.createObjectURL(f));
  };

  const addSkill = (s: string) => {
    const v = s.trim();
    if (!v || skills.includes(v) || skills.length >= 10) return;
    setSkills([...skills, v]);
    setSkillInput('');
  };

  const handleSave = async () => {
    if (!title.trim()) { toast.error('Add a title'); return; }
    setSaving(true);

    let coverUrl = editing?.cover_image_url || null;
    if (coverFile) {
      try {
        const optimized = await compressImage(coverFile, { maxEdge: 1600, quality: 0.82 });
        const path = `${userId}/portfolio/${Date.now()}.jpg`;
        const { error: upErr } = await supabase.storage
          .from('marketplace-uploads')
          .upload(path, optimized, { upsert: true, contentType: 'image/jpeg' });
        if (upErr) { setSaving(false); toast.error(upErr.message); return; }
        const { data: pub } = supabase.storage.from('marketplace-uploads').getPublicUrl(path);
        coverUrl = pub.publicUrl;
      } catch (err: any) {
        setSaving(false);
        toast.error('Could not upload image');
        return;
      }
    }

    const payload = {
      worker_id: workerProfileId,
      title: title.trim(),
      description: description.trim() || null,
      category: category || null,
      skills,
      cover_image_url: coverUrl,
      external_link: externalLink.trim() || null,
    };

    let error;
    if (editing) {
      ({ error } = await (supabase as any)
        .from('worker_portfolio_items').update(payload).eq('id', editing.id));
    } else {
      ({ error } = await (supabase as any)
        .from('worker_portfolio_items').insert(payload));
    }
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success(editing ? 'Work updated' : 'Work added to your portfolio');
    setOpen(false);
    reset();
    void load();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Remove this work from your portfolio?')) return;
    const { error } = await (supabase as any).from('worker_portfolio_items').delete().eq('id', id);
    if (error) { toast.error(error.message); return; }
    toast.success('Removed');
    void load();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-[11px] tracking-[0.18em] text-muted-foreground/70 uppercase">Portfolio works</p>
        {editable && (
          <Button size="sm" variant="outline" onClick={openCreate} className="rounded-full h-8 gap-1.5">
            <Plus className="h-3.5 w-3.5" /> Add work
          </Button>
        )}
      </div>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {[1,2,3].map(i => <div key={i} className="aspect-[4/3] bg-muted/40 rounded-xl animate-pulse" />)}
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-10 border border-dashed border-border/40 rounded-xl">
          <ImagePlus className="h-7 w-7 mx-auto text-muted-foreground/60 mb-2" />
          <p className="text-sm text-muted-foreground mb-3">{editable ? 'No works yet — show off your best 3-6 projects.' : 'No portfolio works yet.'}</p>
          {editable && <Button size="sm" onClick={openCreate} className="rounded-full">Add your first work</Button>}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <AnimatePresence>
            {items.map((item) => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.25 }}
                className="group relative rounded-xl overflow-hidden border border-border/40 bg-muted/40"
              >
                <div className="aspect-[4/3] bg-muted/60 overflow-hidden">
                  {item.cover_image_url ? (
                    <img src={item.cover_image_url} alt={item.title} loading="lazy"
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.04]" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                      <ImagePlus className="h-7 w-7" />
                    </div>
                  )}
                </div>
                <div className="p-3">
                  <p className="font-medium text-sm line-clamp-1">{item.title}</p>
                  {item.category && <p className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">{item.category}</p>}
                  {item.skills?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {item.skills.slice(0, 3).map(s => <Badge key={s} variant="secondary" className="rounded-full text-[10px] font-normal h-5 px-2">{s}</Badge>)}
                    </div>
                  )}
                </div>
                {editable && (
                  <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openEdit(item)} className="h-7 w-7 rounded-full bg-background/95 backdrop-blur flex items-center justify-center hover:bg-background border border-border/60">
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={() => handleDelete(item.id)} className="h-7 w-7 rounded-full bg-background/95 backdrop-blur flex items-center justify-center hover:bg-destructive hover:text-destructive-foreground border border-border/60">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Create/edit dialog */}
      <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) reset(); }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? 'Edit work' : 'Add a work'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Cover image</Label>
              <div className="mt-2">
                {coverPreview ? (
                  <div className="relative aspect-[4/3] rounded-xl overflow-hidden border border-border/40 bg-muted/40">
                    <img src={coverPreview} alt="" className="w-full h-full object-cover" />
                    <label className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer text-white text-sm font-medium">
                      Change image
                      <input type="file" accept="image/*" className="hidden" onChange={onCoverChange} />
                    </label>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center aspect-[4/3] rounded-xl border-2 border-dashed border-border/60 hover:border-foreground/40 hover:bg-muted/30 cursor-pointer transition-colors">
                    <ImagePlus className="h-7 w-7 text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">Click to upload — auto-compressed</p>
                    <input type="file" accept="image/*" className="hidden" onChange={onCoverChange} />
                  </label>
                )}
              </div>
            </div>
            <div>
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Title</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120}
                placeholder="Residential villa — exterior render" className="mt-1.5 rounded-xl" />
            </div>
            <div>
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Description</Label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} maxLength={1000}
                placeholder="Software used, what you did, the result…" rows={3} className="mt-1.5 rounded-xl" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">Category</Label>
                <select value={category} onChange={(e) => setCategory(e.target.value)}
                  className="mt-1.5 w-full h-10 rounded-xl border border-border/60 bg-background px-3 text-sm">
                  <option value="">—</option>
                  {STUDIO_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">External link</Label>
                <Input value={externalLink} onChange={(e) => setExternalLink(e.target.value)}
                  placeholder="https://" className="mt-1.5 rounded-xl" />
              </div>
            </div>
            <div>
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Skills</Label>
              <div className="flex flex-wrap gap-1.5 mt-2 mb-2">
                {skills.map(s => (
                  <Badge key={s} variant="secondary" className="rounded-full gap-1">
                    {s}<button onClick={() => setSkills(skills.filter(x => x !== s))}><X className="h-3 w-3" /></button>
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Input list="portfolio-skills" value={skillInput} onChange={(e) => setSkillInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSkill(skillInput); } }}
                  placeholder="Type a skill" className="rounded-xl h-10" />
                <datalist id="portfolio-skills">{STUDIO_SKILLS.map(s => <option key={s} value={s} />)}</datalist>
                <Button type="button" variant="outline" size="icon" onClick={() => addSkill(skillInput)} className="rounded-xl h-10 w-10"><Plus className="h-4 w-4" /></Button>
              </div>
            </div>
          </div>
          <DialogFooter className="mt-2">
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving} className="rounded-full bg-foreground text-background hover:bg-foreground/90">
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editing ? 'Save changes' : 'Add to portfolio'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
