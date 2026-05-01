import { useState } from 'react';
import { useCoupon } from '@/contexts/CouponContext';
import { useAuth } from '@/contexts/AuthContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tag, Loader2, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

export function CouponRedeemInput({ compact = false }: { compact?: boolean }) {
  const { redeem, isActive, active } = useCoupon();
  const { user } = useAuth();
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);

  if (isActive && active) {
    return (
      <div className="flex items-center gap-2 text-sm rounded-xl border border-accent/30 bg-accent/8 px-3 py-2">
        <CheckCircle2 className="h-4 w-4 text-accent" />
        <span className="font-semibold text-accent">{active.code}</span>
        <span className="text-muted-foreground">applied — {active.discountPercent}% off active</span>
      </div>
    );
  }

  const submit = async () => {
    if (!code.trim()) return;
    if (!user) {
      toast.error('Please sign in to apply a coupon.');
      return;
    }
    setBusy(true);
    const r = await redeem(code.trim());
    setBusy(false);
    if (!r.success) toast.error(r.error || 'Could not apply coupon.');
    else setCode('');
  };

  return (
    <div className={`flex gap-2 items-stretch ${compact ? '' : 'mt-2'}`}>
      <div className="relative flex-1">
        <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="Enter coupon code (e.g. MAY2026)"
          className="pl-9 uppercase"
          onKeyDown={(e) => e.key === 'Enter' && submit()}
          maxLength={32}
        />
      </div>
      <Button onClick={submit} disabled={busy || !code.trim()} variant="secondary">
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Apply'}
      </Button>
    </div>
  );
}
