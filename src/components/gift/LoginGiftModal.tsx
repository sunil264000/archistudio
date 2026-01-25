import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Gift, Sparkles, Clock, BookOpen } from 'lucide-react';
import { format, addHours } from 'date-fns';

interface GiftClaim {
  campaign_id: string;
  campaign_name: string;
  courses: { id: string; title: string; slug: string }[];
  message: string;
  cta_text: string;
  expires_at: string | null;
}

interface LoginGiftModalProps {
  userId: string;
  onClose: () => void;
}

export function LoginGiftModal({ userId, onClose }: LoginGiftModalProps) {
  const [giftClaim, setGiftClaim] = useState<GiftClaim | null>(null);
  const [loading, setLoading] = useState(true);
  const [canDismiss, setCanDismiss] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    checkAndClaimGift();
    // Allow dismiss after 2 seconds
    const timer = setTimeout(() => setCanDismiss(true), 2000);
    return () => clearTimeout(timer);
  }, [userId]);

  const checkAndClaimGift = async () => {
    try {
      // 1. Find active campaigns
      const now = new Date().toISOString();
      const { data: campaigns, error: campError } = await supabase
        .from('login_gift_campaigns')
        .select('*')
        .eq('is_active', true)
        .lte('start_at', now)
        .gte('end_at', now);

      if (campError || !campaigns || campaigns.length === 0) {
        setLoading(false);
        onClose();
        return;
      }

      // 2. Check if user already claimed any of these campaigns
      const { data: existingClaims } = await supabase
        .from('login_gift_claims')
        .select('campaign_id')
        .eq('user_id', userId)
        .in('campaign_id', campaigns.map(c => c.id));

      const claimedIds = new Set(existingClaims?.map(c => c.campaign_id) || []);
      const unclaimedCampaigns = campaigns.filter(c => !claimedIds.has(c.id));

      if (unclaimedCampaigns.length === 0) {
        setLoading(false);
        onClose();
        return;
      }

      // 3. Get user profile to check eligibility
      const { data: profile } = await supabase
        .from('profiles')
        .select('created_at')
        .eq('user_id', userId)
        .single();

      // 4. Find eligible campaign
      let eligibleCampaign = null;
      for (const campaign of unclaimedCampaigns) {
        const isEligible = await checkEligibility(campaign, profile?.created_at);
        if (isEligible) {
          eligibleCampaign = campaign;
          break;
        }
      }

      if (!eligibleCampaign) {
        setLoading(false);
        onClose();
        return;
      }

      // 5. Get courses for this campaign
      const { data: campaignCourses } = await supabase
        .from('login_gift_campaign_courses')
        .select(`
          course_id,
          course:courses(id, title, slug)
        `)
        .eq('campaign_id', eligibleCampaign.id);

      const courses = campaignCourses?.map(cc => cc.course).filter(Boolean) || [];
      
      if (courses.length === 0) {
        setLoading(false);
        onClose();
        return;
      }

      // 6. Select random message
      const messages = Array.isArray(eligibleCampaign.custom_messages) 
        ? eligibleCampaign.custom_messages 
        : [];
      const randomMessage = messages.length > 0 
        ? messages[Math.floor(Math.random() * messages.length)]
        : 'Congratulations! You have been granted free access.';

      // 7. Calculate expiry
      let expiresAt: string | null = null;
      if (eligibleCampaign.access_duration_hours) {
        expiresAt = addHours(new Date(), eligibleCampaign.access_duration_hours).toISOString();
      } else {
        expiresAt = eligibleCampaign.end_at;
      }

      setGiftClaim({
        campaign_id: eligibleCampaign.id,
        campaign_name: eligibleCampaign.name,
        courses: courses as any[],
        message: randomMessage,
        cta_text: eligibleCampaign.cta_text || 'Start Learning',
        expires_at: expiresAt,
      });

      setLoading(false);
    } catch (error) {
      console.error('Error checking gift campaign:', error);
      setLoading(false);
      onClose();
    }
  };

  const checkEligibility = async (campaign: any, userCreatedAt: string | undefined): Promise<boolean> => {
    const eligibility = campaign.eligible_users;

    if (eligibility === 'all') return true;

    if (eligibility === 'new_only') {
      if (!userCreatedAt) return false;
      // User is "new" if created within last 7 days
      const createdDate = new Date(userCreatedAt);
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      return createdDate >= sevenDaysAgo;
    }

    if (eligibility === 'random_percent') {
      const percent = campaign.random_percent || 50;
      return Math.random() * 100 < percent;
    }

    return false;
  };

  const handleClaimGift = async () => {
    if (!giftClaim) return;

    setClaiming(true);
    try {
      // 1. Create claim record
      const { error: claimError } = await supabase
        .from('login_gift_claims')
        .insert({
          campaign_id: giftClaim.campaign_id,
          user_id: userId,
          expires_at: giftClaim.expires_at,
          shown_message: giftClaim.message,
        });

      if (claimError) throw claimError;

      // 2. Create enrollments for each course
      for (const course of giftClaim.courses) {
        // Check if enrollment already exists
        const { data: existing } = await supabase
          .from('enrollments')
          .select('id')
          .eq('user_id', userId)
          .eq('course_id', course.id)
          .single();

        if (!existing) {
          await supabase.from('enrollments').insert({
            user_id: userId,
            course_id: course.id,
            status: 'active',
            is_manual: true,
            granted_at: new Date().toISOString(),
            expires_at: giftClaim.expires_at,
          });
        }
      }

      // 3. Navigate to first course
      const firstCourse = giftClaim.courses[0];
      onClose();
      navigate(`/course/${firstCourse.slug}/learn`);
    } catch (error) {
      console.error('Error claiming gift:', error);
    } finally {
      setClaiming(false);
    }
  };

  if (loading || !giftClaim) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm"
        onClick={canDismiss ? onClose : undefined}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: 'spring', duration: 0.5 }}
          className="relative max-w-md w-full mx-4 bg-card border rounded-2xl p-8 shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Decorative Elements */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring' }}
            className="absolute -top-6 left-1/2 -translate-x-1/2"
          >
            <div className="relative">
              <div className="h-16 w-16 rounded-full bg-gradient-to-br from-accent to-accent/60 flex items-center justify-center">
                <Gift className="h-8 w-8 text-white" />
              </div>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                className="absolute -inset-2"
              >
                <Sparkles className="h-5 w-5 text-accent absolute -top-1 -right-1" />
                <Sparkles className="h-4 w-4 text-amber-500 absolute -bottom-1 -left-1" />
              </motion.div>
            </div>
          </motion.div>

          {/* Content */}
          <div className="text-center pt-8 space-y-4">
            <motion.h2
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-2xl font-bold"
            >
              Studio Access Granted
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-muted-foreground"
            >
              {giftClaim.message}
            </motion.p>

            {/* Courses */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-muted/50 rounded-lg p-4 space-y-2"
            >
              {giftClaim.courses.map((course) => (
                <div key={course.id} className="flex items-center gap-2 text-left">
                  <BookOpen className="h-4 w-4 text-accent flex-shrink-0" />
                  <span className="text-sm font-medium truncate">{course.title}</span>
                </div>
              ))}
            </motion.div>

            {/* Expiry */}
            {giftClaim.expires_at && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="flex items-center justify-center gap-2 text-sm text-muted-foreground"
              >
                <Clock className="h-4 w-4" />
                <span>
                  Access until {format(new Date(giftClaim.expires_at), 'MMM d, yyyy h:mm a')}
                </span>
              </motion.div>
            )}

            {/* CTA */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
            >
              <Button
                size="lg"
                className="w-full mt-4 gap-2"
                onClick={handleClaimGift}
                disabled={claiming}
              >
                {claiming ? 'Activating...' : giftClaim.cta_text}
              </Button>
            </motion.div>

            {canDismiss && (
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                onClick={onClose}
              >
                Maybe later
              </motion.button>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
