import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { ArrowRight, BookOpen, Compass } from 'lucide-react';
import { SEOHead } from '@/components/seo/SEOHead';

export default function Splash() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEOHead
        title="Archistudio — Learn architecture & hire future architects"
        description="Two doors into Archistudio: master architecture through our courses, or get real briefs done with our Studio Hub of verified members."
        url="https://archistudio.shop"
      />
      <Navbar />
      <main className="flex-1 flex items-center">
        <div className="container-wide py-16 md:py-24 w-full">
          <div className="max-w-3xl mx-auto text-center mb-14">
            <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-muted/60 text-[11px] uppercase tracking-[0.14em] text-muted-foreground mb-7">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" /> Welcome to Archistudio
            </motion.div>
            <motion.h1 initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.1 }}
              className="font-display text-4xl sm:text-5xl md:text-6xl font-semibold tracking-tight leading-[1.05] mb-5">
              Architecture, <span className="italic text-muted-foreground/70">two ways</span>.
            </motion.h1>
            <motion.p initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.18 }}
              className="text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
              Learn the craft, or hire a Studio Member to bring your project to life. One account, two doors.
            </motion.p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-border/30 rounded-3xl overflow-hidden max-w-5xl mx-auto border border-border/40">
            {/* Door 1: Learn */}
            <Link to="/learn" className="group bg-background p-10 md:p-14 hover:bg-muted/30 transition-colors flex flex-col">
              <BookOpen className="h-6 w-6 text-accent mb-8" />
              <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground/70 mb-3">For learners</p>
              <h2 className="font-display text-2xl md:text-3xl font-semibold tracking-tight mb-4">Learn architecture</h2>
              <p className="text-sm text-muted-foreground leading-relaxed mb-8 flex-1">
                Mentor-led courses on AutoCAD, 3ds Max, Revit, V-Ray and the way real studios actually work. Practice over theory.
              </p>
              <span className="inline-flex items-center gap-1.5 text-sm font-medium text-foreground group-hover:gap-2.5 transition-all">
                Enter the school <ArrowRight className="h-4 w-4" />
              </span>
            </Link>
            {/* Door 2: Hire */}
            <Link to="/studio-hub" className="group bg-background p-10 md:p-14 hover:bg-muted/30 transition-colors flex flex-col">
              <Compass className="h-6 w-6 text-accent mb-8" />
              <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground/70 mb-3">For projects</p>
              <h2 className="font-display text-2xl md:text-3xl font-semibold tracking-tight mb-4">Studio Hub</h2>
              <p className="text-sm text-muted-foreground leading-relaxed mb-8 flex-1">
                Hire verified Studio Members for drafting, 3D, rendering and thesis help. Studio-protected escrow on every project.
              </p>
              <span className="inline-flex items-center gap-1.5 text-sm font-medium text-foreground group-hover:gap-2.5 transition-all">
                Enter the studio <ArrowRight className="h-4 w-4" />
              </span>
            </Link>
          </div>

          <p className="text-center text-xs text-muted-foreground mt-10">
            One account works for both. <Link to="/auth?mode=signup" className="underline underline-offset-4 text-foreground">Create your account</Link>
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
