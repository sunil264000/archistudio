import { useExitDiscount } from '@/hooks/useExitDiscount';
import { Timer, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

export function DiscountTimerBanner() {
  const { isActive, timeLeft, discountPercent, formatTime, canExtend, extend } = useExitDiscount();
  const navigate = useNavigate();

  if (!isActive && !canExtend) return null;

  // Show "extend" offer when timer expired but extension available
  if (canExtend) {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-24 left-4 right-4 sm:left-auto sm:right-6 sm:w-80 z-[9996]"
        >
          <div className="bg-card border border-border rounded-xl shadow-2xl p-4 space-y-2">
            <p className="text-sm font-semibold text-foreground">⏰ Your {discountPercent}% discount expired!</p>
            <p className="text-xs text-muted-foreground">We'll give you 5 more minutes. Last chance!</p>
            <button
              onClick={extend}
              className="w-full bg-accent text-accent-foreground text-sm font-semibold py-2 rounded-lg hover:opacity-90 transition-opacity"
            >
              Get 5 More Minutes →
            </button>
          </div>
        </motion.div>
      </AnimatePresence>
    );
  }

  // Urgency color
  const isUrgent = timeLeft < 120;

  return (
    <motion.div
      initial={{ y: 60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="fixed bottom-24 left-4 right-4 sm:left-auto sm:right-6 sm:w-72 z-[9996]"
    >
      <div
        onClick={() => navigate('/courses')}
        className={`cursor-pointer rounded-xl shadow-2xl p-3 border transition-colors ${
          isUrgent
            ? 'bg-destructive/10 border-destructive/30'
            : 'bg-accent/10 border-accent/30'
        }`}
      >
        <div className="flex items-center gap-3">
          <div className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
            isUrgent ? 'bg-destructive/20' : 'bg-accent/20'
          }`}>
            {isUrgent ? (
              <Zap className="h-5 w-5 text-destructive animate-pulse" />
            ) : (
              <Timer className="h-5 w-5 text-accent" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-foreground">
              {discountPercent}% OFF — Auto-applied!
            </p>
            <p className={`text-lg font-bold font-mono tabular-nums ${
              isUrgent ? 'text-destructive' : 'text-accent'
            }`}>
              {formatTime(timeLeft)}
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
