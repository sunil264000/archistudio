import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { StudioHubLayout } from '@/components/studio-hub/StudioHubLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, ShieldCheck, Sparkles, Compass, Layers, PenTool, Box, Clock, Users, Star } from 'lucide-react';
import { SEOHead } from '@/components/seo/SEOHead';
import { LiveActivityTicker } from '@/components/ui/LiveActivityTicker';
import { VerifiedBadge } from '@/components/ui/VerifiedBadge';
import { StudioPulse } from '@/components/studio-hub/StudioPulse';
import { Card, CardContent } from '@/components/ui/card';
import { useStudioProjects, useTopMembers, formatBudget, STUDIO_CATEGORIES } from '@/hooks/useStudioHub';
import { formatDistanceToNow } from 'date-fns';

const fade = { hidden: { opacity: 0, y: 18 }, visible: (i: number) => ({ opacity: 1, y: 0, transition: { duration: 0.6, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] as any } }) };

const services = [
  { icon: PenTool, title: 'Execution drawings', desc: 'Precise CAD plans, sections & site details', color: 'text-amber-500 bg-amber-500/10' },
  { icon: Box, title: 'High-end viz', desc: 'Unreal, Lumion, V-Ray & Enscape', color: 'text-blue-500 bg-blue-500/10' },
  { icon: Layers, title: 'Thesis Support', desc: 'Jury-ready sheets and concept mentorship', color: 'text-purple-500 bg-purple-500/10' },
  { icon: Compass, title: 'Master planning', desc: 'Urban design and landscape coordination', color: 'text-emerald-500 bg-emerald-500/10' },
];

const steps = [
  { n: '01', t: 'Brief your project', d: 'Post your requirements. Verified members submit competitive proposals within hours.' },
  { n: '02', t: 'Studio-grade Escrow', d: 'Your payment is secured by Archistudio. We only release funds once the work is flawless.' },
  { n: '03', t: 'Quality Review', d: 'Every deliverable is vetted by our experts before you see it, ensuring office-ready quality.' },
];

