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
    <section className="section-padding relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-background via-secondary/20 to-background" />
      
      <div className="container-wide relative">
        <motion.div 
          className="max-w-3xl mx-auto text-center mb-14 sm:mb-20"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5 }}
        >
          <div className="section-label mb-4">The Curriculum</div>
          <h2 className="font-display font-bold mb-4">What You'll Actually Learn</h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Eight comprehensive modules covering everything your college skipped. 
            Each built on real-world project experience.
          </p>
        </motion.div>

        <motion.div 
          className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4"
          variants={staggerContainerFast}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
        >
          {modules.map((module, i) => (
            <motion.div 
              key={i}
              variants={fadeInUp}
              className="group p-4 sm:p-6 rounded-xl card-glass hover:border-accent/30 transition-colors duration-300"
            >
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-secondary flex items-center justify-center mb-3 sm:mb-4 group-hover:bg-accent/10 transition-colors duration-300">
                <module.icon className="h-4 w-4 sm:h-5 sm:w-5 text-accent" />
              </div>
              
              <h3 className="font-semibold text-sm sm:text-base mb-1 sm:mb-2 group-hover:text-accent transition-colors duration-300">{module.title}</h3>
              <p className="text-muted-foreground text-xs sm:text-sm leading-relaxed">{module.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
