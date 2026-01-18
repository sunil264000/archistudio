import { AlertTriangle } from 'lucide-react';

export function ProblemSection() {
  const problems = [
    "You can sketch beautiful concepts but can't read a structural drawing",
    "You learned AutoCAD basics but never created drawings contractors can build from",
    "You understand design theory but freeze when asked about construction sequences",
    "You spent years in college but still feel unprepared for your first real project"
  ];

  return (
    <section className="section-padding bg-secondary/30">
      <div className="container-wide">
        <div className="max-w-4xl mx-auto">
          {/* Section label */}
          <div className="text-technical mb-4">The Reality</div>
          
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h2 className="text-3xl md:text-4xl font-display font-bold leading-tight">
                Architecture College Taught You Theory.{' '}
                <span className="text-muted-foreground">But Not How to Practice.</span>
              </h2>
              <p className="text-lg text-muted-foreground">
                Five years of education, countless studio projects, dozens of reviews — 
                and yet most graduates walk into their first job feeling completely unprepared. 
                This isn't your fault. The curriculum was never designed for practice.
              </p>
            </div>

            <div className="space-y-4">
              {problems.map((problem, i) => (
                <div 
                  key={i}
                  className="flex items-start gap-4 p-4 rounded-lg bg-background border border-border"
                >
                  <AlertTriangle className="h-5 w-5 text-warning mt-0.5 shrink-0" />
                  <p className="text-sm text-muted-foreground">{problem}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Transition statement */}
          <div className="mt-16 text-center">
            <p className="text-xl font-medium">
              We're here to bridge that gap. <span className="text-accent">Permanently.</span>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
