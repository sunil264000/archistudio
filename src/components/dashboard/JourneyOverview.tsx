import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import {
  BookOpen, Paintbrush, FileImage, MessageSquare, Brain, Briefcase,
  ChevronRight, Sparkles, Trophy, ArrowRight, Target, AlertCircle, RefreshCw,
  Upload, Zap, ExternalLink
} from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

interface JourneyStats {
  coursesEnrolled: number;
  coursesCompleted: number;
  studioProjects: number;
  sheetsUploaded: number;
  critiquesGiven: number;
  forumAnswers: number;
  portfolioExists: boolean;
  certificatesEarned: number;
  hoursLearned: number;
}

const JOURNEY_STAGES = [
  { key: 'learn', label: 'Learn', icon: BookOpen, color: 'text-blue-500', bg: 'bg-blue-500/10', link: '/courses', cta: 'Browse Courses' },
  { key: 'apply', label: 'Apply', icon: Paintbrush, color: 'text-orange-500', bg: 'bg-orange-500/10', link: '/studio', cta: 'Open Studio' },
  { key: 'share', label: 'Share', icon: FileImage, color: 'text-green-500', bg: 'bg-green-500/10', link: '/sheets', cta: 'Upload Sheet' },
  { key: 'feedback', label: 'Get Feedback', icon: MessageSquare, color: 'text-purple-500', bg: 'bg-purple-500/10', link: '/sheets', cta: 'Give Critique' },
  { key: 'improve', label: 'Improve', icon: Brain, color: 'text-pink-500', bg: 'bg-pink-500/10', link: '/challenges', cta: 'Daily Challenge' },
  { key: 'showcase', label: 'Showcase', icon: Briefcase, color: 'text-accent', bg: 'bg-accent/10', link: '/portfolio/build', cta: 'Build Portfolio' },
];

