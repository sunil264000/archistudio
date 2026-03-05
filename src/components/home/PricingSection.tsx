import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Check, ArrowRight, Sparkles, Loader2 } from 'lucide-react';
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
      name: 'Single Studio',
      description: 'Perfect for specific skill gaps',
      priceINR: '₹399',
      maxPrice: '₹4,999',
      originalPrice: null as string | null,
      period: 'one-time',
      features: [
        'Access to one studio of your choice',
        'All sessions and resources',
        'Proof of Completion included',
        'Community forum access',
        'Lifetime access',
        'EMI available on courses above ₹1,699',
      ],
      cta: 'Browse Studios',
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
        `Access to ALL ${priceRange?.count || ''} studio programs`,
        'New studios as they release',
        'Priority support & AI tutor',
        'Downloadable resources',
        'Proof of Completion for each',
      ],
      cta: 'Explore All Studios',
      popular: true,
      href: '/courses',
    },
  ];

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

        <div className="grid lg:grid-cols-2 gap-8 max-w-4xl mx-auto">
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
                  <span className="text-4xl font-bold text-primary">{plan.priceINR}</span>
                  <span className="text-muted-foreground">{plan.period}</span>
                </div>
                {plan.originalPrice && (
                  <div className="mt-1">
                    <span className="text-sm text-muted-foreground line-through">{plan.originalPrice}</span>
                    <span className="ml-2 text-xs text-success font-medium">
                      {Math.round((1 - parseInt(plan.priceINR.replace(/[₹,]/g, '')) / parseInt(plan.originalPrice.replace(/[₹,]/g, ''))) * 100)}% OFF
                    </span>
                  </div>
                )}
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
