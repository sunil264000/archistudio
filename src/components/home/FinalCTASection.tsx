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
    <section className="section-padding relative overflow-hidden">
      {/* Dark premium background */}
      <div className="absolute inset-0 bg-foreground" />
      
      {/* Static accent glow */}
      <div 
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, hsl(var(--accent) / 0.06) 0%, transparent 70%)' }}
      />

      <div className="container-wide relative">
        <motion.div 
          className="max-w-2xl mx-auto text-center space-y-8"
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
        >
          <motion.div variants={fadeInUp} className="text-xs font-medium tracking-[0.15em] uppercase text-accent/80">
            Transform Your Career
          </motion.div>
          
          <motion.h2 
            variants={fadeInUp}
            className="text-3xl sm:text-4xl md:text-5xl font-display font-bold leading-tight text-background"
          >
            Stop Guessing Architecture.
            <br />
            <span className="opacity-50">Start Understanding It.</span>
          </motion.h2>
          
          <motion.p variants={fadeInUp} className="text-lg text-background/60 max-w-lg mx-auto">
            You've spent years learning theory. Spend a few months learning practice. 
            The difference will last your entire career.
          </motion.p>

          <motion.div variants={fadeInUp} className="pt-2">
            <Link to={user ? "/courses" : "/auth?mode=signup"}>
              <Button 
                size="xl" 
                className="bg-accent text-accent-foreground hover:bg-accent/90 gap-2 group shadow-lg"
              >
                {user ? "Explore Courses" : "Start Your Free Account"}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
          </motion.div>

          <motion.p variants={fadeInUp} className="text-sm text-background/40">
            {user ? "Explore all course programs" : "Free course previews available. No credit card required."}
          </motion.p>
        </motion.div>
      </div>
    </section>
  );
}
