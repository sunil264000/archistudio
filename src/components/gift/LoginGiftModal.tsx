import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Gift, Sparkles, Clock, BookOpen } from 'lucide-react';
import { format } from 'date-fns';

interface GiftCourse {
  id: string;
  title: string;
  slug: string;
  thumbnail_url?: string | null;
}

interface GiftData {
  message: string;
  courses: GiftCourse[];
  expiresAt: string | null;
  ctaText: string;
}

export interface LoginGiftModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  giftData: GiftData | null;
}

export function LoginGiftModal({ open, onOpenChange, giftData }: LoginGiftModalProps) {
  const [canDismiss, setCanDismiss] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (open) {
      setCanDismiss(false);
      // Allow dismiss after 2 seconds
      const timer = setTimeout(() => setCanDismiss(true), 2000);
      return () => clearTimeout(timer);
    }
  }, [open]);

  const handleStartLearning = () => {
    if (giftData?.courses && giftData.courses.length > 0) {
      const firstCourse = giftData.courses[0];
      onOpenChange(false);
      navigate(`/learn/${firstCourse.slug}`);
    } else {
      onOpenChange(false);
      navigate('/courses');
    }
  };

  const handleDismiss = () => {
    if (canDismiss) {
      onOpenChange(false);
    }
  };

  if (!open || !giftData) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm"
        onClick={handleDismiss}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: 'spring', duration: 0.5 }}
          className="relative max-w-md w-full mx-4 bg-card border rounded-2xl p-8 shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Decorative Elements */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring' }}
            className="absolute -top-6 left-1/2 -translate-x-1/2"
          >
            <div className="relative">
              <div className="h-16 w-16 rounded-full bg-gradient-to-br from-accent to-accent/60 flex items-center justify-center">
                <Gift className="h-8 w-8 text-white" />
              </div>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                className="absolute -inset-2"
              >
                <Sparkles className="h-5 w-5 text-accent absolute -top-1 -right-1" />
                <Sparkles className="h-4 w-4 text-amber-500 absolute -bottom-1 -left-1" />
              </motion.div>
            </div>
          </motion.div>

          {/* Content */}
          <div className="text-center pt-8 space-y-4">
            <motion.h2
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-2xl font-bold"
            >
              Studio Access Granted
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-muted-foreground"
            >
              {giftData.message}
            </motion.p>

            {/* Courses */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-muted/50 rounded-lg p-4 space-y-2"
            >
              {giftData.courses.map((course) => (
                <div key={course.id} className="flex items-center gap-2 text-left">
                  <BookOpen className="h-4 w-4 text-accent flex-shrink-0" />
                  <span className="text-sm font-medium truncate">{course.title}</span>
                </div>
              ))}
            </motion.div>

            {/* Expiry */}
            {giftData.expiresAt && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="flex items-center justify-center gap-2 text-sm text-muted-foreground"
              >
                <Clock className="h-4 w-4" />
                <span>
                  Access until {format(new Date(giftData.expiresAt), 'MMM d, yyyy h:mm a')}
                </span>
              </motion.div>
            )}

            {/* CTA */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
            >
              <Button
                size="lg"
                className="w-full mt-4 gap-2"
                onClick={handleStartLearning}
              >
                {giftData.ctaText}
              </Button>
            </motion.div>

            {canDismiss && (
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => onOpenChange(false)}
              >
                Maybe later
              </motion.button>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
