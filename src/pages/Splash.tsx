import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { ArrowRight, BookOpen, Compass, Sparkles } from 'lucide-react';
import { SEOHead } from '@/components/seo/SEOHead';

const ease = [0.22, 1, 0.36, 1] as const;

export default function Splash() {
  return (
    <div className="min-h-screen bg-background flex flex-col relative overflow-hidden">
      <SEOHead
        title="Archistudio — Learn architecture & hire future architects"
        description="Two doors into Archistudio: master architecture through our courses, or get real briefs done with Studio Hub members."
        url="https://archistudio.shop"
      />
      {/* Ambient background washes */}
      <div className="absolute inset-0 pointer-events-none">
        <motion.div
          aria-hidden
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1.4 }}
          className="absolute -top-40 -left-40 h-[520px] w-[520px] rounded-full bg-[radial-gradient(circle,hsl(var(--accent)/0.10),transparent_70%)] blur-2xl"
        />
        <motion.div
          aria-hidden
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1.4, delay: 0.2 }}
          className="absolute -bottom-40 -right-40 h-[520px] w-[520px] rounded-full bg-[radial-gradient(circle,hsl(var(--primary)/0.08),transparent_70%)] blur-2xl"
        />
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent,hsl(var(--background)))]" />
      </div>

      <Navbar />

      <main className="flex-1 flex items-center relative">
        <div className="container-wide py-16 md:py-24 w-full">
          <div className="max-w-3xl mx-auto text-center mb-14">
            <motion.div
              initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease }}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-muted/60 border border-border/40 text-[11px] uppercase tracking-[0.16em] text-muted-foreground mb-7"
            >
              <Sparkles className="h-3 w-3 text-accent" />
              Welcome to Archistudio
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.08, ease }}
              className="font-display text-4xl sm:text-5xl md:text-7xl font-semibold tracking-tight leading-[1.02] mb-6"
            >
              Architecture,
              <br />
              <span className="italic font-light text-muted-foreground/70">two ways.</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.2, ease }}
              className="text-lg md:text-xl text-muted-foreground max-w-xl mx-auto leading-relaxed"
            >
              Master the craft, or hire a Studio Member to bring your project to life.
              <br className="hidden sm:block" />
              One account, two doors.
            </motion.p>
          </div>

          {/* Two doors */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5 max-w-5xl mx-auto">
            {[
              {
                to: '/learn', icon: BookOpen, tag: 'For learners',
                title: 'Learn architecture', cta: 'Enter the school',
                desc: 'Mentor-led courses on AutoCAD, 3ds Max, Revit, V-Ray and the way real studios actually work.',
                accent: 'from-amber-200/15 via-transparent to-transparent',
              },
              {
                to: '/studio-hub', icon: Compass, tag: 'For projects',
                title: 'Studio Hub', cta: 'Enter the studio',
                desc: 'Hire verified Studio Members for drafting, 3D, rendering and thesis help. Studio-protected escrow.',
                accent: 'from-blue-200/15 via-transparent to-transparent',
              },
            ].map((door, i) => (
              <motion.div
                key={door.to}
                initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.32 + i * 0.1, ease }}
              >
                <Link
                  to={door.to}
                  className="group relative block rounded-3xl overflow-hidden border border-border/50 bg-background hover:border-foreground/30 transition-all duration-500 hover:-translate-y-1 hover:shadow-2xl hover:shadow-foreground/5"
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${door.accent} opacity-60 group-hover:opacity-100 transition-opacity duration-500`} />
                  <div className="relative p-10 md:p-14 flex flex-col h-full min-h-[320px]">
                    <door.icon className="h-7 w-7 text-accent mb-10 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-[-6deg]" />
                    <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground/70 mb-3">{door.tag}</p>
                    <h2 className="font-display text-3xl md:text-4xl font-semibold tracking-tight mb-4">{door.title}</h2>
                    <p className="text-sm md:text-[15px] text-muted-foreground leading-relaxed mb-8 flex-1 max-w-md">{door.desc}</p>
                    <span className="inline-flex items-center gap-1.5 text-sm font-medium text-foreground transition-all duration-300 group-hover:gap-3">
                      {door.cta}
                      <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                    </span>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>

          <motion.p
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: 0.7 }}
            className="text-center text-xs text-muted-foreground mt-12"
          >
            One account works for both ·{' '}
            <Link to="/auth?mode=signup" className="underline underline-offset-4 text-foreground hover:text-accent transition-colors">
              Create your account
            </Link>
          </motion.p>
        </div>
      </main>

      <Footer />
    </div>
  );
}
