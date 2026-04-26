import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { StudioHubLayout } from '@/components/studio-hub/StudioHubLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SEOHead } from '@/components/seo/SEOHead';
import { useAuth } from '@/contexts/AuthContext';
import { useMyContracts, useMyMemberProfile, useMyProjects, statusLabel, calculatePayout } from '@/hooks/useStudioHub';
import { Briefcase, PlusCircle, UserCog, Loader2, ArrowRight, Wallet, FileEdit } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

export default function MyStudio() {
  const { user } = useAuth();
  const { profile, loading: loadingProfile } = useMyMemberProfile();
  const { projects, loading: loadingProjects } = useMyProjects();
  const { contracts: clientContracts } = useMyContracts('client');
  const { contracts: workerContracts } = useMyContracts('worker');

  if (!user) {
    return (
      <StudioHubLayout>
        <div className="container-wide py-16 text-center">
          <h1 className="font-display text-2xl font-semibold mb-3">Please sign in</h1>
          <Link to="/auth?redirect=/studio-hub/me"><Button className="rounded-full">Sign in</Button></Link>
        </div>
      </StudioHubLayout>
    );
  }

  const totalEarnings = workerContracts
    .filter((c) => c.status === 'completed')
    .reduce((sum, c) => sum + Number(c.worker_payout), 0);

  const activeAsWorker = workerContracts.filter((c) => !['completed', 'cancelled', 'refunded'].includes(c.status)).length;

  return (
    <StudioHubLayout>
      <SEOHead title="My Studio — your dashboard" description="Manage your Studio Hub projects, proposals, and contracts." />
      <div className="container-wide py-10 md:py-14 max-w-5xl mx-auto px-4">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[11px] tracking-[0.18em] text-muted-foreground/70 uppercase mb-3">My Studio</p>
            <h1 className="font-display text-3xl md:text-4xl font-semibold tracking-tight">Your projects, proposals & earnings.</h1>
          </div>
          <div className="flex gap-2">
            <Link to="/studio-hub/post"><Button variant="outline" size="sm" className="rounded-full"><PlusCircle className="h-3.5 w-3.5 mr-1.5" />Post</Button></Link>
            <Link to="/studio-hub/become-member">
              <Button size="sm" className="rounded-full bg-foreground text-background hover:bg-foreground/90">
                <UserCog className="h-3.5 w-3.5 mr-1.5" />{profile ? 'Edit member profile' : 'Become a member'}
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-border/30 rounded-2xl overflow-hidden mb-10">
          <Stat label="Posted projects" value={projects.length} />
          <Stat label="Active contracts" value={clientContracts.filter(c => !['completed','cancelled','refunded'].includes(c.status)).length + activeAsWorker} />
          <Stat label="Earnings (₹)" value={totalEarnings.toLocaleString()} />
          <Stat label="Member rating" value={profile ? Number(profile.average_rating || 0).toFixed(1) : '—'} />
        </div>

        <Tabs defaultValue="client">
          <TabsList className="rounded-full bg-muted/40 p-1 mb-6">
            <TabsTrigger value="client" className="rounded-full px-5">As Client</TabsTrigger>
            <TabsTrigger value="member" className="rounded-full px-5">As Member</TabsTrigger>
          </TabsList>

          <TabsContent value="client">
            <Section title="Projects you posted" empty="No projects posted yet." emptyCta={{ to: '/studio-hub/post', label: 'Post your first project' }}>
              {loadingProjects ? <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /> : (
                <div className="divide-y divide-border/40 border-y border-border/40">
                  {projects.map((p) => (
                    <Link key={p.id} to={`/studio-hub/projects/${p.id}`} className="grid grid-cols-12 gap-3 py-4 px-2 -mx-2 rounded-lg hover:bg-muted/30 transition-colors">
                      <div className="col-span-12 md:col-span-7"><p className="font-medium line-clamp-1">{p.title}</p><p className="text-xs text-muted-foreground">{p.category}</p></div>
                      <div className="col-span-6 md:col-span-2 text-sm self-center"><Badge variant="outline" className="rounded-full text-[10px] capitalize">{p.status}</Badge></div>
                      <div className="col-span-3 md:col-span-2 text-sm self-center text-muted-foreground">{p.proposals_count} proposals</div>
                      <div className="col-span-3 md:col-span-1 text-xs text-muted-foreground self-center text-right">{formatDistanceToNow(new Date(p.created_at), { addSuffix: false })}</div>
                    </Link>
                  ))}
                </div>
              )}
            </Section>

            <Section title="Your contracts" empty="No active contracts.">
              <ContractList contracts={clientContracts} role="client" />
            </Section>
          </TabsContent>

          <TabsContent value="member">
            {!profile && !loadingProfile ? (
              <div className="border border-border/40 rounded-2xl p-10 text-center">
                <UserCog className="h-8 w-8 mx-auto text-muted-foreground mb-3" />
                <p className="font-medium mb-1.5">You're not a Studio Member yet</p>
                <p className="text-sm text-muted-foreground mb-5">Set up your profile to start sending proposals.</p>
                <Link to="/studio-hub/become-member"><Button className="rounded-full bg-foreground text-background hover:bg-foreground/90">Become a member</Button></Link>
              </div>
            ) : (
              <Section title="Your contracts as a member" empty="No active contracts yet — send some proposals.">
                <ContractList contracts={workerContracts} role="worker" />
              </Section>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </StudioHubLayout>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-background p-5">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5">{label}</p>
      <p className="font-display text-2xl font-semibold">{value}</p>
    </div>
  );
}

function Section({ title, children, empty, emptyCta }: { title: string; children: React.ReactNode; empty: string; emptyCta?: { to: string; label: string } }) {
  return (
    <div className="mb-8">
      <h2 className="font-display text-lg font-medium mb-4">{title}</h2>
      {children || (
        <div className="text-center py-10 border border-dashed border-border/40 rounded-xl">
          <p className="text-sm text-muted-foreground mb-3">{empty}</p>
          {emptyCta && <Link to={emptyCta.to}><Button variant="outline" size="sm" className="rounded-full">{emptyCta.label}</Button></Link>}
        </div>
      )}
    </div>
  );
}

function ContractList({ contracts, role }: { contracts: any[]; role: 'client' | 'worker' }) {
  if (contracts.length === 0) return null;
  return (
    <div className="divide-y divide-border/40 border-y border-border/40">
      {contracts.map((c) => (
        <Link key={c.id} to={`/studio-hub/contracts/${c.id}`} className="grid grid-cols-12 gap-3 py-4 px-2 -mx-2 rounded-lg hover:bg-muted/30 transition-colors">
          <div className="col-span-12 md:col-span-6">
            <p className="font-medium line-clamp-1">Contract #{c.id.slice(0, 8)}</p>
            <p className="text-xs text-muted-foreground">{role === 'client' ? `You pay ₹${Number(c.agreed_amount).toLocaleString()}` : `You earn ₹${Number(c.worker_payout).toLocaleString()}`}</p>
          </div>
          <div className="col-span-6 md:col-span-3 self-center"><Badge variant="outline" className="rounded-full text-[10px]">{statusLabel(c.status)}</Badge></div>
          <div className="col-span-6 md:col-span-3 text-xs text-muted-foreground self-center text-right">{c.due_date ? `Due ${new Date(c.due_date).toLocaleDateString()}` : '—'}</div>
        </Link>
      ))}
    </div>
  );
}
