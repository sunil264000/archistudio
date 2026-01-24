import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, CheckCircle, Sparkles, Star } from 'lucide-react';
import { Background3D } from '@/components/3d/Background3D';
import { motion } from 'framer-motion';
import { 
  FloatingBadge, 
  AnimatedUnderline, 
  FloatingElement,
  staggerContainer,
  fadeInUp 
} from '@/components/animations/AnimatedSection';
import { useAuth } from '@/contexts/AuthContext';

export function HeroSection() {
  const { user } = useAuth();
  
  return (
    <section className="relative overflow-hidden min-h-[90vh] flex items-center">
      {/* 3D Background */}
      <Background3D intensity="medium" />
      
      {/* Enhanced gradient overlays */}
      <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-transparent to-background pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-r from-background/40 via-transparent to-background/40 pointer-events-none" />
      
      {/* Animated accent orbs with better glow */}
      <motion.div 
        className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-accent/15 rounded-full blur-[150px]"
        animate={{ 
          scale: [1, 1.2, 1],
          opacity: [0.15, 0.25, 0.15]
        }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div 
        className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-primary/10 rounded-full blur-[120px]"
        animate={{ 
          scale: [1.2, 1, 1.2],
          opacity: [0.1, 0.2, 0.1]
        }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }}
      />
      
      {/* Animated grid pattern */}
      <div className="absolute inset-0 grid-pattern opacity-30" />
      
      {/* Architectural grid lines */}
      <svg className="absolute inset-0 w-full h-full opacity-[0.08]" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="hero-grid" width="80" height="80" patternUnits="userSpaceOnUse">
            <path d="M 80 0 L 0 0 0 80" fill="none" stroke="currentColor" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#hero-grid)" />
      </svg>
      
      <div className="relative section-padding w-full">
        <div className="container-wide">
          <motion.div 
            className="max-w-4xl mx-auto text-center space-y-8"
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
          >
            {/* Floating Badge with glow */}
            <motion.div variants={fadeInUp}>
              <FloatingBadge 
                icon={<Sparkles className="h-4 w-4 text-accent" />}
                className="shadow-[0_0_40px_-10px_hsl(var(--accent)/0.4)]"
              >
                For Students & Fresh Architects
              </FloatingBadge>
            </motion.div>
            
            {/* Headline with animated underline */}
            <motion.h1 
              variants={fadeInUp}
              className="text-4xl md:text-5xl lg:text-7xl font-display font-bold tracking-tight leading-[1.1]"
            >
              <motion.span
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
              >
                Learn Architecture the Way
              </motion.span>{' '}
              <span className="relative inline-block mt-2">
                <motion.span 
                  className="bg-gradient-to-r from-accent via-primary to-accent bg-[length:200%_auto] bg-clip-text text-transparent"
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ 
                    opacity: 1, 
                    y: 0,
                    backgroundPosition: ['0% center', '200% center']
                  }}
                  transition={{ 
                    opacity: { duration: 0.6, delay: 0.5 },
                    y: { duration: 0.6, delay: 0.5 },
                    backgroundPosition: { duration: 8, repeat: Infinity, ease: "linear" }
                  }}
                >
                  It Is Actually Practiced
                </motion.span>
                <AnimatedUnderline delay={1} />
              </span>
            </motion.h1>
            
            {/* Positioning Statement */}
            <motion.div
              variants={fadeInUp}
              className="max-w-3xl mx-auto mb-4"
            >
              <div className="px-6 py-4 rounded-xl bg-secondary/60 backdrop-blur-sm border border-border/50">
                <p className="text-lg md:text-xl text-foreground font-medium leading-relaxed text-center">
                  This platform teaches what architecture colleges and CAD institutes don't:{' '}
                  <span className="text-accent">how real buildings are designed, detailed, and executed in offices.</span>
                </p>
              </div>
            </motion.div>
            
            {/* Subheadline with word highlighting */}
            <motion.p 
              variants={fadeInUp}
              className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed"
            >
              From site analysis to working drawings, construction logic to sustainability — 
              <motion.span 
                className="text-foreground font-medium"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.2, duration: 0.5 }}
              > practical skills</motion.span> the industry demands.
            </motion.p>

            {/* CTAs with enhanced hover */}
            <motion.div 
              variants={fadeInUp}
              className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4"
            >
              <Link to={user ? "/courses" : "/auth?mode=signup"}>
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button variant="glow" size="xl" className="gap-3 text-base group relative overflow-hidden">
                    <motion.span
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                      initial={{ x: '-100%' }}
                      animate={{ x: '200%' }}
                      transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                    />
                    {user ? "Explore Studios" : "Begin Your Practice"}
                    <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                  </Button>
                </motion.div>
              </Link>
            </motion.div>

            {/* Trust indicators with staggered animation */}
            <motion.div 
              variants={fadeInUp}
              className="flex flex-wrap items-center justify-center gap-x-6 gap-y-4 pt-10"
            >
              {[
                "No prior CAD knowledge needed",
                "Learn at your own pace",
                "Proof of Completion included"
              ].map((text, i) => (
                <motion.div 
                  key={text}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-secondary/60 backdrop-blur-sm border border-border/50 hover:border-accent/30 transition-colors"
                  initial={{ opacity: 0, scale: 0.8, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ delay: 1.2 + i * 0.15, duration: 0.5 }}
                  whileHover={{ scale: 1.05, y: -2 }}
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
      <motion.div 
        className="absolute bottom-0 left-0 right-0 h-px"
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 1.5, delay: 0.5 }}
        style={{ background: 'linear-gradient(to right, transparent, hsl(var(--accent) / 0.6), transparent)' }}
      />
      
      {/* Floating decorative shapes */}
      <FloatingElement className="absolute top-20 right-[10%] hidden lg:block" yOffset={25} duration={6}>
        <motion.div 
          className="w-20 h-20 border border-accent/30 rotate-45"
          animate={{ rotate: [45, 55, 45] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
      </FloatingElement>
      
      <FloatingElement className="absolute bottom-40 left-[8%] hidden lg:block" yOffset={20} duration={5} delay={1}>
        <div className="w-16 h-16 bg-gradient-to-br from-accent/20 to-transparent rounded-full" />
      </FloatingElement>
      
      <FloatingElement className="absolute top-1/3 right-[5%] hidden xl:block" yOffset={15} duration={7} delay={2}>
        <Star className="h-8 w-8 text-accent/30" />
      </FloatingElement>
      
      {/* Corner accent lines */}
      <motion.div
        className="absolute top-0 left-0 w-40 h-40 hidden lg:block"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
      >
        <svg className="w-full h-full" viewBox="0 0 160 160">
          <motion.path
            d="M0 80 L0 0 L80 0"
            stroke="hsl(var(--accent) / 0.3)"
            strokeWidth="1"
            fill="none"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.5, delay: 1.5 }}
          />
        </svg>
      </motion.div>
      
      <motion.div
        className="absolute bottom-0 right-0 w-40 h-40 hidden lg:block"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
      >
        <svg className="w-full h-full" viewBox="0 0 160 160">
          <motion.path
            d="M160 80 L160 160 L80 160"
            stroke="hsl(var(--accent) / 0.3)"
            strokeWidth="1"
            fill="none"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.5, delay: 1.7 }}
          />
        </svg>
      </motion.div>
    </section>
  );
}
