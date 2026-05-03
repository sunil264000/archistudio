import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useCoupon } from '@/contexts/CouponContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Gift, GraduationCap, Timer, Sparkles, MessageCircle, Instagram, Send } from 'lucide-react';
import { motion } from 'framer-motion';

const SHOWN_KEY_PREFIX = 'archi.may2026.celebShown.';

function fmt(s: number) {
  const m = Math.floor(s / 60).toString().padStart(2, '0');
  const ss = (s % 60).toString().padStart(2, '0');
  return `${m}:${ss}`;
}

export function CouponCelebrationModal() {
  const { user } = useAuth();
  const { active, secondsLeft, isActive } = useCoupon();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [courseSlug, setCourseSlug] = useState<string | null>(null);
  const [socials, setSocials] = useState<{ whatsapp_channel_url?: string; instagram_url?: string; telegram_url?: string }>({});

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('site_settings')
        .select('key, value')
        .in('key', ['whatsapp_channel_url', 'instagram_url', 'telegram_url']);
      if (data) {
        const map: Record<string, string> = {};
        data.forEach((r: any) => { if (r.value) map[r.key] = r.value; });
        setSocials(map);
      }
    })();
  }, []);

  // Show once per user when an active redemption is detected
  useEffect(() => {
    if (!user?.id || !isActive || !active) return;
    const key = `${SHOWN_KEY_PREFIX}${user.id}`;
    if (sessionStorage.getItem(key) === '1') return;
    // small delay so it follows the confetti
    const t = setTimeout(() => {
      setOpen(true);
      sessionStorage.setItem(key, '1');
    }, 600);
    return () => clearTimeout(t);
  }, [user?.id, isActive, active]);

  // Resolve free course slug for the CTA
  useEffect(() => {
    if (!active?.freeCourseId) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from('courses')
        .select('slug')
        .eq('id', active.freeCourseId)
        .maybeSingle();
      if (!cancelled && data?.slug) setCourseSlug(data.slug);
    })();
    return () => { cancelled = true; };
  }, [active?.freeCourseId]);

  if (!active) return null;

  const goToFreeCourse = () => {
    setOpen(false);
    if (courseSlug) navigate(`/courses/${courseSlug}`);
    else navigate('/dashboard');
  };

  const browseDiscounted = () => {
    setOpen(false);
    navigate('/courses');
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-lg overflow-hidden border-accent/30 bg-gradient-to-br from-background via-background to-accent/5">
        <div className="absolute inset-0 pointer-events-none opacity-50">
          <div className="absolute -top-20 -right-20 h-56 w-56 rounded-full bg-accent/30 blur-3xl" />
          <div className="absolute -bottom-20 -left-20 h-56 w-56 rounded-full bg-primary/30 blur-3xl" />
        </div>

        <DialogHeader className="relative z-10">
          <motion.div
            initial={{ scale: 0, rotate: -30 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 220, damping: 14 }}
            className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-accent to-accent/60 shadow-lg shadow-accent/30"
          >
            <Gift className="h-8 w-8 text-accent-foreground" />
          </motion.div>
          <DialogTitle className="text-center text-2xl font-display tracking-tight">
            🎉 MAY2026 Unlocked
          </DialogTitle>
          <DialogDescription className="text-center text-base">
            Welcome to ArchiStudio. Your free Master Course is in your library
            and a <span className="font-semibold text-accent">20% discount</span> is
            now active for the next few minutes.
          </DialogDescription>
        </DialogHeader>

        <div className="relative z-10 mt-2 flex items-center justify-center gap-2 text-sm">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-accent/30 bg-accent/10 px-3 py-1.5 font-mono tabular-nums">
            <Timer className="h-3.5 w-3.5 text-accent" />
            {fmt(secondsLeft)} left for 20% off
          </div>
        </div>

        <div className="relative z-10 mt-5 grid gap-3 sm:grid-cols-2">
          <Button
            size="lg"
            onClick={goToFreeCourse}
            className="h-auto flex-col gap-1 py-4"
          >
            <GraduationCap className="h-5 w-5" />
            <span className="font-semibold">View my free course</span>
            <span className="text-[11px] font-normal opacity-80">AutoCAD & SketchUp</span>
          </Button>
          <Button
            size="lg"
            variant="outline"
            onClick={browseDiscounted}
            className="h-auto flex-col gap-1 py-4 border-accent/40 hover:bg-accent/10"
          >
            <Sparkles className="h-5 w-5 text-accent" />
            <span className="font-semibold">Browse 20% off courses</span>
            <span className="text-[11px] font-normal opacity-80">Timer is running</span>
          </Button>
        </div>

        {(socials.whatsapp_channel_url || socials.instagram_url || socials.telegram_url) && (
          <div className="relative z-10 mt-5 rounded-xl border border-border/40 bg-secondary/30 p-3.5">
            <div className="text-center text-[11px] uppercase tracking-[0.18em] text-muted-foreground mb-2.5">
              Join the community — never miss a drop
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2">
              {socials.whatsapp_channel_url && (
                <a
                  href={socials.whatsapp_channel_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-full bg-[#25D366] px-3.5 py-1.5 text-xs font-semibold text-white transition-transform hover:scale-105"
                >
                  <MessageCircle className="h-3.5 w-3.5" /> WhatsApp Channel
                </a>
              )}
              {socials.instagram_url && (
                <a
                  href={socials.instagram_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-tr from-[#feda75] via-[#d62976] to-[#4f5bd5] px-3.5 py-1.5 text-xs font-semibold text-white transition-transform hover:scale-105"
                >
                  <Instagram className="h-3.5 w-3.5" /> Instagram
                </a>
              )}
              {socials.telegram_url && (
                <a
                  href={socials.telegram_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-full bg-[#229ED9] px-3.5 py-1.5 text-xs font-semibold text-white transition-transform hover:scale-105"
                >
                  <Send className="h-3.5 w-3.5" /> Telegram
                </a>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
