import { 
  MapPin, 
  PenTool, 
  Layers, 
  Building2, 
  Leaf, 
  FileText, 
  Ruler, 
  Lightbulb 
} from 'lucide-react';

const modules = [
  {
    icon: MapPin,
    title: 'Site Analysis',
    description: 'Read sites like experienced architects. Understand context, constraints, and opportunities before putting pen to paper.',
  },
  {
    icon: PenTool,
    title: 'Working Drawings',
    description: 'Create complete drawing sets that contractors can actually build from. Plans, sections, details — all of it.',
  },
  {
    icon: Layers,
    title: 'Construction Logic',
    description: 'Understand how buildings go up. Sequences, dependencies, and the "why" behind construction methods.',
  },
  {
    icon: Building2,
    title: 'Structural Coordination',
    description: 'Read and coordinate with structural drawings. No more guessing what those symbols mean.',
  },
  {
    icon: Leaf,
    title: 'Sustainability',
    description: 'Design for climate, energy efficiency, and material consciousness. Beyond buzzwords, into practice.',
  },
  {
    icon: FileText,
    title: 'Specifications',
    description: 'Write specs that protect your design intent. Materials, finishes, and quality standards.',
  },
  {
    icon: Ruler,
    title: 'Detailing',
    description: 'Create details that solve real problems. Junctions, transitions, and the craft of building.',
  },
  {
    icon: Lightbulb,
    title: 'Services Integration',
    description: 'Understand MEP coordination. Your building needs more than walls and windows.',
  },
];

export function WhatYouLearnSection() {
  return (
    <section id="courses" className="section-padding">
      <div className="container-wide">
        <div className="max-w-4xl mx-auto text-center mb-16">
          <div className="text-technical mb-4">The Curriculum</div>
          <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
            What You'll Actually Learn
          </h2>
          <p className="text-lg text-muted-foreground">
            Eight comprehensive modules covering everything your college skipped. 
            Each one built on real-world project experience.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {modules.map((module, i) => (
            <div 
              key={i}
              className="group p-6 rounded-lg bg-card border border-border hover:border-accent/50 transition-all duration-300 card-architectural"
            >
              <div className="h-12 w-12 rounded-lg bg-secondary flex items-center justify-center mb-4 group-hover:bg-accent/10 transition-colors">
                <module.icon className="h-6 w-6 text-accent" />
              </div>
              <h3 className="font-semibold text-lg mb-2">{module.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{module.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
