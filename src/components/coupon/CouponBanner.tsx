import { useState } from 'react';
import { useCoupon } from '@/contexts/CouponContext';
import { Sparkles, X, Clock, Gift } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';

function fmt(s: number) {
  const m = Math.floor(s / 60).toString().padStart(2, '0');
  const ss = (s % 60).toString().padStart(2, '0');
  return `${m}:${ss}`;
}

export function CouponBanner() {
  const { isActive, active, secondsLeft } = useCoupon();
  const [hidden, setHidden] = useState(false);

  if (!isActive || !active || hidden) return null;

  const urgent = secondsLeft <= 60;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -20, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 320, damping: 28 }}
        className="fixed top-[64px] left-0 right-0 z-[55] px-3 sm:px-4 pointer-events-none"
        role="status"
      >
        <div className="max-w-5xl mx-auto pointer-events-auto">
          <div
            className={`relative overflow-hidden rounded-2xl border backdrop-blur-xl shadow-[0_8px_30px_-8px_hsl(var(--accent)/0.4)] ${
              urgent
                ? 'bg-gradient-to-r from-destructive/15 via-accent/10 to-destructive/15 border-destructive/40'
                : 'bg-gradient-to-r from-accent/15 via-primary/10 to-accent/15 border-accent/30'
            }`}
          >
            <div className="flex items-center gap-3 px-4 py-2.5 sm:py-3">
              <div className="shrink-0 w-9 h-9 rounded-full bg-accent/20 flex items-center justify-center">
                <Gift className="h-4 w-4 text-accent" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-sm">
                  <span className="font-semibold tracking-tight">
                    <span className="text-accent">{active.code}</span> active
                  </span>
                  <span className="text-muted-foreground hidden sm:inline">•</span>
                  <span className="text-foreground/85">
                    Free Master Course unlocked
                  </span>
                  {active.discountPercent > 0 && (
                    <>
                      <span className="text-muted-foreground hidden sm:inline">•</span>
                      <span className="font-semibold text-accent">
                        {active.discountPercent}% OFF everything else
                      </span>
                    </>
                  )}
                </div>
              </div>

              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full font-mono text-sm font-bold tabular-nums ${
                urgent ? 'bg-destructive/20 text-destructive animate-pulse' : 'bg-accent/15 text-accent'
              }`}>
                <Clock className="h-3.5 w-3.5" />
                {fmt(secondsLeft)}
              </div>

              <Link
                to="/dashboard"
                className="hidden sm:inline-flex items-center gap-1 text-xs font-semibold text-foreground/90 hover:text-accent transition-colors px-2"
              >
                <Sparkles className="h-3.5 w-3.5" /> View
              </Link>

              <button
                onClick={() => setHidden(true)}
                aria-label="Hide coupon banner"
                className="shrink-0 w-7 h-7 rounded-full hover:bg-foreground/10 flex items-center justify-center transition-colors"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            <motion.div
              initial={{ width: '100%' }}
              animate={{ width: `${Math.max(0, (secondsLeft / 600) * 100)}%` }}
              transition={{ duration: 0.5, ease: 'linear' }}
              className={`absolute bottom-0 left-0 h-[2px] ${urgent ? 'bg-destructive' : 'bg-accent'}`}
            />
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
