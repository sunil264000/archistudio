import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Check, ArrowRight, Sparkles } from 'lucide-react';

const plans = [
  {
    name: 'Single Studio',
    description: 'Perfect for specific skill gaps',
    priceINR: '₹349',
    period: 'one-time',
    features: [
      'Access to one studio of your choice',
      'All sessions and resources',
      'Proof of Completion included',
      'Community forum access',
      'Lifetime access',
    ],
    cta: 'Choose Studio',
    popular: false,
  },
  {
    name: 'All Access',
    description: 'Best value for serious learners',
    priceINR: '₹1,499',
    period: '/year',
    features: [
      'Access to ALL studio programs',
      'New studios as they release',
      'Priority support',
      'AI tutor (50 questions/day)',
      'Downloadable resources',
      'Proof of Completion for each',
      '1 year access',
    ],
    cta: 'Begin Practice',
    popular: true,
  },
  {
    name: 'Lifetime',
    description: 'Never pay again',
    priceINR: '₹2,999',
    period: 'one-time',
    features: [
      'Everything in All Access',
      'Lifetime access',
      'All future studios included',
      'AI tutor (unlimited)',
      '1-on-1 session (1 hour)',
      'Private community access',
    ],
    cta: 'Get Lifetime Access',
    popular: false,
  },
];

export function PricingSection() {
  return (
    <section id="pricing" className="section-padding bg-secondary/20">
      <div className="container-wide">
        <div className="max-w-4xl mx-auto text-center mb-16">
          <div className="text-technical mb-4">Investment</div>
          <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
            Simple, Transparent Pricing
          </h2>
          <p className="text-lg text-muted-foreground">
            No hidden fees. No surprise charges. Just straightforward access to practical architecture education.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {plans.map((plan, i) => (
            <div 
              key={i}
              className={`relative flex flex-col p-6 rounded-lg bg-card border ${
                plan.popular ? 'border-accent ring-2 ring-accent/20' : 'border-border'
              }`}
            >
              {/* Popular badge */}
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-accent text-accent-foreground text-xs font-medium">
                    <Sparkles className="h-3 w-3" />
                    Most Popular
                  </div>
                </div>
              )}

              {/* Plan header */}
              <div className="mb-6">
                <h3 className="text-xl font-bold mb-1">{plan.name}</h3>
                <p className="text-sm text-muted-foreground">{plan.description}</p>
              </div>

              {/* Pricing */}
              <div className="mb-6">
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold">{plan.priceINR}</span>
                  <span className="text-muted-foreground">{plan.period}</span>
                </div>
              </div>

              {/* Features */}
              <ul className="space-y-3 mb-8 flex-1">
                {plan.features.map((feature, j) => (
                  <li key={j} className="flex items-start gap-2 text-sm">
                    <Check className="h-4 w-4 text-success mt-0.5 shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <Link to="/auth?mode=signup">
                <Button 
                  className="w-full gap-2" 
                  variant={plan.popular ? 'default' : 'outline'}
                >
                  {plan.cta}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
