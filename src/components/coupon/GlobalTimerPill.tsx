import { useCoupon } from '@/contexts/CouponContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Timer, Zap } from 'lucide-react';

function fmt(s: number) {
  const m = Math.floor(s / 60).toString().padStart(2, '0');
  const ss = (s % 60).toString().padStart(2, '0');
  return `${m}:${ss}`;
}

export function GlobalTimerPill() {
  const { isActive, secondsLeft } = useCoupon();

  if (!isActive) return null;

  const urgent = secondsLeft <= 60;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 50, opacity: 0, scale: 0.8 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 50, opacity: 0, scale: 0.8 }}
        className="fixed bottom-24 right-6 z-[60] pointer-events-none"
      >
        <div className={`
          pointer-events-auto flex items-center gap-2.5 px-4 py-2.5 rounded-full 
          border backdrop-blur-xl shadow-2xl transition-colors duration-300
          ${urgent 
            ? 'bg-destructive/20 border-destructive/40 text-destructive shadow-destructive/20' 
            : 'bg-accent/20 border-accent/40 text-accent shadow-accent/20'}
        `}>
          <div className="relative">
            <Timer className={`h-4 w-4 ${urgent ? 'animate-pulse' : ''}`} />
            <motion.div
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="absolute -top-1 -right-1"
            >
              <Zap className="h-2 w-2 fill-current" />
            </motion.div>
          </div>
          
          <div className="flex flex-col">
            <span className="text-[10px] leading-none font-bold uppercase tracking-wider opacity-70">
              Flash Sale
            </span>
            <span className="text-sm font-mono font-bold leading-none tabular-nums mt-0.5">
              {fmt(secondsLeft)}
            </span>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
