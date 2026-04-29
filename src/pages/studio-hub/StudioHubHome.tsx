import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { StudioHubLayout } from '@/components/studio-hub/StudioHubLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, ShieldCheck, Sparkles, Compass, Layers, PenTool, Box, Clock, Users, Star } from 'lucide-react';
import { SEOHead } from '@/components/seo/SEOHead';
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
      <SEOHead
        title="Studio Hub — Professional Architecture Marketplace"
        description="The safest way to hire architecture talent. Verified members, protected payments, and expert-reviewed deliverables."
        url="https://archistudio.shop/studio-hub"
      />

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border/30">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_60%_at_50%_0%,hsl(var(--accent)/0.06),transparent_70%)] pointer-events-none" />
        <div className="absolute inset-0 dot-grid opacity-15 pointer-events-none" />
        <div className="container-wide relative py-20 md:py-28">
          <div className="max-w-3xl mx-auto text-center">
            <motion.div initial="hidden" animate="visible" custom={0} variants={fade}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-muted/60 border border-border/40 text-[11px] font-medium tracking-[0.12em] uppercase text-muted-foreground mb-7">
              <Sparkles className="h-3 w-3 text-accent" />
              Elite Marketplace · by Archistudio
            </motion.div>

            <motion.h1 initial="hidden" animate="visible" custom={1} variants={fade}
              className="font-display text-4xl sm:text-5xl md:text-7xl font-bold tracking-tight leading-[1] mb-6">
              Collaborate. Create.
              <br />
              <span className="italic text-muted-foreground/70 font-medium">Construct.</span>
            </motion.h1>

            <motion.p initial="hidden" animate="visible" custom={2} variants={fade}
              className="text-base md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              The professional ecosystem where quality meets security. Hire vetted architectural talent with a studio-protected workflow.
            </motion.p>

            <motion.div initial="hidden" animate="visible" custom={3} variants={fade}
              className="flex flex-col sm:flex-row gap-4 justify-center mt-12">
              <Link to="/studio-hub/post">
                <Button size="xl" className="bg-foreground text-background hover:bg-foreground/90 gap-2 rounded-full px-10 shadow-2xl font-bold">
                  Hire Talent <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link to="/studio-hub/become-member">
                <Button size="xl" variant="outline" className="rounded-full px-10 text-muted-foreground hover:text-foreground border-border/60 font-medium">
                  Join as a Member
                </Button>
              </Link>
            </motion.div>

            <motion.div initial="hidden" animate="visible" custom={4} variants={fade}
              className="flex flex-wrap items-center justify-center gap-6 mt-10">
              {['Studio-grade Escrow', 'Expert File Review', 'Secure Deliverables'].map(item => (
                <span key={item} className="trust-badge text-[11px] font-bold uppercase tracking-wider">
                  <ShieldCheck className="h-3.5 w-3.5 text-accent" />
                  {item}
                </span>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Services */}
      <section className="container-wide py-24">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6 }} className="max-w-2xl mb-16">
          <p className="text-[11px] tracking-[0.2em] text-muted-foreground font-bold uppercase mb-4">Our Expertise</p>
          <h2 className="font-display text-4xl md:text-5xl font-bold tracking-tight">High-End Architectural Services.</h2>
        </motion.div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {services.map((s, i) => (
            <motion.div key={s.title}
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.5, delay: i * 0.06 }}
              className="card-premium p-8 group cursor-default"
            >
              <div className={`p-3 rounded-2xl ${s.color} w-fit mb-6 transition-transform group-hover:scale-110 group-hover:-rotate-6`}>
                <s.icon className="h-6 w-6" />
              </div>
              <h3 className="font-display text-lg font-bold mb-2 group-hover:text-accent transition-colors">{s.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* How it works — Timeline */}
      <section className="bg-muted/30 border-y border-border/30 py-24">
        <div className="container-wide">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.6 }} className="max-w-2xl mb-16">
            <p className="text-[11px] tracking-[0.2em] text-muted-foreground font-bold uppercase mb-4">The Workflow</p>
            <h2 className="font-display text-4xl md:text-5xl font-bold tracking-tight">Built for Absolute Security.</h2>
          </motion.div>
          <div className="max-w-3xl space-y-12">
            {steps.map((s, i) => (
              <motion.div key={s.n}
                initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, margin: '-50px' }}
                transition={{ duration: 0.6, delay: i * 0.1 }}
                className="timeline-step"
              >
                <div className="timeline-dot bg-foreground text-background font-bold">{s.n}</div>
                <h3 className="font-display text-2xl font-bold mb-3">{s.t}</h3>
                <p className="text-base text-muted-foreground leading-relaxed max-w-xl">{s.d}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Subscription CTA */}
      <section className="container-wide py-16">
        <div className="relative rounded-[48px] overflow-hidden bg-foreground text-background p-10 md:p-20">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,hsl(var(--accent)/0.25),transparent_60%)]" />
          <div className="absolute inset-0 opacity-10 dot-grid" />
          
          <div className="relative z-10 max-w-2xl">
            <Badge className="bg-accent text-accent-foreground border-none mb-8 rounded-full px-5 py-1.5 text-[11px] uppercase tracking-widest font-black animate-pulse">
              Upgrade to Studio Pro
            </Badge>
            <h2 className="font-display text-4xl md:text-6xl font-bold tracking-tight mb-8 leading-[1.05]">
              Get the <span className="text-accent italic font-medium">Pro Advantage.</span>
            </h2>
            <p className="text-background/70 text-lg md:text-xl mb-10 leading-relaxed font-medium">
              Maximize your earnings. Unlock 0% platform fees, priority bid placement, and the elite "Verified Pro" badge. 
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-12">
              {[
                '0% Fees on all projects',
                'Priority bid pinning',
                'Exclusive High-Budget jobs',
                'Unlimited portfolio templates'
              ].map((benefit) => (
                <div key={benefit} className="flex items-center gap-3">
                  <div className="h-6 w-6 rounded-full bg-accent/20 flex items-center justify-center shrink-0">
                    <Star className="h-3.5 w-3.5 text-accent fill-accent" />
                  </div>
                  <span className="text-sm font-bold tracking-tight">{benefit}</span>
                </div>
              ))}
            </div>

            <Link to="/studio-hub/pricing">
              <Button size="xl" className="bg-accent text-accent-foreground hover:bg-accent/90 rounded-full px-12 h-16 font-black text-xl shadow-2xl shadow-accent/40 group">
                Go Pro Today
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
          </div>

          <div className="absolute right-[-5%] top-1/2 -translate-y-1/2 w-[45%] h-[130%] hidden lg:block opacity-15">
            <div className="w-full h-full border-[80px] border-accent rounded-full blur-[60px]" />
          </div>
        </div>
      </section>

      {/* Live projects */}
      <section className="container-wide py-24">
        <div className="flex items-end justify-between mb-12">
          <div>
            <p className="text-[11px] tracking-[0.2em] text-muted-foreground font-bold uppercase mb-4">Opportunities</p>
            <h2 className="font-display text-4xl font-bold tracking-tight">Active Project Briefs.</h2>
          </div>
          <Link to="/studio-hub/projects" className="hidden md:inline-flex items-center gap-2 text-sm font-bold text-accent hover:underline underline-offset-8 transition-all">
            Browse all projects <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {loading ? (
          <div className="grid gap-4">{[1, 2, 3].map((i) => <div key={i} className="h-28 bg-muted/40 rounded-2xl animate-pulse" />)}</div>
        ) : projects.length === 0 ? (
          <div className="text-center py-20 card-premium rounded-3xl">
            <p className="text-base text-muted-foreground font-medium">No open projects yet. Be the first to <Link to="/studio-hub/post" className="text-accent underline underline-offset-8 font-bold">post a brief</Link>.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {projects.slice(0, 6).map((p) => (
              <Link key={p.id} to={`/studio-hub/projects/${p.id}`}
                className="grid grid-cols-12 gap-6 py-6 px-6 -mx-2 rounded-2xl hover:bg-muted/40 transition-all duration-300 border border-transparent hover:border-border/40 group relative overflow-hidden"
              >
                <div className="col-span-12 md:col-span-7">
                  <h3 className="text-lg font-bold mb-1.5 line-clamp-1 group-hover:text-accent transition-colors tracking-tight">{p.title}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-1 leading-relaxed">{p.description}</p>
                </div>
                <div className="col-span-6 md:col-span-2 self-center">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground bg-muted/60 px-3 py-1.5 rounded-lg">{p.category}</span>
                </div>
                <div className="col-span-3 md:col-span-2 text-lg font-black self-center text-accent">{formatBudget(p)}</div>
                <div className="col-span-3 md:col-span-1 text-[11px] font-bold text-muted-foreground/60 self-center text-right flex items-center gap-1.5 justify-end uppercase tracking-tighter">
                  <Clock className="h-3 w-3" />
                  {formatDistanceToNow(new Date(p.created_at), { addSuffix: false })}
                </div>
              </Link>
            ))}
          </div>
        )}
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
                <p className="text-[15px] font-bold line-clamp-1 group-hover:text-accent transition-colors tracking-tight">{m.display_name || 'Anonymous'}</p>
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
