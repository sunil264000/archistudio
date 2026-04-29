import { motion } from 'framer-motion';
import { StudioHubLayout } from '@/components/studio-hub/StudioHubLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SEOHead } from '@/components/seo/SEOHead';
import { Check, Zap, Star, ShieldCheck, Crown, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const PLANS = [
  {
    id: 'trial',
    name: '7-Day Pass',
    price: 49,
    originalPrice: 149,
    duration: '7 days',
    description: 'Perfect for completing your first quick project.',
    features: ['0% Platform Fees', 'Priority Bidding', 'Pro Badge (7 days)', '1 Course Critique'],
    cta: 'Start Trial',
    popular: false,
    icon: Clock,
  },
  {
    id: 'monthly',
    name: 'Monthly Pro',
    price: 199,
    originalPrice: 499,
    duration: 'month',
    description: 'Flexibility to work on multiple projects as you learn.',
    features: ['0% Platform Fees', 'Priority Bidding', 'Pro Badge', '3 Course Critiques', 'Pro-only Projects'],
    cta: 'Go Monthly',
    popular: false,
    icon: Zap,
  },
  {
    id: 'quarterly',
    name: 'Quarterly Pro',
    price: 499,
    originalPrice: 1497,
    duration: '3 months',
    description: 'The sweet spot for active architecture students.',
    features: ['0% Platform Fees', 'Priority Bidding', 'Pro Badge', 'Unlimited Critiques', 'Pro-only Projects', 'Portfolio Templates'],
    cta: 'Get Best Value',
    popular: true,
    icon: Star,
  },
  {
    id: 'annual',
    name: 'Annual Pro',
    price: 1499,
    originalPrice: 5988,
    duration: 'year',
    description: 'For those serious about their professional career.',
    features: ['0% Platform Fees', 'Priority Bidding', 'Pro Badge', 'Unlimited Critiques', 'Featured Profile', 'Pro-only Projects', 'All Templates'],
    cta: 'Join as Pro',
    popular: false,
    icon: Crown,
  }
];

export default function PricingPage() {
  const navigate = useNavigate();

  return (
    <StudioHubLayout>
      <SEOHead title="Pricing — Studio Pro Membership" description="Unlock unfair advantages on Studio Hub. 0% fees, priority bidding, and professional badges." />
      
      <div className="relative pt-20 pb-24 overflow-hidden">
        {/* Background elements */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-full pointer-events-none">
          <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-accent/5 rounded-full blur-[120px]" />
          <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-blueprint/5 rounded-full blur-[100px]" />
        </div>

        <div className="container-wide relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <Badge variant="outline" className="mb-4 rounded-full border-accent/30 text-accent bg-accent/5 px-4 py-1">
                Pricing & Plans
              </Badge>
              <h1 className="font-display text-4xl md:text-6xl font-semibold tracking-tight mb-6">
                Invest in your <span className="text-accent">professional growth.</span>
              </h1>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Studio Pro members earn an average of 40% more and get hired 3× faster. 
                Choose a plan that fits your current stage.
              </p>
            </motion.div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {PLANS.map((plan, i) => (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: i * 0.1 }}
                className={`relative group flex flex-col p-8 rounded-3xl border transition-all duration-500 ${
                  plan.popular 
                    ? 'bg-card border-accent shadow-[0_20px_50px_-20px_rgba(var(--accent-rgb),0.3)]' 
                    : 'bg-card/40 border-border/40 hover:border-border/80'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-accent text-accent-foreground text-[10px] uppercase tracking-widest font-bold px-4 py-1 rounded-full shadow-lg">
                    Best Value
                  </div>
                )}

                <div className="mb-8">
                  <div className={`h-12 w-12 rounded-2xl flex items-center justify-center mb-6 ${plan.popular ? 'bg-accent/10 text-accent' : 'bg-muted text-muted-foreground'}`}>
                    <plan.icon className="h-6 w-6" />
                  </div>
                  <h3 className="font-display text-xl font-bold mb-2">{plan.name}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed h-10">{plan.description}</p>
                </div>

                <div className="mb-8">
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-display font-bold">₹{plan.price}</span>
                    <span className="text-sm text-muted-foreground">/{plan.duration}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs text-muted-foreground line-through">₹{plan.originalPrice}</span>
                    <Badge variant="secondary" className="text-[10px] bg-emerald-500/10 text-emerald-500 border-emerald-500/20 px-2 py-0">
                      Save {Math.round((1 - plan.price / plan.originalPrice) * 100)}%
                    </Badge>
                  </div>
                </div>

                <div className="flex-1 space-y-4 mb-8">
                  {plan.features.map((feature) => (
                    <div key={feature} className="flex items-start gap-3 text-sm">
                      <div className="mt-1 bg-emerald-500/20 rounded-full p-0.5">
                        <Check className="h-3 w-3 text-emerald-500" />
                      </div>
                      <span className="text-foreground/80">{feature}</span>
                    </div>
                  ))}
                </div>

                <Button 
                  onClick={() => navigate('/auth?redirect=/studio-hub/pricing')}
                  className={`w-full rounded-2xl h-12 font-semibold transition-all duration-300 ${
                    plan.popular 
                      ? 'bg-accent text-accent-foreground hover:bg-accent/90' 
                      : 'bg-foreground text-background hover:bg-foreground/90'
                  }`}
                >
                  {plan.cta}
                </Button>
              </motion.div>
            ))}
          </div>

          {/* Trust indicators */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.8 }}
            className="mt-20 pt-10 border-t border-border/40 grid grid-cols-1 md:grid-cols-3 gap-8"
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
