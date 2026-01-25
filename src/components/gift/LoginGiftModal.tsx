import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Gift, Sparkles, Clock, BookOpen, Star, Zap, ChevronRight, X } from 'lucide-react';
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

// Floating particle component
const FloatingParticle = ({ delay, duration, size, color }: { delay: number; duration: number; size: number; color: string }) => (
  <motion.div
    initial={{ opacity: 0, y: 50, scale: 0 }}
    animate={{ 
      opacity: [0, 1, 1, 0],
      y: [50, -100],
      scale: [0, 1, 1, 0.5],
      x: [0, Math.random() * 100 - 50]
    }}
    transition={{ 
      duration,
      delay,
      repeat: Infinity,
      ease: "easeOut"
    }}
    className="absolute pointer-events-none"
    style={{
      width: size,
      height: size,
      borderRadius: '50%',
      background: color,
      left: `${Math.random() * 100}%`,
      bottom: 0,
    }}
  />
);

// Sparkle star component
const SparkleIcon = ({ delay, x, y }: { delay: number; x: string; y: string }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0, rotate: 0 }}
    animate={{ 
      opacity: [0, 1, 0],
      scale: [0, 1, 0],
      rotate: [0, 180]
    }}
    transition={{ 
      duration: 2,
      delay,
      repeat: Infinity,
      ease: "easeInOut"
    }}
    className="absolute pointer-events-none"
    style={{ left: x, top: y }}
  >
    <Star className="h-3 w-3 text-accent fill-accent" />
  </motion.div>
);

