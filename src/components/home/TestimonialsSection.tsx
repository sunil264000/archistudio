import { Star, Quote, CheckCircle2 } from 'lucide-react';
import { motion, useMotionValue, animate } from 'framer-motion';
import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { 
  staggerContainerFast,
  fadeInUp
} from '@/components/animations/AnimatedSection';

interface Testimonial {
  quote: string;
  name: string;
  role: string;
  rating: number;
}

const fallbackTestimonials: Testimonial[] = [
  {
    quote: "I learnt so much things here that my college will never teach me today or in the future. The practical knowledge is insane. Highly recommended!",
    name: "Aarav P.",
    role: "Architecture Student",
    rating: 5,
  },
  {
    quote: "After two years at a firm, I still felt like I was faking it. The Studio Hub courses finally gave me the confidence to lead a project from start to finish.",
    name: "Priya M.",
    role: "Junior Architect, 3 years experience",
    rating: 5,
  },
  {
    quote: "The construction logic and detailing modules alone saved me from making a ₹5 lakh mistake on my first independent project. Worth every single rupee.",
    name: "Rahul K.",
    role: "Freelance Architect",
    rating: 5,
  },
  {
    quote: "Honestly, they teach you the actual reality of architecture. My professors never taught us how to actually handle clients or price our 3D renders. Archistudio changed my career.",
    name: "Sneha R.",
    role: "Freelance 3D Artist",
    rating: 5,
  },
  {
    quote: "I wish this platform existed when I graduated. Would have saved me three years of learning the hard way through trial and error.",
    name: "Anjali S.",
    role: "Senior Architect",
    rating: 5,
  },
  {
    quote: "Studio Hub connected me with a real client for the first time. The escrow system made it 100% safe to work, and I got paid immediately after delivery.",
    name: "Vikram D.",
    role: "Freelance Drafter",
    rating: 5,
  },
  {
    quote: "Better than any YouTube tutorial or university lecture. The mentorship approach and real-project files you get are completely unmatched in India.",
    name: "Arjun T.",
    role: "Architecture Intern",
    rating: 5,
  },
  {
    quote: "I was struggling to find a job, but after doing the portfolio mastery course here, I landed a job at a top-tier firm in Mumbai. Thank you so much Archistudio!",
    name: "Kavya N.",
    role: "Junior Designer",
    rating: 5,
  }
];

function useTestimonials() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>(fallbackTestimonials);
  useEffect(() => {
    supabase
      .from('reviews')
      .select('rating, review, user_id')
      .gte('rating', 4)
      .not('review', 'is', null)
      .order('rating', { ascending: false })
      .limit(6)
      .then(async ({ data }) => {
        if (data && data.length >= 2) {
          const userIds = [...new Set(data.map((r: any) => r.user_id))];
          const { data: profiles } = await supabase
            .from('profiles')
            .select('user_id, full_name')
            .in('user_id', userIds);
          const nameMap = new Map((profiles || []).map((p: any) => [p.user_id, p.full_name]));
          setTestimonials(data.map((r: any) => ({
            quote: r.review,
            name: nameMap.get(r.user_id) || 'Student',
            role: 'Verified Student',
            rating: r.rating,
          })));
        }
      });
  }, []);
  return testimonials;
}

function InfiniteScrollRow({ testimonials, direction = 1, speed = 25 }: { testimonials: Testimonial[]; direction?: number; speed?: number }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);

  useEffect(() => {
    if (!containerRef.current) return;
    const contentWidth = containerRef.current.scrollWidth / 2;
    
    const controls = animate(x, direction > 0 ? -contentWidth : 0, {
      type: 'tween',
      ease: 'linear',
      duration: contentWidth / speed,
      repeat: Infinity,
      repeatType: 'loop',
      ...(direction < 0 && { from: -contentWidth }),
    });

    return () => controls.stop();
  }, [testimonials, direction, speed]);

  const items = [...testimonials, ...testimonials];

  return (
    <div className="overflow-hidden group">
      <motion.div
        ref={containerRef}
        className="flex gap-4 w-max"
        style={{ x }}
        onHoverStart={() => x.stop()}
        onHoverEnd={() => {
          if (!containerRef.current) return;
          const contentWidth = containerRef.current.scrollWidth / 2;
          const current = x.get();
          const remaining = direction > 0 ? Math.abs(-contentWidth - current) : Math.abs(current);
          animate(x, direction > 0 ? -contentWidth : 0, {
            type: 'tween', ease: 'linear', duration: remaining / speed,
            repeat: Infinity, repeatType: 'loop',
          });
        }}
      >
        {items.map((testimonial, i) => (
          <div key={i} className="w-[380px] shrink-0 p-6 rounded-2xl card-premium bg-card border border-border/30">
            <Quote className="h-6 w-6 text-accent/10 mb-4" />
            
            {/* Stars */}
            <div className="flex gap-0.5 mb-4">
              {[...Array(testimonial.rating)].map((_, j) => (
                <Star key={j} className="h-3 w-3 fill-accent text-accent" />
              ))}
            </div>
            
            <p className="text-sm text-muted-foreground leading-relaxed mb-5 line-clamp-4">
              "{testimonial.quote}"
            </p>
            
            <footer className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-accent/8 flex items-center justify-center border border-accent/15">
                <span className="text-[10px] font-bold text-accent">
                  {testimonial.name.split(' ').map(n => n[0]).join('')}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-display font-semibold text-sm text-foreground truncate">{testimonial.name}</span>
                  <CheckCircle2 className="h-3.5 w-3.5 text-accent shrink-0" />
                </div>
                <div className="text-xs text-muted-foreground truncate">{testimonial.role}</div>
              </div>
            </footer>
          </div>
        ))}
      </motion.div>
    </div>
  );
}

export function TestimonialsSection() {
  const testimonials = useTestimonials();
  const half = Math.ceil(testimonials.length / 2);
  const row1 = testimonials.slice(0, half);
  const row2 = testimonials.slice(half);

  return (
    <section className="section-padding relative overflow-hidden">
      <div className="container-wide">
        <motion.div 
          className="max-w-2xl mx-auto text-center mb-14"
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5 }}
        >
          <div className="section-label mb-4">Student Stories</div>
          <h2 className="font-display mb-4">
            From Skeptics to <span className="text-accent">Practitioners</span>
          </h2>
          <p className="text-body text-muted-foreground max-w-md mx-auto">
            Don't take our word for it. Here's what students and architects are saying.
          </p>
        </motion.div>
      </div>

      {/* Auto-scrolling rows */}
      <div className="space-y-4 max-w-[100vw]">
        <InfiniteScrollRow testimonials={row1} direction={1} speed={20} />
        {row2.length > 0 && <InfiniteScrollRow testimonials={row2} direction={-1} speed={18} />}
      </div>
    </section>
  );
}
