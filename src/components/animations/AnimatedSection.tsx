import { motion, Variants, useInView } from 'framer-motion';
import { ReactNode, useRef, useMemo } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';

// Check for reduced motion preference
const prefersReducedMotion = typeof window !== 'undefined' 
  ? window.matchMedia('(prefers-reduced-motion: reduce)').matches 
  : false;

// Simplified variants for mobile - faster, less complex
const mobileVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { duration: 0.3, ease: 'easeOut' }
  }
};

// Reusable animation variants
export const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 40 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] }
  }
};

export const fadeInLeft: Variants = {
  hidden: { opacity: 0, x: -40 },
  visible: { 
    opacity: 1, 
    x: 0,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] }
  }
};

export const fadeInRight: Variants = {
  hidden: { opacity: 0, x: 40 },
  visible: { 
    opacity: 1, 
    x: 0,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] }
  }
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { 
    opacity: 1, 
    scale: 1,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] }
  }
};

export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1
    }
  }
};

export const staggerContainerFast: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.05
    }
  }
};

interface AnimatedSectionProps {
  children: ReactNode;
  className?: string;
  variants?: Variants;
  delay?: number;
}

export function AnimatedSection({ 
  children, 
  className = '',
  variants = fadeInUp,
  delay = 0
}: AnimatedSectionProps) {
  const ref = useRef(null);
  const isMobile = useIsMobile();
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  // Use simpler animations on mobile for performance
  const activeVariants = useMemo(() => {
    if (prefersReducedMotion) return mobileVariants;
    if (isMobile) return mobileVariants;
    return variants;
  }, [isMobile, variants]);

  return (
    <motion.div
      ref={ref}
      variants={activeVariants}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      transition={{ delay: isMobile ? 0 : delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

interface AnimatedTextProps {
  text: string;
  className?: string;
  highlightWords?: string[];
  highlightClassName?: string;
}

export function AnimatedText({ 
  text, 
  className = '',
  highlightWords = [],
  highlightClassName = 'text-accent'
}: AnimatedTextProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });
  
  const words = text.split(' ');

  return (
    <motion.span
      ref={ref}
      className={`inline-flex flex-wrap ${className}`}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      variants={{
        visible: {
          transition: { staggerChildren: 0.025 }
        }
      }}
    >
      {words.map((word, i) => (
        <motion.span
          key={i}
          className={`inline-block mr-[0.25em] ${highlightWords.includes(word) ? highlightClassName : ''}`}
          variants={{
            hidden: { opacity: 0, y: 20, rotateX: 45 },
            visible: { 
              opacity: 1, 
              y: 0, 
              rotateX: 0,
              transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] }
            }
          }}
        >
          {word}
        </motion.span>
      ))}
    </motion.span>
  );
}

// Floating badge component with glow effect
interface FloatingBadgeProps {
  children: ReactNode;
  className?: string;
  icon?: ReactNode;
}

export function FloatingBadge({ children, className = '', icon }: FloatingBadgeProps) {
  return (
    <div
      className={`
        inline-flex items-center gap-2 px-5 py-2.5 rounded-full 
        bg-secondary/80 text-foreground text-sm font-medium 
        border border-accent/20
        ${className}
      `}
    >
      {icon && <span>{icon}</span>}
      {children}
    </div>
  );
}

// Animated underline component (like the reference image)
interface AnimatedUnderlineProps {
  className?: string;
  delay?: number;
  color?: string;
}

export function AnimatedUnderline({ 
  className = '', 
  delay = 0.8,
  color = 'hsl(var(--accent))'
}: AnimatedUnderlineProps) {
  return (
    <svg 
      className={`absolute -bottom-2 md:-bottom-3 left-0 w-full overflow-visible ${className}`} 
      viewBox="0 0 300 16" 
      fill="none"
      preserveAspectRatio="none"
    >
      <motion.path 
        d="M2 12C40 4 80 6 120 8C160 10 200 4 240 8C280 12 298 6 298 6" 
        stroke={color}
        strokeWidth="4" 
        strokeLinecap="round"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 1.2, delay, ease: [0.22, 1, 0.36, 1] }}
      />
    </svg>
  );
}

// Card with hover glow effect
interface GlowCardProps {
  children: ReactNode;
  className?: string;
  delay?: number;
}

export function GlowCard({ children, className = '', delay = 0 }: GlowCardProps) {
  return (
    <motion.div
      variants={fadeInUp}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-50px" }}
      transition={{ delay }}
      className={`
        relative overflow-hidden rounded-xl bg-card border border-border
        transition-colors duration-300 hover:border-accent/40 hover:shadow-lg
        ${className}
      `}
    >
      {children}
    </motion.div>
  );
}

// Animated counter for stats
interface AnimatedCounterProps {
  value: number;
  suffix?: string;
  prefix?: string;
  className?: string;
}

export function AnimatedCounter({ value, suffix = '', prefix = '', className = '' }: AnimatedCounterProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  return (
    <motion.span
      ref={ref}
      className={className}
      initial={{ opacity: 0 }}
      animate={isInView ? { opacity: 1 } : {}}
    >
      {prefix}
      <motion.span
        initial={{ opacity: 0 }}
        animate={isInView ? { opacity: 1 } : {}}
        transition={{ duration: 0.5 }}
      >
        {isInView ? value : 0}
      </motion.span>
      {suffix}
    </motion.span>
  );
}

// Sparkle animation for icons - simplified on mobile
export function SparkleIcon({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <span className={`inline-flex ${className}`}>{children}</span>;
}

// Parallax floating element - disabled on mobile
interface FloatingElementProps {
  children: ReactNode;
  className?: string;
  yOffset?: number;
  duration?: number;
  delay?: number;
}

export function FloatingElement({ 
  children, 
  className = '', 
  yOffset = 20,
  duration = 5,
  delay = 0
}: FloatingElementProps) {
  const isMobile = useIsMobile();
  
  // No floating animation on mobile
  if (isMobile || prefersReducedMotion) {
    return <div className={className}>{children}</div>;
  }
  
  return (
    <motion.div
      className={className}
      animate={{
        y: [0, -yOffset, 0],
      }}
      transition={{
        duration,
        repeat: Infinity,
        ease: "easeInOut",
        delay
      }}
    >
      {children}
    </motion.div>
  );
}

// Text reveal with blur effect - simplified on mobile
interface BlurRevealTextProps {
  children: ReactNode;
  className?: string;
  delay?: number;
}

export function BlurRevealText({ children, className = '', delay = 0 }: BlurRevealTextProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });
  const isMobile = useIsMobile();

  // Simple fade on mobile (no blur for performance)
  if (isMobile || prefersReducedMotion) {
    return (
      <motion.span
        ref={ref}
        className={className}
        initial={{ opacity: 0 }}
        animate={isInView ? { opacity: 1 } : {}}
        transition={{ duration: 0.4, delay: 0 }}
      >
        {children}
      </motion.span>
    );
  }

  return (
    <motion.span
      ref={ref}
      className={className}
      initial={{ opacity: 0, filter: 'blur(10px)' }}
      animate={isInView ? { opacity: 1, filter: 'blur(0px)' } : {}}
      transition={{ duration: 0.8, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.span>
  );
}
