import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, BookOpen, CheckCircle } from 'lucide-react';

export function HeroSection() {
  return (
    <section className="relative overflow-hidden">
      {/* Grid pattern background */}
      <div className="absolute inset-0 grid-pattern opacity-50" />
      
      <div className="relative section-padding">
        <div className="container-wide">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            {/* Badge */}
            <div className="inline-block px-4 py-1.5 rounded-full bg-secondary text-secondary-foreground text-sm font-medium border border-border">
              For Students & Fresh Architects
            </div>
            
            {/* Headline */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold tracking-tight leading-[1.1]">
              Learn Architecture the Way{' '}
              <span className="relative">
                <span className="text-accent">It Is Actually Practiced</span>
                <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 300 12" fill="none">
                  <path d="M2 10C50 4 100 2 150 6C200 10 250 4 298 8" stroke="hsl(var(--accent))" strokeWidth="3" strokeLinecap="round"/>
                </svg>
              </span>
            </h1>
            
            {/* Subheadline */}
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              From site analysis to working drawings, construction logic to sustainability — 
              practical skills that colleges don't teach but the industry demands.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Link to="/auth?mode=signup">
                <Button size="lg" className="gap-2 text-base px-8 h-12">
                  Start Learning Today
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
              <a href="#courses">
                <Button variant="outline" size="lg" className="gap-2 text-base px-8 h-12">
                  <BookOpen className="h-5 w-5" />
                  See Course Curriculum
                </Button>
              </a>
            </div>

            {/* Trust indicators */}
            <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-4 pt-8 text-muted-foreground">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-success" />
                <span className="text-sm">No prior CAD knowledge needed</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-success" />
                <span className="text-sm">Learn at your own pace</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-success" />
                <span className="text-sm">Certificate on completion</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Decorative architectural element */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
    </section>
  );
}
