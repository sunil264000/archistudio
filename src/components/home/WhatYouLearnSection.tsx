import { 
  MapPin, 
  PenTool, 
  Layers, 
  Building2, 
  Leaf, 
  FileText, 
  Ruler, 
  Lightbulb 
} from 'lucide-react';
import { motion } from 'framer-motion';
import { 
  AnimatedSection,
  staggerContainer,
  staggerContainerFast,
  fadeInUp
} from '@/components/animations/AnimatedSection';

const modules = [
  {
    icon: MapPin,
    title: 'Site Analysis',
    description: 'Read sites like experienced architects. Understand context, constraints, and opportunities before putting pen to paper.',
  },
  {
    icon: PenTool,
    title: 'Working Drawings',
    description: 'Create complete drawing sets that contractors can actually build from. Plans, sections, details — all of it.',
  },
  {
    icon: Layers,
    title: 'Construction Logic',
    description: 'Understand how buildings go up. Sequences, dependencies, and the "why" behind construction methods.',
  },
  {
    icon: Building2,
    title: 'Structural Coordination',
    description: 'Read and coordinate with structural drawings. No more guessing what those symbols mean.',
  },
  {
    icon: Leaf,
    title: 'Sustainability',
    description: 'Design for climate, energy efficiency, and material consciousness. Beyond buzzwords, into practice.',
  },
  {
    icon: FileText,
    title: 'Specifications',
    description: 'Write specs that protect your design intent. Materials, finishes, and quality standards.',
  },
  {
    icon: Ruler,
    title: 'Detailing',
    description: 'Create details that solve real problems. Junctions, transitions, and the craft of building.',
  },
  {
    icon: Lightbulb,
    title: 'Services Integration',
    description: 'Understand MEP coordination. Your building needs more than walls and windows.',
  },
];

export function WhatYouLearnSection() {
  return (
    <section id="courses" className="section-padding relative overflow-hidden">
      {/* Animated background gradient */}
      <motion.div 
        className="absolute inset-0 opacity-30 pointer-events-none"
        animate={{
          background: [
            'radial-gradient(ellipse at 20% 50%, hsl(var(--accent) / 0.1) 0%, transparent 50%)',
            'radial-gradient(ellipse at 80% 50%, hsl(var(--accent) / 0.1) 0%, transparent 50%)',
            'radial-gradient(ellipse at 20% 50%, hsl(var(--accent) / 0.1) 0%, transparent 50%)',
          ]
        }}
        transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
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
            The Curriculum
          </motion.div>
          <motion.h2 
            variants={fadeInUp}
            className="text-3xl md:text-4xl font-display font-bold mb-4"
          >
            What You'll Actually Learn
          </motion.h2>
          <motion.p 
            variants={fadeInUp}
            className="text-lg text-muted-foreground"
          >
            Eight comprehensive modules covering everything your college skipped. 
            Each one built on real-world project experience.
          </motion.p>
        </motion.div>

        <motion.div 
          className="grid md:grid-cols-2 lg:grid-cols-4 gap-6"
          variants={staggerContainerFast}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
        >
          {modules.map((module, i) => (
            <motion.div 
              key={i}
              variants={fadeInUp}
              whileHover={{ 
                y: -8,
                boxShadow: '0 25px 50px -12px hsl(var(--accent) / 0.15)',
              }}
              className="group relative p-6 rounded-xl bg-card border border-border hover:border-accent/50 transition-all duration-500 overflow-hidden"
            >
              {/* Hover glow effect */}
              <motion.div 
                className="absolute inset-0 bg-gradient-to-br from-accent/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"
              />
              
              {/* Icon with animation */}
              <motion.div 
                className="relative h-12 w-12 rounded-lg bg-secondary flex items-center justify-center mb-4 group-hover:bg-accent/20 transition-colors duration-300"
                whileHover={{ rotate: [0, -5, 5, 0], scale: 1.1 }}
                transition={{ duration: 0.4 }}
              >
                <module.icon className="h-6 w-6 text-accent transition-transform duration-300 group-hover:scale-110" />
              </motion.div>
              
              <h3 className="relative font-semibold text-lg mb-2 group-hover:text-accent transition-colors duration-300">
                {module.title}
              </h3>
              <p className="relative text-muted-foreground text-sm leading-relaxed">
                {module.description}
              </p>
              
              {/* Bottom accent line */}
              <motion.div 
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent"
                initial={{ scaleX: 0 }}
                whileHover={{ scaleX: 1 }}
                transition={{ duration: 0.3 }}
                style={{ transformOrigin: 'left' }}
              />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
