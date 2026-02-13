import { 
  MapPin, PenTool, Layers, Building2, 
  Leaf, FileText, Ruler, Lightbulb 
} from 'lucide-react';
import { motion } from 'framer-motion';
import { 
  staggerContainerFast,
  fadeInUp
} from '@/components/animations/AnimatedSection';

const modules = [
  { icon: MapPin, title: 'Site Analysis', description: 'Read sites like experienced architects. Context, constraints, opportunities.' },
  { icon: PenTool, title: 'Working Drawings', description: 'Complete drawing sets that contractors can actually build from.' },
  { icon: Layers, title: 'Construction Logic', description: 'How buildings go up. Sequences, dependencies, and the "why" behind methods.' },
  { icon: Building2, title: 'Structural Coordination', description: 'Read and coordinate with structural drawings confidently.' },
  { icon: Leaf, title: 'Sustainability', description: 'Climate-responsive design, energy efficiency, material consciousness.' },
  { icon: FileText, title: 'Specifications', description: 'Write specs that protect your design intent and quality standards.' },
  { icon: Ruler, title: 'Detailing', description: 'Create details that solve real problems. Junctions, transitions, craft.' },
  { icon: Lightbulb, title: 'Services Integration', description: 'Understand MEP coordination. Your building needs more than walls.' },
];

export function WhatYouLearnSection() {
  return (
    <section className="section-padding bg-secondary/30 relative overflow-hidden">
      <div className="container-wide">
        <motion.div 
          className="max-w-3xl mx-auto text-center mb-14 sm:mb-20"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
        >
          <div className="section-label mb-4">The Curriculum</div>
          <h2 className="font-display font-bold mb-4">What You'll Actually Learn</h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Eight comprehensive modules covering everything your college skipped. 
            Each built on real-world project experience.
          </p>
        </motion.div>

        <motion.div 
          className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5"
          variants={staggerContainerFast}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
        >
          {modules.map((module, i) => (
            <motion.div 
              key={i}
              variants={fadeInUp}
              className="group relative p-6 rounded-xl bg-card border border-border hover:border-accent/30 transition-all duration-300 hover:shadow-medium"
            >
              <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center mb-4 group-hover:bg-accent/10 transition-colors">
                <module.icon className="h-5 w-5 text-accent" />
              </div>
              
              <h3 className="font-semibold text-base mb-2 group-hover:text-accent transition-colors">{module.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{module.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
