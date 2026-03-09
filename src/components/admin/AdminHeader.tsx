import { motion } from 'framer-motion';
import { Shield, Sparkles, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface AdminHeaderProps {
  stats: {
    totalUsers: number;
    totalCourses: number;
    totalRevenue: number;
    totalEnrollments: number;
  };
}

export function AdminHeader({ stats }: AdminHeaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-2xl border border-border/50 mb-8"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-accent/6 via-background to-primary/4" />
      <div className="absolute top-0 right-0 w-80 h-80 bg-accent/5 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/3" />
      <div
        className="absolute inset-0 opacity-[0.015]"
        style={{
          backgroundImage: `linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)`,
          backgroundSize: '40px 40px'
        }}
      />

      <div className="relative p-7">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-5">
            <div className="relative">
              <div className="h-14 w-14 rounded-2xl bg-accent/8 border border-accent/15 flex items-center justify-center">
                <Shield className="h-6 w-6 text-accent" />
              </div>
              <div className="absolute -top-0.5 -right-0.5 h-4 w-4 bg-emerald-500 rounded-full flex items-center justify-center ring-2 ring-card">
                <Sparkles className="h-2 w-2 text-white" />
              </div>
            </div>

            <div>
              <h1 className="text-2xl font-bold tracking-tight">Admin Panel</h1>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className="text-[10px] h-5 border-border/50 text-muted-foreground">
                  <Clock className="h-2.5 w-2.5 mr-1" />
                  {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </Badge>
              </div>
            </div>
          </div>

          <div className="hidden lg:flex gap-8">
            {[
              { label: 'Users', value: stats.totalUsers, color: 'text-blue-500' },
              { label: 'Revenue', value: `₹${stats.totalRevenue > 0 ? (stats.totalRevenue / 1000).toFixed(1) + 'K' : '0'}`, color: 'text-emerald-500' },
              { label: 'Enrolled', value: stats.totalEnrollments, color: 'text-accent' },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <p className={`text-xl font-bold ${stat.color}`}>{stat.value}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
