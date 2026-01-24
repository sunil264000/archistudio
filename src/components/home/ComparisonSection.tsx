import { X, Check } from 'lucide-react';
import { motion } from 'framer-motion';
import { 
  staggerContainer,
  staggerContainerFast,
  fadeInUp
} from '@/components/animations/AnimatedSection';

const comparisons = [
  {
    aspect: 'Drawing Skills',
    college: 'Conceptual sketches and presentations',
    platform: 'Construction-ready working drawings',
  },
  {
    aspect: 'Site Understanding',
    college: 'Theoretical site analysis frameworks',
    platform: 'Practical site reading and documentation',
  },
  {
    aspect: 'Construction Knowledge',
    college: 'Abstract building technology courses',
    platform: 'Real construction sequences and logic',
  },
  {
    aspect: 'Coordination',
    college: 'Individual design projects',
    platform: 'Multi-discipline project coordination',
  },
  {
    aspect: 'Professional Skills',
    college: 'Studio critiques with professors',
    platform: 'Client meetings and contractor talks',
  },
  {
    aspect: 'Learning Style',
    college: 'Theory-first, practice-maybe-later',
    platform: 'Practice-first, theory-when-needed',
  },
];

export function ComparisonSection() {
  return (
    <section className="section-padding relative overflow-hidden">
      {/* Subtle animated gradient */}
      <motion.div 
        className="absolute inset-0 pointer-events-none opacity-20"
        animate={{
          background: [
            'radial-gradient(circle at 30% 70%, hsl(var(--destructive) / 0.1) 0%, transparent 40%), radial-gradient(circle at 70% 30%, hsl(var(--success) / 0.1) 0%, transparent 40%)',
            'radial-gradient(circle at 70% 70%, hsl(var(--destructive) / 0.1) 0%, transparent 40%), radial-gradient(circle at 30% 30%, hsl(var(--success) / 0.1) 0%, transparent 40%)',
            'radial-gradient(circle at 30% 70%, hsl(var(--destructive) / 0.1) 0%, transparent 40%), radial-gradient(circle at 70% 30%, hsl(var(--success) / 0.1) 0%, transparent 40%)',
          ]
        }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
      />
      
      <div className="container-wide relative">
        <motion.div 
          className="max-w-4xl mx-auto text-center mb-16"
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
        >
          <motion.div 
            variants={fadeInUp}
            className="text-technical mb-4"
          >
            The Difference
          </motion.div>
          <motion.h2 
            variants={fadeInUp}
            className="text-3xl md:text-4xl font-display font-bold mb-4"
          >
            Why This Works When{' '}
            <motion.span 
              className="text-accent"
              whileHover={{ scale: 1.05 }}
              style={{ display: 'inline-block' }}
            >
              College Didn't
            </motion.span>
          </motion.h2>
          <motion.p 
            variants={fadeInUp}
            className="text-lg text-muted-foreground"
          >
            It's not that college was useless. It just wasn't designed for practice.
          </motion.p>
        </motion.div>

        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <motion.div 
            className="grid grid-cols-3 gap-4 mb-4 text-sm font-medium"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="text-muted-foreground">Aspect</div>
            <div className="text-center text-muted-foreground">College Approach</div>
            <div className="text-center text-accent font-semibold">Our Approach</div>
          </motion.div>

          {/* Rows */}
          <motion.div 
            className="space-y-3"
            variants={staggerContainerFast}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
          >
            {comparisons.map((item, i) => (
              <motion.div 
                key={i}
                variants={fadeInUp}
                whileHover={{ 
                  scale: 1.01,
                  boxShadow: '0 10px 40px -10px hsl(var(--accent) / 0.1)',
                  borderColor: 'hsl(var(--accent) / 0.3)'
                }}
                className="grid grid-cols-3 gap-4 p-4 rounded-xl bg-card border border-border items-center transition-all duration-300 cursor-default"
              >
                <motion.div 
                  className="font-medium text-sm"
                  whileHover={{ x: 5 }}
                >
                  {item.aspect}
                </motion.div>
                <div className="text-center">
                  <motion.div 
                    className="inline-flex items-center gap-2 text-sm text-muted-foreground"
                    whileHover={{ scale: 0.98 }}
                  >
                    <motion.div
                      whileHover={{ rotate: 90 }}
                      transition={{ duration: 0.3 }}
                    >
                      <X className="h-4 w-4 text-destructive shrink-0" />
                    </motion.div>
                    <span className="hidden sm:inline">{item.college}</span>
                  </motion.div>
                </div>
                <div className="text-center">
                  <motion.div 
                    className="inline-flex items-center gap-2 text-sm font-medium"
                    whileHover={{ scale: 1.02 }}
                  >
                    <motion.div
                      whileHover={{ scale: 1.2 }}
                      transition={{ type: "spring", stiffness: 400 }}
                    >
                      <Check className="h-4 w-4 text-success shrink-0" />
                    </motion.div>
                    <span className="hidden sm:inline text-foreground">{item.platform}</span>
                  </motion.div>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Mobile-friendly alternative description */}
          <motion.div 
            className="sm:hidden mt-8 space-y-4"
            variants={staggerContainerFast}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {comparisons.map((item, i) => (
              <motion.div 
                key={i} 
                variants={fadeInUp}
                className="p-4 rounded-xl bg-card border border-border"
              >
                <div className="font-medium mb-3 text-accent">{item.aspect}</div>
                <div className="flex items-start gap-2 text-sm text-muted-foreground mb-2">
                  <X className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                  <span>College: {item.college}</span>
                </div>
                <div className="flex items-start gap-2 text-sm">
                  <Check className="h-4 w-4 text-success shrink-0 mt-0.5" />
                  <span className="font-medium">Here: {item.platform}</span>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
