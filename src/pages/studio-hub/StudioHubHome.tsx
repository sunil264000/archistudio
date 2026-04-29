import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { StudioHubLayout } from '@/components/studio-hub/StudioHubLayout';
import { Button } from '@/components/ui/button';
import { ArrowRight, ShieldCheck, Sparkles, Compass, Layers, PenTool, Box, Clock, Users, Star } from 'lucide-react';
import { SEOHead } from '@/components/seo/SEOHead';
import { useStudioProjects, useTopMembers, formatBudget, STUDIO_CATEGORIES } from '@/hooks/useStudioHub';
import { formatDistanceToNow } from 'date-fns';

const fade = { hidden: { opacity: 0, y: 18 }, visible: (i: number) => ({ opacity: 1, y: 0, transition: { duration: 0.6, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] as any } }) };

const services = [
  { icon: PenTool, title: 'Working drawings', desc: 'CAD plans, sections & details', color: 'text-amber-500 bg-amber-500/10' },
  { icon: Box, title: '3D & rendering', desc: 'SketchUp, Revit, V-Ray, Lumion', color: 'text-blue-500 bg-blue-500/10' },
  { icon: Layers, title: 'Concept & thesis', desc: 'Sheets, presentations, mentorship', color: 'text-purple-500 bg-purple-500/10' },
  { icon: Compass, title: 'Site & landscape', desc: 'Master plans, urban studies', color: 'text-emerald-500 bg-emerald-500/10' },
];

const steps = [
  { n: '01', t: 'You brief, we match', d: 'Post your project. Members send proposals with timeline and price.' },
  { n: '02', t: 'Pay the studio', d: 'Funds rest with Archistudio while the work happens — never with the member directly.' },
  { n: '03', t: 'We review & release', d: 'When the deliverable is approved by our team, files reach you and the member is paid.' },
];

