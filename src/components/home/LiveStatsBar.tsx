import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { motion } from 'framer-motion';
import { Users, BookOpen, MessageSquare, Award } from 'lucide-react';
import { AnimatedCounter } from '@/components/ui/AnimatedCounter';

interface Stats {
  students: number;
  courses: number;
  critiques: number;
  certificates: number;
}

export function LiveStatsBar() {
  const [stats, setStats] = useState<Stats>({ students: 0, courses: 0, critiques: 0, certificates: 0 });

  useEffect(() => {
    Promise.all([
      supabase.from('profiles').select('user_id', { count: 'exact', head: true }),
      supabase.from('courses').select('id', { count: 'exact', head: true }).eq('is_published', true),
      supabase.from('forum_answers').select('id', { count: 'exact', head: true }),
      supabase.from('certificates').select('id', { count: 'exact', head: true }),
    ]).then(([studentsRes, coursesRes, critiquesRes, certsRes]) => {
      setStats({
        students: studentsRes.count || 0,
        courses: coursesRes.count || 0,
        critiques: critiquesRes.count || 0,
        certificates: certsRes.count || 0,
      });
    });
  }, []);

  const items = [
    { icon: Users, value: stats.students || 2000, suffix: '+', label: 'Students' },
    { icon: BookOpen, value: stats.courses || 70, suffix: '+', label: 'Courses' },
    { icon: MessageSquare, value: stats.critiques || 5000, suffix: '+', label: 'Critiques' },
    { icon: Award, value: stats.certificates || 500, suffix: '+', label: 'Certificates' },
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
                <AnimatedCounter value={item.value} suffix={item.suffix} duration={2.2} />
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
