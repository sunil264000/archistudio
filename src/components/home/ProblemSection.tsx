import { AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';
import { 
  AnimatedSection, 
  fadeInUp, 
  fadeInLeft, 
  fadeInRight,
  staggerContainer,
  GlowCard,
  AnimatedUnderline
} from '@/components/animations/AnimatedSection';

export function ProblemSection() {
  const problems = [
    "You can sketch beautiful concepts but can't read a structural drawing",
    "You learned AutoCAD basics but never created drawings contractors can build from",
    "You understand design theory but freeze when asked about construction sequences",
    "You spent years in college but still feel unprepared for your first real project"
  ];

  return (
    <section className="section-padding bg-secondary/30 relative overflow-hidden">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 opacity-30">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="problem-dots" width="40" height="40" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="1" fill="currentColor" opacity="0.3" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#problem-dots)" />
        </svg>
      </div>
      
      <div className="container-wide relative">
        <div className="max-w-5xl mx-auto">
          {/* Section label */}
          <AnimatedSection>
            <motion.div 
              className="text-technical mb-4"
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              The Reality
            </motion.div>
          </AnimatedSection>
          
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div 
              className="space-y-6"
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
            >
              <motion.h2 
                variants={fadeInLeft}
                className="text-3xl md:text-4xl font-display font-bold leading-tight"
              >
                Architecture College Taught You Theory.{' '}
                <span className="relative inline-block">
                  <span className="text-muted-foreground">But Not How to Practice.</span>
                  <AnimatedUnderline delay={0.5} color="hsl(var(--muted-foreground) / 0.4)" />
                </span>
              </motion.h2>
              <motion.p 
                variants={fadeInLeft}
                className="text-lg text-muted-foreground"
              >
                Five years of education, countless studio projects, dozens of reviews — 
                and yet most graduates walk into their first job feeling completely unprepared. 
                This isn't your fault. The curriculum was never designed for practice.
              </motion.p>
            </motion.div>

            <motion.div 
              className="space-y-4"
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-50px" }}
            >
              {problems.map((problem, i) => (
                <motion.div 
                  key={i}
                  variants={fadeInRight}
                  whileHover={{ 
                    scale: 1.02, 
                    x: 5,
                    boxShadow: '0 10px 30px -10px hsl(var(--warning) / 0.15)'
                  }}
                  className="flex items-start gap-4 p-4 rounded-lg bg-background border border-border hover:border-warning/30 transition-all duration-300 cursor-default"
                >
                  <motion.div
                    initial={{ rotate: 0 }}
                    whileHover={{ rotate: [0, -10, 10, 0] }}
                    transition={{ duration: 0.5 }}
                  >
                    <AlertTriangle className="h-5 w-5 text-warning mt-0.5 shrink-0" />
                  </motion.div>
                  <p className="text-sm text-muted-foreground">{problem}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>

          {/* Transition statement */}
          <motion.div 
            className="mt-16 text-center"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <p className="text-xl font-medium">
              We're here to bridge that gap.{' '}
              <motion.span 
                className="text-accent inline-block"
                whileHover={{ scale: 1.1 }}
                transition={{ type: "spring", stiffness: 400 }}
              >
                Permanently.
              </motion.span>
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
