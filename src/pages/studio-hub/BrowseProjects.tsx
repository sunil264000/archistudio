import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { StudioHubLayout } from '@/components/studio-hub/StudioHubLayout';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { SEOHead } from '@/components/seo/SEOHead';
import { useStudioProjects, STUDIO_CATEGORIES, formatBudget } from '@/hooks/useStudioHub';
import { Search, Calendar, Users } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function BrowseProjects() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const category = searchParams.get('category') || '';

  const filters = useMemo(() => ({
    category: category || undefined,
    search: search || undefined,
  }), [category, search]);

  const { projects, loading } = useStudioProjects(filters);

  const setCategory = (v: string) => {
    if (v === 'all') searchParams.delete('category');
    else searchParams.set('category', v);
    setSearchParams(searchParams);
  };

  return (
    <StudioHubLayout>
      <SEOHead title="Open architecture projects — Studio Hub" description="Browse open architecture freelance projects from students who need help." url="https://archistudio.shop/studio-hub/projects" />
      <div className="container-wide py-12 md:py-16">
        <div className="max-w-2xl mb-10">
          <p className="text-[11px] tracking-[0.18em] text-muted-foreground/70 uppercase mb-3">Open projects</p>
          <h1 className="font-display text-3xl md:text-4xl font-semibold tracking-tight">Find your next brief.</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[1fr_220px] gap-3 mb-8">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by title…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 h-11 rounded-xl border-border/60"
            />
          </div>
          <Select value={category || 'all'} onValueChange={setCategory}>
            <SelectTrigger className="h-11 rounded-xl border-border/60"><SelectValue placeholder="All categories" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {STUDIO_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="space-y-2">{[1,2,3,4].map(i => <div key={i} className="h-24 rounded-xl bg-muted/40 animate-pulse" />)}</div>
        ) : projects.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-muted-foreground mb-4">No projects found.</p>
            <Link to="/studio-hub/post"><Button>Post a project</Button></Link>
          </div>
        ) : (
          <div className="divide-y divide-border/40 border-y border-border/40">
            {projects.map((p) => (
              <Link key={p.id} to={`/studio-hub/projects/${p.id}`} className="block py-6 px-3 -mx-3 rounded-xl hover:bg-muted/30 transition-colors">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3 mb-2.5">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <Badge variant="outline" className="text-[10px] tracking-wider uppercase font-normal border-border/60">{p.category}</Badge>
                      <span className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(p.created_at), { addSuffix: true })}</span>
                    </div>
                    <h3 className="font-display text-lg font-medium mb-1.5 line-clamp-1">{p.title}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">{p.description}</p>
                  </div>
                  <div className="text-left md:text-right shrink-0">
                    <div className="font-display font-semibold text-lg">{formatBudget(p)}</div>
                    <div className="text-xs text-muted-foreground capitalize">{p.budget_type}</div>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-3">
                  {p.skills_required.slice(0, 5).map((s) => (
                    <span key={s} className="text-xs text-muted-foreground">{s}</span>
                  ))}
                  <div className="flex-1" />
                  <span className="flex items-center gap-1 text-xs text-muted-foreground"><Users className="h-3 w-3" />{p.proposals_count}</span>
                  {p.deadline && <span className="flex items-center gap-1 text-xs text-muted-foreground"><Calendar className="h-3 w-3" />{new Date(p.deadline).toLocaleDateString()}</span>}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </StudioHubLayout>
  );
}
