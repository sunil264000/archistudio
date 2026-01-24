import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, Sparkles } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { motion } from 'framer-motion';
import { 
  staggerContainer,
  fadeInUp,
  FloatingElement
} from '@/components/animations/AnimatedSection';

export function FinalCTASection() {
  const { user } = useAuth();

  return (
    <section className="section-padding bg-primary text-primary-foreground relative overflow-hidden">
      {/* Animated grid pattern */}
      <motion.div 
        className="absolute inset-0 opacity-10"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 0.1 }}
        viewport={{ once: true }}
      >
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="cta-grid" width="60" height="60" patternUnits="userSpaceOnUse">
              <path d="M 60 0 L 0 0 0 60" fill="none" stroke="currentColor" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#cta-grid)" />
        </svg>
      </motion.div>

      {/* Floating accent elements */}
      <FloatingElement className="absolute top-10 left-[10%] opacity-20" yOffset={30} duration={7}>
        <div className="w-24 h-24 rounded-full border border-current" />
      </FloatingElement>
      <FloatingElement className="absolute bottom-10 right-[10%] opacity-20" yOffset={25} duration={6} delay={1}>
        <div className="w-16 h-16 rotate-45 border border-current" />
      </FloatingElement>
      
      {/* Glowing orbs */}
      <motion.div 
        className="absolute top-1/4 left-1/4 w-64 h-64 bg-accent/10 rounded-full blur-[100px]"
        animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.2, 0.1] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      />

      <div className="container-wide relative">
        <motion.div 
          className="max-w-3xl mx-auto text-center space-y-8"
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
        >
          {/* Sparkle badge */}
          <motion.div
            variants={fadeInUp}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20"
          >
            <motion.div
              animate={{ rotate: [0, 15, -15, 0] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
            >
              <Sparkles className="h-4 w-4 text-accent" />
            </motion.div>
            <span className="text-sm font-medium">Transform Your Career</span>
          </motion.div>
          
          <motion.h2 
            variants={fadeInUp}
            className="text-3xl md:text-4xl lg:text-5xl font-display font-bold leading-tight"
          >
            Stop Guessing Architecture.{' '}
            <motion.span 
              className="opacity-70"
              whileHover={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              Start Understanding It.
            </motion.span>
          </motion.h2>
          
          <motion.p 
            variants={fadeInUp}
            className="text-lg opacity-80 max-w-xl mx-auto"
          >
            You've spent years learning theory. Spend a few months learning practice. 
            The difference will last your entire career.
          </motion.p>

          <motion.div 
            variants={fadeInUp}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4"
          >
            <Link to={user ? "/courses" : "/auth?mode=signup"}>
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button 
                  size="lg" 
                  variant="secondary" 
                  className="gap-2 text-base px-8 h-12 relative overflow-hidden group"
                >
                  {/* Shimmer effect */}
                  <motion.span
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                    initial={{ x: '-100%' }}
                    animate={{ x: '200%' }}
                    transition={{ duration: 2, repeat: Infinity, repeatDelay: 4 }}
                  />
                  <span className="relative z-10">
                    {user ? "Explore Studios" : "Start Your Free Account"}
                  </span>
                  <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1 relative z-10" />
                </Button>
              </motion.div>
            </Link>
          </motion.div>

          <motion.p 
            variants={fadeInUp}
            className="text-sm opacity-60"
          >
            {user ? "Explore 70+ studio programs" : "Free preview sessions available. No credit card required."}
          </motion.p>
        </motion.div>
      </div>

      {/* Bottom accent line */}
      <motion.div 
        className="absolute bottom-0 left-0 right-0 h-px"
        initial={{ scaleX: 0 }}
        whileInView={{ scaleX: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1.5, delay: 0.3 }}
        style={{ background: 'linear-gradient(to right, transparent, hsl(var(--accent) / 0.5), transparent)' }}
      />
    </section>
  );
}
