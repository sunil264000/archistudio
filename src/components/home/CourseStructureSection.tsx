import { ArrowRight, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { 
  staggerContainer,
  fadeInUp,
  AnimatedUnderline
} from '@/components/animations/AnimatedSection';

const tracks = [
  {
    level: 'Beginner',
    title: 'Foundation',
    duration: '8 weeks',
    description: 'Start here if you\'re fresh out of college or switching careers.',
    topics: [
      'Reading architectural drawings',
      'Understanding scale and dimensions',
      'Basic construction terminology',
      'Site visit fundamentals',
    ],
    color: 'success',
    gradient: 'from-success/20 to-success/5',
    borderColor: 'border-success/30',
    textColor: 'text-success',
  },
  {
    level: 'Intermediate',
    title: 'Practice',
    duration: '12 weeks',
    description: 'For those with 1-2 years of experience who want to level up.',
    topics: [
      'Creating working drawing sets',
      'Structural coordination',
      'Specification writing',
      'Contractor coordination',
    ],
    color: 'accent',
    gradient: 'from-accent/20 to-accent/5',
    borderColor: 'border-accent/30',
    textColor: 'text-accent',
  },
  {
    level: 'Advanced',
    title: 'Mastery',
    duration: '16 weeks',
    description: 'Senior-level skills for project architects and team leads.',
    topics: [
      'Complex project management',
      'MEP integration strategies',
      'Value engineering',
      'Design-build coordination',
    ],
    color: 'blueprint',
    gradient: 'from-blueprint/20 to-blueprint/5',
    borderColor: 'border-blueprint/30',
    textColor: 'text-blueprint',
  },
];

export function CourseStructureSection() {
  return (
    <section className="section-padding bg-secondary/20 relative overflow-hidden">
      {/* Animated background lines */}
      <div className="absolute inset-0 opacity-20">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="structure-lines" width="100" height="100" patternUnits="userSpaceOnUse">
              <path d="M 0 50 L 100 50" stroke="currentColor" strokeWidth="0.3" opacity="0.5" />
              <path d="M 50 0 L 50 100" stroke="currentColor" strokeWidth="0.3" opacity="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#structure-lines)" />
        </svg>
      </div>
      
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
            Learning Path
          </motion.div>
          <motion.h2 
            variants={fadeInUp}
            className="text-3xl md:text-4xl font-display font-bold mb-4"
          >
            A Clear Path from{' '}
            <span className="relative inline-block">
              Student to Practitioner
              <AnimatedUnderline delay={0.3} />
            </span>
          </motion.h2>
          <motion.p 
            variants={fadeInUp}
            className="text-lg text-muted-foreground"
          >
            Three progressive tracks. Each builds on the last. 
            Start where you are, end where you want to be.
          </motion.p>
        </motion.div>

        <motion.div 
          className="grid lg:grid-cols-3 gap-8"
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
        >
          {tracks.map((track, i) => (
            <motion.div 
              key={i}
              variants={fadeInUp}
              whileHover={{ 
                y: -10,
                boxShadow: `0 30px 60px -15px hsl(var(--${track.color}) / 0.2)`,
              }}
              className={`relative flex flex-col p-6 rounded-xl bg-card border border-border hover:${track.borderColor} transition-all duration-500 overflow-hidden group`}
            >
              {/* Gradient overlay on hover */}
              <motion.div 
                className={`absolute inset-0 bg-gradient-to-br ${track.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
              />
              
              {/* Level badge with glow */}
              <motion.div 
                className={`relative inline-flex self-start px-4 py-1.5 rounded-full text-xs font-medium border ${track.borderColor} ${track.textColor} bg-${track.color}/10`}
                whileHover={{ scale: 1.05 }}
              >
                {track.level}
              </motion.div>

              {/* Content */}
              <div className="relative mt-4 flex-1">
                <motion.h3 
                  className="text-2xl font-bold mb-1"
                  whileHover={{ x: 5 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  {track.title}
                </motion.h3>
                <p className={`text-sm ${track.textColor} font-medium mb-4`}>{track.duration}</p>
                <p className="text-muted-foreground mb-6">{track.description}</p>

                <ul className="space-y-3">
                  {track.topics.map((topic, j) => (
                    <motion.li 
                      key={j} 
                      className="flex items-start gap-2 text-sm"
                      initial={{ opacity: 0, x: -10 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.1 * j }}
                    >
                      <CheckCircle className={`h-4 w-4 ${track.textColor} mt-0.5 shrink-0`} />
                      <span>{topic}</span>
                    </motion.li>
                  ))}
                </ul>
              </div>

              {/* Bottom glow line */}
              <motion.div 
                className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-${track.color} to-transparent`}
                initial={{ opacity: 0, scaleX: 0 }}
                whileHover={{ opacity: 1, scaleX: 1 }}
                transition={{ duration: 0.4 }}
              />

              {/* Arrow to next track */}
              {i < tracks.length - 1 && (
                <motion.div 
                  className="hidden lg:flex absolute -right-4 top-1/2 -translate-y-1/2 z-10"
                  animate={{ x: [0, 5, 0] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                >
                  <div className="h-8 w-8 rounded-full bg-background border border-border flex items-center justify-center shadow-lg">
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </motion.div>
              )}
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
