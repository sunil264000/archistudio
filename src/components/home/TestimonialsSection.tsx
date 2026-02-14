import { Star, Quote } from 'lucide-react';
import { motion } from 'framer-motion';
import { 
  staggerContainerFast,
  fadeInUp
} from '@/components/animations/AnimatedSection';

const testimonials = [
  {
    quote: "After two years at a firm, I still felt like I was faking it. This course finally gave me the confidence to lead a project from start to finish.",
    name: "Priya M.",
    role: "Junior Architect, 3 years experience",
    rating: 5,
  },
  {
    quote: "The construction logic module alone saved me from making a ₹5 lakh mistake on my first independent project. Worth every rupee.",
    name: "Rahul K.",
    role: "Freelance Architect",
    rating: 5,
  },
  {
    quote: "I wish this existed when I graduated. Would have saved me three years of learning the hard way.",
    name: "Anjali S.",
    role: "Senior Architect, 8 years experience",
    rating: 5,
  },
  {
    quote: "Finally, someone teaching architecture the way it's actually practiced. No fluff, no motivation speeches — just practical skills.",
    name: "Vikram P.",
    role: "Architecture Student, Final Year",
    rating: 5,
  },
];

export function TestimonialsSection() {
  return (
    <section className="section-padding relative overflow-hidden">
      <div className="container-wide">
        <motion.div 
          className="max-w-3xl mx-auto text-center mb-14 sm:mb-20"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
        >
          <div className="section-label mb-4">What They Say</div>
          <h2 className="font-display font-bold mb-4">
            From Skeptics to <span className="text-accent">Practitioners</span>
          </h2>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Don't take our word for it. Here's what students and architects are saying.
          </p>
        </motion.div>

        <motion.div 
          className="grid md:grid-cols-2 gap-5 max-w-5xl mx-auto"
          variants={staggerContainerFast}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
        >
          {testimonials.map((testimonial, i) => (
            <motion.div 
              key={i}
              variants={fadeInUp}
              className="relative p-7 rounded-2xl card-glass group"
              whileHover={{ y: -3 }}
              transition={{ duration: 0.3 }}
            >
              {/* Quote icon */}
              <Quote className="h-8 w-8 text-accent/15 absolute top-5 right-5" />
              
              {/* Star rating */}
              <div className="flex gap-0.5 mb-5">
                {[...Array(testimonial.rating)].map((_, j) => (
                  <Star key={j} className="h-4 w-4 fill-accent text-accent" />
                ))}
              </div>
              
              <blockquote>
                <p className="text-muted-foreground leading-relaxed mb-6 text-sm">
                  "{testimonial.quote}"
                </p>
                
                <footer className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-accent/10 flex items-center justify-center border border-accent/20">
                    <span className="text-xs font-semibold text-accent">
                      {testimonial.name.split(' ').map(n => n[0]).join('')}
                    </span>
                  </div>
                  <div>
                    <div className="font-medium text-sm">{testimonial.name}</div>
                    <div className="text-xs text-muted-foreground">{testimonial.role}</div>
                  </div>
                </footer>
              </blockquote>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
