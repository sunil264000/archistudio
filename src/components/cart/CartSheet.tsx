import { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Trash2, CreditCard, Loader2, Sparkles } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useCashfreePayment } from '@/hooks/useCashfreePayment';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { PhoneNumberDialog } from '@/components/payment/PhoneNumberDialog';
import { CourseThumbnail } from '@/components/course/CourseThumbnail';

export function CartSheet() {
  const { items, removeFromCart, totalPrice, itemCount, clearCart } = useCart();
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const { initiatePayment, isLoading } = useCashfreePayment();
  const { toast } = useToast();
  const [showPhoneDialog, setShowPhoneDialog] = useState(false);

  // Bundle discount logic
  const getBundleDiscount = (count: number) => {
    if (count >= 3) return 20;
    if (count >= 2) return 10;
    return 0;
  };

  const bundleDiscount = getBundleDiscount(itemCount);
  const discountAmount = bundleDiscount > 0 ? Math.round(totalPrice * bundleDiscount / 100) : 0;
  const finalPrice = totalPrice - discountAmount;

  const handleCheckout = async (phone?: string) => {
    if (!user) {
      navigate('/auth');
      return;
    }

    if (items.length === 0) return;

    // For single item, initiate payment directly
    if (items.length === 1) {
      const item = items[0];
      const customerPhone = phone || profile?.phone?.replace(/[\s-]/g, '');
      const hasValidPhone = customerPhone && customerPhone.length >= 10;

      if (!hasValidPhone) {
        setShowPhoneDialog(true);
        return;
      }

      await initiatePayment({
        courseId: item.slug,
        amount: item.price,
        customerName: profile?.full_name || user.email?.split('@')[0] || 'Customer',
        customerEmail: user.email || '',
        customerPhone: customerPhone,
        courseTitle: item.title,
      });
    } else {
      // For multiple items, navigate to first course for now
      // TODO: implement multi-course checkout
      toast({
        title: "Multi-Course Checkout",
        description: "Please purchase courses individually for now. We're working on multi-course checkout!",
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
                  <Button 
                    variant="link" 
                    onClick={() => navigate('/courses')}
                    className="mt-2"
                  >
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

                  {/* Bundle discount display */}
                  {bundleDiscount > 0 && (
                    <div className="flex items-center justify-between text-sm p-2 rounded-lg bg-accent/10 border border-accent/20">
                      <span className="flex items-center gap-1.5 text-accent font-medium">
                        <Sparkles className="h-3.5 w-3.5" />
                        Bundle Discount ({bundleDiscount}%)
                      </span>
                      <span className="text-accent font-semibold">-₹{discountAmount.toLocaleString()}</span>
                    </div>
                  )}

                  <div className="flex justify-between text-lg font-semibold">
                    <span>Total</span>
                    <div className="text-right">
                      {discountAmount > 0 && (
                        <span className="text-sm text-muted-foreground line-through mr-2">₹{totalPrice.toLocaleString()}</span>
                      )}
                      <span>₹{finalPrice.toLocaleString()}</span>
                    </div>
                  </div>
                  <Button onClick={() => handleCheckout()} disabled={isLoading} className="w-full" size="lg">
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <CreditCard className="h-4 w-4 mr-2" />
                    )}
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
