import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { StudioHubLayout } from '@/components/studio-hub/StudioHubLayout';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { SEOHead } from '@/components/seo/SEOHead';
import { supabase } from '@/integrations/supabase/client';
import { Search, Star, MapPin, Loader2 } from 'lucide-react';
import type { MemberProfile } from '@/hooks/useStudioHub';

export default function MembersDirectory() {
  const [members, setMembers] = useState<MemberProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data } = await (supabase as any)
        .from('worker_profiles')
        .select('*')
        .eq('is_active', true)
        .order('average_rating', { ascending: false })
        .order('total_jobs_completed', { ascending: false })
        .limit(60);
      setMembers((data || []) as MemberProfile[]);
      setLoading(false);
    })();
  }, []);

  const filtered = members.filter((m) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      (m.display_name || '').toLowerCase().includes(q) ||
      (m.headline || '').toLowerCase().includes(q) ||
      (m.skills || []).some((s) => s.toLowerCase().includes(q))
    );
  });

  return (
    <StudioHubLayout>
      <SEOHead title="Studio Members — Future architects" description="Discover Studio Members — verified architecture students offering drafting, 3D, rendering and more." url="https://archistudio.shop/studio-hub/members" />
      <div className="container-wide py-12 md:py-16 relative">
        <div className="absolute inset-0 dot-grid opacity-[0.06] pointer-events-none" />
        <div className="max-w-2xl mb-10 relative">
          <p className="text-[11px] tracking-[0.18em] text-muted-foreground/70 uppercase mb-3">Studio Members</p>
          <h1 className="font-display text-3xl md:text-4xl font-semibold tracking-tight mb-3">Future architects, <span className="text-hero-gradient">verified.</span></h1>
          <p className="text-sm text-muted-foreground">Discover the people behind Studio Hub.</p>
        </div>

        <div className="relative max-w-md mb-10">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name, skill…" className="pl-10 h-11 rounded-xl border-border/60" />
        </div>

        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : filtered.length === 0 ? (
          <p className="text-center py-16 text-muted-foreground">No members yet.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-border/30 rounded-2xl overflow-hidden">
            {filtered.map((m) => (
              <Link key={m.id} to={`/studio-hub/members/${m.user_id}`} className="bg-background p-6 hover:bg-muted/30 transition-all duration-300 group">
                <div className="flex items-start gap-4">
                  <div className="h-14 w-14 rounded-full bg-muted/60 overflow-hidden border border-border/40 shrink-0">
                    {m.avatar_url ? (
                      <img src={m.avatar_url} alt={m.display_name || ''} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-lg font-display text-accent bg-accent/8">{(m.display_name || '?').slice(0, 1)}</div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate group-hover:text-accent transition-colors">{m.display_name || 'Anonymous'}</p>
                    <p className="text-sm text-muted-foreground line-clamp-1">{m.headline || `${m.experience_level} member`}</p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                      {m.average_rating > 0 && (
                        <span className="inline-flex items-center gap-1"><Star className="h-3 w-3 fill-amber-400 text-amber-400" />{Number(m.average_rating).toFixed(1)}</span>
                      )}
                      {m.location && <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" />{m.location}</span>}
                      <span className="capitalize">{m.experience_level}</span>
                    </div>
                  </div>
                </div>
                {m.skills.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-4">
                    {m.skills.slice(0, 4).map((s) => <Badge key={s} variant="secondary" className="text-[10px] rounded-full font-normal">{s}</Badge>)}
                    {m.skills.length > 4 && <span className="text-[10px] text-muted-foreground self-center">+{m.skills.length - 4}</span>}
                  </div>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
    </StudioHubLayout>
  );
}
