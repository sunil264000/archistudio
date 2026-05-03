import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, X, Heart } from 'lucide-react';

// Launch date — banner shows for 7 days from May 3, 2026
const LAUNCH_DATE = new Date('2026-05-03T00:00:00+05:30');
const SHOW_FOR_DAYS = 7;
const STORAGE_KEY = 'archistudio_launch_banner_dismissed_v1';

export function LaunchWelcomeBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem(STORAGE_KEY);
    if (dismissed === 'true') return;

    const now = new Date();
    const diffDays = (now.getTime() - LAUNCH_DATE.getTime()) / (1000 * 60 * 60 * 24);
    if (diffDays >= 0 && diffDays <= SHOW_FOR_DAYS) {
      setVisible(true);
    }
  }, []);

  const handleDismiss = () => {
    localStorage.setItem(STORAGE_KEY, 'true');
    setVisible(false);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="relative overflow-hidden border-b border-accent/20"
        >
          {/* Soothing gradient background */}
          <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 via-rose-400/10 to-blue-500/10" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,hsl(var(--accent)/0.15),transparent_60%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_50%,hsl(var(--blueprint)/0.10),transparent_60%)]" />

          {/* Animated shimmer */}
          <motion.div
            aria-hidden
            className="absolute inset-y-0 -left-1/2 w-1/2 bg-gradient-to-r from-transparent via-white/5 to-transparent"
            animate={{ x: ['0%', '300%'] }}
            transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
          />

          <div className="relative container-wide py-3 md:py-3.5">
            <div className="flex items-center justify-center gap-3 md:gap-4 text-center">
              <motion.div
                animate={{ rotate: [0, 12, -8, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                className="hidden sm:flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent/15 text-accent"
              >
                <Sparkles className="h-3.5 w-3.5" />
              </motion.div>

              <p className="text-xs md:text-sm leading-relaxed text-foreground/90">
                <span className="font-semibold tracking-tight text-foreground">
                  Welcome to Archistudio
                </span>
                <span className="mx-2 text-muted-foreground/50">·</span>
                <span className="text-muted-foreground">
                  We're so glad you're here. Best of luck to every{' '}
                  <span className="text-accent font-medium">architect</span>,{' '}
                  <span className="text-accent font-medium">designer</span> &{' '}
                  <span className="text-accent font-medium">student</span> beginning your craft today.
                </span>
                <Heart className="hidden md:inline-block h-3 w-3 ml-2 -mt-0.5 text-rose-400 fill-rose-400/40" />
              </p>

              <button
                onClick={handleDismiss}
                aria-label="Dismiss welcome banner"
                className="shrink-0 h-6 w-6 rounded-full flex items-center justify-center text-muted-foreground/60 hover:text-foreground hover:bg-foreground/5 transition-colors"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
