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
      {/* Dark background */}
      <div className="absolute inset-0 bg-foreground" />
      
      {/* Subtle accent glow */}
      <div 
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, hsl(var(--accent) / 0.06) 0%, transparent 70%)' }}
      />

      <div className="container-wide relative">
        <motion.div 
          className="max-w-2xl mx-auto text-center space-y-8 py-8"
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
        >
          <motion.div variants={fadeInUp} className="font-display text-caption uppercase tracking-[0.16em] text-accent/70">
            Join 10,000+ Architecture Students
          </motion.div>
          
          <motion.h2 
            variants={fadeInUp}
            className="font-display text-3xl sm:text-4xl md:text-5xl font-bold leading-[1.1] text-background"
          >
            Stop Guessing Architecture.
            <br />
            <span className="opacity-40">Start Building Better Design Skills.</span>
          </motion.h2>
          
          <motion.p variants={fadeInUp} className="text-body-lg text-background/50 max-w-lg mx-auto">
            You've spent years learning theory. Spend a few months learning practice. 
            The difference will last your entire career.
          </motion.p>

          <motion.div variants={fadeInUp} className="pt-2">
            <Link to={user ? "/courses" : "/auth?mode=signup"}>
              <Button 
                size="xl" 
                className="bg-accent text-accent-foreground hover:bg-accent/90 gap-2.5 group shadow-[0_4px_24px_hsl(var(--accent)/0.25)] text-base px-10"
              >
                {user ? "Explore Courses" : "Start Learning Free"}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
          </motion.div>

          <motion.p variants={fadeInUp} className="text-caption text-background/25">
            {user ? "Explore all course programs and community features" : "Free course previews available. No credit card required."}
          </motion.p>
        </motion.div>
      </div>
    </section>
  );
}
