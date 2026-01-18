import { ArrowRight, CheckCircle } from 'lucide-react';

const tracks = [
  {
    level: 'Beginner',
    title: 'Foundation',
    duration: '8 weeks',
    description: 'Start here if you\'re fresh out of college or switching careers.',
    topics: [
      'Reading architectural drawings',
      'Understanding scale and dimensions',
      'Basic construction terminology',
      'Site visit fundamentals',
    ],
    color: 'bg-success/10 border-success/30 text-success',
  },
  {
    level: 'Intermediate',
    title: 'Practice',
    duration: '12 weeks',
    description: 'For those with 1-2 years of experience who want to level up.',
    topics: [
      'Creating working drawing sets',
      'Structural coordination',
      'Specification writing',
      'Contractor coordination',
    ],
    color: 'bg-accent/10 border-accent/30 text-accent',
  },
  {
    level: 'Advanced',
    title: 'Mastery',
    duration: '16 weeks',
    description: 'Senior-level skills for project architects and team leads.',
    topics: [
      'Complex project management',
      'MEP integration strategies',
      'Value engineering',
      'Design-build coordination',
    ],
    color: 'bg-blueprint/10 border-blueprint/30 text-blueprint',
  },
];

export function CourseStructureSection() {
  return (
    <section className="section-padding bg-secondary/20">
      <div className="container-wide">
        <div className="max-w-4xl mx-auto text-center mb-16">
          <div className="text-technical mb-4">Learning Path</div>
          <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
            A Clear Path from Student to Practitioner
          </h2>
          <p className="text-lg text-muted-foreground">
            Three progressive tracks. Each builds on the last. 
            Start where you are, end where you want to be.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {tracks.map((track, i) => (
            <div 
              key={i}
              className="relative flex flex-col p-6 rounded-lg bg-card border border-border"
            >
              {/* Level badge */}
              <div className={`inline-flex self-start px-3 py-1 rounded-full text-xs font-medium border ${track.color}`}>
                {track.level}
              </div>

              {/* Content */}
              <div className="mt-4 flex-1">
                <h3 className="text-2xl font-bold mb-1">{track.title}</h3>
                <p className="text-sm text-muted-foreground mb-4">{track.duration}</p>
                <p className="text-muted-foreground mb-6">{track.description}</p>

                <ul className="space-y-3">
                  {track.topics.map((topic, j) => (
                    <li key={j} className="flex items-start gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-success mt-0.5 shrink-0" />
                      <span>{topic}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Arrow to next track */}
              {i < tracks.length - 1 && (
                <div className="hidden lg:flex absolute -right-4 top-1/2 -translate-y-1/2 z-10">
                  <div className="h-8 w-8 rounded-full bg-background border border-border flex items-center justify-center">
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
