import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { StudioHubLayout } from '@/components/studio-hub/StudioHubLayout';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { SEOHead } from '@/components/seo/SEOHead';
import { useStudioProjects, STUDIO_CATEGORIES, formatBudget } from '@/hooks/useStudioHub';
import { Search, Calendar, Users, SlidersHorizontal, X, ArrowUpDown, Clock, AlertCircle } from 'lucide-react';
import { formatDistanceToNow, differenceInDays } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles } from 'lucide-react';

type SortOption = 'newest' | 'budget_high' | 'budget_low' | 'proposals';

type SortKey = 'newest' | 'budget_high' | 'budget_low' | 'most_proposals';

const PRO_TIPS = [
  "Including a video walkthrough increases hire chances by 35%.",
  "Clients in this category prefer Revit for technical drawings.",
  "Projects with clear deadlines usually have faster escrow releases.",
  "Adding a breakdown of tasks in your bid helps clients trust you.",
  "Mention if you can provide source files like .RVT or .DWG.",
  "Bidding within the first 2 hours increases your visibility by 2×."
];

export default function BrowseProjects() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const category = searchParams.get('category') || '';
  const sort = (searchParams.get('sort') as SortKey) || 'newest';
  const [budgetMin, setBudgetMin] = useState('');
  const [budgetMax, setBudgetMax] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [showFilters, setShowFilters] = useState(false);

  const filters = useMemo(() => ({
    category: category || undefined,
    search: search || undefined,
    minBudget: budgetMin ? parseFloat(budgetMin) : undefined,
    maxBudget: budgetMax ? parseFloat(budgetMax) : undefined,
  }), [category, search, budgetMin, budgetMax]);

  const { projects: rawProjects, loading } = useStudioProjects(filters);

  const projects = useMemo(() => {
    const arr = [...rawProjects];
    if (sort === 'budget_high') arr.sort((a, b) => Number(b.budget_max || b.budget_min || 0) - Number(a.budget_max || a.budget_min || 0));
    if (sort === 'budget_low') arr.sort((a, b) => Number(a.budget_min || a.budget_max || 0) - Number(b.budget_min || b.budget_max || 0));
    if (sort === 'most_proposals') arr.sort((a, b) => b.proposals_count - a.proposals_count);
    return arr;
  }, [rawProjects, sort]);

  const setSort = (v: string) => {
    if (v === 'newest') searchParams.delete('sort'); else searchParams.set('sort', v);
    setSearchParams(searchParams);
  };

  // Client-side sort (backend returns newest first by default)
  const sortedProjects = useMemo(() => {
    const sorted = [...projects];
    switch (sortBy) {
      case 'budget_high':
        return sorted.sort((a, b) => (b.budget_max || b.budget_min || 0) - (a.budget_max || a.budget_min || 0));
      case 'budget_low':
        return sorted.sort((a, b) => (a.budget_min || 0) - (b.budget_min || 0));
      case 'proposals':
        return sorted.sort((a, b) => b.proposals_count - a.proposals_count);
      default:
        return sorted;
    }
  }, [projects, sortBy]);

  const setCategory = (v: string) => {
    if (v === 'all') searchParams.delete('category');
    else searchParams.set('category', v);
    setSearchParams(searchParams);
  };

  const hasActiveFilters = !!category || !!budgetMin || !!budgetMax;

  const clearFilters = () => {
    searchParams.delete('category');
    setSearchParams(searchParams);
    setBudgetMin('');
    setBudgetMax('');
    setSearch('');
  };

  const isUrgent = (deadline: string | null) => {
    if (!deadline) return false;
    return differenceInDays(new Date(deadline), new Date()) <= 7;
  };

  return (
    <StudioHubLayout>
      <SEOHead title="Open architecture projects — Studio Hub" description="Browse open architecture freelance projects from students who need help." url="https://archistudio.shop/studio-hub/projects" />
      <div className="container-wide py-12 md:py-16 relative">
        <div className="absolute inset-0 dot-grid opacity-[0.06] pointer-events-none" />
        {/* Header */}
        <div className="relative flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8">
          <div>
            <p className="text-[11px] tracking-[0.18em] text-muted-foreground/70 uppercase mb-3">Open projects</p>
            <h1 className="font-display text-3xl md:text-4xl font-semibold tracking-tight">Find your <span className="text-hero-gradient">next brief.</span></h1>
          </div>
          {!loading && (
            <p className="text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">{sortedProjects.length}</span> project{sortedProjects.length !== 1 ? 's' : ''} found
            </p>
          )}
        </div>

        {/* Search + Filter bar */}
        <div className="relative grid grid-cols-1 md:grid-cols-[1fr_180px_180px_auto] gap-3 mb-4">
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
          <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
            <SelectTrigger className="h-11 rounded-xl border-border/60">
              <ArrowUpDown className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest first</SelectItem>
              <SelectItem value="budget_high">Budget: High → Low</SelectItem>
              <SelectItem value="budget_low">Budget: Low → High</SelectItem>
              <SelectItem value="proposals">Most proposals</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant={showFilters ? 'default' : 'outline'}
            onClick={() => setShowFilters(!showFilters)}
            className="h-11 rounded-xl gap-1.5"
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            Filters
            {hasActiveFilters && <span className="h-4 w-4 rounded-full bg-accent text-accent-foreground text-[10px] flex items-center justify-center">!</span>}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mb-6">{loading ? 'Loading projects…' : `${projects.length} open project${projects.length === 1 ? '' : 's'}`}</p>

        {/* Expanded filters panel */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="overflow-hidden"
            >
              <div className="relative border border-border/40 rounded-2xl p-5 mb-6 bg-card/50">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Budget range */}
                  <div>
                    <label className="text-xs uppercase tracking-wider text-muted-foreground mb-1.5 block">Min Budget (₹)</label>
                    <Input
                      type="number" min="0" step="100"
                      value={budgetMin}
                      onChange={(e) => setBudgetMin(e.target.value)}
                      placeholder="500"
                      className="h-10 rounded-xl border-border/60"
                    />
                  </div>
                  <div>
                    <label className="text-xs uppercase tracking-wider text-muted-foreground mb-1.5 block">Max Budget (₹)</label>
                    <Input
                      type="number" min="0" step="100"
                      value={budgetMax}
                      onChange={(e) => setBudgetMax(e.target.value)}
                      placeholder="50000"
                      className="h-10 rounded-xl border-border/60"
                    />
                  </div>
                  <div className="sm:col-span-2 flex items-end">
                    {hasActiveFilters && (
                      <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1.5 text-muted-foreground hover:text-foreground">
                        <X className="h-3.5 w-3.5" /> Clear all filters
                      </Button>
                    )}
                  </div>
                </div>

                {/* Category pills */}
                <div className="mt-4 pt-4 border-t border-border/30">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Quick category</p>
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      onClick={() => setCategory('all')}
                      className={`px-3 py-1.5 rounded-full text-xs transition-all ${
                        !category ? 'bg-foreground text-background' : 'border border-border/60 text-muted-foreground hover:border-foreground/40 hover:text-foreground'
                      }`}
                    >
                      All
                    </button>
                    {STUDIO_CATEGORIES.map((c) => (
                      <button
                        key={c}
                        onClick={() => setCategory(c)}
                        className={`px-3 py-1.5 rounded-full text-xs transition-all ${
                          category === c ? 'bg-foreground text-background' : 'border border-border/60 text-muted-foreground hover:border-foreground/40 hover:text-foreground'
                        }`}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Results */}
        {loading ? (
          <div className="space-y-2">{[1,2,3,4].map(i => <div key={i} className="h-28 rounded-xl bg-muted/40 animate-pulse" />)}</div>
        ) : sortedProjects.length === 0 ? (
          <div className="text-center py-20 card-premium rounded-2xl">
            <Search className="h-8 w-8 mx-auto text-muted-foreground/40 mb-3" />
            <p className="text-muted-foreground mb-2">No projects match your filters.</p>
            {hasActiveFilters && (
              <Button variant="outline" size="sm" onClick={clearFilters} className="rounded-full mt-2">Clear filters</Button>
            )}
            <p className="text-sm text-muted-foreground mt-4">
              Or <Link to="/studio-hub/post" className="text-accent font-medium hover:underline">post your own project</Link>
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border/40 border-y border-border/40">
            {sortedProjects.map((p) => (
              <Link key={p.id} to={`/studio-hub/projects/${p.id}`} className="block py-6 px-4 -mx-3 rounded-xl hover:bg-muted/30 transition-all duration-300 group">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3 mb-2.5">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <Badge variant="outline" className="text-[10px] tracking-wider uppercase font-normal border-border/60">{p.category}</Badge>
                      <span className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(p.created_at), { addSuffix: true })}</span>
                      {p.deadline && isUrgent(p.deadline) && (
                        <span className="flex items-center gap-1 text-[10px] text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full font-medium">
                          <AlertCircle className="h-3 w-3" /> Urgent
                        </span>
                      )}
                    </div>
                    <h3 className="font-display text-lg font-medium mb-1.5 line-clamp-1 group-hover:text-accent transition-colors">{p.title}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">{p.description}</p>
                  </div>
                  <div className="text-left md:text-right shrink-0">
                    <div className="font-display font-semibold text-lg">{formatBudget(p)}</div>
                    <div className="text-xs text-muted-foreground capitalize">{p.budget_type} price</div>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t border-border/10">
                  {p.skills_required.slice(0, 5).map((s) => (
                    <span key={s} className="text-[11px] text-muted-foreground bg-muted/40 px-2.5 py-0.5 rounded-full">{s}</span>
                  ))}
                  {p.skills_required.length > 5 && (
                    <span className="text-xs text-muted-foreground">+{p.skills_required.length - 5}</span>
                  )}
                  <div className="flex-1" />
                  <span className="flex items-center gap-1.5 text-xs bg-accent/8 text-accent px-3 py-1 rounded-full font-medium">
                    <Users className="h-3 w-3" />{p.proposals_count} proposal{p.proposals_count !== 1 ? 's' : ''}
                  </span>
                </div>

                {/* Assistant Tip */}
                <div className="mt-3 flex items-center gap-2 text-[10px] text-muted-foreground/60 italic bg-accent/5 py-1.5 px-3 rounded-lg border border-accent/10">
                  <Sparkles className="h-2.5 w-2.5 text-accent" />
                  Archi Tip: {PRO_TIPS[p.id.length % PRO_TIPS.length]}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </StudioHubLayout>
  );
}
