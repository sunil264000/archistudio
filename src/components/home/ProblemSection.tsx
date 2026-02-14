import { AlertTriangle, ArrowDown } from 'lucide-react';
import { motion } from 'framer-motion';
import { 
  fadeInUp, 
  fadeInLeft, 
  fadeInRight,
  staggerContainer,
} from '@/components/animations/AnimatedSection';

export function ProblemSection() {
  const problems = [
    "You can sketch beautiful concepts but can't read a structural drawing",
    "You learned AutoCAD basics but never created drawings contractors can build from",
    "You understand design theory but freeze when asked about construction sequences",
    "You spent years in college but still feel unprepared for your first real project"
  ];

  return (
    <section className="section-padding relative overflow-hidden">
      {/* Subtle orb */}
      <div className="absolute top-[20%] right-[-10%] w-[400px] h-[400px] rounded-full bg-accent/[0.03] blur-[100px] pointer-events-none" />
      
      <div className="container-wide">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            {/* Left - heading */}
            <motion.div 
              className="space-y-6"
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
            >
              <motion.div variants={fadeInLeft} className="section-label">The Reality</motion.div>
              <motion.h2 
                variants={fadeInLeft}
                className="font-display font-bold leading-tight"
              >
                Architecture College
                <br />
                Taught You Theory.
                <br />
                <span className="text-muted-foreground">But Not How to Practice.</span>
              </motion.h2>
              <motion.p variants={fadeInLeft} className="text-muted-foreground leading-relaxed max-w-md">
                Five years of education, countless studio projects, dozens of reviews — 
                and yet most graduates walk into their first job feeling completely unprepared.
              </motion.p>
            </motion.div>

            {/* Right - problem cards */}
            <motion.div 
              className="space-y-3"
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-50px" }}
            >
              {problems.map((problem, i) => (
                <motion.div 
                  key={i}
                  variants={fadeInRight}
                  className="flex items-start gap-4 p-5 rounded-xl card-glass group"
                >
                  <div className="shrink-0 mt-0.5">
                    <div className="w-8 h-8 rounded-lg bg-warning/10 flex items-center justify-center group-hover:bg-warning/20 transition-colors">
                      <AlertTriangle className="h-4 w-4 text-warning" />
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed group-hover:text-foreground transition-colors">{problem}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>

          {/* Transition */}
          <motion.div 
            className="mt-16 sm:mt-20 text-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full card-glass">
              <div className="w-1.5 h-1.5 rounded-full bg-accent" />
              <p className="text-sm font-medium">We're here to bridge that gap. <span className="text-accent">Permanently.</span></p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
