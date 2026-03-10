import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { motion } from 'framer-motion';
import { Users, BookOpen, MessageSquare, Award } from 'lucide-react';

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
    { icon: Users, value: stats.students > 0 ? stats.students.toLocaleString('en-IN') : '2,000+', label: 'Students' },
    { icon: BookOpen, value: stats.courses > 0 ? `${stats.courses}+` : '70+', label: 'Courses' },
    { icon: MessageSquare, value: stats.critiques > 0 ? stats.critiques.toLocaleString('en-IN') : '5,000+', label: 'Critiques' },
    { icon: Award, value: stats.certificates > 0 ? stats.certificates.toLocaleString('en-IN') : '500+', label: 'Certificates' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      className="w-full py-12 border-y border-border/20"
    >
      <div className="container-wide">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {items.map((item) => (
            <div key={item.label} className="text-center">
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-accent/8 mb-3">
                <item.icon className="h-5 w-5 text-accent" />
              </div>
              <div className="font-display text-3xl sm:text-4xl font-bold text-foreground tracking-tight">
                {item.value}
              </div>
              <div className="text-xs tracking-wider uppercase text-muted-foreground/60 mt-1 font-medium">
                {item.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
