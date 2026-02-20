import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

const INITIAL_DURATION = 900; // 15 minutes
const EXTENSION_DURATION = 300; // 5 minutes
export const EXIT_DISCOUNT_PERCENT = 10;

export interface ExitDiscountState {
  isActive: boolean;
  timeLeft: number;
  discountPercent: number;
  isExtended: boolean;
  canExtend: boolean;
  activate: () => void;
  extend: () => void;
  formatTime: (seconds: number) => string;
  loading: boolean;
}

interface TimerRow {
  activated_at: string;
  extended: boolean;
  extended_at: string | null;
  expired: boolean;
  initial_duration_seconds: number;
  extension_duration_seconds: number;
  discount_percent: number;
}

function calcState(row: TimerRow | null): { active: boolean; remaining: number; extended: boolean; canExtend: boolean; discountPercent: number } {
  if (!row || row.expired) return { active: false, remaining: 0, extended: false, canExtend: false, discountPercent: EXIT_DISCOUNT_PERCENT };

  const start = new Date(row.activated_at).getTime();
  const totalDuration = row.initial_duration_seconds + (row.extended ? row.extension_duration_seconds : 0);
  const elapsed = Math.floor((Date.now() - start) / 1000);
  const remaining = totalDuration - elapsed;

  if (remaining <= 0) {
    if (!row.extended) {
      return { active: false, remaining: 0, extended: false, canExtend: true, discountPercent: row.discount_percent };
    }
    return { active: false, remaining: 0, extended: true, canExtend: false, discountPercent: row.discount_percent };
  }

  return { active: true, remaining, extended: row.extended, canExtend: false, discountPercent: row.discount_percent };
}

// Helper to query user_discount_timers (not in generated types yet)
const timerTable = () => (supabase as any).from('user_discount_timers');

export function useExitDiscount(): ExitDiscountState {
  const { user } = useAuth();
  const [row, setRow] = useState<TimerRow | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [isExtended, setIsExtended] = useState(false);
  const [canExtend, setCanExtend] = useState(false);
  const [loading, setLoading] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchTimer = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    try {
      const { data } = await timerTable()
        .select('activated_at, extended, extended_at, expired, initial_duration_seconds, extension_duration_seconds, discount_percent')
        .eq('user_id', user.id)
        .maybeSingle();

      setRow(data as TimerRow | null);
      if (data) {
        const s = calcState(data as TimerRow);
        setIsActive(s.active);
        setTimeLeft(s.remaining);
        setIsExtended(s.extended);
        setCanExtend(s.canExtend);

        // Fix stuck timer: if expired (time up) and not yet marked expired in DB, write it now
        if (!s.active && !(data as any).expired) {
          await timerTable().update({ expired: true }).eq('user_id', user.id);
        }
      }
    } catch (e) {
      console.warn('Discount timer fetch error:', e);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchTimer(); }, [fetchTimer]);

  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (!isActive || !row) return;

    intervalRef.current = setInterval(() => {
      const s = calcState(row);
      setTimeLeft(s.remaining);
      setIsActive(s.active);
      setCanExtend(s.canExtend);
      if (!s.active) {
        clearInterval(intervalRef.current!);
        if (s.extended && user) {
          timerTable().update({ expired: true }).eq('user_id', user.id);
        }
      }
    }, 1000);

    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isActive, row, user]);

  const activate = useCallback(async () => {
    if (!user || row) return;
    try {
      const newRow = {
        user_id: user.id,
        activated_at: new Date().toISOString(),
        extended: false,
        expired: false,
        initial_duration_seconds: INITIAL_DURATION,
        extension_duration_seconds: EXTENSION_DURATION,
        discount_percent: EXIT_DISCOUNT_PERCENT,
      };
      const { data } = await timerTable().insert(newRow).select().single();
      if (data) {
        setRow(data as TimerRow);
        setIsActive(true);
        setTimeLeft(INITIAL_DURATION);
        setIsExtended(false);
        setCanExtend(false);
      }
    } catch (e) {
      console.warn('Failed to activate discount timer:', e);
    }
  }, [user, row]);

  const extend = useCallback(async () => {
    if (!user || !row || isExtended) return;
    try {
      await timerTable().update({
        extended: true,
        extended_at: new Date().toISOString(),
      }).eq('user_id', user.id);

      const updatedRow = { ...row, extended: true, extended_at: new Date().toISOString() };
      setRow(updatedRow);
      const s = calcState(updatedRow);
      setIsActive(true);
      setTimeLeft(s.remaining > 0 ? s.remaining : EXTENSION_DURATION);
      setIsExtended(true);
      setCanExtend(false);
    } catch (e) {
      console.warn('Failed to extend discount timer:', e);
    }
  }, [user, row, isExtended]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return {
    isActive: isActive && !!user,
    timeLeft,
    discountPercent: row?.discount_percent ?? EXIT_DISCOUNT_PERCENT,
    isExtended,
    canExtend: canExtend && !!user,
    activate,
    extend,
    formatTime,
    loading,
  };
}
