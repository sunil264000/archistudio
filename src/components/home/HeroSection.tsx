import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, Play } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

const ease = [0.22, 1, 0.36, 1] as const;

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: ease as unknown as [number, number, number, number], delay: i * 0.12 }
  })
};

function MarqueeStrip() {
  const words = [
    'WORKING DRAWINGS', 'SITE ANALYSIS', 'CONSTRUCTION LOGIC', 'STRUCTURAL COORDINATION',
    'DETAILING', 'SPECIFICATIONS', 'MEP INTEGRATION', 'BIM MODELING',
    '3DS MAX', 'AUTOCAD', 'REVIT', 'SKETCHUP', 'CORONA RENDERING'
  ];
  
  return (
    <div className="absolute bottom-0 left-0 right-0 overflow-hidden border-t border-border/10">
      <div className="flex animate-marquee whitespace-nowrap py-3.5">
        {[...words, ...words].map((word, i) => (
          <span key={i} className="mx-6 sm:mx-10 font-mono text-[10px] tracking-[0.25em] text-muted-foreground/30 font-medium">
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
    <section className="relative min-h-[90vh] flex items-center overflow-hidden">
      {/* Ambient background — subtle, calm */}
      <div className="absolute inset-0 bg-gradient-to-b from-muted/30 via-background to-background" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_50%_0%,hsl(var(--accent)/0.03),transparent)]" />
      
      <div className="relative section-padding w-full z-10">
        <div className="container-wide">
          <div className="max-w-4xl mx-auto">
            <div className="grid lg:grid-cols-[1.3fr_0.7fr] gap-16 items-center">
              {/* Left content */}
              <div className="space-y-7 text-center lg:text-left">
                {/* Label */}
                <motion.div 
                  custom={0} variants={fadeUp} initial="hidden" animate="visible"
                  className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full border border-border/40 bg-card/30"
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                  <span className="font-display text-[11px] font-semibold tracking-[0.12em] text-muted-foreground uppercase">
                    For Students & Fresh Architects
                  </span>
                </motion.div>
                
                {/* Headline — calmer, editorial */}
                <motion.div custom={1} variants={fadeUp} initial="hidden" animate="visible">
                  <h1 className="font-display">
                    Learn Architecture
                    <br />
                    <span className="text-muted-foreground/80">the Way It's Actually</span>
                    <br />
                    <span className="text-accent">Practiced.</span>
                  </h1>
                </motion.div>
                
                {/* Subheadline */}
                <motion.p 
                  custom={2} variants={fadeUp} initial="hidden" animate="visible"
                  className="text-body-lg text-muted-foreground max-w-lg mx-auto lg:mx-0 leading-relaxed"
                >
                  This platform teaches what architecture colleges and CAD institutes don't:{' '}
                  <span className="text-foreground/80 font-medium">how real buildings are designed, detailed, and executed in offices.</span>
                </motion.p>
                
                {/* CTAs — cleaner */}
                <motion.div 
                  custom={3} variants={fadeUp} initial="hidden" animate="visible"
                  className="flex flex-col sm:flex-row items-center gap-3 justify-center lg:justify-start"
                >
                  <Link to={user ? "/courses" : "/auth?mode=signup"} className="w-full sm:w-auto">
                    <Button size="xl" className="gap-2.5 group w-full sm:w-auto bg-accent text-accent-foreground hover:bg-accent/90 shadow-[0_4px_20px_hsl(var(--accent)/0.15)]">
                      {user ? "Explore Courses" : "Start Learning Free"}
                      <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                    </Button>
                  </Link>
                  <Link to="/explore" className="w-full sm:w-auto">
                    <Button variant="ghost" size="xl" className="gap-2 w-full sm:w-auto text-muted-foreground hover:text-foreground">
                      <Play className="h-4 w-4" />
                      Discover & Explore
                    </Button>
                  </Link>
                </motion.div>
                
                {/* Stats — minimal */}
                <motion.div 
                  custom={4} variants={fadeUp} initial="hidden" animate="visible"
                  className="flex items-center gap-10 sm:gap-14 justify-center lg:justify-start pt-4"
                >
                  {[
                    { value: liveStats.courses, label: 'Courses' },
                    { value: liveStats.students, label: 'Students' },
                    { value: '4.9', label: 'Avg Rating' },
                  ].map((stat) => (
                    <div key={stat.label} className="text-center lg:text-left">
                      <div className="font-display text-2xl sm:text-3xl font-bold text-foreground tracking-tight">{stat.value}</div>
                      <div className="text-[11px] tracking-wider uppercase text-muted-foreground/60 mt-1 font-medium">{stat.label}</div>
                    </div>
                  ))}
                </motion.div>
              </div>
              
              {/* Right — feature card */}
              <motion.div
                custom={2} variants={fadeUp} initial="hidden" animate="visible"
                className="hidden lg:block"
              >
                <div className="relative">
                  <div className="relative rounded-2xl border border-border/30 bg-card/40 p-8 space-y-6 overflow-hidden">
                    <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-accent/20 to-transparent" />
                    
                    <div className="space-y-5">
                      <div className="text-[10px] font-semibold tracking-[0.15em] uppercase text-muted-foreground/60">What You'll Master</div>
                      
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
                          className="flex items-center gap-3.5"
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.4, ease: ease as unknown as [number, number, number, number], delay: 0.7 + i * 0.08 }}
                        >
                          <div className="w-1 h-1 rounded-full bg-accent/60 shrink-0" />
                          <span className="text-body-sm text-muted-foreground/80">{item}</span>
                        </motion.div>
                      ))}
                    </div>
                    
                    <div className="absolute bottom-0 right-0 w-16 h-16 border-t border-l border-border/10 rounded-tl-2xl" />
                  </div>
                  
                  <div className="absolute -bottom-2.5 -right-2.5 inset-x-2.5 h-full rounded-2xl border border-border/10 bg-muted/5 -z-10" />
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
