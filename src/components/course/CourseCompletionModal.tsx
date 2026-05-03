import { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Award, Download, Loader2, PartyPopper, Star, Truck, CreditCard, Sparkles, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';
import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface CourseCompletionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courseName: string;
  courseId: string;
  userId: string;
}

export function CourseCompletionModal({
  open,
  onOpenChange,
  courseName,
  courseId,
  userId,
}: CourseCompletionModalProps) {
  const [generating, setGenerating] = useState(false);
  const [showPhysical, setShowPhysical] = useState(false);
  const [address, setAddress] = useState({ name: '', line1: '', city: '', state: '', pincode: '', phone: '' });

  useEffect(() => {
    if (open) {
      const duration = 3 * 1000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

      const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

      const interval: any = setInterval(function() {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          return clearInterval(interval);
        }

        const particleCount = 50 * (timeLeft / duration);
        confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
        confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
      }, 250);

      return () => clearInterval(interval);
    }
  }, [open]);

  const handleDownloadCertificate = async () => {
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-certificate', {
        body: { userId, courseId },
      });

      if (error) throw error;

      const html = typeof data === 'string' ? data : '';
      if (!html) throw new Error('Empty certificate response');
      const win = window.open('', '_blank');
      if (win) {
        win.document.write(html);
        win.document.close();
      }

      toast.success('Certificate opened! Use Ctrl+P to save as PDF.');
    } catch (err) {
      console.error('Certificate generation error:', err);
      toast.error('Failed to generate certificate. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const handlePhysicalOrder = async () => {
    if (!address.name || !address.line1 || !address.city || !address.pincode || !address.phone) {
      toast.error('Please fill all address fields');
      return;
    }
    // For now, notify admin about physical certificate request
    try {
      await supabase.from('support_tickets').insert({
        user_id: userId,
        subject: `Physical Certificate Request - ${courseName}`,
        message: `User requests physical certificate for "${courseName}". Address: ${address.name}, ${address.line1}, ${address.city}, ${address.state} - ${address.pincode}. Phone: ${address.phone}. Amount: ₹699 + delivery.`,
        status: 'open',
        priority: 'normal',
      });
      toast.success('Physical certificate request submitted! Admin will contact you for payment.');
      setShowPhysical(false);
    } catch {
      toast.error('Failed to submit request');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md border-0 bg-gradient-to-br from-card via-card to-accent/5 overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-accent via-primary to-accent" />

        <div className="text-center py-4 space-y-6">
          {/* Celebration icon */}
          <div className="relative mx-auto w-32 h-32">
            <motion.div 
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", damping: 12 }}
              className="relative z-10"
            >
              <div className="absolute inset-0 rounded-full bg-accent/20 animate-ping" style={{ animationDuration: '3s' }} />
              <div className="relative w-32 h-32 rounded-full bg-gradient-to-br from-accent via-accent/80 to-accent/60 flex items-center justify-center shadow-2xl shadow-accent/40 border-4 border-white/20">
                <Award className="h-16 w-16 text-accent-foreground" />
              </div>
            </motion.div>
            
            <motion.div
              animate={{ rotate: [0, 15, -15, 0], scale: [1, 1.2, 1] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="absolute -top-2 -right-2 z-20"
            >
              <PartyPopper className="h-10 w-10 text-yellow-500" />
            </motion.div>
            
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              className="absolute -bottom-1 -left-2 z-20"
            >
              <Star className="h-8 w-8 text-yellow-400 fill-yellow-400" />
            </motion.div>
            
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 flex gap-1">
              {[1, 2, 3].map(i => (
                <motion.div
                  key={i}
                  animate={{ opacity: [0, 1, 0], y: [-20, -40] }}
                  transition={{ repeat: Infinity, duration: 1.5, delay: i * 0.4 }}
                >
                  <Sparkles className="h-4 w-4 text-accent" />
                </motion.div>
              ))}
            </div>
          </div>

          <div className="space-y-3 relative z-10">
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <h2 className="text-3xl font-black text-foreground tracking-tight">MISSION ACCOMPLISHED!</h2>
              <div className="flex items-center justify-center gap-2 mt-1">
                <div className="h-px w-8 bg-accent/30" />
                <p className="text-accent font-bold text-xs tracking-[0.2em] uppercase">Graduate Level</p>
                <div className="h-px w-8 bg-accent/30" />
              </div>
            </motion.div>

            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="space-y-1"
            >
              <p className="text-muted-foreground text-sm font-medium">You have mastered every lesson in</p>
              <p className="text-xl font-bold bg-gradient-to-r from-accent to-accent/70 bg-clip-text text-transparent px-4">
                {courseName}
              </p>
            </motion.div>
          </div>

          {/* Certificate Card Preview */}
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="mx-auto w-full max-w-sm p-5 rounded-2xl border border-white/10 bg-gradient-to-br from-background/80 to-muted/50 shadow-2xl backdrop-blur-sm relative overflow-hidden group"
          >
            <div className="absolute inset-0 bg-accent/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="border-2 border-dashed border-accent/20 rounded-xl p-5 space-y-3 relative">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <p className="text-[10px] uppercase tracking-[0.3em] text-accent font-bold">Official Credential</p>
                  <p className="text-base font-bold text-foreground leading-tight">{courseName}</p>
                </div>
                <Award className="h-6 w-6 text-accent/40" />
              </div>
              
              <div className="flex items-center gap-3 pt-2">
                <div className="flex-1">
                  <p className="text-[9px] text-muted-foreground uppercase tracking-wider">Issue Date</p>
                  <p className="text-xs font-medium text-foreground">
                    {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </p>
                </div>
                <div className="h-8 w-px bg-border/50" />
                <div className="flex-1">
                  <p className="text-[9px] text-muted-foreground uppercase tracking-wider">Status</p>
                  <div className="flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                    <p className="text-xs font-bold text-emerald-500">Verified</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {!showPhysical ? (
            <div className="flex flex-col gap-3">
              <Button
                onClick={handleDownloadCertificate}
                disabled={generating}
                className="w-full bg-accent hover:bg-accent/90 text-accent-foreground shadow-md"
                size="lg"
              >
                {generating ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Generating Certificate...
                  </>
                ) : (
                  <>
                    <Download className="h-5 w-5 mr-2" />
                    Download PDF Certificate
                  </>
                )}
              </Button>

              <Button
                variant="outline"
                onClick={() => setShowPhysical(true)}
                className="w-full gap-2"
              >
                <Truck className="h-4 w-4" />
                Get Physical Certificate (₹699 + Delivery)
              </Button>

              <Button variant="ghost" onClick={() => onOpenChange(false)} className="text-muted-foreground">
                Maybe Later
              </Button>
            </div>
          ) : (
            <div className="space-y-3 text-left">
              <p className="text-sm font-medium text-center">Enter your delivery address</p>
              <Input placeholder="Full Name" value={address.name} onChange={e => setAddress(p => ({ ...p, name: e.target.value }))} />
              <Input placeholder="Address Line 1" value={address.line1} onChange={e => setAddress(p => ({ ...p, line1: e.target.value }))} />
              <div className="grid grid-cols-2 gap-2">
                <Input placeholder="City" value={address.city} onChange={e => setAddress(p => ({ ...p, city: e.target.value }))} />
                <Input placeholder="State" value={address.state} onChange={e => setAddress(p => ({ ...p, state: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Input placeholder="Pincode" value={address.pincode} onChange={e => setAddress(p => ({ ...p, pincode: e.target.value }))} />
                <Input placeholder="Phone" value={address.phone} onChange={e => setAddress(p => ({ ...p, phone: e.target.value }))} />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setShowPhysical(false)} className="flex-1">Back</Button>
                <Button onClick={handlePhysicalOrder} className="flex-1 gap-2 bg-accent hover:bg-accent/90 text-accent-foreground">
                  <CreditCard className="h-4 w-4" />
                  Request (₹699)
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
