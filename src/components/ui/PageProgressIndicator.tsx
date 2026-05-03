import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface Section {
  id: string;
  label: string;
}

const sections: Section[] = [
  { id: 'hero', label: 'Home' },
  { id: 'programs', label: 'Programs' },
  { id: 'curriculum', label: 'Curriculum' },
  { id: 'path', label: 'Path' },
  { id: 'community', label: 'Community' },
  { id: 'testimonials', label: 'Stories' },
];

export function PageProgressIndicator() {
  const [activeSection, setActiveSection] = useState('hero');
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = (window.scrollY / totalHeight) * 100;
      setScrollProgress(progress);

      // Detect active section
      for (const section of [...sections].reverse()) {
        const element = document.getElementById(section.id);
        if (element) {
          const rect = element.getBoundingClientRect();
          if (rect.top <= 200) {
            setActiveSection(section.id);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      window.scrollTo({
        top: element.offsetTop - 80,
        behavior: 'smooth',
      });
    }
  };

  return (
    <div className="fixed right-6 top-1/2 -translate-y-1/2 z-[100] hidden xl:flex flex-col items-center gap-6">
      {/* Progress Line */}
      <div className="relative h-48 w-[2px] bg-border/40 rounded-full overflow-hidden">
        <motion.div 
          className="absolute top-0 left-0 w-full bg-accent"
          style={{ height: `${scrollProgress}%` }}
        />
      </div>

      {/* Dots */}
      <div className="flex flex-col gap-5">
        {sections.map((section) => (
          <button
            key={section.id}
            onClick={() => scrollToSection(section.id)}
            className="group relative flex items-center justify-center"
            aria-label={`Scroll to ${section.label}`}
          >
            <motion.div
              animate={{
                scale: activeSection === section.id ? 1.2 : 1,
                backgroundColor: activeSection === section.id ? 'hsl(var(--accent))' : 'transparent',
                borderColor: activeSection === section.id ? 'hsl(var(--accent))' : 'hsl(var(--muted-foreground)/0.3)',
              }}
              className={cn(
                "h-2.5 w-2.5 rounded-full border-2 transition-colors duration-300",
                activeSection === section.id ? "shadow-[0_0_10px_hsl(var(--accent)/0.5)]" : "group-hover:border-muted-foreground/60"
              )}
            />
            
            {/* Label */}
            <AnimatePresence>
              <motion.div
                initial={{ opacity: 0, x: 10 }}
                whileHover={{ opacity: 1, x: -12 }}
                className="absolute right-full mr-4 px-2 py-1 rounded bg-popover border border-border shadow-lg pointer-events-none opacity-0"
              >
                <span className="text-[10px] font-bold uppercase tracking-widest text-popover-foreground whitespace-nowrap">
                  {section.label}
                </span>
              </motion.div>
            </AnimatePresence>
          </button>
        ))}
      </div>
    </div>
  );
}
