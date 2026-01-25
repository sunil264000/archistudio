import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { AccessType } from '@/hooks/useAccessControl';
import { Check, Clock, Gift, Rocket, Percent } from 'lucide-react';
import { format } from 'date-fns';

interface AccessBadgeProps {
  accessType: AccessType;
  unlockedPercent?: number;
  expiryDate?: string | null;
  className?: string;
}

export function AccessBadge({ accessType, unlockedPercent, expiryDate, className }: AccessBadgeProps) {
  const config = {
    full: {
      label: 'Enrolled',
      variant: 'default' as const,
      icon: Check,
      description: 'You have full access to this course',
    },
    partial: {
      label: `${unlockedPercent || 0}% Unlocked`,
      variant: 'secondary' as const,
      icon: Percent,
      description: 'You have partial access. Complete payment to unlock more.',
    },
    gift: {
      label: 'Gift Access',
      variant: 'default' as const,
      icon: Gift,
      description: expiryDate 
        ? `Free access until ${format(new Date(expiryDate), 'MMM d, yyyy')}`
        : 'Complimentary access',
    },
    launch_free: {
      label: 'Free Launch Access',
      variant: 'outline' as const,
      icon: Rocket,
      description: expiryDate 
        ? `Free during launch, ends ${format(new Date(expiryDate), 'MMM d, yyyy')}`
        : 'Free during launch period',
    },
    none: {
      label: '',
      variant: 'outline' as const,
      icon: Clock,
      description: '',
    },
  };

  if (accessType === 'none') return null;

  const { label, variant, icon: Icon, description } = config[accessType];

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant={variant} className={className}>
            <Icon className="h-3 w-3 mr-1" />
            {label}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p>{description}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
