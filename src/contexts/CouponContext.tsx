import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';

const STORAGE_KEY = 'archi.activeCoupon';

interface ActiveCoupon {
  code: string;
  freeCourseId: string | null;
  discountPercent: number;
  expiresAt: string; // ISO
}

interface CouponContextType {
  active: ActiveCoupon | null;
  secondsLeft: number;
  isActive: boolean;
  redeem: (code: string, opts?: { silent?: boolean }) => Promise<{ success: boolean; error?: string; alreadyRedeemed?: boolean }>;
  applyDiscountedPrice: (price: number, courseId?: string) => number;
  refresh: () => Promise<void>;
}

const CouponContext = createContext<CouponContextType | undefined>(undefined);

function celebrate() {
  try {
    const end = Date.now() + 1200;
    const colors = ['#D4AF37', '#7B1E2C', '#FFFFFF'];
    (function frame() {
      confetti({ particleCount: 4, angle: 60, spread: 70, origin: { x: 0 }, colors });
      confetti({ particleCount: 4, angle: 120, spread: 70, origin: { x: 1 }, colors });
      if (Date.now() < end) requestAnimationFrame(frame);
    })();
  } catch (_) { /* ignore */ }
}

export function CouponProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [active, setActive] = useState<ActiveCoupon | null>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as ActiveCoupon;
      if (new Date(parsed.expiresAt).getTime() > Date.now()) return parsed;
      return null;
    } catch { return null; }
  });
  const [secondsLeft, setSecondsLeft] = useState(0);

  const persist = (c: ActiveCoupon | null) => {
    if (c) localStorage.setItem(STORAGE_KEY, JSON.stringify(c));
    else localStorage.removeItem(STORAGE_KEY);
    setActive(c);
  };

  const refresh = useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase.rpc('get_active_coupon_redemption');
    if (error) return;
    const row = Array.isArray(data) ? data[0] : null;
    if (row) {
      persist({
        code: row.coupon_code,
        freeCourseId: row.free_course_id,
        discountPercent: row.discount_percent,
        expiresAt: row.timer_expires_at,
      });
    }
  }, [user]);

  // Auto-apply MAY2026 on sign-in
  useEffect(() => {
    if (!user) return;
    (async () => {
      await refresh();
      // If no active redemption yet, attempt silent auto-apply
      const raw = localStorage.getItem(STORAGE_KEY);
      const current = raw ? (JSON.parse(raw) as ActiveCoupon) : null;
      if (!current || new Date(current.expiresAt).getTime() <= Date.now()) {
        const { data, error } = await supabase.rpc('redeem_coupon', { p_code: 'MAY2026' });
        if (!error && data && (data as any).success) {
          const d = data as any;
          persist({
            code: 'MAY2026',
            freeCourseId: d.free_course_id ?? null,
            discountPercent: d.discount_percent ?? 0,
            expiresAt: d.timer_expires_at,
          });
          if (!d.already_redeemed) {
            celebrate();
            toast.success('🎉 MAY2026 coupon applied!', {
              description: 'Free Master Course unlocked + 20% off everything for 10 minutes.',
              duration: 6000,
            });
          }
        }
      }
    })();
  }, [user, refresh]);

  // Countdown
  useEffect(() => {
    if (!active) { setSecondsLeft(0); return; }
    const tick = () => {
      const ms = new Date(active.expiresAt).getTime() - Date.now();
      if (ms <= 0) { persist(null); setSecondsLeft(0); return; }
      setSecondsLeft(Math.floor(ms / 1000));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [active]);

  const redeem = useCallback(async (code: string, opts?: { silent?: boolean }) => {
    if (!user) {
      return { success: false, error: 'Please sign in first to redeem a coupon.' };
    }
    const { data, error } = await supabase.rpc('redeem_coupon', { p_code: code });
    if (error) return { success: false, error: error.message };
    const d = data as any;
    if (!d?.success) return { success: false, error: d?.error || 'Could not redeem coupon.' };
    persist({
      code: code.toUpperCase().trim(),
      freeCourseId: d.free_course_id ?? null,
      discountPercent: d.discount_percent ?? 0,
      expiresAt: d.timer_expires_at,
    });
    if (!opts?.silent && !d.already_redeemed) {
      celebrate();
      toast.success(`🎉 ${code.toUpperCase()} applied!`, {
        description: 'Free course unlocked + discount started for 10 minutes.',
        duration: 6000,
      });
    }
    return { success: true, alreadyRedeemed: !!d.already_redeemed };
  }, [user]);

  const applyDiscountedPrice = useCallback((price: number, courseId?: string) => {
    if (!active || secondsLeft <= 0) return price;
    if (courseId && active.freeCourseId === courseId) return 0;
    if (active.discountPercent <= 0) return price;
    return Math.round(price * (1 - active.discountPercent / 100));
  }, [active, secondsLeft]);

  return (
    <CouponContext.Provider value={{
      active,
      secondsLeft,
      isActive: !!active && secondsLeft > 0,
      redeem,
      applyDiscountedPrice,
      refresh,
    }}>
      {children}
    </CouponContext.Provider>
  );
}

export const useCoupon = () => {
  const ctx = useContext(CouponContext);
  if (!ctx) throw new Error('useCoupon must be used within CouponProvider');
  return ctx;
};
