import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { MarketplaceLayout } from '@/components/marketplace/MarketplaceLayout';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { SEOHead } from '@/components/seo/SEOHead';
import { useMarketplaceJobs, MARKETPLACE_CATEGORIES, formatBudget } from '@/hooks/useMarketplace';
import { Search, Calendar, Users, Briefcase } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function BrowseJobs() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const category = searchParams.get('category') || '';

  const filters = useMemo(
    () => ({
      category: category || undefined,
      search: search || undefined,
    }),
    [category, search]
  );

  const { jobs, loading } = useMarketplaceJobs(filters);

  const setCategory = (v: string) => {
    if (v === 'all') searchParams.delete('category');
    else searchParams.set('category', v);
    setSearchParams(searchParams);
  };

  return (
    <MarketplaceLayout>
      <SEOHead
        title="Browse Architecture Jobs — Archi Studio Marketplace"
        description="Find architecture freelance jobs: AutoCAD, 3D modelling, rendering, thesis help and more."
        url="https://archistudio.shop/marketplace/jobs"
      />
      <div className="container-wide py-8 md:py-12">
        <div className="mb-8">
          <h1 className="font-display text-3xl md:text-4xl font-bold mb-2">Open jobs</h1>
          <p className="text-muted-foreground">Find your next architecture project</p>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-[1fr_220px] gap-3 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search jobs by title…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={category || 'all'} onValueChange={setCategory}>
            <SelectTrigger>
              <SelectValue placeholder="All categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {MARKETPLACE_CATEGORIES.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Jobs */}
        {loading ? (
          <div className="grid gap-3">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="p-5 animate-pulse h-32" />
            ))}
          </div>
        ) : jobs.length === 0 ? (
          <Card className="p-12 text-center">
            <Briefcase className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <h3 className="font-semibold mb-1">No jobs found</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {category || search ? 'Try clearing your filters.' : 'Be the first to post a job!'}
            </p>
            <Link to="/marketplace/post-job">
              <Button>Post a job</Button>
            </Link>
          </Card>
        ) : (
          <div className="grid gap-3">
            {jobs.map((job) => (
              <Link key={job.id} to={`/marketplace/jobs/${job.id}`}>
                <Card className="p-5 hover:border-accent/50 transition-colors cursor-pointer">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-2">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-1 line-clamp-1">{job.title}</h3>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <Badge variant="outline" className="text-xs">{job.category}</Badge>
                        <span>•</span>
                        <span>Posted {formatDistanceToNow(new Date(job.created_at), { addSuffix: true })}</span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="font-semibold text-accent">{formatBudget(job)}</div>
                      <div className="text-xs text-muted-foreground capitalize">{job.budget_type}</div>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{job.description}</p>
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {job.skills_required.slice(0, 5).map((s) => (
                      <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>
                    ))}
                    {job.skills_required.length > 5 && (
                      <Badge variant="secondary" className="text-xs">+{job.skills_required.length - 5}</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {job.proposals_count} proposal{job.proposals_count === 1 ? '' : 's'}
                    </span>
                    {job.deadline && (
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Due {new Date(job.deadline).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </MarketplaceLayout>
  );
}
