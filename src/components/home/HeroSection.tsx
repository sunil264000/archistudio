import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, BookOpen, CheckCircle, Sparkles, Play } from 'lucide-react';
import { Background3D } from '@/components/3d/Background3D';
import { motion } from 'framer-motion';

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.2
    }
  }
};

export function HeroSection() {
  return (
    <section className="relative overflow-hidden min-h-[90vh] flex items-center">
      {/* 3D Background */}
      <Background3D intensity="medium" />
      
      {/* Enhanced gradient overlays */}
      <div className="absolute inset-0 bg-gradient-to-b from-background/50 via-transparent to-background pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-r from-background/30 via-transparent to-background/30 pointer-events-none" />
      
      {/* Animated accent orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-accent/20 rounded-full blur-[120px] animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-primary/15 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '1s' }} />
      
      {/* Grid pattern background */}
      <div className="absolute inset-0 grid-pattern opacity-20" />
      
      <div className="relative section-padding w-full">
        <div className="container-wide">
          <motion.div 
            className="max-w-4xl mx-auto text-center space-y-8"
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
          >
            {/* Badge */}
            <motion.div 
              variants={fadeInUp}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-gradient-to-r from-accent/20 to-primary/20 backdrop-blur-md text-foreground text-sm font-medium border border-accent/30 shadow-lg"
            >
              <Sparkles className="h-4 w-4 text-accent" />
              For Students & Fresh Architects
            </motion.div>
            
            {/* Headline */}
            <motion.h1 
              variants={fadeInUp}
              className="text-4xl md:text-5xl lg:text-7xl font-display font-bold tracking-tight leading-[1.1]"
            >
              Learn Architecture the Way{' '}
              <span className="relative inline-block">
                <span className="bg-gradient-to-r from-accent via-primary to-accent bg-[length:200%_auto] bg-clip-text text-transparent animate-shimmer">
                  It Is Actually Practiced
                </span>
                <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 300 12" fill="none">
                  <motion.path 
                    d="M2 10C50 4 100 2 150 6C200 10 250 4 298 8" 
                    stroke="hsl(var(--accent))" 
                    strokeWidth="3" 
                    strokeLinecap="round"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 1.5, delay: 0.8 }}
                  />
                </svg>
              </span>
            </motion.h1>
            
            {/* Subheadline */}
            <motion.p 
              variants={fadeInUp}
              className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto leading-relaxed"
            >
              From site analysis to working drawings, construction logic to sustainability — 
              <span className="text-foreground font-medium"> practical skills that colleges don't teach</span> but the industry demands.
            </motion.p>

            {/* CTAs */}
            <motion.div 
              variants={fadeInUp}
              className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4"
            >
              <Link to="/auth?mode=signup">
                <Button variant="glow" size="xl" className="gap-3 text-base group">
                  Start Learning Today
                  <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
              <a href="#courses">
                <Button variant="outline" size="xl" className="gap-3 text-base backdrop-blur-sm bg-background/50 group">
                  <Play className="h-5 w-5 transition-transform group-hover:scale-110" />
                  See Course Curriculum
                </Button>
              </a>
            </motion.div>

            {/* Trust indicators */}
            <motion.div 
              variants={fadeInUp}
              className="flex flex-wrap items-center justify-center gap-x-8 gap-y-4 pt-10"
            >
              {[
                "No prior CAD knowledge needed",
                "Learn at your own pace",
                "Certificate on completion"
              ].map((text, i) => (
                <motion.div 
                  key={text}
                  className="flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/50 backdrop-blur-sm border border-border/50"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 1 + i * 0.1 }}
                >
                  <CheckCircle className="h-5 w-5 text-success" />
                  <span className="text-sm text-muted-foreground">{text}</span>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Decorative architectural element */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-accent/50 to-transparent" />
      
      {/* Floating shapes */}
      <motion.div 
        className="absolute top-20 right-10 w-20 h-20 border border-accent/30 rotate-45"
        animate={{ 
          y: [0, -20, 0],
          rotate: [45, 50, 45]
        }}
        transition={{ 
          duration: 5,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      <motion.div 
        className="absolute bottom-40 left-10 w-16 h-16 bg-gradient-to-br from-accent/20 to-transparent rounded-full"
        animate={{ 
          y: [0, 20, 0],
          scale: [1, 1.1, 1]
        }}
        transition={{ 
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
    </section>
  );
}
