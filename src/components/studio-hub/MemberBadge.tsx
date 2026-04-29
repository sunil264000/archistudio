import { Badge } from '@/components/ui/badge';
import { Star, Award, ShieldCheck, Crown, Sparkles } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export type MemberTier = 'newbie' | 'rising_star' | 'top_rated' | 'master' | 'pro';

interface MemberBadgeProps {
  tier?: MemberTier;
  projectsCompleted?: number;
  rating?: number;
  isPro?: boolean;
  className?: string;
}

export function MemberBadge({ tier, projectsCompleted = 0, rating = 0, isPro, className }: MemberBadgeProps) {
  let activeTier: MemberTier = 'newbie';
  
  if (isPro) activeTier = 'pro';
  else if (projectsCompleted >= 10 && rating >= 4.8) activeTier = 'master';
  else if (projectsCompleted >= 5 && rating >= 4.7) activeTier = 'top_rated';
  else if (projectsCompleted >= 1 && rating >= 4.5) activeTier = 'rising_star';

  const config = {
    newbie: { 
      label: 'New Member', 
      icon: Sparkles, 
      color: 'bg-muted text-muted-foreground border-border/40',
      desc: 'Just started their journey in the Studio.'
    },
    rising_star: { 
      label: 'Rising Star', 
      icon: Zap, 
      color: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
      desc: 'Completed projects with consistent high quality.'
    },
    top_rated: { 
      label: 'Top Rated', 
      icon: ShieldCheck, 
      color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
      desc: 'One of our most trusted and reliable members.'
    },
    master: { 
      label: 'Master Architect', 
      icon: Crown, 
      color: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
      desc: 'Exceptional skill level and perfect project history.'
    },
    pro: { 
      label: 'Pro Member', 
      icon: Award, 
      color: 'bg-accent/10 text-accent border-accent/20',
      desc: 'Verified Studio Pro with exclusive benefits.'
    }
  };

  const { label, icon: Icon, color, desc } = config[activeTier];

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant="outline" className={`gap-1.5 rounded-full font-medium py-0.5 px-2.5 transition-all cursor-help hover:scale-105 ${color} ${className}`}>
            <Icon className="h-3 w-3" />
            {label}
          </Badge>
        </TooltipTrigger>
        <TooltipContent className="max-w-[200px] text-center p-3 rounded-xl border-border/60 bg-card/90 backdrop-blur-md">
          <p className="text-xs font-semibold mb-1">{label}</p>
          <p className="text-[10px] text-muted-foreground leading-relaxed">{desc}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

const Zap = ({ className }: { className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width="24" height="24" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z"/>
  </svg>
);
