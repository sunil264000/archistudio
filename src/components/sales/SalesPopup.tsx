import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { X, Clock, Flame, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';

interface SaleSettings {
  sale_active: boolean;
  sale_end_time: string | null;
  sale_discount_percent: number;
  sale_title: string;
}

export function SalesPopup() {
  const [saleSettings, setSaleSettings] = useState<SaleSettings | null>(null);
  const [timeLeft, setTimeLeft] = useState<{ hours: number; minutes: number; seconds: number } | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [showPopup, setShowPopup] = useState(false);

  // Fetch sale settings
  useEffect(() => {
    const fetchSettings = async () => {
      const { data } = await supabase
        .from('site_settings')
        .select('key, value')
        .in('key', ['sale_active', 'sale_end_time', 'sale_discount_percent', 'sale_title']);

      if (data && data.length > 0) {
        const settings: SaleSettings = {
          sale_active: false,
          sale_end_time: null,
          sale_discount_percent: 0,
          sale_title: 'Flash Sale!'
        };

        data.forEach(item => {
          if (item.key === 'sale_active') settings.sale_active = item.value === 'true';
          if (item.key === 'sale_end_time') settings.sale_end_time = item.value;
          if (item.key === 'sale_discount_percent') settings.sale_discount_percent = parseInt(item.value || '0');
          if (item.key === 'sale_title') settings.sale_title = item.value || 'Flash Sale!';
        });

        setSaleSettings(settings);
      }
    };

    fetchSettings();

    // Subscribe to realtime updates
    const channel = supabase
      .channel('sale_settings')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'site_settings' 
      }, () => {
        fetchSettings();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Calculate time left
  useEffect(() => {
    if (!saleSettings?.sale_active || !saleSettings?.sale_end_time) {
      setTimeLeft(null);
      setShowPopup(false);
      return;
    }

    const calculateTimeLeft = () => {
      const endTime = new Date(saleSettings.sale_end_time!).getTime();
      const now = Date.now();
      const diff = endTime - now;

      if (diff <= 0) {
        setTimeLeft(null);
        setShowPopup(false);
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft({ hours, minutes, seconds });
      
      // Show popup after 3 seconds on page
      setTimeout(() => setShowPopup(true), 3000);
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(interval);
  }, [saleSettings]);

  if (!saleSettings?.sale_active || !timeLeft || dismissed) {
    return null;
  }

  return (
    <AnimatePresence>
      {showPopup && (
        <motion.div
          initial={{ opacity: 0, y: 100, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 100, scale: 0.8 }}
          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          className="fixed bottom-4 right-4 z-[100] max-w-sm"
        >
          <div className="relative bg-gradient-to-br from-destructive/90 via-destructive to-orange-600 text-white rounded-2xl p-6 shadow-2xl border border-white/20 backdrop-blur-sm overflow-hidden">
            {/* Animated background sparkles */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <Sparkles className="absolute top-2 right-8 h-4 w-4 text-yellow-300 animate-pulse" />
              <Sparkles className="absolute bottom-4 left-4 h-3 w-3 text-yellow-300 animate-pulse" style={{ animationDelay: '0.5s' }} />
              <Sparkles className="absolute top-1/2 right-4 h-3 w-3 text-yellow-300 animate-pulse" style={{ animationDelay: '1s' }} />
            </div>

            {/* Close button */}
            <button
              onClick={() => setDismissed(true)}
              className="absolute top-2 right-2 p-1 hover:bg-white/20 rounded-full transition-colors"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Content */}
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-2">
                <Flame className="h-5 w-5 text-yellow-300 animate-pulse" />
                <span className="text-sm font-medium text-yellow-200 uppercase tracking-wide">
                  Limited Time Offer
                </span>
              </div>

              <h3 className="text-xl font-bold mb-1">{saleSettings.sale_title}</h3>
              
              <div className="flex items-center gap-2 mb-4">
                <span className="text-4xl font-black text-yellow-300">
                  {saleSettings.sale_discount_percent}% OFF
                </span>
                <span className="text-sm opacity-80">on all courses!</span>
              </div>

              {/* Timer */}
              <div className="flex items-center gap-2 mb-4">
                <Clock className="h-4 w-4" />
                <span className="text-sm">Ends in:</span>
                <div className="flex gap-1">
                  <div className="bg-black/30 rounded px-2 py-1 text-center min-w-[40px]">
                    <span className="text-lg font-bold">{String(timeLeft.hours).padStart(2, '0')}</span>
                    <span className="text-[10px] block opacity-70">HRS</span>
                  </div>
                  <span className="text-lg font-bold">:</span>
                  <div className="bg-black/30 rounded px-2 py-1 text-center min-w-[40px]">
                    <span className="text-lg font-bold">{String(timeLeft.minutes).padStart(2, '0')}</span>
                    <span className="text-[10px] block opacity-70">MIN</span>
                  </div>
                  <span className="text-lg font-bold">:</span>
                  <div className="bg-black/30 rounded px-2 py-1 text-center min-w-[40px]">
                    <span className="text-lg font-bold">{String(timeLeft.seconds).padStart(2, '0')}</span>
                    <span className="text-[10px] block opacity-70">SEC</span>
                  </div>
                </div>
              </div>

              <Button 
                onClick={() => window.location.href = '/courses'}
                className="w-full bg-yellow-400 hover:bg-yellow-300 text-black font-bold"
              >
                Shop Now 🛒
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
