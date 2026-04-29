import { useEffect, useState } from 'react';
import { 
  MapPin, PenTool, Layers, Building2, 
  Leaf, FileText, Ruler, Lightbulb,
  Monitor, Palette, Box, Eye, Settings, Cpu, Compass, Camera
} from 'lucide-react';
import { motion } from 'framer-motion';
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
  { icon: MapPin, title: 'Strategic Site Analysis', description: 'Read sites like a lead architect. Master environmental constraints, urban fabric, and hidden opportunities.' },
  { icon: PenTool, title: 'Executive Drawing Sets', description: 'Produce GFC (Good For Construction) sets that offices and contractors trust. Zero ambiguity.' },
  { icon: Layers, title: 'Building Systems & Logic', description: 'Understand the anatomy of construction. Sequences, material dependencies, and structural integrity.' },
  { icon: Building2, title: 'Cross-Disciplinary Coordination', description: 'Speak the language of engineers. Confidently coordinate structural and MEP drawings.' },
  { icon: Leaf, title: 'High-Performance Design', description: 'Beyond basic sustainability. Implement climate-responsive strategies and advanced material science.' },
  { icon: FileText, title: 'Technical Specifications', description: 'Write bulletproof specs that protect your design intent and ensure contractor accountability.' },
  { icon: Ruler, title: 'Precision Detailing', description: 'Craft junctions that work. Master the art of the architectural detail, from concept to execution.' },
  { icon: Lightbulb, title: 'MEP Integration Strategy', description: 'Integrate complex services without compromising design. Architecture meets engineering.' },
];

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
      <div className="absolute inset-0 bg-gradient-to-b from-background via-secondary/10 to-background" />
      
      <div className="container-wide relative">
        <motion.div 
          className="max-w-2xl mx-auto text-center mb-16"
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5 }}
        >
          <div className="section-label mb-4">The Curriculum</div>
          <h2 className="font-display mb-4">What You'll Actually Learn</h2>
          <p className="text-body text-muted-foreground max-w-lg mx-auto">
            {courseTitle
              ? `Key modules from ${courseTitle} — each built on real-world project experience.`
              : 'Eight comprehensive modules covering everything your college skipped.'
            }
          </p>
        </motion.div>

        <motion.div 
          className="grid grid-cols-2 lg:grid-cols-4 gap-4"
          variants={staggerContainerFast}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
        >
          {modules.map((module, i) => {
            const Icon = module.icon;
            return (
              <motion.div 
                key={i}
                variants={fadeInUp}
                className="group p-5 sm:p-6 rounded-xl card-glass hover:border-accent/20 transition-all duration-300"
              >
                <div className="w-10 h-10 rounded-lg bg-secondary/80 flex items-center justify-center mb-4 group-hover:bg-accent/10 transition-colors duration-300">
                  <Icon className="h-[18px] w-[18px] text-accent" />
                </div>
                
                <h4 className="font-display font-semibold text-sm mb-1.5 group-hover:text-accent transition-colors duration-300">{module.title}</h4>
                <p className="text-body-sm text-muted-foreground leading-relaxed">{module.description}</p>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
