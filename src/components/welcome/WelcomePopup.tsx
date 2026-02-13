import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Quote } from 'lucide-react';
import { Button } from '@/components/ui/button';

const architectureQuotes = [
  { quote: "Architecture is the learned game, correct and magnificent, of forms assembled in the light.", author: "Le Corbusier" },
  { quote: "Less is more.", author: "Ludwig Mies van der Rohe" },
  { quote: "Architecture should speak of its time and place, but yearn for timelessness.", author: "Frank Gehry" },
  { quote: "God is in the details.", author: "Ludwig Mies van der Rohe" },
  { quote: "A great building must begin with the immeasurable, must go through measurable means when it is being designed, and in the end must be unmeasured.", author: "Louis Kahn" },
  { quote: "Architecture is basically a container of something. I hope they will enjoy not so much the teacup, but the tea.", author: "Yoshio Taniguchi" },
  { quote: "The mother art is architecture. Without an architecture of our own we have no soul of our own civilization.", author: "Frank Lloyd Wright" },
  { quote: "To create, one must first question everything.", author: "Eileen Gray" },
  { quote: "Space and light and order. Those are the things that men need just as much as they need bread or a place to sleep.", author: "Le Corbusier" },
  { quote: "Every great architect is — necessarily — a great poet.", author: "Frank Lloyd Wright" },
  { quote: "I don't design buildings, I design the quality of life for the people who live in them.", author: "Bjarke Ingels" },
  { quote: "Architecture is the thoughtful making of space.", author: "Louis Kahn" },
  { quote: "The details are not the details. They make the design.", author: "Charles Eames" },
  { quote: "Form follows function — that has been misunderstood. Form and function should be one.", author: "Frank Lloyd Wright" },
];

export function WelcomePopup() {
  const [isVisible, setIsVisible] = useState(false);
  const [todayQuote, setTodayQuote] = useState(architectureQuotes[0]);

  useEffect(() => {
    const lastShown = localStorage.getItem('archistudio_welcome_shown');
    const today = new Date().toDateString();

    if (lastShown === today) return;

    // Pick quote based on day of year for consistency
    const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
    setTodayQuote(architectureQuotes[dayOfYear % architectureQuotes.length]);

    const timer = setTimeout(() => setIsVisible(true), 1800);
    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    localStorage.setItem('archistudio_welcome_shown', new Date().toDateString());
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={handleClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          {/* Modal */}
          <motion.div
            className="relative w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl overflow-hidden"
            initial={{ scale: 0.8, y: 40, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.9, y: 20, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          >
            {/* Top accent bar */}
            <div className="h-1.5 bg-gradient-to-r from-accent via-primary to-accent" />

            {/* Floating particles */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              {[...Array(6)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-1.5 h-1.5 rounded-full bg-accent/20"
                  style={{
                    left: `${15 + i * 15}%`,
                    top: `${20 + (i % 3) * 25}%`,
                  }}
                  animate={{
                    y: [-8, 8, -8],
                    opacity: [0.2, 0.5, 0.2],
                  }}
                  transition={{
                    duration: 3 + i * 0.5,
                    repeat: Infinity,
                    ease: 'easeInOut',
                    delay: i * 0.3,
                  }}
                />
              ))}
            </div>

            {/* Close button */}
            <button
              onClick={handleClose}
              className="absolute top-3 right-3 z-10 p-1.5 rounded-full bg-muted/80 hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Content */}
            <div className="relative px-6 py-8 text-center">
              {/* Icon */}
              <motion.div
                className="mx-auto w-14 h-14 rounded-full bg-accent/10 flex items-center justify-center mb-4"
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              >
                <Sparkles className="w-7 h-7 text-accent" />
              </motion.div>

              <motion.h2
                className="text-xl font-bold text-foreground mb-1"
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.15 }}
              >
                Welcome to Archistudio
              </motion.h2>

              <motion.p
                className="text-sm text-muted-foreground mb-5"
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.25 }}
              >
                Today's Architecture Thought
              </motion.p>

              {/* Quote card */}
              <motion.div
                className="relative bg-muted/50 border border-border rounded-xl p-5 mb-6"
                initial={{ y: 15, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.35 }}
              >
                <Quote className="w-5 h-5 text-accent/40 mb-2 mx-auto" />
                <p className="text-foreground font-medium italic leading-relaxed text-[15px]">
                  "{todayQuote.quote}"
                </p>
                <p className="text-accent font-semibold text-sm mt-3">
                  — {todayQuote.author}
                </p>
              </motion.div>

              {/* CTA */}
              <motion.div
                className="flex gap-3"
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.45 }}
              >
                <Button
                  onClick={handleClose}
                  variant="default"
                  className="flex-1"
                  size="lg"
                >
                  Explore Courses
                </Button>
                <Button
                  onClick={() => {
                    handleClose();
                    window.location.href = '/contact';
                  }}
                  variant="outline"
                  className="flex-1"
                  size="lg"
                >
                  Get in Touch
                </Button>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
