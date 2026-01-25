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
  'Sanjay R.', 'Neha P.', 'Rajesh K.', 'Anjali S.', 'Deepak M.',
  'Manish G.', 'Sakshi T.', 'Varun B.', 'Shreya D.', 'Akash L.',
];

const courseNames = [
  '3ds Max Complete Course',
  'Interior Design Masterclass',
  'Architectural Visualization',
  'AutoCAD Professional',
  'Revit BIM Fundamentals',
  'SketchUp Pro Training',
  'Corona Rendering Expert',
  'Post Production Mastery',
  'Rhino 3D Modeling',
];

const cities = [
  'Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai', 
  'Pune', 'Kolkata', 'Ahmedabad', 'Jaipur', 'Lucknow',
];

const actionTypes = [
  { action: 'purchased', icon: 'cart' },
  { action: 'joined', icon: 'cart' },
  { action: 'started practicing', icon: 'play' },
  { action: 'finished a session in', icon: 'check' },
  { action: 'completed', icon: 'award' },
];

const getRandomTime = () => {
  const options = [
    { text: 'just now', weight: 10 },
    { text: '2 min ago', weight: 15 },
    { text: '5 min ago', weight: 20 },
    { text: '12 min ago', weight: 15 },
    { text: '23 min ago', weight: 10 },
    { text: '45 min ago', weight: 8 },
    { text: '1 hour ago', weight: 7 },
    { text: '2 hours ago', weight: 5 },
    { text: '3 hours ago', weight: 4 },
    { text: '5 hours ago', weight: 3 },
    { text: '8 hours ago', weight: 2 },
    { text: 'yesterday', weight: 1 },
  ];
  
  const totalWeight = options.reduce((sum, opt) => sum + opt.weight, 0);
  let random = Math.random() * totalWeight;
  
  for (const option of options) {
    random -= option.weight;
    if (random <= 0) return option.text;
  }
  return options[0].text;
};

export function PurchaseNotification() {
  const [notification, setNotification] = useState<Purchase | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const fetchRealPurchases = async () => {
      // Fetch completed payments with course info only (no profile join since no FK exists)
      const { data: payments } = await supabase
        .from('payments')
        .select('created_at, user_id, courses(title)')
        .eq('status', 'completed')
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (!payments || payments.length === 0) return [];
      
      // Fetch profiles separately for these users
      const userIds = [...new Set(payments.map(p => p.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name')
        .in('user_id', userIds);
      
      const profileMap = new Map(profiles?.map(p => [p.user_id, p.full_name]) || []);
      
      return payments.map(p => ({
        created_at: p.created_at,
        course_title: (p.courses as any)?.title,
        full_name: profileMap.get(p.user_id) || null,
      }));
    };

    const showNotification = async () => {
      const realPurchases = await fetchRealPurchases();
      
      // 30% chance for real purchase if available
      const useReal = realPurchases.length > 0 && Math.random() < 0.3;
      
      let purchase: Purchase;
      
      if (useReal) {
        const real = realPurchases[Math.floor(Math.random() * realPurchases.length)];
        const name = real.full_name || 'Someone';
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
          course: real.course_title || 'a course',
          timeAgo,
          isReal: true,
        };
      } else {
        const actionType = actionTypes[Math.floor(Math.random() * actionTypes.length)];
        const showCity = Math.random() > 0.6;
        const name = fakeNames[Math.floor(Math.random() * fakeNames.length)];
        const city = cities[Math.floor(Math.random() * cities.length)];
        
        purchase = {
          name: showCity ? `${name} from ${city}` : name,
          course: courseNames[Math.floor(Math.random() * courseNames.length)],
          timeAgo: getRandomTime(),
          isReal: false,
        };
      }
      
      setNotification(purchase);
      setIsVisible(true);
      
      setTimeout(() => setIsVisible(false), 6000);
    };

    // Initial delay
    const initialDelay = setTimeout(() => {
      showNotification();
    }, 6000);

    // Show notification every 15-35 seconds
    const interval = setInterval(() => {
      showNotification();
    }, 15000 + Math.random() * 20000);

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
                {notification.name}
              </p>
              <p className="text-sm text-primary font-semibold truncate">
                purchased {notification.course}
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
