import { X, Check } from 'lucide-react';

const comparisons = [
  {
    aspect: 'Drawing Skills',
    college: 'Conceptual sketches and presentations',
    platform: 'Construction-ready working drawings',
  },
  {
    aspect: 'Site Understanding',
    college: 'Theoretical site analysis frameworks',
    platform: 'Practical site reading and documentation',
  },
  {
    aspect: 'Construction Knowledge',
    college: 'Abstract building technology courses',
    platform: 'Real construction sequences and logic',
  },
  {
    aspect: 'Coordination',
    college: 'Individual design projects',
    platform: 'Multi-discipline project coordination',
  },
  {
    aspect: 'Professional Skills',
    college: 'Studio critiques with professors',
    platform: 'Client meetings and contractor talks',
  },
  {
    aspect: 'Learning Style',
    college: 'Theory-first, practice-maybe-later',
    platform: 'Practice-first, theory-when-needed',
  },
];

export function ComparisonSection() {
  return (
    <section className="section-padding">
      <div className="container-wide">
        <div className="max-w-4xl mx-auto text-center mb-16">
          <div className="text-technical mb-4">The Difference</div>
          <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
            Why This Works When College Didn't
          </h2>
          <p className="text-lg text-muted-foreground">
            It's not that college was useless. It just wasn't designed for practice.
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="grid grid-cols-3 gap-4 mb-2 text-sm font-medium">
            <div className="text-muted-foreground">Aspect</div>
            <div className="text-center text-muted-foreground">College Approach</div>
            <div className="text-center text-accent">Our Approach</div>
          </div>

          {/* Rows */}
          <div className="space-y-2">
            {comparisons.map((item, i) => (
              <div 
                key={i}
                className="grid grid-cols-3 gap-4 p-4 rounded-lg bg-card border border-border items-center"
              >
                <div className="font-medium text-sm">{item.aspect}</div>
                <div className="text-center">
                  <div className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                    <X className="h-4 w-4 text-destructive shrink-0" />
                    <span className="hidden sm:inline">{item.college}</span>
                  </div>
                </div>
                <div className="text-center">
                  <div className="inline-flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-success shrink-0" />
                    <span className="hidden sm:inline">{item.platform}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Mobile-friendly alternative description */}
          <div className="sm:hidden mt-8 space-y-4">
            {comparisons.map((item, i) => (
              <div key={i} className="p-4 rounded-lg bg-card border border-border">
                <div className="font-medium mb-2">{item.aspect}</div>
                <div className="flex items-start gap-2 text-sm text-muted-foreground mb-2">
                  <X className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                  <span>College: {item.college}</span>
                </div>
                <div className="flex items-start gap-2 text-sm">
                  <Check className="h-4 w-4 text-success shrink-0 mt-0.5" />
                  <span>Here: {item.platform}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
