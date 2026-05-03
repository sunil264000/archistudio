import { ArrowRight, CheckCircle } from 'lucide-react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
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
    borderClass: 'group-hover:border-success/30',
    glowClass: 'rgba(34, 197, 94, 0.1)',
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
    borderClass: 'group-hover:border-accent/30',
    glowClass: 'rgba(var(--accent-rgb), 0.1)',
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
    borderClass: 'group-hover:border-blueprint/30',
    glowClass: 'rgba(59, 130, 246, 0.1)',
  },
];

function TrackCard({ track, index }: { track: any; index: number }) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseXSpring = useSpring(x);
  const mouseYSpring = useSpring(y);

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["7deg", "-7deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-7deg", "7deg"]);

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;
    x.set(xPct);
    y.set(yPct);
  }

  function handleMouseLeave() {
    x.set(0);
    y.set(0);
  }

  return (
    <motion.div 
      variants={fadeInUp}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateX,
        rotateY,
        transformStyle: "preserve-3d",
      }}
      whileTap={{ scale: 0.98 }}
      className={`relative flex flex-col p-6 sm:p-8 rounded-2xl card-glass border border-border/40 ${track.borderClass} transition-colors duration-500 group cursor-default`}
    >
      <div style={{ transform: "translateZ(50px)" }}>
        {/* Level badge */}
        <div className={`inline-flex self-start px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${track.accentClass} ${track.bgClass}`}>
          {track.level}
        </div>

        <div className="mt-6 flex-1">
          <h3 className="font-display text-xl font-bold mb-1 group-hover:text-foreground transition-colors">{track.title}</h3>
          <p className={`text-xs ${track.accentClass} font-bold mb-5`}>{track.duration}</p>
          <p className="text-sm text-muted-foreground mb-8 leading-relaxed">{track.description}</p>

          <ul className="space-y-4">
            {track.topics.map((topic: string, j: number) => (
              <li key={j} className="flex items-start gap-3 text-sm">
                <CheckCircle className={`h-4 w-4 ${track.accentClass} mt-0.5 shrink-0`} />
                <span className="text-muted-foreground group-hover:text-foreground/80 transition-colors">{topic}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Decorative glow */}
      <div 
        className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{
          background: `radial-gradient(circle at center, ${track.glowClass}, transparent 70%)`
        }}
      />
    </motion.div>
  );
}

export function CourseStructureSection() {
  return (
    <section className="section-padding relative overflow-hidden">
      <div className="container-wide">
        <motion.div 
          className="max-w-2xl mx-auto text-center mb-16"
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5 }}
        >
          <div className="section-label mb-4">Learning Path</div>
          <h2 className="font-display mb-4 font-bold">
            A Clear Path to Mastery
          </h2>
          <p className="text-body text-muted-foreground max-w-lg mx-auto">
            Three progressive tracks. Each builds on the last. Start where you are, end where you want to be.
          </p>
        </motion.div>

        <motion.div 
          className="grid lg:grid-cols-3 gap-6 max-w-6xl mx-auto"
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
        >
          {tracks.map((track, i) => (
            <TrackCard key={i} track={track} index={i} />
          ))}
        </motion.div>
      </div>
    </section>
  );
}
