import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Gift, Timer } from 'lucide-react';
import { useExitDiscount } from '@/hooks/useExitDiscount';
import { useAuth } from '@/contexts/AuthContext';

const EXIT_INTENT_SHOWN_KEY = 'exit_intent_popup_shown';

export function ExitIntentPopup() {
  const [open, setOpen] = useState(false);
  const { activate, isActive, timeLeft, discountPercent, formatTime, loading } = useExitDiscount();
  const { user } = useAuth();
  const navigate = useNavigate();

  const shouldShow = useCallback(() => {
    if (!user) return false; // Only for logged-in users
    if (isActive) return false; // Already has active discount
    if (sessionStorage.getItem(EXIT_INTENT_SHOWN_KEY)) return false;
    return true;
  }, [user, isActive]);

  useEffect(() => {
    if (loading || !shouldShow()) return;

    const handleMouseLeave = (e: MouseEvent) => {
      if (e.clientY <= 0) {
        sessionStorage.setItem(EXIT_INTENT_SHOWN_KEY, 'true');
        activate();
        setOpen(true);
      }
    };

    let lastScrollY = window.scrollY;
    let lastTime = Date.now();
    const handleScroll = () => {
      const currentY = window.scrollY;
      const currentTime = Date.now();
      const speed = (lastScrollY - currentY) / (currentTime - lastTime);
      if (speed > 2 && currentY < 100) {
        sessionStorage.setItem(EXIT_INTENT_SHOWN_KEY, 'true');
        activate();
        setOpen(true);
      }
      lastScrollY = currentY;
      lastTime = currentTime;
    };

    const timer = setTimeout(() => {
      document.addEventListener('mouseleave', handleMouseLeave);
      window.addEventListener('scroll', handleScroll, { passive: true });
    }, 10000);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [shouldShow, activate, loading]);

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
            Get <span className="font-bold text-accent">{discountPercent}% OFF</span> on any course!
            Your discount is <strong>auto-applied</strong> and starts now.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {isActive && timeLeft > 0 && (
            <div className="flex items-center justify-center gap-2 text-sm">
              <Timer className="h-4 w-4 text-destructive" />
              <span className="text-muted-foreground">
                Expires in <span className="font-bold text-destructive font-mono">{formatTime(timeLeft)}</span>
              </span>
            </div>
          )}

          <Button onClick={handleShopNow} className="w-full" size="lg" variant="gradient">
            Browse Courses — {discountPercent}% OFF →
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
