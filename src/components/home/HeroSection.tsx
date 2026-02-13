import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, Play } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, delay: i * 0.12, ease: [0.22, 1, 0.36, 1] as const }
  })
};

// Scrolling marquee of architecture keywords
function MarqueeStrip() {
  const words = [
    'WORKING DRAWINGS', 'SITE ANALYSIS', 'CONSTRUCTION LOGIC', 'STRUCTURAL COORDINATION',
    'DETAILING', 'SPECIFICATIONS', 'MEP INTEGRATION', 'SUSTAINABILITY', 'BIM MODELING',
    '3DS MAX', 'AUTOCAD', 'REVIT', 'SKETCHUP', 'CORONA RENDERING'
  ];
  
  return (
    <div className="absolute bottom-0 left-0 right-0 overflow-hidden border-t border-border/30 bg-background/50 backdrop-blur-sm">
      <div className="flex animate-marquee whitespace-nowrap py-3 sm:py-4">
        {[...words, ...words].map((word, i) => (
          <span key={i} className="mx-4 sm:mx-8 text-[10px] sm:text-xs font-mono tracking-[0.2em] text-muted-foreground/60">
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
    <section className="relative min-h-[100vh] flex items-center overflow-hidden">
      {/* Clean gradient background */}
      <div className="absolute inset-0 bg-gradient-to-b from-secondary/40 via-background to-background" />
      
      {/* Subtle geometric shapes - desktop only */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none hidden md:block">
        <motion.div 
          className="absolute top-[15%] right-[8%] w-[300px] h-[300px] rounded-full border border-border/30"
          animate={{ rotate: 360 }}
          transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
        />
        <motion.div 
          className="absolute bottom-[20%] left-[5%] w-[200px] h-[200px] border border-border/20 rotate-45"
          animate={{ rotate: [45, 135, 45] }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div 
          className="absolute top-[40%] right-[25%] w-2 h-2 rounded-full bg-accent/40"
          animate={{ scale: [1, 1.5, 1], opacity: [0.4, 0.8, 0.4] }}
          transition={{ duration: 3, repeat: Infinity }}
        />
        <motion.div 
          className="absolute top-[25%] left-[30%] w-1.5 h-1.5 rounded-full bg-accent/30"
          animate={{ scale: [1, 2, 1], opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 4, repeat: Infinity, delay: 1 }}
        />
      </div>
      
      {/* Grid lines - desktop */}
      <svg className="absolute inset-0 w-full h-full opacity-[0.03] hidden lg:block" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="hero-grid" width="80" height="80" patternUnits="userSpaceOnUse">
            <path d="M 80 0 L 0 0 0 80" fill="none" stroke="currentColor" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#hero-grid)" />
      </svg>
      
      <div className="relative section-padding w-full">
        <div className="container-wide">
          <div className="max-w-5xl mx-auto">
            <div className="grid lg:grid-cols-[1.2fr_0.8fr] gap-12 lg:gap-16 items-center">
              {/* Left content */}
              <div className="space-y-6 sm:space-y-8 text-center lg:text-left">
                {/* Label */}
                <motion.div 
                  custom={0} variants={fadeUp} initial="hidden" animate="visible"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-border bg-card/80 backdrop-blur-sm"
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                  <span className="text-xs font-medium tracking-wide text-muted-foreground">
                    For Students & Fresh Architects
                  </span>
                </motion.div>
                
                {/* Headline */}
                <motion.h1 
                  custom={1} variants={fadeUp} initial="hidden" animate="visible"
                  className="font-display font-bold"
                >
                  Learn Architecture
                  <br />
                  <span className="text-accent">the Way It Is</span>
                  <br />
                  <span className="text-accent">Actually Practiced</span>
                </motion.h1>
                
                {/* Positioning statement */}
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
                    <Button variant="default" size="xl" className="gap-2 group w-full sm:w-auto">
                      {user ? "Explore Studios" : "Start Learning Free"}
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </Button>
                  </Link>
                  <Link to="/courses" className="w-full sm:w-auto">
                    <Button variant="outline" size="xl" className="gap-2 w-full sm:w-auto">
                      <Play className="h-4 w-4" />
                      Preview Sessions
                    </Button>
                  </Link>
                </motion.div>
                
                {/* Stats row */}
                <motion.div 
                  custom={4} variants={fadeUp} initial="hidden" animate="visible"
                  className="flex items-center gap-6 sm:gap-10 justify-center lg:justify-start pt-4"
                >
                  {[
                    { value: '70+', label: 'Studio Programs' },
                    { value: '2,000+', label: 'Students' },
                    { value: '4.9', label: 'Avg Rating' },
                  ].map((stat) => (
                    <div key={stat.label} className="text-center lg:text-left">
                      <div className="text-xl sm:text-2xl font-bold text-foreground">{stat.value}</div>
                      <div className="text-[11px] sm:text-xs text-muted-foreground tracking-wide">{stat.label}</div>
                    </div>
                  ))}
                </motion.div>
              </div>
              
              {/* Right - Premium visual card */}
              <motion.div
                custom={2} variants={fadeUp} initial="hidden" animate="visible"
                className="hidden lg:block"
              >
                <div className="relative">
                  {/* Main card */}
                  <motion.div 
                    className="relative rounded-2xl border border-border bg-card/60 backdrop-blur-sm p-8 space-y-6 overflow-hidden"
                    whileHover={{ y: -4 }}
                    transition={{ duration: 0.4 }}
                  >
                    {/* Accent line top */}
                    <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-accent to-transparent" />
                    
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
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.8 + i * 0.1 }}
                        >
                          <div className="w-1 h-1 rounded-full bg-accent shrink-0" />
                          {item}
                        </motion.div>
                      ))}
                    </div>
                    
                    {/* Decorative corner */}
                    <div className="absolute bottom-0 right-0 w-24 h-24 border-t border-l border-border/50 rounded-tl-3xl" />
                  </motion.div>
                  
                  {/* Shadow card behind */}
                  <div className="absolute -bottom-3 -right-3 inset-x-3 h-full rounded-2xl border border-border/50 bg-secondary/30 -z-10" />
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Marquee strip at bottom */}
      <MarqueeStrip />
    </section>
  );
}
