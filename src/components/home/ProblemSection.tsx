import { AlertTriangle } from 'lucide-react';
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
      <div className="container-wide">
        <div className="max-w-5xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            {/* Left */}
            <motion.div 
              className="space-y-5"
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
            >
              <motion.div variants={fadeInLeft} className="section-label">The Reality</motion.div>
              <motion.h2 variants={fadeInLeft} className="font-display leading-tight">
                Architecture College
                <br />
                Taught You Theory.
                <br />
                <span className="text-muted-foreground">But Not How to Practice.</span>
              </motion.h2>
              <motion.p variants={fadeInLeft} className="text-body text-muted-foreground max-w-md">
                Five years of education, countless studio projects, dozens of reviews — 
                and yet most graduates walk into their first job feeling completely unprepared.
              </motion.p>
            </motion.div>

            {/* Right */}
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
                    <div className="w-9 h-9 rounded-lg bg-warning/8 flex items-center justify-center">
                      <AlertTriangle className="h-4 w-4 text-warning" />
                    </div>
                  </div>
                  <p className="text-body-sm text-muted-foreground leading-relaxed">{problem}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>

          {/* Transition */}
          <motion.div 
            className="mt-16 text-center"
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full card-glass">
              <div className="w-1.5 h-1.5 rounded-full bg-accent" />
              <p className="text-body-sm font-medium text-foreground">We're here to bridge that gap. <span className="text-accent">Permanently.</span></p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
