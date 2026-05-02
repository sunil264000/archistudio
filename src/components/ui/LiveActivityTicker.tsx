import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, TrendingUp, Users, Award } from 'lucide-react';

const ACTIVITIES = [
  { id: 1, text: "Aman K. just won a ₹12,500 project in 3D Visualization", icon: TrendingUp, color: "text-emerald-500" },
  { id: 2, text: "New Course: 'Mastering Revit for Interior Design' launched!", icon: Sparkles, color: "text-amber-500" },
  { id: 3, text: "Sneha R. earned a Certificate of Excellence in Lumion", icon: Award, color: "text-blue-500" },
  { id: 4, text: "15 new students joined Archistudio in the last hour", icon: Users, color: "text-accent" },
  { id: 5, text: "High-Budget Project: 'Luxury Villa Design' posted in Studio Hub", icon: Sparkles, color: "text-purple-500" },
  { id: 6, text: "Rahul S. successfully delivered a project to a UK client", icon: TrendingUp, color: "text-emerald-500" },
];

export function LiveActivityTicker() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % ACTIVITIES.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const current = ACTIVITIES[index];

  return (
    <div className="w-full bg-muted/30 border-y border-border/40 py-2 overflow-hidden h-10 flex items-center">
      <div className="container-wide flex items-center justify-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={current.id}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="flex items-center gap-3"
          >
            <div className={`p-1 rounded-md bg-background/50 border border-border/30 ${current.color}`}>
              <current.icon className="h-3.5 w-3.5" />
            </div>
            <p className="text-[11px] md:text-xs font-bold tracking-tight text-muted-foreground uppercase">
              <span className="text-foreground">{current.text.split(' ')[0]}</span>
              {current.text.substring(current.text.indexOf(' '))}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
