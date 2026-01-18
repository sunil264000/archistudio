import { Building2, Clock, Users, Award } from 'lucide-react';

export function InstructorSection() {
  const stats = [
    { icon: Clock, value: '15+', label: 'Years in Practice' },
    { icon: Building2, value: '50+', label: 'Projects Completed' },
    { icon: Users, value: '2000+', label: 'Students Mentored' },
    { icon: Award, value: '8', label: 'Industry Awards' },
  ];

  return (
    <section id="instructor" className="section-padding bg-secondary/20">
      <div className="container-wide">
        <div className="max-w-5xl mx-auto">
          <div className="text-technical mb-4 text-center">Your Mentor</div>
          
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Image placeholder - architectural style */}
            <div className="relative">
              <div className="aspect-[4/5] rounded-lg bg-gradient-to-br from-secondary to-muted overflow-hidden">
                {/* Placeholder pattern */}
                <div className="absolute inset-0 grid-pattern opacity-30" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center p-8">
                    <div className="w-32 h-32 mx-auto rounded-full bg-accent/20 flex items-center justify-center mb-4">
                      <span className="text-4xl font-bold text-accent">YN</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      [Your photo here]
                    </p>
                  </div>
                </div>
              </div>
              {/* Decorative frame */}
              <div className="absolute -bottom-4 -right-4 w-full h-full border-2 border-accent/20 rounded-lg -z-10" />
            </div>

            {/* Content */}
            <div className="space-y-6">
              <h2 className="text-3xl md:text-4xl font-display font-bold">
                Taught by Someone Who's Done It
              </h2>
              
              <div className="space-y-4 text-muted-foreground">
                <p>
                  I'm not an academic who's never left the campus. I've spent over 15 years 
                  on construction sites, in client meetings, coordinating with contractors, 
                  and solving the problems that college never prepared me for.
                </p>
                <p>
                  Every lesson in this course comes from real experience — the mistakes I made, 
                  the lessons I learned, and the systems I developed to work more effectively.
                </p>
                <p>
                  This isn't theory. This is what works.
                </p>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4 pt-4">
                {stats.map((stat, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-background border border-border">
                    <stat.icon className="h-5 w-5 text-accent" />
                    <div>
                      <div className="font-bold text-lg">{stat.value}</div>
                      <div className="text-xs text-muted-foreground">{stat.label}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