export function LoginGiftModal({ open, onOpenChange, giftData }: LoginGiftModalProps) {
  const [canDismiss, setCanDismiss] = useState(false);
  const [showContent, setShowContent] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (open) {
      setCanDismiss(false);
      setShowContent(false);
      
      // Stagger content reveal
      const contentTimer = setTimeout(() => setShowContent(true), 300);
      // Allow dismiss after 2.5 seconds
      const dismissTimer = setTimeout(() => setCanDismiss(true), 2500);
      
      return () => {
        clearTimeout(contentTimer);
        clearTimeout(dismissTimer);
      };
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
        className="fixed inset-0 z-[100] flex items-center justify-center p-4"
        onClick={handleDismiss}
      >
        {/* Gradient backdrop with blur */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 bg-gradient-to-br from-black/90 via-black/80 to-accent/20 backdrop-blur-md"
        />
        
        {/* Floating particles background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(15)].map((_, i) => (
            <FloatingParticle
              key={i}
              delay={i * 0.3}
              duration={3 + Math.random() * 2}
              size={4 + Math.random() * 8}
              color={i % 3 === 0 ? 'hsl(var(--accent))' : i % 3 === 1 ? '#fbbf24' : 'hsl(var(--primary))'}
            />
          ))}
        </div>

        {/* Main modal container */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0, y: 40, rotateX: 15 }}
          animate={{ scale: 1, opacity: 1, y: 0, rotateX: 0 }}
          exit={{ scale: 0.8, opacity: 0, y: 40 }}
          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          className="relative max-w-lg w-full overflow-hidden"
          onClick={(e) => e.stopPropagation()}
          style={{ perspective: 1000 }}
        >
            {/* Glowing border effect */}
            <div className="absolute -inset-[1px] bg-gradient-to-r from-accent via-primary to-accent rounded-3xl opacity-75 blur-sm animate-pulse" />
            
            {/* Card content */}
            <div className="relative bg-gradient-to-b from-card via-card to-card/95 rounded-3xl overflow-hidden">
              {/* Top decorative gradient strip */}
              <div className="h-1.5 bg-gradient-to-r from-accent via-primary to-accent" />
            
            {/* Sparkle decorations */}
            <SparkleIcon delay={0} x="10%" y="20%" />
            <SparkleIcon delay={0.5} x="85%" y="15%" />
            <SparkleIcon delay={1} x="5%" y="60%" />
            <SparkleIcon delay={1.5} x="90%" y="55%" />
            <SparkleIcon delay={2} x="50%" y="10%" />
            
            {/* Close button (appears after dismiss timer) */}
            <AnimatePresence>
              {canDismiss && (
                <motion.button
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0 }}
                  onClick={() => onOpenChange(false)}
                  className="absolute top-4 right-4 p-2 rounded-full bg-muted/50 hover:bg-muted transition-colors z-10"
                >
                  <X className="h-4 w-4 text-muted-foreground" />
                </motion.button>
              )}
            </AnimatePresence>

            <div className="p-6 md:p-8">
              {/* Gift icon with animation */}
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', delay: 0.2, damping: 12 }}
                className="relative mx-auto w-20 h-20 mb-6"
              >
                {/* Pulsing rings */}
                <motion.div
                  animate={{ scale: [1, 1.4, 1], opacity: [0.5, 0, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                  className="absolute inset-0 rounded-full bg-gradient-to-br from-accent to-primary"
                />
                <motion.div
                  animate={{ scale: [1, 1.6, 1], opacity: [0.3, 0, 0.3] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut', delay: 0.3 }}
                  className="absolute inset-0 rounded-full bg-gradient-to-br from-accent to-primary"
                />
                
                {/* Icon container */}
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-accent to-primary flex items-center justify-center shadow-lg shadow-accent/30">
                  <motion.div
                    animate={{ rotate: [0, -10, 10, -10, 0] }}
                    transition={{ duration: 0.5, delay: 0.8, repeat: 2 }}
                  >
                    <Gift className="h-10 w-10 text-accent-foreground" />
                  </motion.div>
                </div>
                
                {/* Floating sparkles around icon */}
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
                  className="absolute -inset-4"
                >
                  <Sparkles className="h-5 w-5 text-accent absolute -top-2 left-1/2 -translate-x-1/2" />
                  <Sparkles className="h-4 w-4 text-primary absolute top-1/2 -right-2 -translate-y-1/2" />
                  <Sparkles className="h-5 w-5 text-accent absolute -bottom-2 left-1/2 -translate-x-1/2" />
                  <Sparkles className="h-4 w-4 text-primary absolute top-1/2 -left-2 -translate-y-1/2" />
                </motion.div>
              </motion.div>

              {/* Title with animated reveal */}
              <AnimatePresence>
                {showContent && (
                  <>
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 }}
                      className="text-center mb-2"
                    >
                      <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 border border-accent/20 text-accent text-xs font-medium">
                        <Zap className="h-3 w-3" />
                        Special Gift Unlocked
                      </span>
                    </motion.div>
                    
                    <motion.h2
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      className="text-2xl md:text-3xl font-bold text-center mb-3 bg-gradient-to-r from-foreground via-accent to-foreground bg-clip-text text-transparent"
                    >
                      Studio Access Granted! 🎉
                    </motion.h2>

                    <motion.p
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                      className="text-center text-muted-foreground mb-6 text-sm md:text-base"
                    >
                      {giftData.message}
                    </motion.p>

                    {/* Courses list with stagger animation */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                      className="space-y-2 mb-6"
                    >
                      {giftData.courses.map((course, index) => (
                        <motion.div
                          key={course.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.5 + index * 0.1 }}
                          className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-muted/50 to-muted/30 border border-border/50 group hover:border-accent/30 transition-all"
                        >
                          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-accent/20 to-accent/5 flex items-center justify-center shrink-0">
                            <BookOpen className="h-5 w-5 text-accent" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate group-hover:text-accent transition-colors">
                              {course.title}
                            </p>
                            <p className="text-xs text-muted-foreground">Full access included</p>
                          </div>
                          <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-accent transition-colors" />
                        </motion.div>
                      ))}
                    </motion.div>

                    {/* Expiry notice */}
                    {giftData.expiresAt && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6 }}
                        className="flex items-center justify-center gap-2 text-xs text-muted-foreground bg-muted/30 rounded-lg px-4 py-2 mb-6"
                      >
                        <Clock className="h-3.5 w-3.5" />
                        <span>
                          Access until {format(new Date(giftData.expiresAt), 'MMM d, yyyy • h:mm a')}
                        </span>
                      </motion.div>
                    )}

                    {/* CTA Button */}
                    <motion.div
                      initial={{ opacity: 0, y: 20, scale: 0.9 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ delay: 0.7, type: 'spring' }}
                    >
                      <Button
                        size="lg"
                        onClick={handleStartLearning}
                        className="w-full h-12 text-base font-semibold bg-gradient-to-r from-accent to-primary hover:from-accent/90 hover:to-primary/90 text-accent-foreground shadow-lg shadow-accent/25 group"
                      >
                        <span>{giftData.ctaText}</span>
                        <motion.span
                          animate={{ x: [0, 4, 0] }}
                          transition={{ duration: 1.5, repeat: Infinity }}
                        >
                          <ChevronRight className="h-5 w-5 ml-2" />
                        </motion.span>
                      </Button>
                    </motion.div>

                    {/* Maybe later link */}
                    <AnimatePresence>
                      {canDismiss && (
                        <motion.button
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ delay: 0.3 }}
                          className="w-full mt-4 text-center text-xs text-muted-foreground hover:text-foreground transition-colors"
                          onClick={() => onOpenChange(false)}
                        >
                          Maybe later
                        </motion.button>
                      )}
                    </AnimatePresence>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
