import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { Sparkles, Briefcase, UserCheck, CheckCircle, TrendingUp, Zap } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface ActivityEvent {
  id: string;
  type: 'project_posted' | 'member_hired' | 'milestone_done' | 'new_member';
  title: string;
  user_name: string;
  timestamp: string;
}

export function StudioPulse() {
  const [events, setEvents] = useState<ActivityEvent[]>([
    { id: '1', type: 'project_posted', title: 'Luxury Villa Visualization', user_name: 'Anjali R.', timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString() },
    { id: '2', type: 'member_hired', title: 'Commercial Interior BIM', user_name: 'Karan M.', timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString() },
    { id: '3', type: 'new_member', title: 'Joined the Studio', user_name: 'Siddharth V.', timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString() },
  ]);

  useEffect(() => {
    // In a real app, subscribe to a 'marketplace_activities' table
    // For now, we simulate the 'World Class' experience with mock stream logic
    const interval = setInterval(() => {
      const types: ActivityEvent['type'][] = ['project_posted', 'member_hired', 'milestone_done', 'new_member'];
      const type = types[Math.floor(Math.random() * types.length)];
      const names = ['Priya S.', 'Rahul V.', 'Meera K.', 'Amit B.', 'Neha G.'];
      const projects = ['Residential Masterplan', 'Sustainable Cafe Design', 'Retail Facade Renders', 'Urban Landscape BIM'];
      
      const newEvent: ActivityEvent = {
        id: Math.random().toString(36).substr(2, 9),
        type,
        user_name: names[Math.floor(Math.random() * names.length)],
        title: type === 'project_posted' ? projects[Math.floor(Math.random() * projects.length)] : type === 'new_member' ? 'Joined the Studio' : 'Project Success',
        timestamp: new Date().toISOString(),
      };

      setEvents(prev => [newEvent, ...prev.slice(0, 4)]);
    }, 15000); // New event every 15s for visual life

    return () => clearInterval(interval);
  }, []);

  const getIcon = (type: ActivityEvent['type']) => {
    switch (type) {
      case 'project_posted': return <Briefcase className="h-3.5 w-3.5 text-blueprint" />;
      case 'member_hired': return <UserCheck className="h-3.5 w-3.5 text-success" />;
      case 'milestone_done': return <CheckCircle className="h-3.5 w-3.5 text-amber-500" />;
      case 'new_member': return <Zap className="h-3.5 w-3.5 text-accent" />;
      default: return <Sparkles className="h-3.5 w-3.5" />;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="relative">
            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <div className="absolute inset-0 h-2 w-2 rounded-full bg-emerald-500 animate-ping opacity-75" />
          </div>
          <h3 className="text-[11px] uppercase tracking-[0.2em] font-bold text-muted-foreground/80">Studio Pulse</h3>
        </div>
        <TrendingUp className="h-3.5 w-3.5 text-muted-foreground/40" />
      </div>

      <div className="relative">
        {/* Cinematic Vertical Line */}
        <div className="absolute left-4 top-0 bottom-0 w-px bg-gradient-to-b from-border/60 via-border/20 to-transparent" />
        
        <div className="space-y-6">
          <AnimatePresence initial={false}>
            {events.map((event, i) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, x: -10, scale: 0.95 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className="relative pl-10 group"
              >
                {/* Icon Container */}
                <div className="absolute left-0 top-0.5 h-8 w-8 rounded-full bg-background border border-border/60 shadow-sm flex items-center justify-center z-10 group-hover:border-accent/40 transition-colors">
                  {getIcon(event.type)}
                </div>

                <div>
                  <div className="flex items-baseline justify-between gap-2 mb-0.5">
                    <p className="text-sm font-semibold tracking-tight group-hover:text-accent transition-colors">
                      {event.user_name}
                    </p>
                    <span className="text-[10px] text-muted-foreground/60 tabular-nums">
                      {formatDistanceToNow(new Date(event.timestamp), { addSuffix: true })}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {event.type === 'project_posted' && `Posted a new project: `}
                    {event.type === 'member_hired' && `Was hired for: `}
                    {event.type === 'milestone_done' && `Successfully completed a milestone on: `}
                    {event.type === 'new_member' && `Verified as a professional Studio Member.`}
                    {event.type !== 'new_member' && <span className="text-foreground/80 font-medium">{event.title}</span>}
                  </p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
      
      <div className="pt-2">
        <div className="p-3 rounded-2xl bg-accent/5 border border-accent/10 flex items-center gap-3">
          <div className="h-8 w-8 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
            <TrendingUp className="h-4 w-4 text-accent" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-accent uppercase tracking-wider">Marketplace High</p>
            <p className="text-[11px] text-muted-foreground">+12% project volume this week</p>
          </div>
        </div>
      </div>
    </div>
  );
}
