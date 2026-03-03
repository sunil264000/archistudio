import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ShoppingBag, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Purchase {
  name: string;
  course: string;
  timeAgo: string;
}

const DAILY_NOTIFICATION_KEY = 'purchase_notification_last_shown_at';

const fakeNames = [
  'Rahul M.', 'Priya S.', 'Amit K.', 'Sneha R.', 'Vikram P.',
  'Ananya G.', 'Rohan D.', 'Kavitha N.', 'Arjun B.', 'Meera L.',
];

const courseNames = [
  '3ds Max Complete Course',
  'Interior Design Masterclass',
  'Architectural Visualization',
  'AutoCAD Professional',
  'Revit BIM Fundamentals',
  'SketchUp Pro Training',
];

const cities = ['Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai', 'Pune'];

const getRandomTime = () => {
  const options = ['just now', '2 min ago', '5 min ago', '12 min ago', '23 min ago', '1 hour ago'];
  return options[Math.floor(Math.random() * options.length)];
};

const isShownToday = () => {
  const today = new Date().toISOString().slice(0, 10);
  return localStorage.getItem(DAILY_NOTIFICATION_KEY) === today;
};

const markShownToday = () => {
  const today = new Date().toISOString().slice(0, 10);
  localStorage.setItem(DAILY_NOTIFICATION_KEY, today);
};

export function PurchaseNotification() {
  const [notification, setNotification] = useState<Purchase | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isShownToday()) return;

    const fetchRealPurchases = async () => {
      const { data: payments } = await supabase
        .from('payments')
        .select('created_at, user_id, courses(title)')
        .eq('status', 'completed')
        .order('created_at', { ascending: false })
        .limit(10);

      if (!payments || payments.length === 0) return [];

      const userIds = [...new Set(payments.map((p) => p.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name')
        .in('user_id', userIds);

      const profileMap = new Map(profiles?.map((p) => [p.user_id, p.full_name]) || []);

      return payments.map((p) => ({
        created_at: p.created_at,
        course_title: (p.courses as any)?.title,
        full_name: profileMap.get(p.user_id) || null,
      }));
    };

    const showOneNotification = async () => {
      if (isShownToday()) return;

      const realPurchases = await fetchRealPurchases();
      const useReal = realPurchases.length > 0 && Math.random() < 0.5;

      let purchase: Purchase;

      if (useReal) {
        const real = realPurchases[Math.floor(Math.random() * realPurchases.length)];
        const name = real.full_name || 'Someone';
        const firstName = name.split(' ')[0];
        const initial = name.split(' ')[1]?.[0] || '';
        const created = new Date(real.created_at);
        const now = new Date();
        const diffMins = Math.floor((now.getTime() - created.getTime()) / 60000);

        let timeAgo = 'just now';
        if (diffMins > 60) timeAgo = `${Math.floor(diffMins / 60)} hour${Math.floor(diffMins / 60) > 1 ? 's' : ''} ago`;
        else if (diffMins > 0) timeAgo = `${diffMins} min ago`;

        purchase = {
          name: `${firstName} ${initial}.`,
          course: real.course_title || 'a course',
          timeAgo,
        };
      } else {
        const name = fakeNames[Math.floor(Math.random() * fakeNames.length)];
        const city = cities[Math.floor(Math.random() * cities.length)];

        purchase = {
          name: `${name} from ${city}`,
          course: courseNames[Math.floor(Math.random() * courseNames.length)],
          timeAgo: getRandomTime(),
        };
      }

      setNotification(purchase);
      setIsVisible(true);
      markShownToday();
      setTimeout(() => setIsVisible(false), 6000);
    };

    const initialDelay = setTimeout(showOneNotification, 15000);
    return () => clearTimeout(initialDelay);
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
              <p className="text-sm font-medium text-foreground">{notification.name}</p>
              <p className="text-sm text-primary font-semibold truncate">purchased {notification.course}</p>
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

