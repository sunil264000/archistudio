import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { X, Timer, Flame } from 'lucide-react';
import { useSaleDiscount } from '@/hooks/useSaleDiscount';

export function SaleBanner() {
  const { isActive, discountPercent, endTime, title, loading } = useSaleDiscount();
  const [dismissed, setDismissed] = useState(() => {
    return sessionStorage.getItem('sale_banner_dismissed') === 'true';
  });
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    if (!endTime) return;
    const update = () => {
      const diff = new Date(endTime).getTime() - Date.now();
      if (diff <= 0) { setTimeLeft(''); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTimeLeft(`${h}h ${m}m ${s}s`);
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [endTime]);

  if (loading || !isActive || dismissed) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[60] bg-destructive text-destructive-foreground">
      <div className="container mx-auto px-4 flex items-center justify-between h-10 text-sm">
        <Link to="/courses" className="flex items-center gap-2 flex-1 min-w-0">
          <Flame className="h-4 w-4 shrink-0 animate-pulse" />
          <span className="font-semibold truncate">{title} — {discountPercent}% OFF</span>
          {timeLeft && (
            <span className="hidden sm:inline-flex items-center gap-1 text-xs opacity-90">
              <Timer className="h-3 w-3" /> Ends in {timeLeft}
            </span>
          )}
        </Link>
        <div className="flex items-center gap-3">
          <Link to="/courses" className="hidden sm:block text-xs font-medium underline underline-offset-2 hover:opacity-80">
            Shop Now →
          </Link>
          <button onClick={() => { setDismissed(true); sessionStorage.setItem('sale_banner_dismissed', 'true'); }} className="p-1 hover:opacity-70 transition-opacity">
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
