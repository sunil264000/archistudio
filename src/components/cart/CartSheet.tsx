import { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ShoppingCart, Trash2, CreditCard, Loader2, Sparkles, Tag, Check, X, Timer } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useCashfreePayment } from '@/hooks/useCashfreePayment';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { PhoneNumberDialog } from '@/components/payment/PhoneNumberDialog';
import { useExitDiscount } from '@/hooks/useExitDiscount';
import { CourseThumbnail } from '@/components/course/CourseThumbnail';

export function CartSheet() {
  const { items, removeFromCart, totalPrice, itemCount, clearCart } = useCart();
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const { initiatePayment, isLoading } = useCashfreePayment();
  const { toast } = useToast();
  const [showPhoneDialog, setShowPhoneDialog] = useState(false);

  // Coupon state
  const [couponCode, setCouponCode] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    discountType: string;
    discountValue: number;
  } | null>(null);

  // Reset coupon when cart items change
  useEffect(() => {
    setAppliedCoupon(null);
    setCouponCode('');
  }, [items.length]);

  // Bundle discount logic
  const getBundleDiscount = (count: number) => {
    if (count >= 3) return 20;
    if (count >= 2) return 10;
    return 0;
  };

  const bundleDiscount = getBundleDiscount(itemCount);
  const bundleAmount = bundleDiscount > 0 ? Math.round(totalPrice * bundleDiscount / 100) : 0;

  // Exit-intent discount (auto-applied)
  const { isActive: exitDiscountActive, timeLeft: exitTimeLeft, discountPercent: exitDiscountPercent, formatTime } = useExitDiscount();

  // Coupon discount (applied after bundle)
  const priceAfterBundle = totalPrice - bundleAmount;
  let couponAmount = 0;
  if (appliedCoupon) {
    if (appliedCoupon.discountType === 'percentage') {
      couponAmount = Math.round(priceAfterBundle * appliedCoupon.discountValue / 100);
    } else {
      couponAmount = Math.min(appliedCoupon.discountValue, priceAfterBundle);
    }
  }

  // Exit discount (applied after bundle + coupon)
  const priceAfterCoupon = priceAfterBundle - couponAmount;
  const exitDiscountAmount = exitDiscountActive ? Math.round(priceAfterCoupon * exitDiscountPercent / 100) : 0;

  const finalPrice = priceAfterCoupon - exitDiscountAmount;

  const applyCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('validate-coupon', {
        body: { code: couponCode.trim().toUpperCase(), amount: priceAfterBundle },
      });

      if (error || !data?.valid) {
        toast({
          title: 'Invalid Coupon',
          description: data?.message || 'This coupon code is not valid.',
          variant: 'destructive',
        });
        setAppliedCoupon(null);
      } else {
        setAppliedCoupon({
          code: couponCode.trim().toUpperCase(),
          discountType: data.discount_type || 'percentage',
          discountValue: data.discount_value || 0,
        });
        toast({ title: 'Coupon Applied!', description: `You saved ₹${data.discount_amount || 0}` });
      }
    } catch {
      toast({ title: 'Error', description: 'Could not validate coupon', variant: 'destructive' });
    } finally {
      setCouponLoading(false);
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
  };

  const handleCheckout = async (phone?: string) => {
    if (!user) {
      navigate('/auth');
      return;
    }
    if (items.length === 0) return;

    if (items.length === 1) {
      const item = items[0];
      const customerPhone = phone || profile?.phone?.replace(/[\s-]/g, '');
      if (!customerPhone || !/^[6-9]\d{9}$/.test(customerPhone.replace(/\s/g, ''))) {
        setShowPhoneDialog(true);
        return;
      }
      await initiatePayment({
        courseId: item.slug,
        amount: finalPrice,
        customerName: profile?.full_name || user.email?.split('@')[0] || 'Customer',
        customerEmail: user.email || '',
        customerPhone: customerPhone,
        courseTitle: item.title,
      });
    } else {
      // Multi-course: navigate to the first course detail page for individual checkout
      toast({
        title: 'One at a time',
        description: `Purchasing "${items[0].title}" first. You can check out the rest after.`,
      });
      navigate(`/course/${items[0].slug}`);
    }
  };

  const handlePhoneSubmit = async (phone: string) => {
    if (user) {
      await supabase.from('profiles').update({ phone }).eq('user_id', user.id);
    }
    setShowPhoneDialog(false);
    await handleCheckout(phone);
  };

  return (
    <>
      <PhoneNumberDialog
        open={showPhoneDialog}
        onOpenChange={setShowPhoneDialog}
        onSubmit={handlePhoneSubmit}
      />
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="relative">
            <ShoppingCart className="h-5 w-5" />
            {itemCount > 0 && (
              <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                {itemCount}
              </Badge>
            )}
          </Button>
        </SheetTrigger>
        <SheetContent className="w-full sm:max-w-md">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Your Cart ({itemCount})
            </SheetTitle>
          </SheetHeader>

          <div className="mt-6 flex flex-col h-[calc(100vh-200px)]">
            {items.length === 0 ? (
              <div className="flex-1 flex items-center justify-center text-center">
                <div>
                  <ShoppingCart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Your cart is empty</p>
                  <Button variant="link" onClick={() => navigate('/courses')} className="mt-2">
                    Browse Courses
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex-1 overflow-auto space-y-3">
                  {items.map((item) => (
                    <div key={item.courseId} className="flex gap-3 p-3 bg-muted/50 rounded-lg">
                      <div className="w-20 h-14 rounded overflow-hidden bg-secondary shrink-0">
                        <CourseThumbnail
                          src={item.thumbnail || '/placeholder.svg'}
                          alt={item.title}
                          slug={item.slug}
                          category=""
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{item.title}</p>
                        <p className="text-primary font-semibold">₹{item.price.toLocaleString()}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeFromCart(item.courseId)}
                        className="h-8 w-8 text-destructive hover:text-destructive shrink-0"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>

                <div className="pt-4 space-y-3">
                  <Separator />

                  {/* Coupon Code Input */}
                  {appliedCoupon ? (
                    <div className="flex items-center justify-between p-2.5 rounded-lg bg-success/10 border border-success/20">
                      <span className="flex items-center gap-1.5 text-sm font-medium text-success">
                        <Check className="h-3.5 w-3.5" />
                        {appliedCoupon.code}
                        <span className="text-muted-foreground font-normal">
                          (-{appliedCoupon.discountType === 'percentage' ? `${appliedCoupon.discountValue}%` : `₹${appliedCoupon.discountValue}`})
                        </span>
                      </span>
                      <button onClick={removeCoupon} className="text-muted-foreground hover:text-foreground">
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                        <Input
                          placeholder="Coupon code"
                          value={couponCode}
                          onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                          onKeyDown={(e) => e.key === 'Enter' && applyCoupon()}
                          className="pl-9 h-9 text-sm uppercase"
                        />
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={applyCoupon}
                        disabled={couponLoading || !couponCode.trim()}
                        className="h-9 px-4"
                      >
                        {couponLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Apply'}
                      </Button>
                    </div>
                  )}

                  {/* Bundle discount */}
                  {bundleDiscount > 0 && (
                    <div className="flex items-center justify-between text-sm p-2 rounded-lg bg-accent/10 border border-accent/20">
                      <span className="flex items-center gap-1.5 text-accent font-medium">
                        <Sparkles className="h-3.5 w-3.5" />
                        Bundle ({bundleDiscount}%)
                      </span>
                      <span className="text-accent font-semibold">-₹{bundleAmount.toLocaleString()}</span>
                    </div>
                  )}

                  {/* Coupon discount */}
                  {couponAmount > 0 && (
                    <div className="flex items-center justify-between text-sm p-2 rounded-lg bg-success/10 border border-success/20">
                      <span className="flex items-center gap-1.5 text-success font-medium">
                        <Tag className="h-3.5 w-3.5" />
                        Coupon
                      </span>
                      <span className="text-success font-semibold">-₹{couponAmount.toLocaleString()}</span>
                    </div>
                  )}

                  {/* Exit-intent auto-discount */}
                  {exitDiscountActive && exitDiscountAmount > 0 && (
                    <div className="flex items-center justify-between text-sm p-2 rounded-lg bg-accent/10 border border-accent/20">
                      <span className="flex items-center gap-1.5 text-accent font-medium">
                        <Timer className="h-3.5 w-3.5" />
                        {exitDiscountPercent}% OFF ({formatTime(exitTimeLeft)})
                      </span>
                      <span className="text-accent font-semibold">-₹{exitDiscountAmount.toLocaleString()}</span>
                    </div>
                  )}

                  <div className="flex justify-between text-lg font-semibold">
                    <span>Total</span>
                    <div className="text-right">
                      {(bundleAmount + couponAmount + exitDiscountAmount) > 0 && (
                        <span className="text-sm text-muted-foreground line-through mr-2">₹{totalPrice.toLocaleString()}</span>
                      )}
                      <span>₹{finalPrice.toLocaleString()}</span>
                    </div>
                  </div>
                  <Button onClick={() => handleCheckout()} disabled={isLoading} className="w-full" size="lg">
                    {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CreditCard className="h-4 w-4 mr-2" />}
                    Checkout
                  </Button>
                  <Button variant="outline" onClick={clearCart} className="w-full">
                    Clear Cart
                  </Button>
                </div>
              </>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