export function JourneyOverview() {
  const { user } = useAuth();
  const [stats, setStats] = useState<JourneyStats>({
    coursesEnrolled: 0, coursesCompleted: 0, studioProjects: 0,
    sheetsUploaded: 0, critiquesGiven: 0, forumAnswers: 0,
    portfolioExists: false, certificatesEarned: 0, hoursLearned: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<{ text: string; link: string; icon: any; priority: string }[]>([]);

  useEffect(() => {
    if (!user) return;
    fetchJourneyStats();
  }, [user]);

  const fetchJourneyStats = async () => {
    if (!user) return;
    setLoading(true);
    setError(null);

    try {
      const [enrollRes, certRes, studioRes, sheetsRes, critiquesRes, forumRes, portfolioRes, progressRes] = await Promise.all([
        supabase.from('enrollments').select('id, status', { count: 'exact' }).eq('user_id', user.id).eq('status', 'active'),
        supabase.from('certificates').select('id', { count: 'exact' }).eq('user_id', user.id),
        supabase.from('studio_projects').select('id', { count: 'exact' }).eq('user_id', user.id),
        supabase.from('sheet_reviews').select('id', { count: 'exact' }).eq('user_id', user.id),
        supabase.from('sheet_critiques').select('id', { count: 'exact' }).eq('user_id', user.id),
        supabase.from('forum_answers').select('id', { count: 'exact' }).eq('user_id', user.id),
        (supabase as any).from('portfolios').select('id').eq('user_id', user.id).maybeSingle(),
        supabase.from('progress').select('watch_time_seconds').eq('user_id', user.id),
      ]);

      const totalWatchTime = (progressRes.data || []).reduce((sum: number, p: any) => sum + (p.watch_time_seconds || 0), 0);

      const newStats: JourneyStats = {
        coursesEnrolled: enrollRes.count || 0,
        coursesCompleted: certRes.count || 0,
        studioProjects: studioRes.count || 0,
        sheetsUploaded: sheetsRes.count || 0,
        critiquesGiven: critiquesRes.count || 0,
        forumAnswers: forumRes.count || 0,
        portfolioExists: !!portfolioRes.data,
        certificatesEarned: certRes.count || 0,
        hoursLearned: Math.round(totalWatchTime / 3600),
      };
      setStats(newStats);

      // Smart suggestions based on journey progress
      const sugs: { text: string; link: string; icon: any; priority: string }[] = [];
      
      // Push users along the Learn→Apply→Share→Feedback→Improve→Showcase path
      if (newStats.coursesEnrolled === 0) {
        sugs.push({ text: 'Start your journey — enroll in a course', link: '/courses', icon: BookOpen, priority: 'high' });
      } else if (newStats.studioProjects === 0) {
        sugs.push({ text: 'Apply what you learned — create a studio project', link: '/studio', icon: Paintbrush, priority: 'high' });
      } else if (newStats.sheetsUploaded === 0) {
        sugs.push({ text: 'Share your work — upload a sheet for review', link: '/sheets', icon: Upload, priority: 'high' });
      } else if (newStats.critiquesGiven < 3) {
        sugs.push({ text: 'Help others — give feedback on a sheet', link: '/sheets', icon: MessageSquare, priority: 'medium' });
      }

      if (!newStats.portfolioExists && newStats.sheetsUploaded > 0) {
        sugs.push({ text: 'Showcase your best work — build your portfolio', link: '/portfolio/build', icon: Briefcase, priority: 'medium' });
      }
      if (newStats.forumAnswers === 0) {
        sugs.push({ text: 'Join the community — answer a forum question', link: '/forum', icon: Brain, priority: 'low' });
      }
      sugs.push({ text: 'Try today\'s design challenge', link: '/challenges', icon: Zap, priority: 'low' });

      setSuggestions(sugs.slice(0, 3));
    } catch (err) {
      console.error('Failed to load journey stats:', err);
      setError('Failed to load your journey data');
      toast.error('Failed to load journey stats');
    }

    setLoading(false);
  };

  const getStageProgress = (key: string) => {
    switch (key) {
      case 'learn': return stats.coursesEnrolled > 0 ? (stats.coursesCompleted > 0 ? 100 : 50) : 0;
      case 'apply': return stats.studioProjects > 0 ? (stats.studioProjects >= 3 ? 100 : 60) : 0;
      case 'share': return stats.sheetsUploaded > 0 ? 100 : 0;
      case 'feedback': return stats.critiquesGiven > 0 ? (stats.critiquesGiven >= 5 ? 100 : 60) : 0;
      case 'improve': return stats.forumAnswers > 0 ? 70 : (stats.hoursLearned > 10 ? 50 : 0);
      case 'showcase': return stats.portfolioExists ? 100 : 0;
      default: return 0;
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-40 w-full rounded-xl" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-20 rounded-xl" />)}
        </div>
        <Skeleton className="h-32 w-full rounded-xl" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12 space-y-3">
        <AlertCircle className="h-10 w-10 text-destructive mx-auto" />
        <p className="text-sm text-destructive">{error}</p>
        <Button variant="outline" size="sm" onClick={fetchJourneyStats} className="gap-1.5">
          <RefreshCw className="h-3.5 w-3.5" /> Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Journey Path */}
      <Card className="border-accent/20 bg-gradient-to-br from-accent/5 via-background to-primary/5">
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 mb-4">
            <Target className="h-5 w-5 text-accent" />
            <h3 className="font-semibold text-foreground">Your Learning Journey</h3>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {JOURNEY_STAGES.map((stage, i) => {
              const progress = getStageProgress(stage.key);
              return (
                <motion.div
                  key={stage.key}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                  className="relative"
                >
                  <Link to={stage.link}>
                    <div className={`rounded-xl p-3 ${stage.bg} border border-border/50 text-center hover:border-accent/30 transition-all cursor-pointer group`}>
                      <stage.icon className={`h-5 w-5 mx-auto mb-1 ${stage.color}`} />
                      <p className="text-xs font-medium text-foreground">{stage.label}</p>
                      <Progress value={progress} className="h-1 mt-2" />
                      <span className="text-[10px] text-muted-foreground">{progress}%</span>
                      {progress === 0 && (
                        <p className="text-[9px] text-accent opacity-0 group-hover:opacity-100 transition-opacity mt-0.5">{stage.cta} →</p>
                      )}
                    </div>
                  </Link>
                  {i < JOURNEY_STAGES.length - 1 && (
                    <ChevronRight className="hidden lg:block absolute -right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40 z-10" />
                  )}
                </motion.div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Hours Learned', value: stats.hoursLearned, icon: BookOpen },
          { label: 'Projects', value: stats.studioProjects, icon: Paintbrush },
          { label: 'Sheets Shared', value: stats.sheetsUploaded, icon: FileImage },
          { label: 'Certificates', value: stats.certificatesEarned, icon: Trophy },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 + i * 0.05 }}
          >
            <Card>
              <CardContent className="py-4 px-4 flex items-center gap-3">
                <stat.icon className="h-5 w-5 text-accent shrink-0" />
                <div>
                  <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Suggested Next Actions — contextual nudges */}
      {suggestions.length > 0 && (
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="h-4 w-4 text-accent" />
              <h4 className="text-sm font-semibold text-foreground">What to Do Next</h4>
            </div>
            <div className="space-y-2">
              {suggestions.map((sug, i) => (
                <Link key={i} to={sug.link}>
                  <div className={`flex items-center justify-between p-3 rounded-lg border transition-colors group ${
                    sug.priority === 'high' 
                      ? 'border-accent/30 bg-accent/5 hover:bg-accent/10' 
                      : 'border-border/50 hover:bg-accent/5'
                  }`}>
                    <div className="flex items-center gap-3">
                      <sug.icon className={`h-4 w-4 ${sug.priority === 'high' ? 'text-accent' : 'text-muted-foreground'}`} />
                      <span className="text-sm text-foreground">{sug.text}</span>
                      {sug.priority === 'high' && (
                        <Badge variant="outline" className="text-[9px] border-accent/30 text-accent">Recommended</Badge>
                      )}
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-accent transition-colors" />
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick links to cross-linked features */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Studio', link: '/studio', icon: Paintbrush },
          { label: 'Sheet Reviews', link: '/sheets', icon: FileImage },
          { label: 'Challenges', link: '/challenges', icon: Zap },
          { label: 'Forum', link: '/forum', icon: MessageSquare },
        ].map((item) => (
          <Link key={item.label} to={item.link}>
            <Card className="hover:border-accent/30 transition-all cursor-pointer">
              <CardContent className="py-3 px-4 flex items-center gap-2">
                <item.icon className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-foreground">{item.label}</span>
                <ExternalLink className="h-3 w-3 text-muted-foreground/50 ml-auto" />
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
