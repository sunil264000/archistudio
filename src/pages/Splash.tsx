import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { ArrowRight, BookOpen, Compass, Sparkles, Users, GraduationCap, Shield } from 'lucide-react';
import { SEOHead } from '@/components/seo/SEOHead';

const ease = [0.22, 1, 0.36, 1] as const;

const stats = [
  { label: 'Students', value: '1,000+', icon: Users },
  { label: 'Courses', value: '15+', icon: GraduationCap },
  { label: 'Protected Escrow', value: '100%', icon: Shield },
];

export default function Splash() {
  return (
    <div className="min-h-screen bg-background flex flex-col relative overflow-hidden">
      <SEOHead
        title="Archistudio — Learn architecture & hire future architects"
        description="Two doors into Archistudio: master architecture through our courses, or get real briefs done with Studio Hub members."
        url="https://archistudio.shop"
      />

      {/* Ambient background */}
      <div className="absolute inset-0 pointer-events-none">
        <motion.div
          aria-hidden
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 2 }}
          className="absolute -top-40 -left-40 h-[600px] w-[600px] rounded-full bg-[radial-gradient(circle,hsl(var(--accent)/0.08),transparent_70%)] blur-3xl"
        />
        <motion.div
          aria-hidden
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 2, delay: 0.3 }}
          className="absolute -bottom-40 -right-40 h-[600px] w-[600px] rounded-full bg-[radial-gradient(circle,hsl(var(--blueprint)/0.06),transparent_70%)] blur-3xl"
        />
        <motion.div
          aria-hidden
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 2, delay: 0.6 }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[800px] w-[800px] rounded-full bg-[radial-gradient(circle,hsl(var(--accent)/0.03),transparent_60%)] blur-2xl"
        />
        <div className="absolute inset-0 dot-grid opacity-30" />
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent_60%,hsl(var(--background)))]" />
      </div>

      <Navbar />

      <main className="flex-1 flex items-center relative">
        <div className="container-wide py-16 md:py-24 w-full">
          <div className="max-w-3xl mx-auto text-center mb-14">
            <motion.div
              initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-muted/60 border border-border/40 text-[11px] uppercase tracking-[0.16em] text-muted-foreground mb-7"
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

          {/* Two doors — premium cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6 max-w-5xl mx-auto">
            {[
              {
                to: '/learn', icon: BookOpen, tag: 'For learners',
                title: 'Learn architecture', cta: 'Enter the school',
                desc: 'Mentor-led courses on AutoCAD, 3ds Max, Revit, V-Ray and the way real studios actually work.',
                gradient: 'from-amber-500/8 via-orange-500/4 to-transparent',
                iconBg: 'bg-amber-500/10 text-amber-500',
              },
              {
                to: '/studio-hub', icon: Compass, tag: 'For projects',
                title: 'Studio Hub', cta: 'Enter the studio',
                desc: 'Hire verified Studio Members for drafting, 3D, rendering and thesis help. Studio-protected escrow.',
                gradient: 'from-blue-500/8 via-indigo-500/4 to-transparent',
                iconBg: 'bg-blue-500/10 text-blue-500',
              },
            ].map((door, i) => (
              <motion.div
                key={door.to}
                initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.32 + i * 0.12, ease }}
              >
                <Link
                  to={door.to}
                  className="group relative block rounded-3xl overflow-hidden card-premium min-h-[340px]"
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${door.gradient} opacity-60 group-hover:opacity-100 transition-opacity duration-700`} />
                  
                  {/* Hover glow */}
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,hsl(var(--accent)/0.06),transparent_60%)] opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                  
                  <div className="relative p-10 md:p-14 flex flex-col h-full">
                    <div className={`p-3 rounded-2xl ${door.iconBg} w-fit mb-8 transition-all duration-500 group-hover:scale-110 group-hover:rotate-[-6deg]`}>
                      <door.icon className="h-6 w-6" />
                    </div>
                    <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground/70 mb-3">{door.tag}</p>
                    <h2 className="font-display text-3xl md:text-4xl font-semibold tracking-tight mb-4">{door.title}</h2>
                    <p className="text-sm md:text-[15px] text-muted-foreground leading-relaxed mb-8 flex-1 max-w-md">{door.desc}</p>
                    <span className="inline-flex items-center gap-2 text-sm font-medium text-foreground transition-all duration-300 group-hover:gap-3">
                      {door.cta}
                      <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                    </span>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>

          {/* Stats bar */}
          <motion.div
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.7, ease }}
            className="flex flex-wrap items-center justify-center gap-6 md:gap-10 mt-14"
          >
            {stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 + i * 0.1, duration: 0.5 }}
                className="trust-badge"
              >
                <stat.icon className="h-3.5 w-3.5 text-accent" />
                <span className="font-semibold text-foreground">{stat.value}</span>
                <span>{stat.label}</span>
              </motion.div>
            ))}
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: 0.9 }}
            className="text-center text-xs text-muted-foreground mt-8"
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
