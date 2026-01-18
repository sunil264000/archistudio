import { Quote } from 'lucide-react';

const testimonials = [
  {
    quote: "After two years at a firm, I still felt like I was faking it. This course finally gave me the confidence to lead a project from start to finish.",
    name: "Priya M.",
    role: "Junior Architect, 3 years experience",
    highlight: "confidence to lead",
  },
  {
    quote: "The construction logic module alone saved me from making a ₹5 lakh mistake on my first independent project. Worth every rupee.",
    name: "Rahul K.",
    role: "Freelance Architect",
    highlight: "saved me from making a ₹5 lakh mistake",
  },
  {
    quote: "I wish this existed when I graduated. Would have saved me three years of learning the hard way.",
    name: "Anjali S.",
    role: "Senior Architect, 8 years experience",
    highlight: "three years of learning the hard way",
  },
  {
    quote: "Finally, someone teaching architecture the way it's actually practiced. No fluff, no motivation speeches — just practical skills.",
    name: "Vikram P.",
    role: "Architecture Student, Final Year",
    highlight: "architecture the way it's actually practiced",
  },
];

export function TestimonialsSection() {
  return (
    <section className="section-padding">
      <div className="container-wide">
        <div className="max-w-4xl mx-auto text-center mb-16">
          <div className="text-technical mb-4">What They Say</div>
          <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
            From Skeptics to Practitioners
          </h2>
          <p className="text-lg text-muted-foreground">
            Don't take our word for it. Here's what students and architects are saying.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
          {testimonials.map((testimonial, i) => (
            <div 
              key={i}
              className="relative p-6 rounded-lg bg-card border border-border"
            >
              <Quote className="absolute top-4 right-4 h-8 w-8 text-accent/20" />
              
              <blockquote className="relative">
                <p className="text-muted-foreground leading-relaxed mb-4">
                  "{testimonial.quote}"
                </p>
                
                <footer className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center">
                    <span className="text-sm font-medium">
                      {testimonial.name.split(' ').map(n => n[0]).join('')}
                    </span>
                  </div>
                  <div>
                    <div className="font-medium text-sm">{testimonial.name}</div>
                    <div className="text-xs text-muted-foreground">{testimonial.role}</div>
                  </div>
                </footer>
              </blockquote>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
