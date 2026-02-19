import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Gift, Timer, Copy, Check } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

const EXIT_INTENT_KEY = 'exit_intent_shown_v2'; // localStorage so it persists across sessions
const COUPON_CODE = 'STAYWITHUS10';
const DISCOUNT_PERCENT = 10;
const TIMER_SECONDS = 15 * 60; // 15 minutes

export function ExitIntentPopup() {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [timeLeft, setTimeLeft] = useState(TIMER_SECONDS);
  const { user } = useAuth();
  const navigate = useNavigate();

  const shouldShow = useCallback(() => {
    // Use localStorage so it only shows ONCE ever (not per session)
    if (localStorage.getItem(EXIT_INTENT_KEY)) return false;
    return true;
  }, []);

  useEffect(() => {
    if (!shouldShow()) return;

    // Desktop: mouse leave
    const handleMouseLeave = (e: MouseEvent) => {
      if (e.clientY <= 0) {
        localStorage.setItem(EXIT_INTENT_KEY, 'true');
        setOpen(true);
      }
    };

    // Mobile: scroll up quickly detection
    let lastScrollY = window.scrollY;
    let lastTime = Date.now();
    const handleScroll = () => {
      const currentY = window.scrollY;
      const currentTime = Date.now();
      const speed = (lastScrollY - currentY) / (currentTime - lastTime);
      
      if (speed > 2 && currentY < 100) {
        localStorage.setItem(EXIT_INTENT_KEY, 'true');
        setOpen(true);
      }
      lastScrollY = currentY;
      lastTime = currentTime;
    };

    // Delay adding listeners so it doesn't trigger immediately
    const timer = setTimeout(() => {
      document.addEventListener('mouseleave', handleMouseLeave);
      window.addEventListener('scroll', handleScroll, { passive: true });
    }, 10000); // Wait 10 seconds before activating

    return () => {
      clearTimeout(timer);
      document.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [shouldShow]);

  // Countdown timer
  useEffect(() => {
    if (!open) return;
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) { clearInterval(interval); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [open]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(COUPON_CODE);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShopNow = () => {
    setOpen(false);
    navigate('/courses');
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex justify-center mb-3">
            <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center">
              <Gift className="h-8 w-8 text-accent" />
            </div>
          </div>
          <DialogTitle className="text-center text-xl">Wait! Here's a special offer 🎁</DialogTitle>
          <DialogDescription className="text-center">
            Get <span className="font-bold text-accent">{DISCOUNT_PERCENT}% OFF</span> on any course. Use this code before it expires!
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Coupon Code */}
          <div className="flex items-center justify-center gap-2">
            <div className="px-6 py-3 bg-secondary rounded-lg border-2 border-dashed border-accent/50 font-mono text-lg font-bold tracking-wider">
              {COUPON_CODE}
            </div>
            <Button size="icon" variant="outline" onClick={handleCopy}>
              {copied ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>

          {/* Timer */}
          {timeLeft > 0 && (
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Timer className="h-4 w-4 text-destructive" />
              <span>Expires in <span className="font-bold text-destructive">{formatTime(timeLeft)}</span></span>
            </div>
          )}

          <Button onClick={handleShopNow} className="w-full" size="lg" variant="gradient">
            Browse Courses →
          </Button>

          <button
            onClick={() => setOpen(false)}
            className="w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            No thanks, I'll pay full price
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