export default function StudioHubHome() {
  const { projects, loading } = useStudioProjects();
  const { members } = useTopMembers(6);

  return (
    <StudioHubLayout>
      <LiveActivityTicker />
      <SEOHead
        title="Studio Hub — Professional Architecture Marketplace"
        description="The safest way to hire architecture talent. Verified members, protected payments, and expert-reviewed deliverables."
        url="https://archistudio.shop/studio-hub"
      />

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border/30 bg-background/50">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_70%_at_50%_0%,hsl(var(--accent)/0.08),transparent_80%)] pointer-events-none" />
        <div className="absolute inset-0 dot-grid opacity-[0.08] pointer-events-none" />
        <div className="container-wide relative py-20 md:py-32">
          <div className="grid lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-7">
              <motion.div initial="hidden" animate="visible" custom={0} variants={fade}
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent/10 border border-accent/20 text-[10px] font-black tracking-[0.2em] uppercase text-accent mb-8">
                <div className="h-2 w-2 rounded-full bg-accent animate-pulse" />
                Live Marketplace · 84+ Open Briefs
              </motion.div>
              
              <motion.h1 initial="hidden" animate="visible" custom={1} variants={fade}
                className="font-display text-5xl md:text-8xl font-black tracking-tighter leading-[0.85] mb-8">
                The Future of 
                <span className="block text-hero-gradient pb-2 mt-2">Architecture.</span>
              </motion.h1>

              <motion.p initial="hidden" animate="visible" custom={2} variants={fade}
                className="text-lg md:text-2xl text-muted-foreground/80 max-w-2xl leading-relaxed mb-12 font-medium">
                Connect with vetted studio talent. From thesis mentorship to execution drawings, get office-ready quality with total escrow protection.
              </motion.p>

              <motion.div initial="hidden" animate="visible" custom={3} variants={fade}
                className="flex flex-col sm:flex-row gap-5">
                <Link to="/studio-hub/projects">
                  <Button size="xl" className="h-16 rounded-[24px] bg-foreground text-background hover:bg-foreground/90 px-12 text-lg font-black shadow-[0_20px_50px_rgba(0,0,0,0.2)] group">
                    Explore Briefs
                    <ArrowRight className="h-5 w-5 ml-2 transition-transform group-hover:translate-x-1" />
                  </Button>
                </Link>
                <Link to="/studio-hub/post">
                  <Button size="xl" variant="outline" className="h-16 rounded-[24px] px-12 text-lg font-bold border-border/60 backdrop-blur-sm hover:bg-muted/50 transition-all">
                    Post a Project
                  </Button>
                </Link>
              </motion.div>
              
              <motion.div initial="hidden" animate="visible" custom={4} variants={fade}
                className="flex flex-wrap gap-8 mt-16 border-t border-border/20 pt-8">
                {[
                  { l: 'Escrow Protected', v: '100% Secure' },
                  { l: 'File Quality', v: 'Expert Review' },
                  { l: 'Avg. Turnaround', v: '24 Hours' }
                ].map(stat => (
                  <div key={stat.l}>
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50 mb-1">{stat.l}</p>
                    <p className="text-sm font-black tracking-tight">{stat.v}</p>
                  </div>
                ))}
              </motion.div>
            </div>

            <motion.div 
              initial={{ opacity: 0, scale: 0.9, rotate: 2 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
              className="lg:col-span-5 relative"
            >
              <div className="absolute inset-0 bg-accent/20 blur-[120px] rounded-full opacity-30 animate-pulse" />
              <div className="relative p-1 rounded-[40px] bg-gradient-to-br from-border/40 via-transparent to-border/40">
                <Card className="rounded-[38px] border-none bg-card/60 backdrop-blur-3xl shadow-2xl overflow-hidden">
                  <CardContent className="p-8">
                    <div className="flex items-center justify-between mb-8">
                      <h3 className="text-xl font-black tracking-tight">Studio Pulse</h3>
                      <div className="flex gap-1">
                        <div className="h-1.5 w-4 rounded-full bg-accent" />
                        <div className="h-1.5 w-1.5 rounded-full bg-muted" />
                      </div>
                    </div>
                    <StudioPulse />
                  </CardContent>
                </Card>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Bento Services */}
      <section className="container-wide py-24 md:py-32">
        <div className="grid lg:grid-cols-3 gap-6">
          <motion.div 
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="lg:col-span-2 card-premium p-12 bg-gradient-to-br from-muted/50 to-background flex flex-col justify-between group overflow-hidden relative"
          >
            <div className="absolute top-0 right-0 p-12 opacity-5 scale-150 -rotate-12 transition-transform group-hover:scale-175 group-hover:-rotate-6 duration-1000">
              <Compass className="h-64 w-64" />
            </div>
            <div className="relative z-10 max-w-lg">
              <Badge className="bg-success/10 text-success border-none mb-6 px-4 py-1.5 rounded-full uppercase tracking-widest font-black text-[10px]">Premium Execution</Badge>
              <h2 className="text-4xl md:text-6xl font-black tracking-tighter leading-[0.95] mb-8">Office-Grade <span className="text-success">Deliverables.</span></h2>
              <p className="text-xl text-muted-foreground/80 font-medium leading-relaxed mb-10">We bridge the gap between freelance speed and studio quality. Every file is checked by Archi-leads before delivery.</p>
              <Button variant="outline" className="rounded-full px-8 h-12 font-bold group-hover:bg-foreground group-hover:text-background transition-all">Learn About Quality Shield</Button>
            </div>
          </motion.div>
          
          <div className="space-y-6">
            {services.slice(0, 2).map((s, i) => (
              <motion.div key={s.title}
                initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="card-premium p-8 h-[calc(50%-12px)] flex flex-col justify-between group"
              >
                <div className={`h-12 w-12 rounded-[18px] ${s.color} flex items-center justify-center transition-transform group-hover:scale-110 group-hover:rotate-6`}>
                  <s.icon className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-2 group-hover:text-accent transition-colors tracking-tight">{s.title}</h3>
                  <p className="text-sm text-muted-foreground font-medium">{s.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Live Active Briefs */}
      <section className="container-wide py-24 md:py-32 border-t border-border/20">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-8 mb-16">
          <div className="max-w-xl">
            <div className="flex items-center gap-2 mb-4">
              <div className="h-2 w-2 rounded-full bg-success animate-ping" />
              <p className="text-[10px] font-black tracking-[0.2em] text-muted-foreground uppercase">Live Opportunities</p>
            </div>
            <h2 className="font-display text-4xl md:text-6xl font-black tracking-tighter leading-none mb-6">Recent <span className="italic font-medium text-accent">Briefs.</span></h2>
            <p className="text-lg text-muted-foreground font-medium">Verified projects from the last 24 hours.</p>
          </div>
          <Link to="/studio-hub/projects">
            <Button size="lg" variant="ghost" className="rounded-full px-8 gap-2 text-accent font-black hover:bg-accent/10">
              View All Projects <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>

        <div className="grid gap-4">
          {loading ? (
            <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="h-32 bg-muted/40 rounded-[24px] animate-pulse" />)}</div>
          ) : (
            <motion.div 
              initial="hidden" whileInView="visible" viewport={{ once: true }}
              variants={{ visible: { transition: { staggerChildren: 0.08 } } }}
              className="space-y-4"
            >
              {projects.slice(0, 5).map((p) => (
                <motion.div key={p.id} variants={fade}>
                  <Link to={`/studio-hub/projects/${p.id}`}
                    className="flex flex-col md:flex-row items-center gap-6 p-6 rounded-[28px] bg-card/40 border border-border/40 hover:bg-card/80 hover:border-accent/30 hover:shadow-[0_20px_40px_rgba(0,0,0,0.05)] transition-all duration-500 group overflow-hidden relative"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-accent/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="flex-1 min-w-0 relative z-10 w-full md:w-auto">
                      <div className="flex items-center gap-3 mb-2">
                        <Badge variant="outline" className="text-[9px] font-black uppercase tracking-widest bg-muted/40 border-none px-3 py-1">{p.category}</Badge>
                        <span className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-tighter">
                          Posted {formatDistanceToNow(new Date(p.created_at), { addSuffix: true })}
                        </span>
                      </div>
                      <h3 className="text-xl font-bold mb-1.5 line-clamp-1 group-hover:text-accent transition-colors tracking-tight leading-tight">{p.title}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-1 font-medium">{p.description}</p>
                    </div>
                    
                    <div className="flex items-center gap-8 relative z-10 shrink-0 w-full md:w-auto justify-between md:justify-end">
                      <div className="flex flex-col items-end">
                        <span className="text-2xl font-black text-foreground tracking-tighter">{formatBudget(p)}</span>
                        <span className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-widest">{p.budget_type}</span>
                      </div>
                      <div className="h-12 w-12 rounded-full bg-accent/5 flex items-center justify-center group-hover:bg-accent group-hover:text-white transition-all duration-500 -rotate-45 group-hover:rotate-0">
                        <ArrowRight className="h-6 w-6" />
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </section>

      {/* Members */}
      {members.length > 0 && (
        <section className="container-wide pb-24">
          <div className="flex items-end justify-between mb-12">
            <div>
              <p className="text-[11px] tracking-[0.2em] text-muted-foreground font-bold uppercase mb-4">The Talent</p>
              <h2 className="font-display text-4xl font-bold tracking-tight">Elite Members.</h2>
            </div>
            <Link to="/studio-hub/members" className="hidden md:inline-flex items-center gap-2 text-sm font-bold text-accent hover:underline underline-offset-8 transition-all">
              View all talent <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-6">
            {members.map((m) => (
              <Link key={m.id} to={`/studio-hub/members/${m.user_id}`} className="group">
                <div className="aspect-square rounded-3xl bg-muted/60 mb-4 overflow-hidden card-premium relative">
                  {m.avatar_url ? (
                    <img 
                      src={m.avatar_url} 
                      alt={m.display_name || 'Member'} 
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                      loading="lazy"
                      decoding="async"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-3xl font-display font-bold text-muted-foreground bg-gradient-to-br from-accent/5 to-blueprint/5">
                      {(m.display_name || '?').slice(0, 1)}
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <div className="flex items-center gap-1.5 mt-1">
                  <p className="text-[15px] font-bold line-clamp-1 group-hover:text-accent transition-colors tracking-tight">{m.display_name || 'Anonymous'}</p>
                  <VerifiedBadge size="sm" />
                </div>
                <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest line-clamp-1 mt-0.5">{m.headline || `${m.experience_level} member`}</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Trust strip */}
      <section className="border-t border-border/30 bg-muted/20">
        <div className="container-wide py-16 grid grid-cols-1 md:grid-cols-3 gap-12 text-sm">
          {[
            { icon: ShieldCheck, title: 'Studio-Protected Escrow', desc: 'Your payment is held securely by Archistudio until the final deliverable is approved. Absolute safety.' },
            { icon: Sparkles, title: 'Expert-Reviewed Work', desc: 'Our architectural leads vet every file before it reaches you. We raise the bar on quality standards.' },
            { icon: Compass, title: 'Architectural Heritage', desc: 'Built by architects, for architects. We understand your language, your deadlines, and your details.' },
          ].map((item) => (
            <div key={item.title} className="group">
              <div className="p-3 rounded-2xl bg-accent/8 text-accent w-fit mb-5 transition-transform group-hover:scale-110">
                <item.icon className="h-5 w-5" />
              </div>
              <p className="font-display text-lg font-bold mb-2 tracking-tight">{item.title}</p>
              <p className="text-muted-foreground leading-relaxed text-sm font-medium">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </StudioHubLayout>
  );
}
