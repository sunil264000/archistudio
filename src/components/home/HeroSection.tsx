import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, Play } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

const ease = [0.22, 1, 0.36, 1] as const;

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: ease as unknown as [number, number, number, number], delay: i * 0.1 }
  })
};

function MarqueeStrip() {
  const words = [
    'WORKING DRAWINGS', 'SITE ANALYSIS', 'CONSTRUCTION LOGIC', 'STRUCTURAL COORDINATION',
    'DETAILING', 'SPECIFICATIONS', 'MEP INTEGRATION', 'SUSTAINABILITY', 'BIM MODELING',
    '3DS MAX', 'AUTOCAD', 'REVIT', 'SKETCHUP', 'CORONA RENDERING'
  ];
  
  return (
    <div className="absolute bottom-0 left-0 right-0 overflow-hidden border-t border-border/15 bg-background/60 backdrop-blur-sm">
      <div className="flex animate-marquee whitespace-nowrap py-3 sm:py-4">
        {[...words, ...words].map((word, i) => (
          <span key={i} className="mx-4 sm:mx-8 text-[10px] sm:text-xs font-mono tracking-[0.2em] text-muted-foreground/40">
            {word}
          </span>
        ))}
      </div>
    </div>
  );
}

function useLiveStats() {
  const [stats, setStats] = useState({ courses: '70+', students: '2,000+' });
  useEffect(() => {
    Promise.all([
      supabase.from('courses').select('id', { count: 'exact', head: true }).eq('is_published', true),
      supabase.from('enrollments').select('user_id', { count: 'exact', head: true }),
    ]).then(([coursesRes, enrollRes]) => {
      const c = coursesRes.count || 0;
      const s = enrollRes.count || 0;
      if (c > 0) setStats({
        courses: `${c}+`,
        students: s > 0 ? `${s.toLocaleString('en-IN')}+` : '2,000+',
      });
    });
  }, []);
  return stats;
}

export function HeroSection() {
  const { user } = useAuth();
  const liveStats = useLiveStats();
  
  return (
    <section className="relative min-h-[100vh] flex items-center overflow-hidden">
      {/* Simple ambient gradients — no animations */}
      <div className="absolute inset-0 bg-gradient-to-b from-secondary/15 via-background to-background" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-15%,hsl(var(--accent)/0.05),transparent)]" />
      
      {/* Subtle grid — desktop only, static */}
      <svg className="absolute inset-0 w-full h-full opacity-[0.015] hidden lg:block" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="hero-grid" width="80" height="80" patternUnits="userSpaceOnUse">
            <path d="M 80 0 L 0 0 0 80" fill="none" stroke="currentColor" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#hero-grid)" />
      </svg>
      
      <div className="relative section-padding w-full z-10">
        <div className="container-wide">
          <div className="max-w-5xl mx-auto">
            <div className="grid lg:grid-cols-[1.2fr_0.8fr] gap-12 lg:gap-16 items-center">
              {/* Left content */}
              <div className="space-y-6 sm:space-y-8 text-center lg:text-left">
                {/* Label */}
                <motion.div 
                  custom={0} variants={fadeUp} initial="hidden" animate="visible"
                  className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full card-glass border-glow"
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-accent" />
                  <span className="text-xs font-medium tracking-wider text-muted-foreground uppercase">
                    For Students & Fresh Architects
                  </span>
                </motion.div>
                
                {/* Headline */}
                <motion.h1 
                  custom={1} variants={fadeUp} initial="hidden" animate="visible"
                  className="font-display font-bold leading-[1.08]"
                >
                  Learn Architecture
                  <br />
                  <span className="text-gradient-accent">the Way It Is Actually</span>
                  <br />
                  <span className="text-gradient-accent">Practiced</span>
                </motion.h1>
                
                {/* Positioning */}
                <motion.p 
                  custom={2} variants={fadeUp} initial="hidden" animate="visible"
                  className="text-base sm:text-lg text-muted-foreground max-w-xl mx-auto lg:mx-0 leading-relaxed"
                >
                  This platform teaches what architecture colleges and CAD institutes don't:{' '}
                  <span className="text-foreground font-medium">how real buildings are designed, detailed, and executed in offices.</span>
                </motion.p>
                
                {/* CTAs */}
                <motion.div 
                  custom={3} variants={fadeUp} initial="hidden" animate="visible"
                  className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 justify-center lg:justify-start"
                >
                  <Link to={user ? "/courses" : "/auth?mode=signup"} className="w-full sm:w-auto">
                    <Button size="xl" className="gap-2.5 group w-full sm:w-auto bg-accent text-accent-foreground hover:bg-accent/90 shadow-[0_4px_20px_hsl(var(--accent)/0.2)]">
                      {user ? "Explore Courses" : "Start Learning Free"}
                      <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                    </Button>
                  </Link>
                  <Link to="/courses" className="w-full sm:w-auto">
                    <Button variant="glass" size="xl" className="gap-2 w-full sm:w-auto">
                      <Play className="h-4 w-4" />
                      Explore Courses
                    </Button>
                  </Link>
                </motion.div>
                
                {/* Stats */}
                <motion.div 
                  custom={4} variants={fadeUp} initial="hidden" animate="visible"
                  className="flex items-center gap-6 sm:gap-10 justify-center lg:justify-start pt-4"
                >
                  {[
                    { value: liveStats.courses, label: 'Courses' },
                    { value: liveStats.students, label: 'Students' },
                    { value: '4.9', label: 'Avg Rating' },
                  ].map((stat) => (
                    <div key={stat.label} className="text-center lg:text-left">
                      <div className="text-xl sm:text-2xl font-bold text-foreground">{stat.value}</div>
                      <div className="text-[11px] sm:text-xs text-muted-foreground tracking-wide">{stat.label}</div>
                    </div>
                  ))}
                </motion.div>
              </div>
              
              {/* Right — glass card, no continuous animations */}
              <motion.div
                custom={2} variants={fadeUp} initial="hidden" animate="visible"
                className="hidden lg:block"
              >
                <div className="relative">
                  <div className="relative rounded-2xl card-glass p-8 space-y-6 overflow-hidden border-glow">
                    {/* Glass top accent */}
                    <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-accent/40 to-transparent" />
                    
                    <div className="space-y-5">
                      <div className="text-xs font-mono tracking-[0.15em] uppercase text-accent">What You'll Master</div>
                      
                      {[
                        'Working Drawings & Detailing',
                        'Construction Logic & Sequences',
                        'Site Analysis & Documentation',
                        'Structural Coordination',
                        'Software — 3ds Max, AutoCAD, Revit',
                        'Sustainability & Services',
                      ].map((item, i) => (
                        <motion.div 
                          key={item}
                          className="flex items-center gap-3 text-sm text-muted-foreground"
                          initial={{ opacity: 0, x: -12 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.4, ease: ease as unknown as [number, number, number, number], delay: 0.6 + i * 0.08 }}
                        >
                          <div className="w-1 h-1 rounded-full bg-accent shrink-0" />
                          {item}
                        </motion.div>
                      ))}
                    </div>
                    
                    <div className="absolute bottom-0 right-0 w-20 h-20 border-t border-l border-border/20 rounded-tl-2xl" />
                  </div>
                  
                  {/* Depth shadow */}
                  <div className="absolute -bottom-3 -right-3 inset-x-3 h-full rounded-2xl border border-border/20 bg-secondary/10 -z-10" />
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
      
      <MarqueeStrip />
    </section>
  );
}
