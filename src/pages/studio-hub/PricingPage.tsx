import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { StudioHubLayout } from '@/components/studio-hub/StudioHubLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SEOHead } from '@/components/seo/SEOHead';
import {
  Check, Zap, Star, ShieldCheck, Crown, Clock, TrendingDown, Sparkles,
  Gift, Trophy, Rocket, MessageSquare, FileDown, Users, Eye, Headphones,
  Award, Briefcase, BadgeCheck, Flame,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

type Plan = {
  id: string;
  name: string;
  price: number;
  originalPrice: number;
  duration: string;
  description: string;
  feeFrom: number;
  feeTo: number;
  features: { icon: any; text: string; highlight?: boolean }[];
  cta: string;
  popular?: boolean;
  icon: any;
  accent: string;
  tagline?: string;
};

const PLANS: Plan[] = [
  {
    id: 'trial',
    name: '7-Day Pass',
    price: 49,
    originalPrice: 149,
    duration: '7 days',
    description: 'Test-drive Pro perks before you commit.',
    feeFrom: 15,
    feeTo: 12,
    tagline: 'Risk-free trial',
    features: [
      { icon: TrendingDown, text: 'Platform fees reduced 15% → 12%', highlight: true },
      { icon: Zap, text: 'Priority bidding on new projects' },
      { icon: BadgeCheck, text: 'Pro Badge on profile (7 days)' },
      { icon: MessageSquare, text: '1 expert sheet critique' },
      { icon: Eye, text: 'See who viewed your bids' },
      { icon: Gift, text: 'Welcome bonus: 2 portfolio templates' },
    ],
    cta: 'Start 7-Day Trial',
    icon: Clock,
    accent: 'from-sky-500/20 to-sky-500/0',
  },
  {
    id: 'monthly',
    name: 'Monthly Pro',
    price: 199,
    originalPrice: 499,
    duration: 'month',
    description: 'Flex monthly access for active freelancers.',
    feeFrom: 15,
    feeTo: 10,
    tagline: 'Most flexible',
    features: [
      { icon: TrendingDown, text: 'Platform fees reduced 15% → 10%', highlight: true },
      { icon: Zap, text: 'Priority bidding (24h head-start)' },
      { icon: BadgeCheck, text: 'Permanent Pro Badge' },
      { icon: MessageSquare, text: '3 expert sheet critiques / month' },
      { icon: Briefcase, text: 'Pro-only project board access' },
      { icon: Eye, text: 'Bid analytics & view tracking' },
      { icon: FileDown, text: '5 portfolio template downloads' },
      { icon: Headphones, text: 'Priority support (24h response)' },
    ],
    cta: 'Go Monthly',
    icon: Zap,
    accent: 'from-violet-500/20 to-violet-500/0',
  },
  {
    id: 'quarterly',
    name: 'Quarterly Pro',
    price: 499,
    originalPrice: 1497,
    duration: '3 months',
    description: 'The sweet spot — built for serious students.',
    feeFrom: 15,
    feeTo: 8,
    popular: true,
    tagline: '⚡ Most chosen by top earners',
    features: [
      { icon: TrendingDown, text: 'Platform fees reduced 15% → 8%', highlight: true },
      { icon: Rocket, text: 'Priority bidding (48h head-start)' },
      { icon: BadgeCheck, text: 'Permanent Pro Badge + spotlight' },
      { icon: MessageSquare, text: 'Unlimited expert sheet critiques' },
      { icon: Briefcase, text: 'Exclusive Pro-only high-budget projects' },
      { icon: FileDown, text: 'All portfolio templates (50+)' },
      { icon: Award, text: 'Quarterly mentor 1:1 call' },
      { icon: Trophy, text: 'Auto-entry to Studio Awards' },
      { icon: Flame, text: 'Featured in "Top Members" carousel' },
      { icon: Headphones, text: 'Priority support (12h response)' },
    ],
    cta: 'Get Best Value',
    icon: Star,
    accent: 'from-accent/30 to-accent/0',
  },
  {
    id: 'annual',
    name: 'Annual Pro',
    price: 1499,
    originalPrice: 5988,
    duration: 'year',
    description: 'For pros building a long-term career.',
    feeFrom: 15,
    feeTo: 6,
    tagline: '🏆 Maximum savings',
    features: [
      { icon: TrendingDown, text: 'Platform fees reduced 15% → 6%', highlight: true },
      { icon: Rocket, text: 'Priority bidding (72h head-start)' },
      { icon: Crown, text: 'Featured Profile across Studio Hub' },
      { icon: MessageSquare, text: 'Unlimited critiques + AI mentor' },
      { icon: Briefcase, text: 'All Pro-only projects + early access' },
      { icon: FileDown, text: 'All templates + exclusive annual drops' },
      { icon: Award, text: 'Monthly mentor 1:1 calls' },
      { icon: Trophy, text: 'Guaranteed Studio Awards entry' },
      { icon: Users, text: 'Private founders community access' },
      { icon: Sparkles, text: 'Verified Architect certificate' },
      { icon: Headphones, text: 'White-glove support (4h response)' },
      { icon: Gift, text: '₹500 bonus credits + free eBook bundle' },
    ],
    cta: 'Join as Annual Pro',
    icon: Crown,
    accent: 'from-amber-500/25 to-amber-500/0',
  },
];

// Animated fee counter: counts down from feeFrom% to feeTo% on mount
function FeeReduction({ from, to, delay = 0 }: { from: number; to: number; delay?: number }) {
  const value = useMotionValue(from);
  const rounded = useTransform(value, (v) => v.toFixed(1));

  useEffect(() => {
    const controls = animate(value, to, {
      duration: 1.6,
      delay,
      ease: [0.22, 1, 0.36, 1],
    });
    return controls.stop;
  }, [from, to, delay]);

  return (
    <div className="flex items-center gap-2 px-2.5 py-1.5 mb-4 rounded-lg bg-emerald-500/8 border border-emerald-500/15 text-xs">
      <TrendingDown className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
      <span className="text-muted-foreground">Fee</span>
      <span className="text-muted-foreground line-through">{from}%</span>
      <span className="text-muted-foreground">→</span>
      <motion.span className="font-semibold text-emerald-400">
        <motion.span>{rounded}</motion.span>%
      </motion.span>
    </div>
  );
}

export default function PricingPage() {
  const navigate = useNavigate();

  const handleSubscription = async (plan: Plan) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate(`/auth?redirect=/studio-hub/pricing&plan=${plan.id}`);
        return;
      }

      // Check if worker profile exists
      const { data: profile } = await supabase
        .from('worker_profiles')
        .select('id, display_name')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!profile) {
        // Redirect to become-member first if no profile
        navigate(`/studio-hub/become-member?plan=${plan.id}`);
        return;
      }

      // Initiate payment
      const { data, error } = await supabase.functions.invoke('create-subscription-order', {
        body: {
          planId: plan.id,
          planName: plan.name,
          amount: plan.price,
          customerName: profile.display_name || user.email?.split('@')[0] || 'Member',
          customerEmail: user.email,
        },
      });

      if (error || !data?.payment_session_id) {
        throw new Error(error?.message || 'Failed to initiate payment');
      }

      // Load Cashfree and checkout
      const cashfree = await (window as any).Cashfree({ mode: "production" });
      await cashfree.checkout({
        paymentSessionId: data.payment_session_id,
        redirectTarget: "_self",
      });

    } catch (err: any) {
      console.error('Subscription error:', err);
      alert('Failed to start subscription. Please try again.');
    }
  };

  return (
    <StudioHubLayout>
      <script src="https://sdk.cashfree.com/js/v3/cashfree.js"></script>
      <SEOHead
        title="Pricing — Studio Pro Membership"
        description="Cut platform fees from 15% to as low as 6%. Priority bidding, unlimited critiques, mentor calls, and more."
      />

      <div className="relative pt-20 pb-24 overflow-hidden">
        {/* Background elements */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-full pointer-events-none">
          <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-accent/5 rounded-full blur-[120px]" />
          <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-blueprint/5 rounded-full blur-[100px]" />
          <motion.div
            className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[700px] h-[300px] bg-emerald-500/5 rounded-full blur-[140px]"
            animate={{ opacity: [0.4, 0.7, 0.4] }}
            transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
          />
        </div>

        <div className="container-wide relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <Badge variant="outline" className="mb-4 rounded-full border-accent/30 text-accent bg-accent/5 px-4 py-1">
                Pricing & Plans
              </Badge>
              <h1 className="font-display text-4xl md:text-6xl font-semibold tracking-tight mb-6">
                Cut your fees from <span className="text-muted-foreground line-through decoration-2">15%</span>{' '}
                to as low as <span className="text-emerald-400">6%</span>
              </h1>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Studio Pro members keep more of every project, get hired 3× faster, and unlock
                unfair advantages standard members will never see.
              </p>
            </motion.div>

            {/* Hero stat strip */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="mt-8 inline-flex flex-wrap items-center justify-center gap-3 px-5 py-3 rounded-full bg-card/60 border border-border/40 backdrop-blur"
            >
              <div className="flex items-center gap-2 text-sm">
                <Trophy className="h-4 w-4 text-amber-400" />
                <span className="font-semibold">+40% avg earnings</span>
              </div>
              <span className="text-border">•</span>
              <div className="flex items-center gap-2 text-sm">
                <Rocket className="h-4 w-4 text-accent" />
                <span className="font-semibold">3× faster hires</span>
              </div>
              <span className="text-border">•</span>
              <div className="flex items-center gap-2 text-sm">
                <ShieldCheck className="h-4 w-4 text-emerald-400" />
                <span className="font-semibold">Cancel anytime</span>
              </div>
            </motion.div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {PLANS.map((plan, i) => (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: i * 0.1 }}
                whileHover={{ y: -6 }}
                className={`relative group flex flex-col p-7 rounded-3xl border transition-all duration-500 overflow-hidden ${
                  plan.popular
                    ? 'bg-card border-accent/60 shadow-[0_25px_60px_-25px_hsl(var(--accent)/0.45)] ring-1 ring-accent/20'
                    : 'bg-card/40 border-border/40 hover:border-border/80 hover:shadow-[0_20px_40px_-20px_hsl(var(--foreground)/0.15)]'
                }`}
              >
                {/* Decorative accent gradient */}
                <div className={`absolute inset-0 bg-gradient-to-br ${plan.accent} opacity-60 pointer-events-none`} />

                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-accent text-accent-foreground text-[10px] uppercase tracking-widest font-bold px-4 py-1.5 rounded-full shadow-lg flex items-center gap-1.5 z-10">
                    <Sparkles className="h-3 w-3" />
                    Best Value
                  </div>
                )}

                <div className="relative z-10 flex flex-col flex-1">
                  <div className="mb-5">
                    <div className={`h-12 w-12 rounded-2xl flex items-center justify-center mb-4 ${plan.popular ? 'bg-accent/15 text-accent' : 'bg-muted text-muted-foreground'}`}>
                      <plan.icon className="h-6 w-6" />
                    </div>
                    <h3 className="font-display text-xl font-bold mb-1.5">{plan.name}</h3>
                    {plan.tagline && (
                      <div className="text-[11px] uppercase tracking-wider font-bold text-accent/90 mb-2">
                        {plan.tagline}
                      </div>
                    )}
                    <p className="text-sm text-muted-foreground leading-relaxed">{plan.description}</p>
                  </div>

                  <div className="mb-5">
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-display font-bold">₹{plan.price}</span>
                      <span className="text-sm text-muted-foreground">/{plan.duration}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs text-muted-foreground line-through">₹{plan.originalPrice}</span>
                      <Badge variant="secondary" className="text-[10px] bg-emerald-500/10 text-emerald-400 border-emerald-500/20 px-2 py-0">
                        Save {Math.round((1 - plan.price / plan.originalPrice) * 100)}%
                      </Badge>
                    </div>
                  </div>

                  {/* Animated fee reduction widget */}
                  <FeeReduction from={plan.feeFrom} to={plan.feeTo} delay={0.3 + i * 0.1} />

                  <div className="flex-1 space-y-2.5 mb-6">
                    {plan.features.map((feature, idx) => {
                      const Icon = feature.icon;
                      return (
                        <motion.div
                          key={feature.text}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.35, delay: 0.5 + i * 0.08 + idx * 0.04 }}
                          className={`flex items-start gap-2.5 text-sm ${
                            feature.highlight ? 'p-2 -mx-1 rounded-lg bg-emerald-500/5 border border-emerald-500/15' : ''
                          }`}
                        >
                          <div className={`mt-0.5 rounded-full p-1 shrink-0 ${
                            feature.highlight ? 'bg-emerald-500/20 text-emerald-400' : 'bg-accent/10 text-accent'
                          }`}>
                            <Icon className="h-3 w-3" />
                          </div>
                          <span className={feature.highlight ? 'text-foreground font-medium' : 'text-foreground/80'}>
                            {feature.text}
                          </span>
                        </motion.div>
                      );
                    })}
                  </div>

                  <Button
                    onClick={() => handleSubscription(plan)}
                    className={`w-full rounded-2xl h-12 font-semibold transition-all duration-300 ${
                      plan.popular
                        ? 'bg-accent text-accent-foreground hover:bg-accent/90 shadow-lg shadow-accent/25'
                        : 'bg-foreground text-background hover:bg-foreground/90'
                    }`}
                  >
                    {plan.cta}
                  </Button>

                  <div className="mt-3 text-center text-[11px] text-muted-foreground flex items-center justify-center gap-1">
                    <ShieldCheck className="h-3 w-3" />
                    7-day money-back guarantee
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Why upgrade — value strip */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4"
          >
            {[
              { icon: TrendingDown, label: 'Lower Fees', value: 'Up to 60% off' },
              { icon: Rocket, label: 'Get Hired', value: '3× faster' },
              { icon: Trophy, label: 'Earn More', value: '+₹40K avg/yr' },
              { icon: ShieldCheck, label: 'Risk-Free', value: '7-day refund' },
            ].map((s) => (
              <div key={s.label} className="p-5 rounded-2xl bg-card/40 border border-border/40 text-center">
                <s.icon className="h-5 w-5 text-accent mx-auto mb-2" />
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mb-1">{s.label}</div>
                <div className="font-display text-lg font-bold">{s.value}</div>
              </div>
            ))}
          </motion.div>

          {/* Trust indicators */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1 }}
            className="mt-16 pt-10 border-t border-border/40 grid grid-cols-1 md:grid-cols-3 gap-8"
          >
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-full bg-accent/5 flex items-center justify-center shrink-0">
                <ShieldCheck className="h-5 w-5 text-accent" />
              </div>
              <div>
                <h4 className="font-semibold text-sm">Secure Escrow</h4>
                <p className="text-xs text-muted-foreground">Your funds are protected by our smart escrow system.</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-full bg-accent/5 flex items-center justify-center shrink-0">
                <Star className="h-5 w-5 text-accent" />
              </div>
              <div>
                <h4 className="font-semibold text-sm">Expert Mentorship</h4>
                <p className="text-xs text-muted-foreground">Unlimited support from professional architects.</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-full bg-accent/5 flex items-center justify-center shrink-0">
                <Zap className="h-5 w-5 text-accent" />
              </div>
              <div>
                <h4 className="font-semibold text-sm">Priority Access</h4>
                <p className="text-xs text-muted-foreground">Be the first to see and bid on high-budget briefs.</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </StudioHubLayout>
  );
}
