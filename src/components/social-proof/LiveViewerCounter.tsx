import { useState, useEffect } from 'react';
import { Eye, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface LiveViewerCounterProps {
  courseSlug?: string;
  variant?: 'course' | 'site';
}

export function LiveViewerCounter({ courseSlug, variant = 'course' }: LiveViewerCounterProps) {
  const [viewers, setViewers] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    // Generate realistic initial count based on time of day
    const hour = new Date().getHours();
    const isBusinessHours = hour >= 9 && hour <= 21;
    
    const baseCount = variant === 'site' 
      ? (isBusinessHours ? 45 : 18)
      : (isBusinessHours ? 12 : 4);
    
    const variance = variant === 'site' ? 20 : 8;
    const initialCount = baseCount + Math.floor(Math.random() * variance);
    setViewers(initialCount);

    // Simulate realistic fluctuations
    const interval = setInterval(() => {
      setViewers(prev => {
        const change = Math.random() > 0.5 ? 1 : -1;
        const maxChange = variant === 'site' ? 3 : 2;
        const actualChange = Math.floor(Math.random() * maxChange) * change;
        
        const minCount = variant === 'site' ? 15 : 3;
        const maxCount = variant === 'site' ? 120 : 35;
        
        const newCount = Math.max(minCount, Math.min(maxCount, prev + actualChange));
        
        if (newCount !== prev) {
          setIsAnimating(true);
          setTimeout(() => setIsAnimating(false), 300);
        }
        
        return newCount;
      });
    }, 8000 + Math.random() * 7000); // Random interval 8-15 seconds

    return () => clearInterval(interval);
  }, [variant, courseSlug]);

  if (variant === 'site') {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <div className="relative">
          <Users className="h-4 w-4 text-success" />
          <span className="absolute -top-1 -right-1 w-2 h-2 bg-success rounded-full animate-pulse" />
        </div>
        <AnimatePresence mode="wait">
          <motion.span
            key={viewers}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="font-medium text-foreground"
          >
            {viewers}
          </motion.span>
        </AnimatePresence>
        <span>students online</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-success/10 border border-success/20 rounded-lg">
      <div className="relative">
        <Eye className="h-4 w-4 text-success" />
        <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-success rounded-full animate-pulse" />
      </div>
      <span className="text-sm">
        <AnimatePresence mode="wait">
          <motion.span
            key={viewers}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`font-bold text-success ${isAnimating ? 'scale-110' : ''}`}
          >
            {viewers}
          </motion.span>
        </AnimatePresence>
        <span className="text-muted-foreground ml-1">viewing now</span>
      </span>
    </div>
  );
}
