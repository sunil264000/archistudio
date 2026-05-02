import { BadgeCheck, Zap } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export function VerifiedBadge({ size = "md", isPro = false }: { size?: "sm" | "md" | "lg", isPro?: boolean }) {
  const sizeClasses = {
    sm: "h-3 w-3",
    md: "h-4 w-4",
    lg: "h-5 w-5"
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={`inline-flex items-center justify-center animate-in fade-in zoom-in duration-500 ${isPro ? 'text-amber-500' : 'text-accent'}`}>
            {isPro ? (
              <div className="relative">
                <BadgeCheck className={`${sizeClasses[size]} drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]`} fill="currentColor" fillOpacity={0.2} />
                <Zap className="absolute -top-1 -right-1 h-2 w-2 text-amber-500 fill-amber-500 animate-pulse" />
              </div>
            ) : (
              <BadgeCheck className={sizeClasses[size]} fill="currentColor" fillOpacity={0.2} />
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent className="bg-background/95 backdrop-blur-md border border-border/50 text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 shadow-xl">
          {isPro ? 'PRO Member · Elite Tier Professional' : 'Verified Professional · Vetted by Archistudio'}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
