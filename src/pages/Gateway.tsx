import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { BookOpen, Compass, ArrowRight, Sparkles, GraduationCap, Briefcase } from 'lucide-react';
import { SEOHead } from '@/components/seo/SEOHead';
import logoMark from '@/assets/logo-mark.png';

const ease = [0.22, 1, 0.36, 1] as const;

export default function Gateway() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center relative overflow-hidden px-4">
      <SEOHead 
        title="Archistudio — Choose Your Path" 
        description="Choose between the Archistudio Academy to learn architecture or the Studio Hub to hire professionals."
      />

      {/* Background Effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,hsl(var(--accent)/0.03),transparent_70%)]" />
        <div className="absolute inset-0 dot-grid opacity-20" />
      </div>

      {/* Header / Logo */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease }}
        className="mb-12 text-center"
      >
        <img src={logoMark} alt="Archistudio" className="h-16 w-16 mx-auto mb-4 rounded-2xl shadow-xl" />
        <h1 className="font-display text-2xl font-bold tracking-tight">Archistudio</h1>
        <p className="text-muted-foreground text-sm mt-1">Architecture, redefined.</p>
      </motion.div>

      <div className="max-w-6xl w-full grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
        {/* Path 1: Academy */}
        <motion.div
          initial={{ opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease }}
        >
          <Link to="/learn" className="group block relative h-full">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent rounded-[40px] border border-amber-500/20 transition-all duration-500 group-hover:scale-[1.02] group-hover:border-amber-500/40 group-hover:shadow-2xl group-hover:shadow-amber-500/10" />
            
            <div className="relative p-8 md:p-12 h-full flex flex-col items-center text-center">
              <div className="p-5 rounded-3xl bg-amber-500/10 text-amber-500 mb-8 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3">
                <GraduationCap className="h-10 w-10" />
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-[10px] uppercase tracking-widest font-bold text-amber-600 dark:text-amber-400 mb-4">
                <Sparkles className="h-3 w-3" /> Academy
              </div>
              <h2 className="font-display text-3xl md:text-5xl font-bold mb-6 tracking-tight">
                Master the <span className="italic">Craft.</span>
              </h2>
              <p className="text-muted-foreground text-lg mb-10 leading-relaxed max-w-sm">
                Join 5,000+ students learning the real-world architecture workflows they don't teach in college.
              </p>
              
              <div className="mt-auto flex items-center gap-2 text-amber-500 font-bold group-hover:gap-4 transition-all duration-300">
                Enter the School <ArrowRight className="h-5 w-5" />
              </div>
            </div>
          </Link>
        </motion.div>

        {/* Path 2: Studio Hub */}
        <motion.div
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.3, ease }}
        >
          <Link to="/studio-hub" className="group block relative h-full">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-blue-500/5 to-transparent rounded-[40px] border border-blue-500/20 transition-all duration-500 group-hover:scale-[1.02] group-hover:border-blue-500/40 group-hover:shadow-2xl group-hover:shadow-blue-500/10" />
            
            <div className="relative p-8 md:p-12 h-full flex flex-col items-center text-center">
              <div className="p-5 rounded-3xl bg-blue-500/10 text-blue-500 mb-8 transition-transform duration-500 group-hover:scale-110 group-hover:-rotate-3">
                <Briefcase className="h-10 w-10" />
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 text-[10px] uppercase tracking-widest font-bold text-blue-600 dark:text-blue-400 mb-4">
                <Compass className="h-3 w-3" /> Marketplace
              </div>
              <h2 className="font-display text-3xl md:text-5xl font-bold mb-6 tracking-tight">
                Hire <span className="italic">Pro Talent.</span>
              </h2>
              <p className="text-muted-foreground text-lg mb-10 leading-relaxed max-w-sm">
                Post briefs and hire top-rated Studio Members for drafting, 3D, rendering, and thesis help.
              </p>
              
              <div className="mt-auto flex items-center gap-2 text-blue-500 font-bold group-hover:gap-4 transition-all duration-300">
                Enter the Studio Hub <ArrowRight className="h-5 w-5" />
              </div>
            </div>
          </Link>
        </motion.div>
      </div>

      {/* Footer hint */}
      <motion.p 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 1 }}
        className="mt-16 text-muted-foreground text-xs uppercase tracking-widest"
      >
        Two paths · One account · Unlimited potential
      </motion.p>
    </div>
  );
}
