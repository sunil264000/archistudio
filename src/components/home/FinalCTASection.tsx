import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

export function FinalCTASection() {
  return (
    <section className="section-padding bg-primary text-primary-foreground relative overflow-hidden">
      {/* Grid pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `
            linear-gradient(to right, currentColor 1px, transparent 1px),
            linear-gradient(to bottom, currentColor 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
        }} />
      </div>

      <div className="container-wide relative">
        <div className="max-w-3xl mx-auto text-center space-y-8">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold leading-tight">
            Stop Guessing Architecture.{' '}
            <span className="opacity-70">Start Understanding It.</span>
          </h2>
          
          <p className="text-lg opacity-80 max-w-xl mx-auto">
            You've spent years learning theory. Spend a few months learning practice. 
            The difference will last your entire career.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link to="/auth?mode=signup">
              <Button 
                size="lg" 
                variant="secondary" 
                className="gap-2 text-base px-8 h-12"
              >
                Start Your Free Account
                <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
          </div>

          <p className="text-sm opacity-60">
            Free preview lessons available. No credit card required.
          </p>
        </div>
      </div>
    </section>
  );
}
