import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Loader2, CreditCard, Unlock, ChevronRight, Percent, Clock } from 'lucide-react';
import { useCashfreePayment } from '@/hooks/useCashfreePayment';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface PaymentTier {
  percent: number;
  module_order_indices: number[];
  label: string;
}

interface EMISetting {
  is_emi_enabled: boolean;
  min_first_payment_percent: number;
  max_splits: number;
  early_payment_discount_percent: number;
  payment_tiers: PaymentTier[];
}

interface Module {
  id: string;
  title: string;
  order_index: number;
}

interface EMIPaymentOptionsProps {
  courseId: string;
  courseSlug: string;
  courseTitle: string;
  coursePrice: number;
  modules: Module[];
  onPaymentSuccess?: () => void;
  onPhoneRequired?: () => void;
  customerPhone?: string;
}

export function EMIPaymentOptions({
  courseId,
  courseSlug,
  courseTitle,
  coursePrice,
  modules,
  onPaymentSuccess,
  onPhoneRequired,
  customerPhone,
}: EMIPaymentOptionsProps) {
  const [emiSettings, setEmiSettings] = useState<EMISetting | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTier, setSelectedTier] = useState<number | null>(null);
  const [paymentMode, setPaymentMode] = useState<'full' | 'emi'>('full');
  const { user, profile } = useAuth();
  const { initiatePayment, isLoading: paymentLoading } = useCashfreePayment();

  useEffect(() => {
    fetchEMISettings();
  }, [courseId]);

  const fetchEMISettings = async () => {
    try {
      const { data, error } = await supabase
        .from('course_emi_settings')
        .select('*')
        .eq('course_id', courseId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        setEmiSettings({
          ...data,
          payment_tiers: Array.isArray(data.payment_tiers) ? data.payment_tiers as unknown as PaymentTier[] : [],
        });
      }
    } catch (error) {
      console.error('Failed to fetch EMI settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const getModulesForTier = (tier: PaymentTier): string[] => {
    if (tier.percent === 100) return modules.map(m => m.title);
    return modules
      .filter(m => tier.module_order_indices.includes(m.order_index || 0))
      .map(m => m.title);
  };

  const calculateTierPrice = (percent: number): number => {
    return Math.round((coursePrice * percent) / 100);
  };

  const handlePayment = async () => {
    if (!user) {
      toast.error('Please login to continue');
      return;
    }

    const phone = customerPhone || profile?.phone;
    if (!phone) {
      onPhoneRequired?.();
      return;
    }

    const amount = paymentMode === 'full' 
      ? coursePrice 
      : selectedTier !== null 
        ? calculateTierPrice(emiSettings!.payment_tiers[selectedTier].percent)
        : coursePrice;

    const tier = paymentMode === 'emi' && selectedTier !== null 
      ? emiSettings!.payment_tiers[selectedTier] 
      : null;

    await initiatePayment({
      courseId: courseSlug,
      amount,
      customerName: profile?.full_name || user.email?.split('@')[0] || 'Student',
      customerEmail: user.email || '',
      customerPhone: phone,
      courseTitle,
      courseLevel: tier ? `EMI_${tier.percent}%` : 'full',
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center py-4">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // If no EMI settings or not enabled, show only full payment
  if (!emiSettings || !emiSettings.is_emi_enabled) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <CreditCard className="h-5 w-5" />
            Payment
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <span className="font-medium">Full Course Access</span>
              <span className="text-xl font-bold">₹{coursePrice.toLocaleString()}</span>
            </div>
            <Button 
              className="w-full" 
              size="lg" 
              onClick={handlePayment}
              disabled={paymentLoading}
            >
              {paymentLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Pay ₹{coursePrice.toLocaleString()}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const tiers = emiSettings.payment_tiers.sort((a, b) => a.percent - b.percent);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <CreditCard className="h-5 w-5" />
          Choose Payment Option
        </CardTitle>
        <CardDescription>
          Pay in full or unlock content progressively
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Payment Mode Toggle */}
        <div className="flex gap-2">
          <Button
            variant={paymentMode === 'full' ? 'default' : 'outline'}
            className="flex-1"
            onClick={() => setPaymentMode('full')}
          >
            Pay Full
          </Button>
          <Button
            variant={paymentMode === 'emi' ? 'default' : 'outline'}
            className="flex-1"
            onClick={() => setPaymentMode('emi')}
          >
            Unlock in Parts
          </Button>
        </div>

        {paymentMode === 'full' ? (
          <div className="space-y-4">
            <div className="p-4 bg-muted/50 rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-medium">Full Course Access</span>
                <span className="text-xl font-bold">₹{coursePrice.toLocaleString()}</span>
              </div>
              <div className="flex items-center gap-1 text-sm text-emerald-600">
                <Unlock className="h-3 w-3" />
                <span>All {modules.length} modules included</span>
              </div>
            </div>
            <Button 
              className="w-full" 
              size="lg" 
              onClick={handlePayment}
              disabled={paymentLoading}
            >
              {paymentLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Pay ₹{coursePrice.toLocaleString()}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <RadioGroup
              value={selectedTier?.toString()}
              onValueChange={(v) => setSelectedTier(parseInt(v))}
            >
              {tiers.map((tier, index) => {
                const tierPrice = calculateTierPrice(tier.percent);
                const unlockedModules = getModulesForTier(tier);
                const isFull = tier.percent === 100;

                return (
                  <div
                    key={index}
                    className={`relative border rounded-lg p-4 cursor-pointer transition-colors ${
                      selectedTier === index 
                        ? 'border-accent bg-accent/5' 
                        : 'hover:bg-muted/50'
                    }`}
                    onClick={() => setSelectedTier(index)}
                  >
                    <div className="flex items-start gap-3">
                      <RadioGroupItem value={index.toString()} id={`tier-${index}`} />
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center justify-between">
                          <Label htmlFor={`tier-${index}`} className="font-medium cursor-pointer">
                            {tier.label || `${tier.percent}% Access`}
                          </Label>
                          <div className="text-right">
                            <span className="text-lg font-bold">₹{tierPrice.toLocaleString()}</span>
                            {!isFull && (
                              <div className="text-xs text-muted-foreground">
                                {tier.percent}% of total
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="text-sm text-muted-foreground">
                          {isFull ? (
                            <span className="flex items-center gap-1 text-emerald-600">
                              <Unlock className="h-3 w-3" />
                              All modules unlocked
                            </span>
                          ) : (
                            <>
                              <span className="flex items-center gap-1">
                                <Unlock className="h-3 w-3" />
                                Unlocks: {unlockedModules.slice(0, 3).join(', ')}
                                {unlockedModules.length > 3 && ` +${unlockedModules.length - 3} more`}
                              </span>
                              <span className="flex items-center gap-1 mt-1 text-amber-600">
                                <Clock className="h-3 w-3" />
                                Remaining: ₹{(coursePrice - tierPrice).toLocaleString()}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </RadioGroup>

            {/* Early Payment Discount Note */}
            {emiSettings.early_payment_discount_percent > 0 && (
              <div className="flex items-center gap-2 p-3 bg-emerald-500/10 rounded-lg text-sm text-emerald-700 dark:text-emerald-400">
                <Percent className="h-4 w-4" />
                <span>
                  Pay before due date and get {emiSettings.early_payment_discount_percent}% off next installment
                </span>
              </div>
            )}

            <Button 
              className="w-full" 
              size="lg" 
              onClick={handlePayment}
              disabled={selectedTier === null || paymentLoading}
            >
              {paymentLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              {selectedTier !== null 
                ? `Pay ₹${calculateTierPrice(tiers[selectedTier].percent).toLocaleString()}`
                : 'Select an option'}
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
