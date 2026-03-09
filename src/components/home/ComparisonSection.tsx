import { X, Check } from 'lucide-react';
import { motion } from 'framer-motion';
import { 
  staggerContainerFast,
  fadeInUp
} from '@/components/animations/AnimatedSection';

const comparisons = [
  { aspect: 'Drawing Skills', college: 'Conceptual sketches and presentations', platform: 'Construction-ready working drawings' },
  { aspect: 'Site Understanding', college: 'Theoretical site analysis frameworks', platform: 'Practical site reading and documentation' },
  { aspect: 'Construction Knowledge', college: 'Abstract building technology courses', platform: 'Real construction sequences and logic' },
  { aspect: 'Coordination', college: 'Individual design projects', platform: 'Multi-discipline project coordination' },
  { aspect: 'Professional Skills', college: 'Studio critiques with professors', platform: 'Client meetings and contractor talks' },
  { aspect: 'Learning Style', college: 'Theory-first, practice-maybe-later', platform: 'Practice-first, theory-when-needed' },
];

export function ComparisonSection() {
  return (
    <section className="section-padding relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-background via-secondary/8 to-background" />
      
      <div className="container-wide relative">
        <motion.div 
          className="max-w-2xl mx-auto text-center mb-16"
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
        >
          <div className="section-label mb-4">The Difference</div>
          <h2 className="font-display mb-4">
            Why This Works When <span className="text-accent">College Didn't</span>
          </h2>
          <p className="text-body text-muted-foreground max-w-md mx-auto">
            It's not that college was useless. It just wasn't designed for practice.
          </p>
        </motion.div>

        <div className="max-w-4xl mx-auto">
          {/* Desktop table */}
          <div className="hidden sm:block">
            <div className="grid grid-cols-[1.2fr_1fr_1fr] gap-4 mb-4 px-5">
              <div className="text-caption uppercase tracking-widest text-muted-foreground">Aspect</div>
              <div className="text-caption uppercase tracking-widest text-muted-foreground text-center">College</div>
              <div className="text-caption uppercase tracking-widest text-accent text-center">Archistudio</div>
            </div>

            <motion.div 
              className="space-y-2"
              variants={staggerContainerFast}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-50px" }}
            >
              {comparisons.map((item, i) => (
                <motion.div 
                  key={i}
                  variants={fadeInUp}
                  className="grid grid-cols-[1.2fr_1fr_1fr] gap-4 p-5 rounded-xl card-glass items-center"
                >
                  <div className="font-display font-semibold text-body-sm text-foreground">{item.aspect}</div>
                  <div className="flex items-center gap-2 text-body-sm text-muted-foreground justify-center">
                    <X className="h-3.5 w-3.5 text-destructive/50 shrink-0" />
                    <span className="text-center">{item.college}</span>
                  </div>
                  <div className="flex items-center gap-2 text-body-sm justify-center">
                    <Check className="h-3.5 w-3.5 text-success shrink-0" />
                    <span className="text-center font-medium text-foreground">{item.platform}</span>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>

          {/* Mobile cards */}
          <motion.div 
            className="sm:hidden space-y-3"
            variants={staggerContainerFast}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {comparisons.map((item, i) => (
              <motion.div key={i} variants={fadeInUp} className="p-5 rounded-xl card-glass">
                <div className="font-display font-semibold text-accent text-body-sm mb-3">{item.aspect}</div>
                <div className="flex items-start gap-2.5 text-body-sm text-muted-foreground mb-2">
                  <X className="h-4 w-4 text-destructive/50 shrink-0 mt-0.5" />
                  <span>{item.college}</span>
                </div>
                <div className="flex items-start gap-2.5 text-body-sm">
                  <Check className="h-4 w-4 text-success shrink-0 mt-0.5" />
                  <span className="font-medium text-foreground">{item.platform}</span>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
