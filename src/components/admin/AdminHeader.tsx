import { motion } from 'framer-motion';
import { Shield, Sparkles } from 'lucide-react';
import logo from '@/assets/logo.png';

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
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-accent/5 to-background border mb-8"
    >
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{ 
            rotate: 360,
            scale: [1, 1.1, 1],
          }}
          transition={{ 
            rotate: { duration: 20, repeat: Infinity, ease: "linear" },
            scale: { duration: 5, repeat: Infinity, ease: "easeInOut" }
          }}
          className="absolute -top-20 -right-20 w-64 h-64 bg-accent/10 rounded-full blur-3xl"
        />
        <motion.div
          animate={{ 
            rotate: -360,
            scale: [1, 1.2, 1],
          }}
          transition={{ 
            rotate: { duration: 25, repeat: Infinity, ease: "linear" },
            scale: { duration: 7, repeat: Infinity, ease: "easeInOut" }
          }}
          className="absolute -bottom-20 -left-20 w-48 h-48 bg-primary/10 rounded-full blur-3xl"
        />
        
        {/* Grid pattern */}
        <div 
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `
              linear-gradient(to right, currentColor 1px, transparent 1px),
              linear-gradient(to bottom, currentColor 1px, transparent 1px)
            `,
            backgroundSize: '40px 40px'
          }}
        />
      </div>

      <div className="relative p-8">
        <div className="flex items-center gap-6">
          {/* Logo */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
            className="relative"
          >
            <div className="h-20 w-20 rounded-2xl bg-background shadow-lg flex items-center justify-center overflow-hidden border-2 border-accent/20">
              <img 
                src={logo} 
                alt="Concrete Logic" 
                className="h-16 w-16 object-contain"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.parentElement!.innerHTML = '<div class="h-12 w-12 flex items-center justify-center"><span class="text-2xl font-bold">CL</span></div>';
                }}
              />
            </div>
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute -top-1 -right-1 h-6 w-6 bg-success rounded-full flex items-center justify-center shadow-lg"
            >
              <Shield className="h-3 w-3 text-success-foreground" />
            </motion.div>
          </motion.div>

          {/* Title & Description */}
          <div className="flex-1">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="flex items-center gap-3"
            >
              <h1 className="text-3xl font-bold">Admin Panel</h1>
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Sparkles className="h-6 w-6 text-accent" />
              </motion.div>
            </motion.div>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-muted-foreground mt-1"
            >
              Manage your platform with powerful tools
            </motion.p>
          </div>

          {/* Quick Stats */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="hidden lg:flex gap-6"
          >
            {[
              { label: 'Users', value: stats.totalUsers, color: 'text-blue-500' },
              { label: 'Revenue', value: `₹${(stats.totalRevenue / 1000).toFixed(1)}K`, color: 'text-success' },
              { label: 'Enrollments', value: stats.totalEnrollments, color: 'text-accent' },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + i * 0.1 }}
                className="text-center"
              >
                <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
