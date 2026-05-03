import { useEffect, useState, useRef } from 'react';
import { 
  MapPin, PenTool, Layers, Building2, 
  Leaf, FileText, Ruler, Lightbulb,
  Monitor, Palette, Box, Eye, Settings, Cpu, Compass, Camera
} from 'lucide-react';
import { motion, useMotionTemplate, useMotionValue } from 'framer-motion';
import { 
  staggerContainerFast,
  fadeInUp
} from '@/components/animations/AnimatedSection';
import { supabase } from '@/integrations/supabase/client';

const iconMap: Record<string, any> = {
  'site': MapPin, 'drawing': PenTool, 'construction': Layers, 'structural': Building2,
  'sustain': Leaf, 'spec': FileText, 'detail': Ruler, 'service': Lightbulb,
  'model': Box, 'render': Camera, 'design': Palette, 'visual': Eye,
  'software': Monitor, 'setting': Settings, 'tech': Cpu, 'plan': Compass,
};

function pickIcon(title: string) {
  const t = title.toLowerCase();
  for (const [key, Icon] of Object.entries(iconMap)) {
    if (t.includes(key)) return Icon;
  }
  return Lightbulb;
}

function generateLearningPoints(modules: any[]): { icon: any; title: string; description: string }[] {
  if (!modules || modules.length === 0) return [];
  return modules.slice(0, 8).map(mod => ({
    icon: pickIcon(mod.title),
    title: mod.title,
    description: mod.description || `Master ${mod.title.toLowerCase()} with hands-on projects and real-world examples.`,
  }));
}

const defaultModules = [
  { icon: MapPin, title: 'Strategic Site Analysis', description: 'Read sites like a lead architect. Master environmental constraints and hidden opportunities.' },
  { icon: PenTool, title: 'Executive Drawing Sets', description: 'Produce GFC (Good For Construction) sets that offices and contractors trust. Zero ambiguity.' },
  { icon: Layers, title: 'Building Systems & Logic', description: 'Understand the anatomy of construction. Sequences, material dependencies, and structural integrity.' },
  { icon: Building2, title: 'Structural Coordination', description: 'Speak the language of engineers. Confidently coordinate structural and MEP drawings.' },
  { icon: Leaf, title: 'High-Performance Design', description: 'Beyond basic sustainability. Implement climate-responsive strategies and material science.' },
  { icon: FileText, title: 'Technical Specifications', description: 'Write bulletproof specs that protect your design intent and ensure contractor accountability.' },
  { icon: Ruler, title: 'Precision Detailing', description: 'Craft junctions that work. Master the art of the architectural detail, from concept to execution.' },
  { icon: Lightbulb, title: 'MEP Integration Strategy', description: 'Integrate complex services without compromising design. Architecture meets engineering.' },
];

function ModuleCard({ module, index }: { module: any; index: number }) {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const Icon = module.icon;

  function handleMouseMove({ currentTarget, clientX, clientY }: React.MouseEvent) {
    const { left, top } = currentTarget.getBoundingClientRect();
    mouseX.set(clientX - left);
    mouseY.set(clientY - top);
  }

  return (
    <motion.div 
      variants={fadeInUp}
      onMouseMove={handleMouseMove}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="group relative p-5 sm:p-6 rounded-2xl border border-border/40 bg-card/30 backdrop-blur-sm overflow-hidden transition-all duration-300 hover:border-accent/30 hover:shadow-[0_0_20px_rgba(var(--accent-rgb),0.05)]"
    >
      <motion.div
        className="pointer-events-none absolute -inset-px rounded-2xl opacity-0 group-hover:opacity-100 transition duration-300"
        style={{
          background: useMotionTemplate`
            radial-gradient(
              400px circle at ${mouseX}px ${mouseY}px,
              rgba(var(--accent-rgb), 0.08),
              transparent 80%
            )
          `,
        }}
      />
      
      <div className="relative z-10">
        <div className="w-10 h-10 rounded-lg bg-accent/5 flex items-center justify-center mb-4 group-hover:bg-accent/10 group-hover:scale-110 transition-all duration-300">
          <Icon className="h-5 w-5 text-accent" />
        </div>
        
        <h4 className="font-display font-bold text-sm mb-2 group-hover:text-accent transition-colors duration-300">{module.title}</h4>
        <p className="text-[12px] text-muted-foreground leading-relaxed">{module.description}</p>
      </div>
    </motion.div>
  );
}

export function WhatYouLearnSection() {
  const [modules, setModules] = useState(defaultModules);
  const [courseTitle, setCourseTitle] = useState('');

  useEffect(() => {
    const fetchHighlightedModules = async () => {
      const { data: course } = await supabase
        .from('courses')
        .select('id, title')
        .eq('is_highlighted', true)
        .eq('is_published', true)
        .limit(1)
        .maybeSingle();

      if (!course) return;
      setCourseTitle(course.title);

      const { data: dbModules } = await supabase
        .from('modules')
        .select('title, description')
        .eq('course_id', course.id)
        .order('order_index', { ascending: true })
        .limit(8);

      if (dbModules && dbModules.length >= 4) {
        const points = generateLearningPoints(dbModules);
        if (points.length > 0) setModules(points);
      }
    };

    fetchHighlightedModules();
  }, []);

  return (
    <section className="section-padding relative overflow-hidden">
      <div className="container-wide relative">
        <motion.div 
          className="max-w-2xl mx-auto text-center mb-16"
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5 }}
        >
          <div className="section-label mb-4">The Curriculum</div>
          <h2 className="font-display mb-4 font-bold">What You'll Actually Learn</h2>
          <p className="text-body text-muted-foreground max-w-lg mx-auto">
            {courseTitle
              ? `Key modules from ${courseTitle} — built on real-world project experience.`
              : 'Eight comprehensive modules covering everything your college skipped.'
            }
          </p>
        </motion.div>

        <motion.div 
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
          variants={staggerContainerFast}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
        >
          {modules.map((module, i) => (
            <ModuleCard key={i} module={module} index={i} />
          ))}
        </motion.div>
      </div>
    </section>
  );
}
