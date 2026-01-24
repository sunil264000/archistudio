import { Quote, Star } from 'lucide-react';
import { motion } from 'framer-motion';
import { 
  staggerContainer,
  staggerContainerFast,
  fadeInUp
} from '@/components/animations/AnimatedSection';

const testimonials = [
  {
    quote: "After two years at a firm, I still felt like I was faking it. This course finally gave me the confidence to lead a project from start to finish.",
    name: "Priya M.",
    role: "Junior Architect, 3 years experience",
    highlight: "confidence to lead",
    rating: 5,
  },
  {
    quote: "The construction logic module alone saved me from making a ₹5 lakh mistake on my first independent project. Worth every rupee.",
    name: "Rahul K.",
    role: "Freelance Architect",
    highlight: "saved me from making a ₹5 lakh mistake",
    rating: 5,
  },
  {
    quote: "I wish this existed when I graduated. Would have saved me three years of learning the hard way.",
    name: "Anjali S.",
    role: "Senior Architect, 8 years experience",
    highlight: "three years of learning the hard way",
    rating: 5,
  },
  {
    quote: "Finally, someone teaching architecture the way it's actually practiced. No fluff, no motivation speeches — just practical skills.",
    name: "Vikram P.",
    role: "Architecture Student, Final Year",
    highlight: "architecture the way it's actually practiced",
    rating: 5,
  },
];

export function TestimonialsSection() {
  return (
    <section className="section-padding relative overflow-hidden">
      {/* Subtle floating quotes in background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <motion.div
          className="absolute top-20 left-10 opacity-5"
          animate={{ y: [0, -20, 0], rotate: [0, 5, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        >
          <Quote className="h-32 w-32" />
        </motion.div>
        <motion.div
          className="absolute bottom-20 right-10 opacity-5"
          animate={{ y: [0, 20, 0], rotate: [0, -5, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        >
          <Quote className="h-24 w-24" />
        </motion.div>
      </div>
      
      <div className="container-wide relative">
        <motion.div 
          className="max-w-4xl mx-auto text-center mb-16"
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
        >
          <motion.div 
            variants={fadeInUp}
            className="text-technical mb-4"
          >
            What They Say
          </motion.div>
          <motion.h2 
            variants={fadeInUp}
            className="text-3xl md:text-4xl font-display font-bold mb-4"
          >
            From Skeptics to{' '}
            <motion.span 
              className="text-accent"
              whileHover={{ scale: 1.05 }}
              style={{ display: 'inline-block' }}
            >
              Practitioners
            </motion.span>
          </motion.h2>
          <motion.p 
            variants={fadeInUp}
            className="text-lg text-muted-foreground"
          >
            Don't take our word for it. Here's what students and architects are saying.
          </motion.p>
        </motion.div>

        <motion.div 
          className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto"
          variants={staggerContainerFast}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
        >
          {testimonials.map((testimonial, i) => (
            <motion.div 
              key={i}
              variants={fadeInUp}
              whileHover={{ 
                y: -8,
                boxShadow: '0 25px 50px -12px hsl(var(--accent) / 0.15)',
              }}
              className="relative p-6 rounded-xl bg-card border border-border hover:border-accent/30 transition-all duration-500 group overflow-hidden"
            >
              {/* Hover gradient */}
              <motion.div 
                className="absolute inset-0 bg-gradient-to-br from-accent/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"
              />
              
              {/* Quote icon with animation */}
              <motion.div
                className="absolute top-4 right-4"
                whileHover={{ scale: 1.2, rotate: 10 }}
              >
                <Quote className="h-8 w-8 text-accent/20 group-hover:text-accent/40 transition-colors" />
              </motion.div>
              
              {/* Star rating */}
              <div className="flex gap-1 mb-4">
                {[...Array(testimonial.rating)].map((_, j) => (
                  <motion.div
                    key={j}
                    initial={{ opacity: 0, scale: 0 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.1 + j * 0.05 }}
                  >
                    <Star className="h-4 w-4 fill-accent text-accent" />
                  </motion.div>
                ))}
              </div>
              
              <blockquote className="relative">
                <p className="text-muted-foreground leading-relaxed mb-4">
                  "{testimonial.quote}"
                </p>
                
                <footer className="flex items-center gap-3">
                  <motion.div 
                    className="h-11 w-11 rounded-full bg-gradient-to-br from-accent/20 to-secondary flex items-center justify-center border border-accent/20"
                    whileHover={{ scale: 1.1 }}
                  >
                    <span className="text-sm font-medium text-accent">
                      {testimonial.name.split(' ').map(n => n[0]).join('')}
                    </span>
                  </motion.div>
                  <div>
                    <div className="font-medium text-sm">{testimonial.name}</div>
                    <div className="text-xs text-muted-foreground">{testimonial.role}</div>
                  </div>
                </footer>
              </blockquote>
              
              {/* Bottom accent line */}
              <motion.div 
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-accent to-transparent"
                initial={{ scaleX: 0 }}
                whileHover={{ scaleX: 1 }}
                transition={{ duration: 0.4 }}
              />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