export default function StudioHubHome() {
  const { projects, loading } = useStudioProjects();
  const { members } = useTopMembers(6);

  return (
    <StudioHubLayout>
      {/* Build Trigger: Growth & Stability Update */}
      <SEOHead
        title="Studio Hub — Architecture freelance, by students"
        description="Hire architecture students for drafting, 3D, rendering and thesis help. Calm, safe, and run by Archistudio with admin-protected escrow."
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
              Studio Hub · by Archistudio
            </motion.div>

            <motion.h1 initial="hidden" animate="visible" custom={1} variants={fade}
              className="font-display text-4xl sm:text-5xl md:text-6xl font-semibold tracking-tight leading-[1.05] mb-6">
              A calmer way to get
              <br />
              <span className="italic text-muted-foreground/70">architecture work</span>
              <br />
              done together.
            </motion.h1>

            <motion.p initial="hidden" animate="visible" custom={2} variants={fade}
              className="text-base md:text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
              Bring a brief. We pair you with verified architecture students. The studio holds the payment, reviews the work, and only releases files when everything is right.
            </motion.p>

            <motion.div initial="hidden" animate="visible" custom={3} variants={fade}
              className="flex flex-col sm:flex-row gap-3 justify-center mt-10">
              <Link to="/studio-hub/post">
                <Button size="lg" className="bg-foreground text-background hover:bg-foreground/90 gap-2 rounded-full px-8 shadow-[0_4px_20px_hsl(var(--foreground)/0.15)]">
                  Post a project <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link to="/studio-hub/become-member">
                <Button size="lg" variant="outline" className="rounded-full px-8 text-muted-foreground hover:text-foreground border-border/50">
                  Join as a Studio Member
                </Button>
              </Link>
            </motion.div>

            <motion.div initial="hidden" animate="visible" custom={4} variants={fade}
              className="flex flex-wrap items-center justify-center gap-4 mt-8">
              {['Admin-protected escrow', '15% platform fee', 'Files released only after review'].map(item => (
                <span key={item} className="trust-badge text-[11px]">
                  <ShieldCheck className="h-3 w-3 text-accent" />
                  {item}
                </span>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Services */}
      <section className="container-wide py-20">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6 }} className="max-w-2xl mb-12">
          <p className="text-[11px] tracking-[0.18em] text-muted-foreground/70 uppercase mb-3">What we do</p>
          <h2 className="font-display text-3xl md:text-4xl font-semibold tracking-tight">From a quick sheet to a full project.</h2>
        </motion.div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {services.map((s, i) => (
            <motion.div key={s.title}
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.5, delay: i * 0.06 }}
              className="card-premium p-7 group cursor-default"
            >
              <div className={`p-2.5 rounded-xl ${s.color} w-fit mb-5 transition-transform group-hover:scale-110 group-hover:-rotate-6`}>
                <s.icon className="h-5 w-5" />
              </div>
              <h3 className="font-medium mb-1.5">{s.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* How it works — Timeline */}
      <section className="bg-muted/30 border-y border-border/30 py-20">
        <div className="container-wide">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.6 }} className="max-w-2xl mb-14">
            <p className="text-[11px] tracking-[0.18em] text-muted-foreground/70 uppercase mb-3">How it works</p>
            <h2 className="font-display text-3xl md:text-4xl font-semibold tracking-tight">Built around protection — for both sides.</h2>
          </motion.div>
          <div className="max-w-2xl space-y-10">
            {steps.map((s, i) => (
              <motion.div key={s.n}
                initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, margin: '-50px' }}
                transition={{ duration: 0.6, delay: i * 0.1 }}
                className="timeline-step"
              >
                <div className="timeline-dot">{s.n}</div>
                <h3 className="font-display text-xl font-medium mb-2">{s.t}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{s.d}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Subscription CTA */}
      <section className="container-wide py-16">
        <div className="relative rounded-[40px] overflow-hidden bg-foreground text-background p-8 md:p-16">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,hsl(var(--accent)/0.2),transparent_60%)]" />
          <div className="absolute inset-0 opacity-10 dot-grid" />
          
          <div className="relative z-10 max-w-2xl">
            <Badge className="bg-accent text-accent-foreground border-none mb-6 rounded-full px-4 py-1 text-[10px] uppercase tracking-widest font-bold animate-pulse">
              Upgrade to Studio Pro
            </Badge>
            <h2 className="font-display text-3xl md:text-5xl font-semibold tracking-tight mb-6 leading-[1.1]">
              Get the <span className="text-accent italic">Pro Advantage.</span>
            </h2>
            <p className="text-background/70 text-base md:text-lg mb-8 leading-relaxed">
              Unlock 0% platform fees, priority bid placement, and a verified Pro badge. 
              Start your 7-day trial for just <span className="text-accent font-bold">₹49</span> today.
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
              {[
                '0% Fees on all projects',
                'Priority bid pinning',
                'Exclusive "Pro" jobs',
                'Unlimited portfolio templates'
              ].map((benefit) => (
                <div key={benefit} className="flex items-center gap-3">
                  <div className="h-5 w-5 rounded-full bg-accent/20 flex items-center justify-center">
                    <Star className="h-3 w-3 text-accent fill-accent" />
                  </div>
                  <span className="text-sm font-medium">{benefit}</span>
                </div>
              ))}
            </div>

            <Link to="/studio-hub/pricing">
              <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90 rounded-full px-10 h-14 font-bold text-lg shadow-xl shadow-accent/20">
                See all plans & pricing
              </Button>
            </Link>
          </div>

          {/* Abstract geometric shape */}
          <div className="absolute right-[-5%] top-1/2 -translate-y-1/2 w-[40%] h-[120%] hidden lg:block opacity-20">
            <div className="w-full h-full border-[60px] border-accent rounded-full blur-[40px]" />
          </div>
        </div>
      </section>


      {/* Live projects */}
      <section className="container-wide py-20">
        <div className="flex items-end justify-between mb-10">
          <div>
            <p className="text-[11px] tracking-[0.18em] text-muted-foreground/70 uppercase mb-3">Open projects</p>
            <h2 className="font-display text-3xl md:text-4xl font-semibold tracking-tight">Recent briefs from clients.</h2>
          </div>
          <Link to="/studio-hub/projects" className="hidden md:inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
            See all <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="grid gap-3">{[1, 2, 3].map((i) => <div key={i} className="h-24 bg-muted/40 rounded-xl animate-pulse" />)}</div>
        ) : projects.length === 0 ? (
          <div className="text-center py-16 card-premium rounded-2xl">
            <p className="text-sm text-muted-foreground">No open projects yet. Be the first to <Link to="/studio-hub/post" className="text-accent underline underline-offset-4 font-medium">post one</Link>.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {projects.slice(0, 6).map((p) => (
              <Link key={p.id} to={`/studio-hub/projects/${p.id}`}
                className="grid grid-cols-12 gap-4 py-5 px-4 -mx-2 rounded-xl hover:bg-muted/40 transition-all duration-300 border border-transparent hover:border-border/40 group"
              >
                <div className="col-span-12 md:col-span-7">
                  <h3 className="font-medium mb-1 line-clamp-1 group-hover:text-accent transition-colors">{p.title}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-1">{p.description}</p>
                </div>
                <div className="col-span-6 md:col-span-2 self-center">
                  <span className="text-xs text-muted-foreground bg-muted/60 px-2.5 py-1 rounded-full">{p.category}</span>
                </div>
                <div className="col-span-3 md:col-span-2 text-sm font-semibold self-center text-accent">{formatBudget(p)}</div>
                <div className="col-span-3 md:col-span-1 text-xs text-muted-foreground self-center text-right flex items-center gap-1 justify-end">
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
        <section className="container-wide pb-20">
          <div className="flex items-end justify-between mb-10">
            <div>
              <p className="text-[11px] tracking-[0.18em] text-muted-foreground/70 uppercase mb-3">Studio Members</p>
              <h2 className="font-display text-3xl md:text-4xl font-semibold tracking-tight">Future architects already here.</h2>
            </div>
            <Link to="/studio-hub/members" className="hidden md:inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
              All members <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {members.map((m) => (
              <Link key={m.id} to={`/studio-hub/members/${m.user_id}`} className="group">
                <div className="aspect-square rounded-2xl bg-muted/60 mb-3 overflow-hidden card-premium">
                  {m.avatar_url ? (
                    <img src={m.avatar_url} alt={m.display_name || 'Member'} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-2xl font-display text-muted-foreground bg-gradient-to-br from-accent/5 to-blueprint/5">
                      {(m.display_name || '?').slice(0, 1)}
                    </div>
                  )}
                </div>
                <p className="text-sm font-medium line-clamp-1 group-hover:text-accent transition-colors">{m.display_name || 'Anonymous'}</p>
                <p className="text-xs text-muted-foreground line-clamp-1">{m.headline || `${m.experience_level} member`}</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Categories */}
      <section className="container-wide pb-24">
        <p className="text-[11px] tracking-[0.18em] text-muted-foreground/70 uppercase mb-4 text-center">Explore by craft</p>
        <div className="flex flex-wrap justify-center gap-2">
          {STUDIO_CATEGORIES.map((c) => (
            <Link key={c} to={`/studio-hub/projects?category=${encodeURIComponent(c)}`}>
              <span className="inline-flex items-center px-4 py-2 rounded-full border border-border/60 hover:border-accent hover:bg-accent/5 hover:text-accent transition-all duration-300 text-sm">{c}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Trust strip */}
      <section className="border-t border-border/30 bg-muted/20">
        <div className="container-wide py-14 grid grid-cols-1 md:grid-cols-3 gap-10 text-sm">
          {[
            { icon: ShieldCheck, title: 'Studio-protected escrow', desc: 'Your payment is held by Archistudio, not the freelancer. Refunds are possible until release.' },
            { icon: Sparkles, title: 'Reviewed deliverables', desc: 'Our team checks every file before it reaches you, raising the floor on quality.' },
            { icon: Compass, title: 'By students, for students', desc: 'Built for the architecture community — fair pay, fair pricing, real practice.' },
          ].map((item) => (
            <div key={item.title} className="group">
              <div className="p-2.5 rounded-xl bg-accent/8 text-accent w-fit mb-4 transition-transform group-hover:scale-110">
                <item.icon className="h-4 w-4" />
              </div>
              <p className="font-medium mb-1.5">{item.title}</p>
              <p className="text-muted-foreground leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </StudioHubLayout>
  );
}
