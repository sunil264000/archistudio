import { createContext, useContext, useState, ReactNode } from 'react';
import { analytics } from '@/hooks/useGoogleAnalytics';

interface CartItem {
  courseId: string;
  slug: string;
  title: string;
  price: number;
  thumbnail?: string;
}

interface CartContextType {
  items: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (courseId: string) => void;
  clearCart: () => void;
  isInCart: (courseId: string) => boolean;
  totalPrice: number;
  itemCount: number;
  discountAmount: number;
  discountPercent: number;
  rawPrice: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem('cart');
    return saved ? JSON.parse(saved) : [];
  });

  const saveCart = (newItems: CartItem[]) => {
    localStorage.setItem('cart', JSON.stringify(newItems));
    setItems(newItems);
  };

  const addToCart = (item: CartItem) => {
    if (!items.find(i => i.courseId === item.courseId)) {
      saveCart([...items, item]);
      // Track add to cart event
      analytics.addToCart(item.courseId, item.title, item.price);
    }
  };

  const removeFromCart = (courseId: string) => {
    saveCart(items.filter(i => i.courseId !== courseId));
  };

  const clearCart = () => {
    saveCart([]);
  };

  const isInCart = (courseId: string) => items.some(i => i.courseId === courseId);
  
  const rawPrice = items.reduce((sum, item) => sum + item.price, 0);
  const discountPercent = items.length >= 3 ? 20 : (items.length === 2 ? 10 : 0);
  const discountAmount = Math.floor(rawPrice * (discountPercent / 100));
  const totalPrice = rawPrice - discountAmount;
  const itemCount = items.length;

  return (
    <CartContext.Provider value={{ 
      items, 
      addToCart, 
      removeFromCart, 
      clearCart, 
      isInCart, 
      totalPrice, 
      itemCount,
      discountAmount,
      discountPercent,
      rawPrice
    }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within CartProvider');
  return context;
};
