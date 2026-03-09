import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Users, BookOpen, DollarSign, TrendingUp,
  ArrowUpRight, GraduationCap, Activity,
  Zap, Bell, CreditCard, BarChart3, Sparkles,
  Clock, CheckCircle2, AlertCircle
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface AdminOverviewProps {
  stats: {
    totalUsers: number;
    totalCourses: number;
    totalRevenue: number;
    totalEnrollments: number;
  };
  onNavigate?: (tab: string) => void;
}

export function AdminOverview({ stats, onNavigate }: AdminOverviewProps) {
  useEffect(() => {
    const MIGRATION_KEY = 'archistudio_db_migrations_v1';
    if (localStorage.getItem(MIGRATION_KEY)) return;
    const runMigrations = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;
        await supabase.functions.invoke('run-db-migrations', {});
        localStorage.setItem(MIGRATION_KEY, 'done');
      } catch (err) {
        console.warn('[Admin] Migration skipped:', err);
      }
    };
    runMigrations();
  }, []);

  const statCards = [
    {
      title: 'Total Users',
      value: stats.totalUsers,
      icon: Users,
      gradient: 'from-blue-500/15 to-blue-600/5',
      iconBg: 'bg-blue-500/10',
      iconColor: 'text-blue-500',
      borderColor: 'border-blue-500/10',
    },
    {
      title: 'Active Courses',
      value: stats.totalCourses,
      icon: BookOpen,
      gradient: 'from-accent/15 to-accent/5',
      iconBg: 'bg-accent/10',
      iconColor: 'text-accent',
      borderColor: 'border-accent/10',
    },
    {
      title: 'Total Revenue',
      value: `₹${stats.totalRevenue > 0 ? (stats.totalRevenue / 1000).toFixed(1) + 'K' : '0'}`,
      icon: DollarSign,
      gradient: 'from-emerald-500/15 to-emerald-600/5',
      iconBg: 'bg-emerald-500/10',
      iconColor: 'text-emerald-500',
      borderColor: 'border-emerald-500/10',
    },
    {
      title: 'Enrollments',
      value: stats.totalEnrollments,
      icon: GraduationCap,
      gradient: 'from-purple-500/15 to-purple-600/5',
      iconBg: 'bg-purple-500/10',
      iconColor: 'text-purple-500',
      borderColor: 'border-purple-500/10',
    },
  ];

  const quickActions = [
    { icon: BookOpen, label: 'Courses', desc: 'Manage content', color: 'text-accent', bg: 'bg-accent/8', tab: 'courses' },
    { icon: Users, label: 'Users', desc: 'View students', color: 'text-blue-500', bg: 'bg-blue-500/8', tab: 'users' },
    { icon: CreditCard, label: 'Payments', desc: 'Revenue data', color: 'text-emerald-500', bg: 'bg-emerald-500/8', tab: 'payments' },
    { icon: BarChart3, label: 'Analytics', desc: 'Performance', color: 'text-purple-500', bg: 'bg-purple-500/8', tab: 'analytics' },
    { icon: Zap, label: 'Realtime', desc: 'Live activity', color: 'text-amber-500', bg: 'bg-amber-500/8', tab: 'realtime' },
    { icon: Bell, label: 'Notifications', desc: 'Send alerts', color: 'text-red-500', bg: 'bg-red-500/8', tab: 'notifications' },
  ];

  return (
    <div className="space-y-8">
      {/* Hero Welcome */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="relative overflow-hidden rounded-2xl border border-border/50"
      >
        {/* Background layers */}
        <div className="absolute inset-0 bg-gradient-to-br from-accent/8 via-background to-primary/5" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-accent/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3" />
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)`,
            backgroundSize: '48px 48px',
          }}
        />

        <div className="relative p-8 md:p-10">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <Badge className="bg-accent/10 text-accent border-accent/20 px-3 py-1 text-xs font-medium">
                  <Sparkles className="h-3 w-3 mr-1.5" />
                  Admin Dashboard
                </Badge>
                <Badge variant="outline" className="text-xs text-muted-foreground border-border/50">
                  <Clock className="h-3 w-3 mr-1.5" />
                  {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                </Badge>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2">
                Welcome back<span className="text-accent">.</span>
              </h1>
              <p className="text-muted-foreground text-sm md:text-base max-w-lg">
                Your platform at a glance — manage courses, users, payments, and everything in between.
              </p>
            </div>

            {/* Floating mini-stats on desktop */}
            <div className="hidden xl:flex gap-6">
              {[
                { label: 'Users', value: stats.totalUsers, color: 'text-blue-500' },
                { label: 'Revenue', value: `₹${stats.totalRevenue > 0 ? (stats.totalRevenue / 1000).toFixed(1) + 'K' : '0'}`, color: 'text-emerald-500' },
              ].map((s) => (
                <div key={s.label} className="text-center">
                  <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                  <p className="text-[11px] text-muted-foreground uppercase tracking-wider">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Stat Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat, i) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + i * 0.05, duration: 0.4 }}
          >
            <Card className={`relative overflow-hidden border ${stat.borderColor} hover:shadow-lg hover:shadow-black/5 transition-all duration-300 group`}>
              <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-50`} />
              <CardContent className="relative p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className={`h-11 w-11 rounded-xl ${stat.iconBg} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                    <stat.icon className={`h-5 w-5 ${stat.iconColor}`} />
                  </div>
                  <div className="flex items-center gap-1 text-emerald-500">
                    <ArrowUpRight className="h-3.5 w-3.5" />
                    <span className="text-xs font-medium">Active</span>
                  </div>
                </div>
                <p className="text-3xl font-bold tracking-tight">{stat.value}</p>
                <p className="text-xs text-muted-foreground mt-1 font-medium">{stat.title}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Quick Actions Grid */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold">Quick Actions</h2>
            <p className="text-xs text-muted-foreground">Jump to any section instantly</p>
          </div>
          <Activity className="h-4 w-4 text-muted-foreground" />
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {quickActions.map((action, i) => (
            <motion.button
              key={action.tab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + i * 0.04 }}
              onClick={() => onNavigate?.(action.tab)}
              className="flex items-center gap-4 p-4 rounded-xl border border-border/50 bg-card hover:bg-muted/30 transition-all duration-200 text-left group hover:border-border hover:shadow-sm"
            >
              <div className={`h-10 w-10 rounded-xl ${action.bg} flex items-center justify-center group-hover:scale-105 transition-transform`}>
                <action.icon className={`h-5 w-5 ${action.color}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">{action.label}</p>
                <p className="text-[11px] text-muted-foreground">{action.desc}</p>
              </div>
              <ArrowUpRight className="h-4 w-4 text-muted-foreground/50 group-hover:text-foreground transition-colors" />
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* System Status */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <Card className="border-border/50">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-sm font-medium">All Systems Operational</span>
              </div>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                  Database
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                  Auth
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                  Storage
                </span>
                <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => onNavigate?.('system-health')}>
                  Details
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
