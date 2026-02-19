import { useCart } from '@/contexts/CartContext';
import { ShoppingCart, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

export function BundleDiscountBanner() {
  const { itemCount } = useCart();

  const getDiscount = (count: number) => {
    if (count >= 3) return 20;
    if (count >= 2) return 10;
    return 0;
  };

  const currentDiscount = getDiscount(itemCount);
  const nextTier = itemCount < 2 ? { count: 2, discount: 10 } : itemCount < 3 ? { count: 3, discount: 20 } : null;

  return (
    <div className="bg-gradient-to-r from-accent/10 via-accent/5 to-accent/10 border border-accent/20 rounded-xl p-4 sm:p-5">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-accent/15 flex items-center justify-center shrink-0">
            <Sparkles className="h-5 w-5 text-accent" />
          </div>
          <div>
            <h3 className="font-semibold text-sm sm:text-base">Bundle & Save!</h3>
            <p className="text-xs sm:text-sm text-muted-foreground">
              {currentDiscount > 0 ? (
                <>You're saving <span className="font-bold text-accent">{currentDiscount}%</span> with {itemCount} courses in cart!</>
              ) : (
                <>Buy 2 courses, get <span className="font-bold text-accent">10% OFF</span> • Buy 3+, get <span className="font-bold text-accent">20% OFF</span></>
              )}
            </p>
          </div>
        </div>
        {nextTier && (
          <p className="text-xs text-muted-foreground">
            Add {nextTier.count - itemCount} more for {nextTier.discount}% off →
          </p>
        )}
      </div>
    </div>
  );
}
