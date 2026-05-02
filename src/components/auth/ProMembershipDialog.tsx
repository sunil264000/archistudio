import { useState } from 'react';
import { CheckCircle2, ShieldCheck, Zap, Star, Trophy, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export function ProMembershipDialog() {
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(false);

  const upgradeToPro = async () => {
    if (!user) return;
    setLoading(true);
    // In a real scenario, this would trigger a payment gateway (Razorpay/Stripe)
    // For now, we simulate the 'Power Move' upgrade
    const { error } = await supabase.from('profiles').update({ 
      subscription_tier: 'pro',
      is_verified_pro: true 
    }).eq('user_id', user.id);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Welcome to Archistudio PRO!');
      window.location.reload();
    }
    setLoading(false);
  };

  const isPro = profile?.subscription_tier === 'pro';

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="gradient" size="sm" className="gap-2 rounded-full shadow-[0_0_20px_-5px_hsl(var(--accent)/0.4)]">
          {isPro ? <ShieldCheck className="h-4 w-4" /> : <Zap className="h-4 w-4" />}
          {isPro ? 'Pro Active' : 'Upgrade to Pro'}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md bg-background/95 backdrop-blur-xl border-accent/20">
        <DialogHeader>
          <div className="flex justify-center mb-4">
            <div className="h-16 w-16 rounded-3xl bg-accent/10 flex items-center justify-center">
              <Zap className="h-8 w-8 text-accent animate-pulse" />
            </div>
          </div>
          <DialogTitle className="text-2xl font-display font-bold text-center">
            Archistudio <span className="text-accent">PRO</span>
          </DialogTitle>
          <p className="text-center text-muted-foreground text-sm">Unlock elite features and stand out from the crowd.</p>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            {[
              "Verified PRO Badge on profile",
              "0% Platform Fees on your first 3 projects",
              "Priority placement in Client Search",
              "Unlimited 1:1 Mentorship requests",
              "Advanced AI Portfolio Coaching",
              "Access to Premium CAD Resource packs"
            ].map((feature, i) => (
              <div key={i} className="flex items-center gap-3 text-sm">
                <CheckCircle2 className="h-4 w-4 text-accent shrink-0" />
                <span className="text-muted-foreground">{feature}</span>
              </div>
            ))}
          </div>

          {!isPro ? (
            <div className="pt-4 space-y-3">
              <div className="p-4 rounded-2xl bg-accent/5 border border-accent/10 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-accent">Yearly Plan</p>
                  <p className="text-2xl font-bold">₹2,499<span className="text-sm font-normal text-muted-foreground">/yr</span></p>
                </div>
                <Badge className="bg-accent text-accent-foreground">Best Value</Badge>
              </div>
              <Button onClick={upgradeToPro} disabled={loading} className="w-full h-12 rounded-xl text-md font-semibold bg-foreground text-background hover:bg-foreground/90 transition-all">
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Get Pro Now'}
              </Button>
              <p className="text-[10px] text-center text-muted-foreground">Secure payment. Cancel anytime.</p>
            </div>
          ) : (
            <div className="p-6 rounded-2xl bg-emerald-500/5 border border-emerald-500/10 text-center space-y-2">
              <Star className="h-8 w-8 text-emerald-500 mx-auto" />
              <p className="font-bold text-emerald-500">You are a PRO Member</p>
              <p className="text-xs text-muted-foreground">Your subscription is active until May 2027.</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
