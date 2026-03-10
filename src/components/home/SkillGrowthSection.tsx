import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, Compass, PenTool, Monitor, HardHat } from 'lucide-react';
import {
  staggerContainerFast,
  fadeInUp,
} from '@/components/animations/AnimatedSection';

const skills = [
  {
    icon: Compass,
    title: 'Concept Design',
    description: 'Site analysis, zoning, massing, and spatial organization — how real projects begin.',
    level: 'Foundation',
    color: 'text-emerald-400',
    bg: 'bg-emerald-400/8',
  },
  {
    icon: PenTool,
    title: 'Technical Drawings',
    description: 'Working drawings, construction details, and document sets that contractors can build from.',
    level: 'Core Skill',
    color: 'text-accent',
    bg: 'bg-accent/8',
  },
  {
    icon: Monitor,
    title: 'Rendering & Visualization',
    description: '3ds Max, Corona, V-Ray, SketchUp — create presentations that win clients.',
    level: 'Professional',
    color: 'text-blue-400',
    bg: 'bg-blue-400/8',
  },
  {
    icon: HardHat,
    title: 'Construction Logic',
    description: 'How buildings actually get built. Sequences, coordination, and site realities.',
    level: 'Advanced',
    color: 'text-amber-400',
    bg: 'bg-amber-400/8',
  },
];

export function SkillGrowthSection() {
  return (
    <section className="section-padding relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-background via-secondary/5 to-background" />
      
      <div className="container-wide relative">
        <motion.div
          className="max-w-2xl mx-auto text-center mb-14"
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5 }}
        >
          <div className="section-label mb-4">Skill Growth</div>
          <h2 className="font-display mb-4">
            Your Path from <span className="text-accent">Student to Practitioner</span>
          </h2>
          <p className="text-body text-muted-foreground max-w-lg mx-auto">
            A progressive skill tree designed to build competence at every level of architecture practice
          </p>
        </motion.div>

        <motion.div
          className="relative max-w-4xl mx-auto"
          variants={staggerContainerFast}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
        >
          {/* Connection line */}
          <div className="absolute left-1/2 top-0 bottom-0 w-px bg-border/30 hidden lg:block" />
          
          <div className="space-y-6 lg:space-y-0 lg:grid lg:grid-cols-2 lg:gap-x-16 lg:gap-y-8">
            {skills.map((skill, i) => {
              const Icon = skill.icon;
              const isRight = i % 2 === 1;
              
              return (
                <motion.div
                  key={skill.title}
                  variants={fadeInUp}
                  className={`relative ${isRight ? 'lg:col-start-2' : 'lg:col-start-1'}`}
                >
                  {/* Connector dot */}
                  <div className={`hidden lg:block absolute top-6 ${isRight ? '-left-[2.15rem]' : '-right-[2.15rem]'} w-3 h-3 rounded-full bg-background border-2 border-accent/40`} />
                  
                  <div className="p-6 rounded-2xl card-glass group hover:border-accent/20 transition-all duration-300">
                    <div className="flex items-start gap-4">
                      <div className={`shrink-0 w-12 h-12 rounded-xl ${skill.bg} flex items-center justify-center`}>
                        <Icon className={`h-5 w-5 ${skill.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-[10px] font-semibold uppercase tracking-wider ${skill.color}`}>
                            {skill.level}
                          </span>
                        </div>
                        <h3 className="font-display text-lg font-bold text-foreground mb-1">{skill.title}</h3>
                        <p className="text-body-sm text-muted-foreground leading-relaxed">{skill.description}</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        <div className="text-center mt-12">
          <Link to="/learning-paths">
            <Button variant="outline" className="gap-2 group">
              Explore Learning Paths
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
