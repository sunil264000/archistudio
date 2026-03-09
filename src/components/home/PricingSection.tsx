import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Check, ArrowRight, Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

function useCoursesPriceRange() {
  const [range, setRange] = useState<{ min: number; max: number; count: number } | null>(null);
  useEffect(() => {
    supabase
      .from('courses')
      .select('price_inr')
      .eq('is_published', true)
      .then(({ data }) => {
        if (data && data.length > 0) {
          const prices = data.map(c => c.price_inr || 0).filter(p => p > 0);
          if (prices.length > 0) {
            setRange({ min: Math.min(...prices), max: Math.max(...prices), count: data.length });
          } else {
            setRange({ min: 0, max: 0, count: data.length });
          }
        }
      });
  }, []);
  return range;
}

export function PricingSection() {
  const priceRange = useCoursesPriceRange();

  const plans = [
    {
      name: 'Single Course',
      description: 'Perfect for specific skill gaps',
      priceINR: '₹399',
      maxPrice: '₹4,999',
      originalPrice: null as string | null,
      period: 'one-time',
      features: [
        'Access to one course of your choice',
        'All lessons and resources',
        'Proof of Completion included',
        'Community forum access',
        'Lifetime access',
        'EMI available on courses above ₹1,699',
      ],
      cta: 'Browse Courses',
      popular: false,
      href: '/courses',
    },
    {
      name: 'Full Catalog',
      description: 'Best value — access everything',
      priceINR: priceRange ? `₹${Math.round(priceRange.max * 0.6).toLocaleString('en-IN')}` : '₹1,999',
      originalPrice: priceRange ? `₹${Math.round(priceRange.max * 1.2).toLocaleString('en-IN')}` : '₹4,999',
      period: 'bundle',
      features: [
        `Access to ALL ${priceRange?.count || ''} course programs`,
        'New courses as they release',
        'Priority support & AI tutor',
        'Downloadable resources',
        'Proof of Completion for each',
      ],
      cta: 'Explore All Courses',
      popular: true,
      href: '/courses',
    },
  ];

  return (
    <section id="pricing" className="section-padding bg-secondary/15">
      <div className="container-wide">
        <div className="max-w-2xl mx-auto text-center mb-16">
          <div className="section-label mb-4">Investment</div>
          <h2 className="font-display mb-4">
            Simple, Transparent Pricing
          </h2>
          <p className="text-body text-muted-foreground">
            No hidden fees. No surprise charges. Just straightforward access to practical architecture education.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-6 max-w-3xl mx-auto">
          {plans.map((plan, i) => (
            <div 
              key={i}
              className={`relative flex flex-col p-7 rounded-2xl bg-card border ${
                plan.popular ? 'border-accent/30 ring-1 ring-accent/15' : 'border-border'
              } shadow-soft`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent text-accent-foreground text-caption font-semibold">
                    <Sparkles className="h-3 w-3" />
                    Most Popular
                  </div>
                </div>
              )}

              <div className="mb-6">
                <h3 className="font-display text-lg font-bold mb-1">{plan.name}</h3>
                <p className="text-body-sm text-muted-foreground">{plan.description}</p>
              </div>

              <div className="mb-6">
                <div className="flex items-baseline gap-2">
                  <span className="font-display text-3xl font-bold text-foreground">{plan.priceINR}</span>
                  <span className="text-body-sm text-muted-foreground">{plan.period}</span>
                </div>
                {plan.originalPrice && (
                  <div className="mt-1">
                    <span className="text-body-sm text-muted-foreground line-through">{plan.originalPrice}</span>
                    <span className="ml-2 text-caption text-success font-semibold">
                      {Math.round((1 - parseInt(plan.priceINR.replace(/[₹,]/g, '')) / parseInt(plan.originalPrice.replace(/[₹,]/g, ''))) * 100)}% OFF
                    </span>
                  </div>
                )}
              </div>

              <ul className="space-y-3 mb-8 flex-1">
                {plan.features.map((feature, j) => (
                  <li key={j} className="flex items-start gap-2.5 text-body-sm">
                    <Check className="h-4 w-4 text-success mt-0.5 shrink-0" />
                    <span className="text-muted-foreground">{feature}</span>
                  </li>
                ))}
              </ul>

              <Link to={plan.href}>
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
