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

export function HeroSection() {
  const { user } = useAuth();
  
  return (
    <section className="relative min-h-[92vh] flex items-center overflow-hidden">
      {/* Ambient background */}
      <div className="absolute inset-0 bg-gradient-to-b from-muted/30 via-background to-background" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_50%_0%,hsl(var(--accent)/0.04),transparent)]" />
      
      <div className="relative section-padding w-full z-10">
        <div className="container-wide">
          <div className="max-w-4xl mx-auto text-center">
            {/* Label */}
            <motion.div 
              custom={0} variants={fadeUp} initial="hidden" animate="visible"
              className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full border border-border/40 bg-card/30 mb-8"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
              <span className="font-display text-[11px] font-semibold tracking-[0.12em] text-muted-foreground uppercase">
                For Students & Fresh Architects
              </span>
            </motion.div>
            
            {/* Headline */}
            <motion.div custom={1} variants={fadeUp} initial="hidden" animate="visible">
              <h1 className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-[1.08] tracking-tight">
                Learn Architecture
                <br />
                <span className="text-muted-foreground/70">the Way It's Actually</span>
                <br />
                <span className="text-accent">Practiced.</span>
              </h1>
            </motion.div>
            
            {/* Subheadline */}
            <motion.p 
              custom={2} variants={fadeUp} initial="hidden" animate="visible"
              className="text-body-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed mt-7"
            >
              Projects, critiques, and real-world workflows used by professional architecture studios.
              {' '}
              <span className="text-foreground/80 font-medium">
                Master what college never taught you.
              </span>
            </motion.p>
            
            {/* CTAs */}
            <motion.div 
              custom={3} variants={fadeUp} initial="hidden" animate="visible"
              className="flex flex-col sm:flex-row items-center gap-3 justify-center mt-9"
            >
              <Link to={user ? "/courses" : "/auth?mode=signup"} className="w-full sm:w-auto">
                <Button size="xl" className="gap-2.5 group w-full sm:w-auto bg-accent text-accent-foreground hover:bg-accent/90 shadow-[0_4px_24px_hsl(var(--accent)/0.2)] text-base px-8">
                  {user ? "Explore Courses" : "Start Learning"}
                  <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                </Button>
              </Link>
              <Link to="/explore" className="w-full sm:w-auto">
                <Button variant="ghost" size="xl" className="gap-2 w-full sm:w-auto text-muted-foreground hover:text-foreground text-base">
                  <Play className="h-4 w-4" />
                  Explore Community
                </Button>
              </Link>
            </motion.div>
            
            {/* Trust signals */}
            <motion.div 
              custom={4} variants={fadeUp} initial="hidden" animate="visible"
              className="flex items-center gap-2.5 justify-center mt-8 text-xs text-muted-foreground/50"
            >
              <span>Free course previews</span>
              <span className="w-1 h-1 rounded-full bg-muted-foreground/20" />
              <span>No credit card required</span>
              <span className="w-1 h-1 rounded-full bg-muted-foreground/20" />
              <span>Cancel anytime</span>
            </motion.div>
          </div>
        </div>
      </div>
      
      <MarqueeStrip />
    </section>
  );
}
