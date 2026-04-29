import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { BookOpen, Compass, ArrowRight, GraduationCap, Briefcase, Zap, ShieldCheck } from 'lucide-react';
import { SEOHead } from '@/components/seo/SEOHead';
import logoMark from '@/assets/logo-mark.png';

const ease = [0.22, 1, 0.36, 1] as const;

export default function Gateway() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center relative overflow-hidden">
      <SEOHead 
        title="Archistudio — The Professional Architectural Gateway" 
        description="Bridge the gap between education and practice. Master architectural software at the Academy or hire top-tier talent at Studio Hub."
      />

      {/* Dynamic Background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-accent/5 blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-blueprint/5 blur-[120px] animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute inset-0 dot-grid opacity-[0.15]" />
        
        {/* Animated architectural lines */}
        <svg className="absolute inset-0 w-full h-full opacity-[0.03]" xmlns="http://www.w3.org/2000/svg">
          <motion.path 
            d="M-100 100 L1000 800 M500 -100 L-200 600" 
            stroke="currentColor" 
            strokeWidth="1" 
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 3, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
          />
        </svg>
      </div>

      <div className="container-wide relative z-10 py-12 md:py-20 flex flex-col h-full min-h-screen">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease }}
          className="mb-12 md:mb-20 text-center"
        >
          <div className="relative inline-block mb-6">
            <img 
              src={logoMark} 
              alt="Archistudio Logo" 
              className="h-20 w-20 mx-auto rounded-[24px] shadow-2xl relative z-10" 
              fetchpriority="high"
              decoding="async"
            />
            <div className="absolute inset-0 bg-accent blur-2xl opacity-20 scale-150" />
          </div>
          <h1 className="font-display text-3xl md:text-5xl font-bold tracking-tight mb-2">Architectural Excellence.</h1>
          <p className="text-muted-foreground text-sm md:text-base max-w-sm mx-auto leading-relaxed">
            A unified ecosystem for the next generation of architects. Choose your destination.
          </p>
        </motion.div>

        <div className="flex-1 flex flex-col md:flex-row items-stretch gap-6 md:gap-10 max-w-6xl mx-auto w-full">
          {/* Path 1: Academy */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease }}
            className="flex-1"
          >
            <Link to="/learn" className="group relative block h-full">
              <div className="absolute inset-0 bg-card border border-border/50 rounded-[48px] transition-all duration-500 group-hover:scale-[1.02] group-hover:border-accent/40 group-hover:shadow-[0_32px_64px_-12px_rgba(0,0,0,0.14)] dark:group-hover:shadow-[0_32px_64px_-12px_rgba(0,0,0,0.4)] overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-accent/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                
                <div className="absolute right-[-10%] top-[-10%] opacity-5 group-hover:opacity-10 transition-opacity">
                  <GraduationCap className="w-64 h-64 rotate-12" />
                </div>
              </div>
              
              <div className="relative p-10 md:p-16 h-full flex flex-col">
                <div className="w-16 h-16 rounded-3xl bg-accent/10 text-accent flex items-center justify-center mb-10 transition-all duration-500 group-hover:scale-110 group-hover:rotate-6">
                  <BookOpen className="h-8 w-8" />
                </div>
                
                <div className="space-y-4 mb-8">
                  <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-accent">
                    <Zap className="h-3 w-3" /> The Academy
                  </div>
                  <h2 className="font-display text-4xl md:text-6xl font-bold leading-[0.95] tracking-tighter">
                    Elevate <br />
                    <span className="text-muted-foreground/40 group-hover:text-accent transition-colors duration-500 italic font-medium">Your Skills.</span>
                  </h2>
                </div>

                <p className="text-muted-foreground text-base md:text-lg leading-relaxed mb-10 max-w-xs">
                  Master industry-standard workflows, BIM modeling, and high-end visualization with professional mentorship.
                </p>
                
                <div className="mt-auto flex items-center gap-3 text-foreground font-bold group-hover:gap-5 transition-all duration-300">
                  <span className="text-lg">Start Learning</span>
                  <div className="w-10 h-10 rounded-full bg-foreground text-background flex items-center justify-center transition-transform group-hover:scale-110">
                    <ArrowRight className="h-5 w-5" />
                  </div>
                </div>
              </div>
            </Link>
          </motion.div>

          {/* Path 2: Studio Hub */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.3, ease }}
            className="flex-1"
          >
            <Link to="/studio-hub" className="group relative block h-full">
              <div className="absolute inset-0 bg-card border border-border/50 rounded-[48px] transition-all duration-500 group-hover:scale-[1.02] group-hover:border-blueprint/40 group-hover:shadow-[0_32px_64px_-12px_rgba(0,0,0,0.14)] dark:group-hover:shadow-[0_32px_64px_-12px_rgba(0,0,0,0.4)] overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-blueprint/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                
                <div className="absolute left-[-10%] bottom-[-10%] opacity-5 group-hover:opacity-10 transition-opacity">
                  <Briefcase className="w-64 h-64 -rotate-12" />
                </div>
              </div>
              
              <div className="relative p-10 md:p-16 h-full flex flex-col">
                <div className="w-16 h-16 rounded-3xl bg-blueprint/10 text-blueprint flex items-center justify-center mb-10 transition-all duration-500 group-hover:scale-110 group-hover:-rotate-6">
                  <Compass className="h-8 w-8" />
                </div>
                
                <div className="space-y-4 mb-8">
                  <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-blueprint">
                    <ShieldCheck className="h-3.5 w-3.5" /> Studio Hub
                  </div>
                  <h2 className="font-display text-4xl md:text-6xl font-bold leading-[0.95] tracking-tighter">
                    Build <br />
                    <span className="text-muted-foreground/40 group-hover:text-blueprint transition-colors duration-500 italic font-medium">Your Future.</span>
                  </h2>
                </div>

                <p className="text-muted-foreground text-base md:text-lg leading-relaxed mb-10 max-w-xs">
                  Connect with elite architecture talent or find high-impact projects with studio-grade tools and escrow.
                </p>
                
                <div className="mt-auto flex items-center gap-3 text-foreground font-bold group-hover:gap-5 transition-all duration-300">
                  <span className="text-lg">Enter Marketplace</span>
                  <div className="w-10 h-10 rounded-full bg-foreground text-background flex items-center justify-center transition-transform group-hover:scale-110">
                    <ArrowRight className="h-5 w-5" />
                  </div>
                </div>
              </div>
            </Link>
          </motion.div>
        </div>

        {/* Bottom hint */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 1 }}
          className="mt-12 md:mt-16 text-center"
        >
          <p className="text-muted-foreground/60 text-[10px] uppercase tracking-[0.3em] font-medium">
            Professional Architecture Infrastructure · Archistudio 2026
          </p>
        </motion.div>
      </div>
    </div>
  );
}
