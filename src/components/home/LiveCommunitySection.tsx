import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, BookOpen, Award, MessageSquare, Image, Users } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import {
  staggerContainerFast,
  fadeInUp,
} from '@/components/animations/AnimatedSection';

interface ActivityItem {
  id: string;
  action: string;
  target_type: string;
  target_title: string | null;
  created_at: string;
  user_name: string | null;
}

const ACTION_ICONS: Record<string, typeof BookOpen> = {
  enrolled: BookOpen,
  completed: Award,
  posted: MessageSquare,
  uploaded: Image,
  joined: Users,
};

export function LiveCommunitySection() {
  const [activities, setActivities] = useState<ActivityItem[]>([]);

  useEffect(() => {
    const fetchActivity = async () => {
      const { data } = await supabase
        .from('community_feed')
        .select('id, action, target_type, target_title, created_at, user_id')
        .order('created_at', { ascending: false })
        .limit(6);

      if (data && data.length > 0) {
        const userIds = [...new Set(data.map((d: any) => d.user_id))];
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, full_name')
          .in('user_id', userIds);
        
        const nameMap = new Map((profiles || []).map((p: any) => [p.user_id, p.full_name]));
        
        setActivities(data.map((d: any) => ({
          ...d,
          user_name: nameMap.get(d.user_id) || 'A student',
        })));
      }
    };

    fetchActivity();
  }, []);

  if (activities.length === 0) return null;

  return (
    <section className="section-padding relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-background via-accent/[0.02] to-background" />
      
      <div className="container-wide relative">
        <motion.div
          className="max-w-2xl mx-auto text-center mb-12"
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5 }}
        >
          <div className="section-label mb-4">Live Activity</div>
          <h2 className="font-display mb-4">
            See What's <span className="text-accent">Happening Now</span>
          </h2>
          <p className="text-body text-muted-foreground max-w-md mx-auto">
            Real-time activity from architecture students across the platform
          </p>
        </motion.div>

        <motion.div
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-3 max-w-4xl mx-auto"
          variants={staggerContainerFast}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
        >
          {activities.map((activity) => {
            const Icon = ACTION_ICONS[activity.action] || BookOpen;
            return (
              <motion.div
                key={activity.id}
                variants={fadeInUp}
                className="flex items-center gap-3 p-4 rounded-xl card-glass"
              >
                <div className="shrink-0 h-9 w-9 rounded-lg bg-accent/8 flex items-center justify-center">
                  <Icon className="h-4 w-4 text-accent" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-foreground truncate">
                    <span className="font-semibold">{activity.user_name}</span>{' '}
                    <span className="text-muted-foreground">{activity.action}</span>{' '}
                    {activity.target_title && (
                      <span className="font-medium">{activity.target_title}</span>
                    )}
                  </p>
                  <p className="text-[11px] text-muted-foreground/60 mt-0.5">
                    {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        <div className="text-center mt-10">
          <Link to="/forum">
            <Button variant="outline" className="gap-2 group">
              <Users className="h-4 w-4" />
              Join the Community
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
