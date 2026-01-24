import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Users, BookOpen, DollarSign, TrendingUp, 
  ArrowUpRight, ArrowDownRight, GraduationCap, Activity
} from 'lucide-react';

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
  const statCards = [
    {
      title: 'Total Users',
      value: stats.totalUsers,
      icon: Users,
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-500/10',
      iconColor: 'text-blue-500',
      trend: '+12%',
      trendUp: true,
    },
    {
      title: 'Total Courses',
      value: stats.totalCourses,
      icon: BookOpen,
      color: 'from-accent to-accent/80',
      bgColor: 'bg-accent/10',
      iconColor: 'text-accent',
      trend: '+5%',
      trendUp: true,
    },
    {
      title: 'Total Revenue',
      value: `₹${(stats.totalRevenue / 1000).toFixed(1)}K`,
      icon: DollarSign,
      color: 'from-emerald-500 to-emerald-600',
      bgColor: 'bg-emerald-500/10',
      iconColor: 'text-emerald-500',
      trend: '+28%',
      trendUp: true,
    },
    {
      title: 'Enrollments',
      value: stats.totalEnrollments,
      icon: GraduationCap,
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-500/10',
      iconColor: 'text-purple-500',
      trend: '+18%',
      trendUp: true,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-accent/20 via-primary/10 to-background border p-6 md:p-8"
      >
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-20 -right-20 w-64 h-64 bg-accent/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-20 -left-20 w-48 h-48 bg-primary/20 rounded-full blur-3xl" />
        </div>
        
        <div className="relative">
          <h1 className="text-2xl md:text-3xl font-bold mb-2">Welcome back, Admin! 👋</h1>
          <p className="text-muted-foreground max-w-2xl">
            Here's what's happening with your platform today. You have full control over courses, users, payments, and more.
          </p>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="relative overflow-hidden hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.title}</p>
                    <p className="text-3xl font-bold mt-1">{stat.value}</p>
                    <div className="flex items-center gap-1 mt-2">
                      {stat.trendUp ? (
                        <ArrowUpRight className="h-4 w-4 text-emerald-500" />
                      ) : (
                        <ArrowDownRight className="h-4 w-4 text-red-500" />
                      )}
                      <span className={`text-sm ${stat.trendUp ? 'text-emerald-500' : 'text-red-500'}`}>
                        {stat.trend}
                      </span>
                      <span className="text-xs text-muted-foreground">vs last month</span>
                    </div>
                  </div>
                  <div className={`h-12 w-12 rounded-xl ${stat.bgColor} flex items-center justify-center`}>
                    <stat.icon className={`h-6 w-6 ${stat.iconColor}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-accent" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <QuickActionButton
                icon={BookOpen}
                label="Add New Course"
                description="Create a new course"
                color="bg-accent/10 text-accent"
                onClick={() => onNavigate?.('courses')}
              />
              <QuickActionButton
                icon={Users}
                label="View Users"
                description="Manage students"
                color="bg-blue-500/10 text-blue-500"
                onClick={() => onNavigate?.('users')}
              />
              <QuickActionButton
                icon={DollarSign}
                label="Revenue Report"
                description="View analytics"
                color="bg-success/10 text-success"
                onClick={() => onNavigate?.('payments')}
              />
              <QuickActionButton
                icon={TrendingUp}
                label="Course Analytics"
                description="Performance data"
                color="bg-purple-500/10 text-purple-500"
                onClick={() => onNavigate?.('analytics')}
              />
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

function QuickActionButton({ 
  icon: Icon, 
  label, 
  description, 
  color,
  onClick
}: { 
  icon: React.ComponentType<{ className?: string }>; 
  label: string; 
  description: string; 
  color: string;
  onClick?: () => void;
}) {
  return (
    <button 
      onClick={onClick}
      className="flex items-center gap-3 p-4 rounded-xl border bg-card hover:bg-muted/50 transition-colors text-left w-full cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
    >
      <div className={`h-10 w-10 rounded-lg ${color} flex items-center justify-center`}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="font-medium text-sm">{label}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
    </button>
  );
}
