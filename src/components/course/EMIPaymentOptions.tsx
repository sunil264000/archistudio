import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Loader2, CreditCard, Unlock, ChevronRight, Percent, Clock, Sparkles, TrendingUp, CheckCircle2, IndianRupee, Calendar, Shield } from 'lucide-react';
import { useCashfreePayment } from '@/hooks/useCashfreePayment';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface PaymentTier {
  percent: number;
  module_order_indices: number[];
  lesson_ids?: string[];
  unlock_mode?: 'modules' | 'lessons';
  label: string;
}

type TierWithDbIndex = PaymentTier & { _dbIndex: number };

interface EMISetting {
  is_emi_enabled: boolean;
  min_first_payment_percent: number;
  max_splits: number;
  early_payment_discount_percent: number;
  emi_surcharge_percent?: number;
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

// Auto EMI threshold
const AUTO_EMI_THRESHOLD = 1699;
const AUTO_EMI_SURCHARGE = 10; // 10% convenience fee

// Generate auto EMI tiers for 2-part and 3-part plans
function generateAutoEMIPlans(coursePrice: number, modules: Module[]) {
  const emiTotal = Math.round(coursePrice * (1 + AUTO_EMI_SURCHARGE / 100));
  const moduleCount = modules.length;
  
  // For module allocation: split modules proportionally
  const sortedModules = [...modules].sort((a, b) => (a.order_index || 0) - (b.order_index || 0));
  
  // 2-part plan: 40% now, 60% within 1 week
  const twoPartModulesFirst = Math.ceil(moduleCount * 0.4);
  const twoPart = {
    splits: 2,
    label: '2 Payments',
    description: 'Pay in 2 parts within 1 month',
    installments: [
      {
        percent: 40,
        amount: Math.round(emiTotal * 0.40),
        label: '1st Payment (Now)',
        deadline: 'Pay now',
        moduleIndices: sortedModules.slice(0, twoPartModulesFirst).map(m => m.order_index),
      },
      {
        percent: 100,
        amount: Math.round(emiTotal * 0.60),
        label: '2nd Payment',
        deadline: 'Within 1 week',
        moduleIndices: sortedModules.map(m => m.order_index),
      },
    ],
    total: emiTotal,
  };

  // 3-part plan: 40% now, 30% within 1 week, 30% within 2 weeks
  const threePartModulesFirst = Math.ceil(moduleCount * 0.4);
  const threePartModulesSecond = Math.ceil(moduleCount * 0.7);
  const threePart = {
    splits: 3,
    label: '3 Payments',
    description: 'Pay in 3 parts within 1 month',
    installments: [
      {
        percent: 40,
        amount: Math.round(emiTotal * 0.40),
        label: '1st Payment (Now)',
        deadline: 'Pay now',
        moduleIndices: sortedModules.slice(0, threePartModulesFirst).map(m => m.order_index),
      },
      {
        percent: 70,
        amount: Math.round(emiTotal * 0.30),
        label: '2nd Payment',
        deadline: 'Within 1 week',
        moduleIndices: sortedModules.slice(0, threePartModulesSecond).map(m => m.order_index),
      },
      {
        percent: 100,
        amount: Math.round(emiTotal * 0.30),
        label: '3rd Payment',
        deadline: 'Within 2 weeks',
        moduleIndices: sortedModules.map(m => m.order_index),
      },
    ],
    total: emiTotal,
  };

  return { twoPart, threePart, emiTotal, extraCost: emiTotal - coursePrice };
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
  const [adminEmiSettings, setAdminEmiSettings] = useState<EMISetting | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTier, setSelectedTier] = useState<number | null>(null);
  const [paymentMode, setPaymentMode] = useState<'full' | 'emi'>('full');
  const [selectedPlan, setSelectedPlan] = useState<2 | 3>(2); // 2-part or 3-part
  const { user, profile } = useAuth();
  const { initiatePayment, isLoading: paymentLoading } = useCashfreePayment();

