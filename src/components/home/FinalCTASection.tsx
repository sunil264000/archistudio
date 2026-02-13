import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { motion } from 'framer-motion';
import { 
  staggerContainer,
  fadeInUp,
} from '@/components/animations/AnimatedSection';

export function FinalCTASection() {
  const { user } = useAuth();

  return (
    <section className="section-padding bg-foreground text-background relative overflow-hidden">
      {/* Subtle grid */}
      <div className="absolute inset-0 opacity-[0.04]">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="cta-grid" width="60" height="60" patternUnits="userSpaceOnUse">
              <path d="M 60 0 L 0 0 0 60" fill="none" stroke="currentColor" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#cta-grid)" />
        </svg>
      </div>

      {/* Accent glow */}
      <motion.div 
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-accent/10 rounded-full blur-[150px] pointer-events-none"
        animate={{ scale: [1, 1.15, 1], opacity: [0.1, 0.15, 0.1] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />

      <div className="container-wide relative">
        <motion.div 
          className="max-w-2xl mx-auto text-center space-y-8"
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
        >
          <motion.div variants={fadeInUp} className="section-label !text-accent/80">Transform Your Career</motion.div>
          
          <motion.h2 
            variants={fadeInUp}
            className="text-3xl sm:text-4xl md:text-5xl font-display font-bold leading-tight"
          >
            Stop Guessing Architecture.
            <br />
            <span className="opacity-60">Start Understanding It.</span>
          </motion.h2>
          
          <motion.p variants={fadeInUp} className="text-lg opacity-70 max-w-lg mx-auto">
            You've spent years learning theory. Spend a few months learning practice. 
            The difference will last your entire career.
          </motion.p>

          <motion.div variants={fadeInUp} className="pt-2">
            <Link to={user ? "/courses" : "/auth?mode=signup"}>
              <Button 
                size="xl" 
                className="bg-accent text-accent-foreground hover:bg-accent/90 gap-2 group shadow-[0_0_30px_hsl(var(--accent)/0.3)]"
              >
                {user ? "Explore Studios" : "Start Your Free Account"}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
          </motion.div>

          <motion.p variants={fadeInUp} className="text-sm opacity-50">
            {user ? "Explore 70+ studio programs" : "Free preview sessions available. No credit card required."}
          </motion.p>
        </motion.div>
      </div>
    </section>
  );
}
