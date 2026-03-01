import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { SEOHead } from '@/components/seo/SEOHead';
import { AnimatedBackground } from '@/components/layout/AnimatedBackground';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { motion } from 'framer-motion';
import {
  Home, BookOpen, LayoutDashboard, ShieldCheck, FileText,
  Award, Library, Phone, ScrollText, LogIn, Play, Star,
  ArrowRight, Users, BarChart3, HelpCircle, Mail, Search,
  ChevronRight, Sparkles, Globe, Lock, Newspaper,
} from 'lucide-react';

interface LiveStats {
  courses: number;
  blogs: number;
  ebooks: number;
}

interface PageLink {
  href: string;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  badgeColor?: string;
  stat?: keyof LiveStats;
  requiresAuth?: boolean;
  requiresAdmin?: boolean;
  external?: boolean;
}

interface PageGroup {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgColor: string;
  pages: PageLink[];
}

export default function Sitemap() {
  const { user, isAdmin } = useAuth();
  const [stats, setStats] = useState<LiveStats>({ courses: 0, blogs: 0, ebooks: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      const [coursesRes, blogsRes, ebooksRes] = await Promise.all([
        supabase.from('courses').select('id', { count: 'exact', head: true }).eq('is_published', true),
        supabase.from('blog_posts').select('id', { count: 'exact', head: true }).eq('is_published', true),
        supabase.from('ebooks').select('id', { count: 'exact', head: true }).eq('is_published', true),
      ]);
      setStats({
        courses: coursesRes.count || 0,
        blogs: blogsRes.count || 0,
        ebooks: ebooksRes.count || 0,
      });
      setLoading(false);
    };
    fetchStats();
  }, []);

  const groups: PageGroup[] = [
    {
      title: 'Main',
      icon: Globe,
      color: 'text-accent',
      bgColor: 'bg-accent/10',
      pages: [
        { href: '/', label: 'Home', description: 'Platform landing page with featured courses and offers', icon: Home },
        { href: '/courses', label: 'All Studios', description: 'Browse every published studio program', icon: BookOpen, stat: 'courses', badge: loading ? '...' : `${stats.courses} courses` },
        { href: '/by', label: 'Browse by Category', description: 'Explore courses organised by software or discipline', icon: Sparkles },
        { href: '/ebooks', label: 'eBook Library', description: 'Purchase individual eBooks or the full bundle', icon: Library, stat: 'ebooks', badge: loading ? '...' : `${stats.ebooks} books` },
        { href: '/blog', label: 'Blog', description: 'Articles, tips and architecture insights', icon: Newspaper, stat: 'blogs', badge: loading ? '...' : `${stats.blogs} posts` },
        { href: '/contact', label: 'Contact', description: 'Reach out to the team directly', icon: Phone },
        { href: '/terms', label: 'Terms & Conditions', description: 'Platform usage policies and legal information', icon: ScrollText },
      ],
    },
    {
      title: 'Account',
      icon: Users,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
      pages: [
        { href: '/auth', label: 'Sign In / Register', description: 'Log in or create a new account', icon: LogIn },
        { href: '/dashboard', label: 'My Dashboard', description: 'Your enrolled courses, eBooks and progress', icon: LayoutDashboard, requiresAuth: true },
        { href: '/reset-password', label: 'Reset Password', description: 'Request a password reset link', icon: Lock },
      ],
    },
    {
      title: 'Learning',
      icon: Play,
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-500/10',
      pages: [
        { href: '/courses', label: 'Course Catalogue', description: 'Find and enroll in studio programs', icon: BookOpen, stat: 'courses' },
        { href: '/dashboard', label: 'Continue Learning', description: 'Pick up where you left off', icon: Play, requiresAuth: true },
        { href: '/dashboard?tab=certificates', label: 'My Certificates', description: 'Download your earned certificates', icon: Award, requiresAuth: true },
        { href: '/dashboard?tab=progress', label: 'Progress Analytics', description: 'Track your watch time and completions', icon: BarChart3, requiresAuth: true },
        { href: '/dashboard?tab=ebooks', label: 'My eBooks', description: 'Read purchased PDF resources', icon: Library, requiresAuth: true },
        { href: '/dashboard?tab=referrals', label: 'Referrals', description: 'Share your code and earn rewards', icon: Sparkles, requiresAuth: true },
      ],
    },
    {
      title: 'Certificates',
      icon: Award,
      color: 'text-amber-500',
      bgColor: 'bg-amber-500/10',
      pages: [
        { href: '/verify', label: 'Verify a Certificate', description: 'Check if a certificate number is authentic', icon: Search },
        { href: '/dashboard?tab=certificates', label: 'Earn Certificates', description: 'Complete a course to receive your certificate', icon: Award, requiresAuth: true },
      ],
    },
    {
      title: 'Payments',
      icon: Star,
      color: 'text-pink-500',
      bgColor: 'bg-pink-500/10',
      pages: [
        { href: '/payment-success', label: 'Payment Success', description: 'Confirmation page after successful enrollment', icon: Star },
        { href: '/payment-failed', label: 'Payment Failed', description: 'Retry or get help with a failed payment', icon: HelpCircle },
        { href: '/ebook-payment-success', label: 'eBook Payment Success', description: 'Confirmation for eBook purchases', icon: Library },
        { href: '/ebook-payment-failed', label: 'eBook Payment Failed', description: 'Retry a failed eBook purchase', icon: HelpCircle },
      ],
    },
    {
      title: 'Admin',
      icon: ShieldCheck,
      color: 'text-red-500',
      bgColor: 'bg-red-500/10',
      pages: [
        { href: '/admin', label: 'Admin Panel', description: 'Manage courses, users, payments and more', icon: ShieldCheck, requiresAdmin: true, badge: 'Admin Only', badgeColor: 'bg-destructive/10 text-destructive border-destructive/20' },
        { href: '/admin#courses', label: 'Course Management', description: 'Add, edit and publish studio programs', icon: BookOpen, requiresAdmin: true },
        { href: '/admin#users', label: 'User Management', description: 'View and manage registered students', icon: Users, requiresAdmin: true },
        { href: '/admin#payments', label: 'Payment Records', description: 'Review all transactions and revenue', icon: BarChart3, requiresAdmin: true },
        { href: '/admin#email-broadcast', label: 'Email Broadcast', description: 'Send bulk emails to enrolled users', icon: Mail, requiresAdmin: true },
        { href: '/admin#certificates', label: 'Certificate Settings', description: 'Customise certificate templates', icon: Award, requiresAdmin: true },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Site Directory - Archistudio"
        description="A complete directory of all pages and sections on the Archistudio platform."
        url="https://archistudio.shop/sitemap"
      />
      <Navbar />
      <AnimatedBackground intensity="light" />

      {/* Hero */}
      <section className="pt-28 pb-12 relative">
        <div className="container mx-auto px-4 max-w-4xl text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 text-accent text-sm font-medium border border-accent/20 mb-6">
              <Globe className="h-4 w-4" />
              Platform Directory
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">
              Every page, <span className="text-accent">in one place</span>
            </h1>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              A complete map of the Archistudio platform — from learning tools to admin controls.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Groups */}
      <section className="pb-20">
        <div className="container mx-auto px-4 max-w-5xl space-y-10">
          {groups.map((group, gi) => {
            const GroupIcon = group.icon;
            // Filter out admin-only items for non-admins
            const visiblePages = group.pages.filter(p => !p.requiresAdmin || isAdmin);
            if (visiblePages.length === 0) return null;

            return (
              <motion.div
                key={group.title}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: gi * 0.07, duration: 0.4 }}
              >
                {/* Section header */}
                <div className="flex items-center gap-3 mb-4">
                  <div className={`h-8 w-8 rounded-lg ${group.bgColor} flex items-center justify-center`}>
                    <GroupIcon className={`h-4 w-4 ${group.color}`} />
                  </div>
                  <h2 className="text-lg font-semibold">{group.title}</h2>
                  <div className="flex-1 h-px bg-border/50" />
                  <span className="text-xs text-muted-foreground">{visiblePages.length} pages</span>
                </div>

                {/* Page cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {visiblePages.map((page, pi) => {
                    const PageIcon = page.icon;
                    const isLocked = (page.requiresAuth && !user) || (page.requiresAdmin && !isAdmin);
                    return (
                      <Link
                        key={page.href + pi}
                        to={isLocked ? '/auth' : page.href}
                        className="group flex items-start gap-3 p-4 rounded-xl border border-border/60 bg-card hover:border-accent/40 hover:shadow-md hover:bg-card/90 transition-all duration-200"
                      >
                        <div className={`h-9 w-9 rounded-lg ${group.bgColor} flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-110 transition-transform`}>
                          {isLocked
                            ? <Lock className={`h-4 w-4 ${group.color}`} />
                            : <PageIcon className={`h-4 w-4 ${group.color}`} />
                          }
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-0.5">
                            <span className="font-medium text-sm group-hover:text-accent transition-colors">{page.label}</span>
                            {page.badge && (
                              <span className={`text-[10px] px-1.5 py-0.5 rounded border font-medium ${page.badgeColor || 'bg-accent/10 text-accent border-accent/20'}`}>
                                {page.badge}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-2">{page.description}</p>
                          <span className="text-[10px] text-muted-foreground/50 font-mono mt-1 block">{page.href}</span>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-accent group-hover:translate-x-0.5 transition-all shrink-0 mt-1" />
                      </Link>
                    );
                  })}
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      <Footer />
    </div>
  );
}
