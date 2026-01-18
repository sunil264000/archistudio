import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ShoppingBag, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Purchase {
  name: string;
  course: string;
  timeAgo: string;
  isReal: boolean;
}

const fakeNames = [
  'Rahul M.', 'Priya S.', 'Amit K.', 'Sneha R.', 'Vikram P.', 
  'Ananya G.', 'Rohan D.', 'Kavitha N.', 'Arjun B.', 'Meera L.',
  'Karan T.', 'Divya C.', 'Aditya V.', 'Pooja H.', 'Nikhil J.',
];

const courseNames = [
  '3ds Max Complete Course',
  'Interior Design Masterclass',
  'Architectural Visualization',
  'AutoCAD Professional',
  'Revit BIM Fundamentals',
  'SketchUp Pro Training',
  'Corona Rendering Expert',
];

const timeOptions = ['just now', '2 min ago', '5 min ago', '12 min ago', '1 hour ago', '3 hours ago'];

export function PurchaseNotification() {
  const [notification, setNotification] = useState<Purchase | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const fetchRealPurchases = async () => {
      const { data } = await supabase
        .from('payments')
        .select('created_at, courses(title), profiles!payments_user_id_fkey(full_name)')
        .eq('status', 'completed')
        .order('created_at', { ascending: false })
        .limit(10);
      
      return data || [];
    };

    const showNotification = async () => {
      const realPurchases = await fetchRealPurchases();
      
      // 30% chance for real purchase if available
      const useReal = realPurchases.length > 0 && Math.random() < 0.3;
      
      let purchase: Purchase;
      
      if (useReal) {
        const real = realPurchases[Math.floor(Math.random() * realPurchases.length)];
        const name = (real.profiles as any)?.full_name || 'Someone';
        const firstName = name.split(' ')[0];
        const initial = name.split(' ')[1]?.[0] || '';
        const created = new Date(real.created_at);
        const now = new Date();
        const diffMs = now.getTime() - created.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        
        let timeAgo = 'just now';
        if (diffHours > 24) timeAgo = `${Math.floor(diffHours / 24)} days ago`;
        else if (diffHours > 0) timeAgo = `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
        else if (diffMins > 0) timeAgo = `${diffMins} min ago`;
        
        purchase = {
          name: `${firstName} ${initial}.`,
          course: (real.courses as any)?.title || 'a course',
          timeAgo,
          isReal: true,
        };
      } else {
        purchase = {
          name: fakeNames[Math.floor(Math.random() * fakeNames.length)],
          course: courseNames[Math.floor(Math.random() * courseNames.length)],
          timeAgo: timeOptions[Math.floor(Math.random() * timeOptions.length)],
          isReal: false,
        };
      }
      
      setNotification(purchase);
      setIsVisible(true);
      
      setTimeout(() => setIsVisible(false), 5000);
    };

    // Initial delay
    const initialDelay = setTimeout(() => {
      showNotification();
    }, 8000);

    // Show notification every 20-40 seconds
    const interval = setInterval(() => {
      showNotification();
    }, 20000 + Math.random() * 20000);

    return () => {
      clearTimeout(initialDelay);
      clearInterval(interval);
    };
  }, []);

  return (
    <AnimatePresence>
      {isVisible && notification && (
        <motion.div
          initial={{ x: -400, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -400, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="fixed bottom-4 left-4 z-50 max-w-sm"
        >
          <div className="bg-card border border-border rounded-lg shadow-xl p-4 flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-success/20 flex items-center justify-center flex-shrink-0">
              <ShoppingBag className="h-5 w-5 text-success" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground">
                {notification.name} purchased
              </p>
              <p className="text-sm text-primary font-semibold truncate">
                {notification.course}
              </p>
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                <Clock className="h-3 w-3" />
                {notification.timeAgo}
              </p>
            </div>
            <button 
              onClick={() => setIsVisible(false)}
              className="text-muted-foreground hover:text-foreground text-lg leading-none"
            >
              ×
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