  // Determine if auto-EMI applies
  const isAutoEMI = coursePrice >= AUTO_EMI_THRESHOLD;
  const hasAdminEMI = adminEmiSettings?.is_emi_enabled === true;
  const showEMI = isAutoEMI || hasAdminEMI;

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
        setAdminEmiSettings({
          ...data,
          emi_surcharge_percent: (data as any).emi_surcharge_percent ?? 10,
          payment_tiers: Array.isArray(data.payment_tiers) ? data.payment_tiers as unknown as PaymentTier[] : [],
        });
      }
    } catch (error) {
      console.error('Failed to fetch EMI settings:', error);
    } finally {
      setLoading(false);
    }
  };

  // Auto EMI plans
  const autoPlans = isAutoEMI ? generateAutoEMIPlans(coursePrice, modules) : null;
  const currentAutoplan = autoPlans ? (selectedPlan === 2 ? autoPlans.twoPart : autoPlans.threePart) : null;

  // Admin EMI calculations
  const surchargePercent = adminEmiSettings?.emi_surcharge_percent ?? AUTO_EMI_SURCHARGE;
  const emiTotalPrice = hasAdminEMI ? Math.round(coursePrice * (1 + surchargePercent / 100)) : (autoPlans?.emiTotal ?? coursePrice);
  const extraCost = emiTotalPrice - coursePrice;

  const getModulesForTier = (tier: PaymentTier): string[] => {
    if (tier.percent === 100) return modules.map(m => m.title);
    return modules
      .filter(m => tier.module_order_indices.includes(m.order_index || 0))
      .map(m => m.title);
  };

  const calculateTierPrice = (percent: number): number => {
    return Math.round((emiTotalPrice * percent) / 100);
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

    try {
      // FULL payment
      if (paymentMode === 'full') {
        await initiatePayment({
          courseId: courseSlug,
          amount: coursePrice,
          customerName: profile?.full_name || user.email?.split('@')[0] || 'Student',
          customerEmail: user.email || '',
          customerPhone: phone,
          courseTitle,
          courseLevel: 'full',
        });
        return;
      }

      // EMI payment
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) {
        toast.error('Please login to continue');
        return;
      }

      // Load Cashfree SDK
      if (!(window as any).Cashfree) {
        await new Promise<void>((resolve, reject) => {
          const script = document.createElement('script');
          script.src = 'https://sdk.cashfree.com/js/v3/cashfree.js';
          script.onload = () => resolve();
          script.onerror = () => reject(new Error('Failed to load Cashfree SDK'));
          document.body.appendChild(script);
        });
      }

      if (isAutoEMI && !hasAdminEMI) {
        // Auto-EMI flow
        if (!currentAutoplan) {
          toast.error('Invalid EMI selection');
          return;
        }

        const firstInstallment = currentAutoplan.installments[0];

        const { data, error } = await supabase.functions.invoke('create-emi-order', {
          headers: { Authorization: `Bearer ${token}` },
          body: {
            courseId: courseSlug,
            customerName: profile?.full_name || user.email?.split('@')[0] || 'Student',
            customerEmail: user.email || '',
            customerPhone: phone,
            paymentPercent: firstInstallment.percent,
            tierIndex: 0,
            autoEMI: true,
            autoEMISplits: selectedPlan,
            autoEMIModuleIndices: firstInstallment.moduleIndices,
          },
        });

        if (error) {
          toast.error(error.message || 'Failed to create EMI order');
          return;
        }

        const paymentSessionId = data?.paymentSessionId as string | undefined;
        if (!paymentSessionId) {
          toast.error('Missing payment session from server');
          return;
        }

        const cashfree = (window as any).Cashfree({ mode: 'production' });
        await cashfree.checkout({ paymentSessionId, redirectTarget: '_self' });
      } else if (hasAdminEMI) {
        // Admin-configured EMI flow
        if (selectedTier === null) {
          toast.error('Please select an EMI option');
          return;
        }

        const tiersWithDbIndex: TierWithDbIndex[] = (adminEmiSettings!.payment_tiers || [])
          .map((t, i) => ({ ...t, _dbIndex: i }))
          .sort((a, b) => a.percent - b.percent);

        const chosen = tiersWithDbIndex[selectedTier];
        if (!chosen) {
          toast.error('Invalid EMI selection');
          return;
        }

        const { data, error } = await supabase.functions.invoke('create-emi-order', {
          headers: { Authorization: `Bearer ${token}` },
          body: {
            courseId: courseSlug,
            customerName: profile?.full_name || user.email?.split('@')[0] || 'Student',
            customerEmail: user.email || '',
            customerPhone: phone,
            paymentPercent: chosen.percent,
            tierIndex: chosen._dbIndex,
          },
        });

        if (error) {
          toast.error(error.message || 'Failed to create EMI order');
          return;
        }

        const paymentSessionId = data?.paymentSessionId as string | undefined;
        if (!paymentSessionId) {
          toast.error('Missing payment session from server');
          return;
        }

        const cashfree = (window as any).Cashfree({ mode: 'production' });
        await cashfree.checkout({ paymentSessionId, redirectTarget: '_self' });
      }
    } catch (err: any) {
      console.error('Payment error:', err);
      toast.error(err?.message || 'Payment failed');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <span className="text-sm text-muted-foreground">Loading payment options...</span>
        </div>
      </div>
    );
  }

  // If no EMI available at all, show only full payment
  if (!showEMI) {
    return (
      <Card className="border-0 shadow-lg bg-gradient-to-br from-card to-muted/20 overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl" />
        <CardHeader className="relative">
          <CardTitle className="flex items-center gap-2 text-lg">
            <div className="p-2 rounded-lg bg-primary/10">
              <CreditCard className="h-5 w-5 text-primary" />
            </div>
            Complete Your Purchase
          </CardTitle>
        </CardHeader>
        <CardContent className="relative">
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-primary/5 to-transparent rounded-xl border">
              <div>
                <span className="font-semibold">Full Course Access</span>
                <p className="text-sm text-muted-foreground mt-0.5">Lifetime access to all content</p>
              </div>
              <div className="text-right">
                <span className="text-2xl font-bold">₹{coursePrice.toLocaleString()}</span>
              </div>
            </div>
            <Button 
              className="w-full h-12 text-base" 
              size="lg" 
              onClick={handlePayment}
              disabled={paymentLoading}
            >
              {paymentLoading ? <Loader2 className="h-5 w-5 mr-2 animate-spin" /> : <CreditCard className="h-5 w-5 mr-2" />}
              Pay ₹{coursePrice.toLocaleString()}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Admin-configured tiers (if available)
  const adminTiers: TierWithDbIndex[] = hasAdminEMI
    ? (adminEmiSettings!.payment_tiers || [])
        .map((t, i) => ({ ...t, _dbIndex: i }))
        .sort((a, b) => a.percent - b.percent)
    : [];

  return (
    <Card className="border-0 shadow-lg bg-gradient-to-br from-card to-muted/20 overflow-hidden">
      <div className="absolute top-0 right-0 w-40 h-40 bg-primary/5 rounded-full blur-3xl" />
      <CardHeader className="relative pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <div className="p-2 rounded-lg bg-primary/10">
            <CreditCard className="h-5 w-5 text-primary" />
          </div>
          Choose Payment Option
        </CardTitle>
        <CardDescription>
          Pay in full for best value or split into easy installments
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5 relative">
        {/* Payment Mode Toggle */}
        <div className="grid grid-cols-2 gap-2 p-1 bg-muted/50 rounded-xl">
          <Button
            variant={paymentMode === 'full' ? 'default' : 'ghost'}
            className={`h-11 rounded-lg transition-all ${paymentMode === 'full' ? 'shadow-md' : ''}`}
            onClick={() => setPaymentMode('full')}
          >
            <Sparkles className="h-4 w-4 mr-2" />
            Pay Full
            <Badge variant="secondary" className="ml-2 bg-primary/20 text-primary text-[10px] px-1.5">
              Best Value
            </Badge>
          </Button>
          <Button
            variant={paymentMode === 'emi' ? 'default' : 'ghost'}
            className={`h-11 rounded-lg transition-all ${paymentMode === 'emi' ? 'shadow-md' : ''}`}
            onClick={() => setPaymentMode('emi')}
          >
            <TrendingUp className="h-4 w-4 mr-2" />
            Pay in Parts
          </Button>
        </div>

        {paymentMode === 'full' ? (
          <div className="space-y-4">
            <div className="p-4 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent rounded-xl border border-primary/20">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <span className="font-semibold text-lg">Full Course Access</span>
                  <p className="text-sm text-muted-foreground">One-time payment, lifetime access</p>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-bold">₹{coursePrice.toLocaleString()}</span>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary" className="bg-primary/10 text-primary">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  All {modules.length} modules
                </Badge>
                <Badge variant="secondary" className="bg-primary/10 text-primary">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  No extra charges
                </Badge>
                <Badge variant="secondary" className="bg-primary/10 text-primary">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Certificate included
                </Badge>
              </div>
            </div>

            {/* Comparison with EMI */}
            <div className="p-3 rounded-lg bg-muted/30 border border-dashed flex items-center gap-3">
              <div className="p-1.5 rounded bg-primary/10">
                <IndianRupee className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1 text-sm">
                <span className="font-medium">Save ₹{extraCost.toLocaleString()}</span>
                <span className="text-muted-foreground"> compared to EMI payments</span>
              </div>
            </div>

            <Button 
              className="w-full h-12 text-base" 
              size="lg" 
              onClick={handlePayment}
              disabled={paymentLoading}
            >
              {paymentLoading ? <Loader2 className="h-5 w-5 mr-2 animate-spin" /> : <CreditCard className="h-5 w-5 mr-2" />}
              Pay ₹{coursePrice.toLocaleString()}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* EMI Surcharge Notice */}
            <div className="p-3 rounded-lg bg-warning/10 border border-warning/20 flex items-start gap-3">
              <div className="p-1.5 rounded bg-warning/20 mt-0.5">
                <Percent className="h-4 w-4 text-warning-foreground" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-warning-foreground">
                  EMI includes {hasAdminEMI ? surchargePercent : AUTO_EMI_SURCHARGE}% convenience fee
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Total EMI cost: ₹{emiTotalPrice.toLocaleString()} (₹{extraCost.toLocaleString()} extra vs full payment)
                </p>
              </div>
            </div>

            {/* Auto-EMI: Plan selector (2 or 3 parts) */}
            {isAutoEMI && !hasAdminEMI && autoPlans && (
              <>
                {/* Plan selector toggle */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setSelectedPlan(2)}
                    className={`p-3 rounded-xl border-2 text-center transition-all ${
                      selectedPlan === 2 
                        ? 'border-primary bg-primary/5 shadow-sm' 
                        : 'border-border hover:border-muted-foreground/40'
                    }`}
                  >
                    <div className="text-lg font-bold">2 Parts</div>
                    <div className="text-xs text-muted-foreground">40% + 60%</div>
                  </button>
                  <button
                    onClick={() => setSelectedPlan(3)}
                    className={`p-3 rounded-xl border-2 text-center transition-all ${
                      selectedPlan === 3 
                        ? 'border-primary bg-primary/5 shadow-sm' 
                        : 'border-border hover:border-muted-foreground/40'
                    }`}
                  >
                    <div className="text-lg font-bold">3 Parts</div>
                    <div className="text-xs text-muted-foreground">40% + 30% + 30%</div>
                  </button>
                </div>

                {/* Timeline breakdown */}
                {currentAutoplan && (
                  <div className="space-y-0">
                    {currentAutoplan.installments.map((inst, idx) => {
                      const isFirst = idx === 0;
                      const isLast = idx === currentAutoplan.installments.length - 1;
                      const modulesUnlocked = isLast 
                        ? modules.length 
                        : inst.moduleIndices.length;

                      return (
                        <div key={idx} className="relative">
                          {/* Timeline connector */}
                          {!isLast && (
                            <div className="absolute left-[19px] top-[44px] bottom-0 w-0.5 bg-border" />
                          )}
                          <div className={`flex gap-3 p-3 rounded-xl transition-all ${
                            isFirst ? 'bg-primary/5 border border-primary/20' : 'hover:bg-muted/30'
                          }`}>
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-sm font-bold ${
                              isFirst 
                                ? 'bg-primary text-primary-foreground' 
                                : 'bg-muted text-muted-foreground border-2 border-border'
                            }`}>
                              {idx + 1}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <div>
                                  <span className="font-semibold text-sm">{inst.label}</span>
                                  <div className="flex items-center gap-1.5 mt-0.5">
                                    <Clock className="h-3 w-3 text-muted-foreground" />
                                    <span className="text-xs text-muted-foreground">{inst.deadline}</span>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <span className={`text-lg font-bold ${isFirst ? 'text-primary' : ''}`}>
                                    ₹{inst.amount.toLocaleString()}
                                  </span>
                                  <div className="text-[10px] text-muted-foreground">
                                    {inst.percent === 100 ? 'Final' : `${inst.percent}%`}
                                  </div>
                                </div>
                              </div>
                              <div className="mt-1.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                                <Unlock className="h-3 w-3" />
                                <span>Unlocks {modulesUnlocked} of {modules.length} modules</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* 1 month guarantee */}
                <div className="flex items-center gap-2.5 p-3 bg-primary/5 rounded-lg text-sm border border-primary/10">
                  <div className="p-1.5 rounded bg-primary/10">
                    <Calendar className="h-4 w-4 text-primary" />
                  </div>
                  <span className="text-foreground">
                    <strong>1 month window</strong> to complete all payments — pay anytime within the deadline
                  </span>
                </div>

                <div className="flex items-center gap-2.5 p-3 bg-muted/30 rounded-lg text-sm border">
                  <div className="p-1.5 rounded bg-muted">
                    <Shield className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <span className="text-muted-foreground text-xs">
                    Content unlocks progressively with each payment. Full access after final payment.
                  </span>
                </div>

                <Button 
                  className="w-full h-12 text-base" 
                  size="lg" 
                  onClick={handlePayment}
                  disabled={paymentLoading}
                >
                  {paymentLoading ? (
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  ) : (
                    <CreditCard className="h-5 w-5 mr-2" />
                  )}
                  Pay 1st Installment — ₹{currentAutoplan?.installments[0].amount.toLocaleString()}
                  <ChevronRight className="h-5 w-5 ml-2" />
                </Button>
              </>
            )}

            {/* Admin-configured EMI tiers */}
            {hasAdminEMI && (
              <>
                <RadioGroup value={selectedTier?.toString()} onValueChange={(v) => setSelectedTier(parseInt(v))}>
                  {adminTiers.map((tier, index) => {
                    const tierPrice = calculateTierPrice(tier.percent);
                    const unlockedModules = getModulesForTier(tier);
                    const isFull = tier.percent === 100;

                    return (
                      <div
                        key={index}
                        className={`relative border rounded-xl p-4 cursor-pointer transition-all ${
                          selectedTier === index 
                            ? 'border-primary bg-primary/5 shadow-md ring-2 ring-primary/20' 
                            : 'hover:bg-muted/30 hover:border-muted-foreground/30'
                        }`}
                        onClick={() => setSelectedTier(index)}
                      >
                        <div className="flex items-start gap-3">
                          <RadioGroupItem value={index.toString()} id={`tier-${index}`} className="mt-1" />
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center justify-between">
                              <Label htmlFor={`tier-${index}`} className="font-semibold cursor-pointer text-base">
                                {tier.label || `${tier.percent}% Access`}
                              </Label>
                              <div className="text-right">
                                <span className="text-xl font-bold">₹{tierPrice.toLocaleString()}</span>
                                {!isFull && (
                                  <div className="text-xs text-muted-foreground">
                                    {tier.percent}% of EMI total
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="space-y-1.5">
                              {isFull ? (
                                <div className="flex items-center gap-1.5 text-sm text-primary font-medium">
                                  <CheckCircle2 className="h-4 w-4" />
                                  <span>Complete course access - all modules unlocked</span>
                                </div>
                              ) : (
                                <>
                                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                                    <Unlock className="h-3.5 w-3.5" />
                                    <span>
                                      Unlocks: {unlockedModules.slice(0, 2).join(', ')}
                                      {unlockedModules.length > 2 && ` +${unlockedModules.length - 2} more`}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                                    <Clock className="h-3.5 w-3.5" />
                                    <span>Remaining: ₹{(emiTotalPrice - tierPrice).toLocaleString()}</span>
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                        {selectedTier === index && (
                          <div className="absolute -top-px -right-px">
                            <div className="bg-primary text-primary-foreground text-[10px] font-medium px-2 py-0.5 rounded-bl-lg rounded-tr-xl">
                              Selected
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </RadioGroup>

                {adminEmiSettings!.early_payment_discount_percent > 0 && (
                  <div className="flex items-center gap-2.5 p-3 bg-primary/5 rounded-lg text-sm border border-primary/10">
                    <div className="p-1.5 rounded bg-primary/10">
                      <Percent className="h-4 w-4 text-primary" />
                    </div>
                    <span className="text-foreground">
                      <strong>Early bird bonus:</strong> Pay before due date and get {adminEmiSettings!.early_payment_discount_percent}% off next installment
                    </span>
                  </div>
                )}

                <Button 
                  className="w-full h-12 text-base" 
                  size="lg" 
                  onClick={handlePayment}
                  disabled={selectedTier === null || paymentLoading}
                >
                  {paymentLoading ? (
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  ) : (
                    <CreditCard className="h-5 w-5 mr-2" />
                  )}
                  {selectedTier !== null 
                    ? `Pay ₹${calculateTierPrice(adminTiers[selectedTier].percent).toLocaleString()}`
                    : 'Select an option'}
                  <ChevronRight className="h-5 w-5 ml-2" />
                </Button>
              </>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
