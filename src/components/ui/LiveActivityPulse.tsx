import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Briefcase, Zap, Award, ShoppingBag } from 'lucide-react';

const ACTIVITIES = [
  { type: 'earnings', text: 'Arjun just earned ₹4,500 from a drafting project', icon: Zap },
  { type: 'job', text: 'New Project: "Modern Villa Interior Visualization" posted', icon: Briefcase },
  { type: 'course', text: 'Sneha just enrolled in "Revit Masterclass 2026"', icon: ShoppingBag },
  { type: 'review', text: '5★ Review: "Professional work, highly recommend!"', icon: Award },
  { type: 'earnings', text: 'Priya just earned ₹8,200 from a thesis help project', icon: Zap },
  { type: 'member', text: 'Welcome our newest Studio Member: Rahul K.', icon: Sparkles },
  { type: 'job', text: 'Urgent Project: "AutoCAD Section Detailing" posted', icon: Briefcase },
  { type: 'earnings', text: 'Vikram just earned ₹12,000 from a BIM project', icon: Zap },
];

export function LiveActivityPulse() {
  const [index, setIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Show after initial delay
    const initialTimer = setTimeout(() => setIsVisible(true), 4000);
    
    const interval = setInterval(() => {
      setIsVisible(false);
      setTimeout(() => {
        setIndex((prev) => (prev + 1) % ACTIVITIES.length);
        setIsVisible(true);
      }, 1000); // Wait for exit animation before showing next
    }, 8000); // Rotate every 8 seconds

    return () => {
      clearTimeout(initialTimer);
      clearInterval(interval);
    };
  }, []);

  const activity = ACTIVITIES[index];
  const Icon = activity.icon;

  return (
    <div className="fixed bottom-6 left-6 z-[60] pointer-events-none">
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="flex items-center gap-3 bg-background/80 backdrop-blur-xl border border-border/40 px-4 py-2.5 rounded-full shadow-[0_8px_32px_-4px_rgba(0,0,0,0.15)] max-w-xs sm:max-w-md pointer-events-auto"
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-accent/10 text-accent shrink-0">
              <Icon className="h-4 w-4" />
            </div>
            <p className="text-[11px] sm:text-xs font-medium text-foreground/90 whitespace-nowrap overflow-hidden text-ellipsis">
              {activity.text}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
