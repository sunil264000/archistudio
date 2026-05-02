import { BadgeCheck } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export function VerifiedBadge({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const sizeClasses = {
    sm: "h-3 w-3",
    md: "h-4 w-4",
    lg: "h-5 w-5"
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="inline-flex items-center justify-center text-accent animate-in fade-in zoom-in duration-500">
            <BadgeCheck className={sizeClasses[size]} fill="currentColor" fillOpacity={0.2} />
          </div>
        </TooltipTrigger>
        <TooltipContent className="bg-background/95 backdrop-blur-md border border-border/50 text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 shadow-xl">
          Verified Professional · Vetted by Archistudio
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
