import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { StudioHubLayout } from '@/components/studio-hub/StudioHubLayout';
import { Button } from '@/components/ui/button';
import { ArrowRight, ShieldCheck, Sparkles, Compass, Layers, PenTool, Box } from 'lucide-react';
import { SEOHead } from '@/components/seo/SEOHead';
import { useStudioProjects, useTopMembers, formatBudget, STUDIO_CATEGORIES } from '@/hooks/useStudioHub';
import { formatDistanceToNow } from 'date-fns';

const fade = { hidden: { opacity: 0, y: 18 }, visible: (i: number) => ({ opacity: 1, y: 0, transition: { duration: 0.6, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] as any } }) };

const services = [
  { icon: PenTool, title: 'Working drawings', desc: 'CAD plans, sections & details' },
  { icon: Box, title: '3D & rendering', desc: 'SketchUp, Revit, V-Ray, Lumion' },
  { icon: Layers, title: 'Concept & thesis', desc: 'Sheets, presentations, mentorship' },
  { icon: Compass, title: 'Site & landscape', desc: 'Master plans, urban studies' },
];

export default function StudioHubHome() {
  const { projects, loading } = useStudioProjects();
  const { members } = useTopMembers(6);

  return (
    <StudioHubLayout>
      <SEOHead
        title="Studio Hub — Architecture freelance, by students"
        description="Hire architecture students for drafting, 3D, rendering and thesis help. Calm, safe, and run by Archistudio with admin-protected escrow."
        url="https://archistudio.shop/studio-hub"
      />

      {/* Hero — soft, editorial */}
      <section className="relative overflow-hidden border-b border-border/30">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_60%_at_50%_0%,hsl(var(--accent)/0.06),transparent_70%)] pointer-events-none" />
        <div className="container-wide relative py-20 md:py-28">
          <div className="max-w-3xl mx-auto text-center">
            <motion.div initial="hidden" animate="visible" custom={0} variants={fade}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-muted/60 text-[11px] font-medium tracking-[0.12em] uppercase text-muted-foreground mb-7">
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
                <Button size="lg" className="bg-foreground text-background hover:bg-foreground/90 gap-2 rounded-full px-7">
                  Post a project <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link to="/studio-hub/become-member">
                <Button size="lg" variant="ghost" className="rounded-full px-7 text-muted-foreground hover:text-foreground">
                  Join as a Studio Member
                </Button>
              </Link>
            </motion.div>

            <motion.p initial="hidden" animate="visible" custom={4} variants={fade}
              className="text-xs text-muted-foreground/60 mt-6">
              Admin-protected escrow · 15% platform fee · Files released only after review
            </motion.p>
          </div>
        </div>
      </section>

      {/* Services — minimal grid with reveal */}
      <section className="container-wide py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] as any }}
          className="max-w-2xl mb-12"
        >
          <p className="text-[11px] tracking-[0.18em] text-muted-foreground/70 uppercase mb-3">What we do</p>
          <h2 className="font-display text-3xl md:text-4xl font-semibold tracking-tight">From a quick sheet to a full project.</h2>
        </motion.div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px bg-border/40 rounded-2xl overflow-hidden">
          {services.map((s, i) => (
            <motion.div
              key={s.title}
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.5, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] as any }}
              className="bg-background p-7 hover:bg-muted/40 transition-colors group"
            >
              <s.icon className="h-5 w-5 text-accent mb-5 transition-transform group-hover:scale-110 group-hover:-rotate-6" />
              <h3 className="font-medium mb-1">{s.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="bg-muted/30 border-y border-border/30 py-20">
        <div className="container-wide">
          <motion.div
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.6 }}
            className="max-w-2xl mb-14"
          >
            <p className="text-[11px] tracking-[0.18em] text-muted-foreground/70 uppercase mb-3">How it works</p>
            <h2 className="font-display text-3xl md:text-4xl font-semibold tracking-tight">Built around protection — for both sides.</h2>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {[
              { n: '01', t: 'You brief, we match', d: 'Post your project. Members send proposals with timeline and price.' },
              { n: '02', t: 'Pay the studio', d: 'Funds rest with Archistudio while the work happens — never with the member directly.' },
              { n: '03', t: 'We review & release', d: 'When the deliverable is approved by our team, files reach you and the member is paid.' },
            ].map((s, i) => (
              <motion.div
                key={s.n}
                initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-50px' }}
                transition={{ duration: 0.6, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] as any }}
              >
                <div className="text-[11px] tracking-[0.2em] text-accent font-medium mb-4">{s.n}</div>
                <h3 className="font-display text-xl font-medium mb-2">{s.t}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{s.d}</p>
              </motion.div>
            ))}
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
          <Link to="/studio-hub/projects" className="hidden md:inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
            See all <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="grid gap-3">{[1, 2, 3].map((i) => <div key={i} className="h-24 bg-muted/40 rounded-xl animate-pulse" />)}</div>
        ) : projects.length === 0 ? (
          <p className="text-sm text-muted-foreground py-12 text-center">No open projects yet. Be the first to <Link to="/studio-hub/post" className="text-foreground underline underline-offset-4">post one</Link>.</p>
        ) : (
          <div className="divide-y divide-border/40 border-y border-border/40">
            {projects.slice(0, 6).map((p) => (
              <Link key={p.id} to={`/studio-hub/projects/${p.id}`} className="grid grid-cols-12 gap-4 py-5 hover:bg-muted/30 transition-colors px-2 -mx-2 rounded-lg">
                <div className="col-span-12 md:col-span-7">
                  <h3 className="font-medium mb-1 line-clamp-1">{p.title}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-1">{p.description}</p>
                </div>
                <div className="col-span-6 md:col-span-2 text-xs text-muted-foreground self-center">{p.category}</div>
                <div className="col-span-3 md:col-span-2 text-sm font-medium self-center">{formatBudget(p)}</div>
                <div className="col-span-3 md:col-span-1 text-xs text-muted-foreground self-center text-right">{formatDistanceToNow(new Date(p.created_at), { addSuffix: false })}</div>
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
            <Link to="/studio-hub/members" className="hidden md:inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
              All members <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {members.map((m) => (
              <Link key={m.id} to={`/studio-hub/members/${m.user_id}`} className="group">
                <div className="aspect-square rounded-2xl bg-muted/60 mb-3 overflow-hidden border border-border/40 group-hover:border-accent/40 transition-colors">
                  {m.avatar_url ? (
                    <img src={m.avatar_url} alt={m.display_name || 'Member'} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-2xl font-display text-muted-foreground">
                      {(m.display_name || '?').slice(0, 1)}
                    </div>
                  )}
                </div>
                <p className="text-sm font-medium line-clamp-1">{m.display_name || 'Anonymous'}</p>
                <p className="text-xs text-muted-foreground line-clamp-1">{m.headline || `${m.experience_level} member`}</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Categories chip cloud */}
      <section className="container-wide pb-24">
        <p className="text-[11px] tracking-[0.18em] text-muted-foreground/70 uppercase mb-4 text-center">Explore by craft</p>
        <div className="flex flex-wrap justify-center gap-2">
          {STUDIO_CATEGORIES.map((c) => (
            <Link key={c} to={`/studio-hub/projects?category=${encodeURIComponent(c)}`}>
              <span className="inline-flex items-center px-4 py-1.5 rounded-full border border-border/60 hover:border-foreground hover:bg-muted/40 transition-colors text-sm">{c}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Trust strip */}
      <section className="border-t border-border/30 bg-muted/20">
        <div className="container-wide py-14 grid grid-cols-1 md:grid-cols-3 gap-10 text-sm">
          <div>
            <ShieldCheck className="h-4 w-4 text-accent mb-3" />
            <p className="font-medium mb-1">Studio-protected escrow</p>
            <p className="text-muted-foreground leading-relaxed">Your payment is held by Archistudio, not the freelancer. Refunds are possible until release.</p>
          </div>
          <div>
            <Sparkles className="h-4 w-4 text-accent mb-3" />
            <p className="font-medium mb-1">Reviewed deliverables</p>
            <p className="text-muted-foreground leading-relaxed">Our team checks every file before it reaches you, raising the floor on quality.</p>
          </div>
          <div>
            <Compass className="h-4 w-4 text-accent mb-3" />
            <p className="font-medium mb-1">By students, for students</p>
            <p className="text-muted-foreground leading-relaxed">Built for the architecture community — fair pay, fair pricing, real practice.</p>
          </div>
        </div>
      </section>
    </StudioHubLayout>
  );
}
