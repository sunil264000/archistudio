import { ArrowRight, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { 
  staggerContainer,
  fadeInUp,
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
    accentClass: 'text-success',
    bgClass: 'bg-success/8',
    borderClass: 'hover:border-success/30',
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
    accentClass: 'text-accent',
    bgClass: 'bg-accent/8',
    borderClass: 'hover:border-accent/30',
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
    accentClass: 'text-blueprint',
    bgClass: 'bg-blueprint/8',
    borderClass: 'hover:border-blueprint/30',
  },
];

export function CourseStructureSection() {
  return (
    <section className="section-padding relative overflow-hidden">
      <div className="container-wide">
        <motion.div 
          className="max-w-3xl mx-auto text-center mb-14 sm:mb-20"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5 }}
        >
          <div className="section-label mb-4">Learning Path</div>
          <h2 className="font-display font-bold mb-4">
            A Clear Path from Student to Practitioner
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Three progressive tracks. Each builds on the last. Start where you are, end where you want to be.
          </p>
        </motion.div>

        <motion.div 
          className="grid lg:grid-cols-3 gap-4 sm:gap-5 max-w-6xl mx-auto"
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
        >
          {tracks.map((track, i) => (
            <motion.div 
              key={i}
              variants={fadeInUp}
              className={`relative flex flex-col p-6 sm:p-7 rounded-2xl card-glass ${track.borderClass} transition-colors duration-300 group`}
            >
              {/* Level badge */}
              <div className={`inline-flex self-start px-3 py-1 rounded-full text-xs font-medium ${track.accentClass} ${track.bgClass} border border-current/10`}>
                {track.level}
              </div>

              <div className="mt-5 flex-1">
                <h3 className="text-2xl font-bold mb-1">{track.title}</h3>
                <p className={`text-sm ${track.accentClass} font-medium mb-4`}>{track.duration}</p>
                <p className="text-muted-foreground text-sm mb-6 leading-relaxed">{track.description}</p>

                <ul className="space-y-2.5">
                  {track.topics.map((topic, j) => (
                    <li key={j} className="flex items-start gap-2.5 text-sm">
                      <CheckCircle className={`h-4 w-4 ${track.accentClass} mt-0.5 shrink-0`} />
                      <span className="text-muted-foreground">{topic}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Arrow connector */}
              {i < tracks.length - 1 && (
                <div className="hidden lg:flex absolute -right-3 top-1/2 -translate-y-1/2 z-10">
                  <div className="h-6 w-6 rounded-full bg-background border border-border flex items-center justify-center shadow-soft">
                    <ArrowRight className="h-3 w-3 text-muted-foreground" />
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
