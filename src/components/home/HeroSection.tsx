import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, Play, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useNetworkSpeed } from '@/hooks/useNetworkSpeed';

const ease = [0.22, 1, 0.36, 1] as const;

const fadeUp = (isSlow: boolean) => ({
  hidden: { opacity: 0, y: isSlow ? 0 : 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: isSlow ? 0.3 : 0.7, ease: ease as unknown as [number, number, number, number], delay: isSlow ? 0 : i * 0.12 }
  })
});

function MarqueeStrip({ isSlow }: { isSlow: boolean }) {
  const words = [
    'WORKING DRAWINGS', 'SITE ANALYSIS', 'CONSTRUCTION LOGIC', 'STRUCTURAL COORDINATION',
    'DETAILING', 'SPECIFICATIONS', 'MEP INTEGRATION', 'BIM MODELING',
    '3DS MAX', 'AUTOCAD', 'REVIT', 'SKETCHUP', 'CORONA RENDERING'
  ];
  
  if (isSlow) return (
    <div className="absolute bottom-0 left-0 right-0 overflow-hidden border-t border-border/10 bg-background/50 py-3 flex justify-center gap-10">
      {words.slice(0, 4).map((word, i) => (
        <span key={i} className="font-mono text-[9px] tracking-[0.2em] text-muted-foreground/30 font-medium">
          {word}
        </span>
      ))}
    </div>
  );

  return (
    <div className="absolute bottom-0 left-0 right-0 overflow-hidden border-t border-border/10">
      <div className="flex animate-marquee whitespace-nowrap py-3.5">
        {[...words, ...words].map((word, i) => (
          <span key={i} className="mx-6 sm:mx-10 font-mono text-[10px] tracking-[0.25em] text-muted-foreground/25 font-medium hover:text-accent/40 transition-colors duration-300 cursor-default">
            {word}
          </span>
        ))}
      </div>
    </div>
  );
}

const trustItems = ['Free course previews', 'No credit card required', 'Cancel anytime'];

export function HeroSection() {
  const { user } = useAuth();
  const { isSlow } = useNetworkSpeed();
  const anims = fadeUp(isSlow);
  
  return (
    <section className="relative min-h-[92vh] flex items-center overflow-hidden">
      {/* Ambient background */}
      <div className="absolute inset-0 bg-gradient-to-b from-muted/30 via-background to-background" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_50%_0%,hsl(var(--accent)/0.05),transparent)]" />
      
      {/* Animated orbs - hidden on slow connections */}
      {!isSlow && (
        <>
          <motion.div
            animate={{ x: [0, 30, 0], y: [0, -20, 0] }}
            transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute top-20 right-[15%] h-[350px] w-[350px] rounded-full bg-[radial-gradient(circle,hsl(var(--accent)/0.06),transparent_65%)] blur-3xl pointer-events-none"
          />
          <motion.div
            animate={{ x: [0, -25, 0], y: [0, 15, 0] }}
            transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute bottom-20 left-[10%] h-[400px] w-[400px] rounded-full bg-[radial-gradient(circle,hsl(var(--blueprint)/0.05),transparent_65%)] blur-3xl pointer-events-none"
          />
        </>
      )}
      
      {/* Dot grid */}
      <div className="absolute inset-0 dot-grid opacity-20 pointer-events-none" />
      
      <div className="relative section-padding w-full z-10">
        <div className="container-wide">
          <div className="max-w-4xl mx-auto text-center">
            {/* Label */}
            <motion.div 
              custom={0} variants={anims} initial="hidden" animate="visible"
              className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full border border-border/40 bg-card/30 backdrop-blur-sm mb-8"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
              <span className="font-display text-[11px] font-semibold tracking-[0.12em] text-muted-foreground uppercase">
                For Students & Fresh Architects
              </span>
            </motion.div>
            
            {/* Headline */}
            <motion.div custom={1} variants={anims} initial="hidden" animate="visible">
              <h1 className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-[1.08] tracking-tight">
                Learn Architecture
                <br />
                <span className="text-muted-foreground/70">the Way It's Actually</span>
                <br />
                <span className="text-hero-gradient">Practiced.</span>
              </h1>
            </motion.div>
            
            {/* Subheadline */}
            <motion.p 
              custom={2} variants={anims} initial="hidden" animate="visible"
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
              custom={3} variants={anims} initial="hidden" animate="visible"
              className="flex flex-col sm:flex-row items-center gap-3 justify-center mt-9"
            >
              <Link to={user ? "/courses" : "/auth?mode=signup"} className="w-full sm:w-auto">
                <Button size="xl" className="gap-2.5 group w-full sm:w-auto bg-accent text-accent-foreground hover:bg-accent/90 shadow-[0_4px_24px_hsl(var(--accent)/0.25)] hover:shadow-[0_8px_32px_hsl(var(--accent)/0.35)] text-base px-8 rounded-full transition-all duration-300">
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
              custom={4} variants={anims} initial="hidden" animate="visible"
              className="flex flex-wrap items-center gap-4 justify-center mt-9"
            >
              {trustItems.map((item) => (
                <span key={item} className="inline-flex items-center gap-1.5 text-xs text-muted-foreground/60">
                  <CheckCircle2 className="h-3 w-3 text-accent/50" />
                  {item}
                </span>
              ))}
            </motion.div>
          </div>
        </div>
      </div>
      
      <MarqueeStrip isSlow={isSlow} />
    </section>
  );
}
