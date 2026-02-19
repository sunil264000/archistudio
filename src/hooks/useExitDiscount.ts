import { useState, useEffect, useCallback } from 'react';

const DISCOUNT_KEY = 'exit_discount_start';
const DISCOUNT_EXTENDED_KEY = 'exit_discount_extended';
const DISCOUNT_USED_KEY = 'exit_discount_used';
const INITIAL_DURATION = 15 * 60; // 15 minutes
const EXTENSION_DURATION = 5 * 60; // 5 minutes
export const EXIT_DISCOUNT_PERCENT = 10;

export interface ExitDiscountState {
  isActive: boolean;
  timeLeft: number; // seconds remaining
  discountPercent: number;
  isExtended: boolean;
  canExtend: boolean;
  activate: () => void;
  extend: () => void;
  formatTime: (seconds: number) => string;
}

export function useExitDiscount(): ExitDiscountState {
  const [timeLeft, setTimeLeft] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [isExtended, setIsExtended] = useState(false);

  const getState = useCallback(() => {
    if (localStorage.getItem(DISCOUNT_USED_KEY)) return { active: false, remaining: 0, extended: false };
    const startStr = localStorage.getItem(DISCOUNT_KEY);
    if (!startStr) return { active: false, remaining: 0, extended: false };

    const start = parseInt(startStr, 10);
    const extended = localStorage.getItem(DISCOUNT_EXTENDED_KEY) === 'true';
    const totalDuration = INITIAL_DURATION + (extended ? EXTENSION_DURATION : 0);
    const elapsed = Math.floor((Date.now() - start) / 1000);
    const remaining = totalDuration - elapsed;

    if (remaining <= 0) {
      // Timer expired — if not extended yet, allow extension
      if (!extended) {
        return { active: false, remaining: 0, extended: false };
      }
      // Fully expired
      localStorage.setItem(DISCOUNT_USED_KEY, 'true');
      return { active: false, remaining: 0, extended: true };
    }

    return { active: true, remaining, extended };
  }, []);

  // Initialize from localStorage
  useEffect(() => {
    const state = getState();
    setIsActive(state.active);
    setTimeLeft(state.remaining);
    setIsExtended(state.extended);
  }, [getState]);

  // Countdown
  useEffect(() => {
    if (!isActive) return;
    const interval = setInterval(() => {
      const state = getState();
      setTimeLeft(state.remaining);
      setIsActive(state.active);
      setIsExtended(state.extended);
      if (!state.active) clearInterval(interval);
    }, 1000);
    return () => clearInterval(interval);
  }, [isActive, getState]);

  const activate = useCallback(() => {
    if (localStorage.getItem(DISCOUNT_USED_KEY)) return;
    if (localStorage.getItem(DISCOUNT_KEY)) return; // Already activated
    localStorage.setItem(DISCOUNT_KEY, Date.now().toString());
    setIsActive(true);
    setTimeLeft(INITIAL_DURATION);
  }, []);

  const extend = useCallback(() => {
    if (localStorage.getItem(DISCOUNT_EXTENDED_KEY) === 'true') return;
    localStorage.setItem(DISCOUNT_EXTENDED_KEY, 'true');
    // Reset start time to now so they get the full 5 min extension
    const startStr = localStorage.getItem(DISCOUNT_KEY);
    if (startStr) {
      const start = parseInt(startStr, 10);
      const elapsed = Math.floor((Date.now() - start) / 1000);
      // If timer already expired, restart from now with extension only
      if (elapsed >= INITIAL_DURATION) {
        localStorage.setItem(DISCOUNT_KEY, (Date.now() - INITIAL_DURATION * 1000).toString());
      }
    }
    setIsExtended(true);
    setIsActive(true);
    const state = getState();
    setTimeLeft(state.remaining > 0 ? state.remaining : EXTENSION_DURATION);
  }, [getState]);

  const canExtend = !isActive && !isExtended && !!localStorage.getItem(DISCOUNT_KEY) && !localStorage.getItem(DISCOUNT_USED_KEY);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return {
    isActive,
    timeLeft,
    discountPercent: EXIT_DISCOUNT_PERCENT,
    isExtended,
    canExtend,
    activate,
    extend,
    formatTime,
  };
}
