import { motion } from 'framer-motion';
import { Users, BookOpen, MessageSquare, Award } from 'lucide-react';
import { AnimatedCounter } from '@/components/ui/AnimatedCounter';
import { useLiveStats } from '@/hooks/useLiveStats';

export function LiveStatsBar() {
  const stats = useLiveStats();

  const items = [
    { icon: Users, value: stats.students, suffix: '+', label: 'Students' },
    { icon: BookOpen, value: stats.courses, suffix: '+', label: 'Courses' },
    { icon: MessageSquare, value: stats.critiques, suffix: '+', label: 'Critiques' },
    { icon: Award, value: stats.certificates, suffix: '+', label: 'Certificates' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      className="w-full py-14 border-y border-border/20 relative overflow-hidden"
    >
      <div className="absolute inset-0 bg-gradient-to-r from-accent/[0.02] via-transparent to-accent/[0.02]" />
      <div className="container-wide relative">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 border border-accent/20 text-accent text-xs font-bold tracking-widest uppercase mb-4">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-accent"></span>
            </span>
            5+ Years of Success
          </div>
          <p className="text-muted-foreground text-sm max-w-xl mx-auto">
            Join the fastest growing architecture community. We've been empowering students and professionals for over half a decade.
          </p>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {items.map((item, i) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-30px' }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="text-center group"
            >
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-accent/8 mb-4 transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-6">
                <item.icon className="h-5 w-5 text-accent" />
              </div>
              <div className="font-display text-3xl sm:text-4xl font-bold text-foreground tracking-tight">
                <AnimatedCounter value={item.value} suffix={item.suffix} duration={6} />
              </div>
              <div className="text-xs tracking-wider uppercase text-muted-foreground/60 mt-1.5 font-medium">
                {item.label}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
