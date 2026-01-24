import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  BookOpen, Package, Video, Users, UserPlus, HelpCircle, Bell, 
  CreditCard, Sparkles, Award, BarChart3, MessageSquare, Settings,
  ChevronLeft, ChevronRight, LayoutDashboard, Timer, Mail
} from 'lucide-react';
import { motion } from 'framer-motion';
import logo from '@/assets/logo.png';

interface AdminSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  collapsed: boolean;
  onCollapsedChange: (collapsed: boolean) => void;
}

const menuItems = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard, color: 'text-blue-500' },
  { id: 'courses', label: 'Courses', icon: BookOpen, color: 'text-accent' },
  { id: 'bundles', label: 'Bundles', icon: Package, color: 'text-purple-500' },
  { id: 'lessons', label: 'Lessons', icon: Video, color: 'text-green-500' },
  { id: 'users', label: 'Users', icon: Users, color: 'text-cyan-500' },
  { id: 'access', label: 'Access Control', icon: UserPlus, color: 'text-orange-500' },
  { id: 'qa', label: 'Q&A', icon: HelpCircle, color: 'text-yellow-500' },
  { id: 'notifications', label: 'Notifications', icon: Bell, color: 'text-red-500' },
  { id: 'payments', label: 'Payments', icon: CreditCard, color: 'text-emerald-500' },
  { id: 'coupons', label: 'Coupons', icon: Sparkles, color: 'text-pink-500' },
  { id: 'sales', label: 'Flash Sales', icon: Timer, color: 'text-destructive' },
  { id: 'certificates', label: 'Certificates', icon: Award, color: 'text-amber-500' },
  { id: 'email-testing', label: 'Email Testing', icon: Mail, color: 'text-violet-500' },
  { id: 'analytics', label: 'Analytics', icon: BarChart3, color: 'text-indigo-500' },
  { id: 'support', label: 'Support', icon: MessageSquare, color: 'text-teal-500' },
  { id: 'settings', label: 'Settings', icon: Settings, color: 'text-gray-500' },
];

export function AdminSidebar({ activeTab, onTabChange, collapsed, onCollapsedChange }: AdminSidebarProps) {
  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 72 : 256 }}
      className={cn(
        "fixed left-0 top-16 bottom-0 z-40 bg-card border-r flex flex-col",
        "transition-shadow duration-300"
      )}
    >
      {/* Logo */}
      <div className="p-4 border-b flex items-center gap-3">
        <div className="h-10 w-10 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0 overflow-hidden">
          <img 
            src={logo} 
            alt="Logo" 
            className="h-8 w-8 object-contain"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        </div>
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 min-w-0"
          >
            <h2 className="font-bold text-sm truncate">Admin Panel</h2>
            <p className="text-xs text-muted-foreground">Manage everything</p>
          </motion.div>
        )}
      </div>

      {/* Menu Items */}
      <ScrollArea className="flex-1 py-4">
        <nav className="space-y-1 px-3">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            
            return (
              <Button
                key={item.id}
                variant={isActive ? "secondary" : "ghost"}
                className={cn(
                  "w-full justify-start gap-3 h-10",
                  collapsed && "justify-center px-0",
                  isActive && "bg-accent/10 text-accent font-medium"
                )}
                onClick={() => onTabChange(item.id)}
              >
                <Icon className={cn("h-5 w-5 flex-shrink-0", isActive ? "text-accent" : item.color)} />
                {!collapsed && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="truncate"
                  >
                    {item.label}
                  </motion.span>
                )}
              </Button>
            );
          })}
        </nav>
      </ScrollArea>

      {/* Collapse Toggle */}
      <div className="p-3 border-t">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-center"
          onClick={() => onCollapsedChange(!collapsed)}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <>
              <ChevronLeft className="h-4 w-4 mr-2" />
              Collapse
            </>
          )}
        </Button>
      </div>
    </motion.aside>
  );
}
