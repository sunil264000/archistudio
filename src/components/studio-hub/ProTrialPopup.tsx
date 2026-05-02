import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, X, Clock, Zap, TrendingDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';

export function ProTrialPopup() {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Show after 30 seconds or if user hasn't seen it in 24 hours
    const lastSeen = localStorage.getItem('pro_trial_popup_seen');
    const now = Date.now();
    
    if (!lastSeen || (now - parseInt(lastSeen)) > 86400000) {
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 30000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleClose = () => {
    setIsOpen(false);
    localStorage.setItem('pro_trial_popup_seen', Date.now().toString());
  };

  const handleStartTrial = () => {
    handleClose();
    navigate('/studio-hub/pricing');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center md:items-center p-4 pointer-events-none">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-background/80 backdrop-blur-sm pointer-events-auto"
            onClick={handleClose}
          />
          
          <motion.div
            initial={{ y: 100, opacity: 0, scale: 0.9 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 100, opacity: 0, scale: 0.9 }}
            className="relative w-full max-w-lg bg-card border border-accent/30 rounded-3xl shadow-[0_20px_50px_-12px_rgba(0,0,0,0.5)] overflow-hidden pointer-events-auto"
          >
            {/* Gradient Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-accent/10 to-transparent pointer-events-none" />
            
            <button 
              onClick={handleClose}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-muted transition-colors z-20"
            >
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
            
            <div className="p-8 relative z-10">
              <Badge className="bg-accent text-accent-foreground mb-4 uppercase tracking-widest text-[10px] font-bold">
                Exclusive Invitation
              </Badge>
              
              <h2 className="font-display text-3xl font-bold mb-4 leading-tight">
                Get <span className="text-accent underline decoration-accent/30 decoration-4 underline-offset-4">Pro Perks</span> for 7 Days
              </h2>
              
              <p className="text-muted-foreground mb-8 leading-relaxed">
                Unlock priority bidding, reduced platform fees (15% → 12%), and expert critiques. Test-drive the full Studio Hub experience for just <span className="text-foreground font-bold">₹49</span>.
              </p>
              
              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="flex items-center gap-3 p-3 rounded-2xl bg-muted/50 border border-border/40">
                  <TrendingDown className="h-5 w-5 text-emerald-500" />
                  <div className="text-xs">
                    <p className="font-bold">-20% Fees</p>
                    <p className="text-muted-foreground">Keep more</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-2xl bg-muted/50 border border-border/40">
                  <Zap className="h-5 w-5 text-amber-500" />
                  <div className="text-xs">
                    <p className="font-bold">Priority Bids</p>
                    <p className="text-muted-foreground">Get hired 3x faster</p>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col gap-3">
                <Button 
                  onClick={handleStartTrial}
                  className="w-full h-14 text-lg font-bold rounded-2xl bg-accent hover:bg-accent/90 shadow-lg shadow-accent/20 gap-2 group"
                >
                  Start 7-Day Pass
                  <Clock className="h-5 w-5 group-hover:rotate-12 transition-transform" />
                </Button>
                <p className="text-[11px] text-center text-muted-foreground">
                  No commitment · Cancel anytime · Risk-free trial
                </p>
              </div>
            </div>
            
            {/* Bottom highlight bar */}
            <div className="bg-accent h-1.5 w-full" />
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
