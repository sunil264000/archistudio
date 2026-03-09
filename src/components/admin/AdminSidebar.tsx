import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  BookOpen, Package, Video, Users, UserPlus, HelpCircle, Bell,
  CreditCard, Sparkles, Award, BarChart3, MessageSquare, Settings,
  ChevronLeft, ChevronRight, LayoutDashboard, Timer, Mail, Send, Library, FileText, KeyRound,
  Gift, Wallet, Rocket, Zap, Shield, History, Wrench, Inbox, Cloud, Monitor, FolderSync, Download, TrendingUp,
  HeartPulse, Activity, Brain, ShieldAlert
} from 'lucide-react';
import { motion } from 'framer-motion';
import logo from '@/assets/logo.png';

interface AdminSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  collapsed: boolean;
  onCollapsedChange: (collapsed: boolean) => void;
}

interface MenuItem {
  id: string;
  label: string;
  icon: any;
  color: string;
}

interface MenuGroup {
  label: string;
  items: MenuItem[];
}

const menuGroups: MenuGroup[] = [
  {
    label: 'Dashboard',
    items: [
      { id: 'overview', label: 'Overview', icon: LayoutDashboard, color: 'text-blue-500' },
      { id: 'realtime', label: 'Realtime', icon: Zap, color: 'text-accent' },
      { id: 'analytics', label: 'Analytics', icon: BarChart3, color: 'text-indigo-500' },
      { id: 'engagement', label: 'Engagement', icon: TrendingUp, color: 'text-emerald-500' },
      { id: 'auto-fix-logs', label: 'Auto-Fix Logs', icon: Wrench, color: 'text-teal-500' },
      { id: 'system-health', label: 'System Health', icon: HeartPulse, color: 'text-rose-500' },
      { id: 'activity-feed', label: 'Activity Feed', icon: Activity, color: 'text-sky-500' },
    ],
  },
  {
    label: 'Content',
    items: [
      { id: 'courses', label: 'Courses', icon: BookOpen, color: 'text-accent' },
      { id: 'bundles', label: 'Bundles', icon: Package, color: 'text-purple-500' },
      { id: 'lessons', label: 'Lessons', icon: Video, color: 'text-green-500' },
      { id: 'ebook-library', label: 'eBook Library', icon: FileText, color: 'text-cyan-500' },
      { id: 'learning-paths', label: 'Learning Paths', icon: KeyRound, color: 'text-indigo-500' },
    ],
  },
  {
    label: 'Users & Access',
    items: [
      { id: 'users', label: 'Users', icon: Users, color: 'text-cyan-500' },
      { id: 'onboarding', label: 'Onboarding', icon: Sparkles, color: 'text-pink-500' },
      { id: 'roles', label: 'Roles', icon: Shield, color: 'text-red-500' },
      { id: 'sessions', label: 'Sessions', icon: Monitor, color: 'text-violet-500' },
      { id: 'access', label: 'Access Control', icon: UserPlus, color: 'text-orange-500' },
    ],
  },
  {
    label: 'Revenue',
    items: [
      { id: 'payments', label: 'Payments', icon: CreditCard, color: 'text-emerald-500' },
      { id: 'coupons', label: 'Coupons', icon: Sparkles, color: 'text-pink-500' },
      { id: 'sales', label: 'Flash Sales', icon: Timer, color: 'text-destructive' },
      { id: 'auto-pricing', label: 'Auto-Pricing', icon: TrendingUp, color: 'text-violet-500' },
      { id: 'emi-settings', label: 'EMI Settings', icon: Wallet, color: 'text-amber-500' },
      { id: 'ebooks', label: 'eBooks Pricing', icon: Library, color: 'text-sky-500' },
      { id: 'download-requests', label: 'Download Requests', icon: Download, color: 'text-cyan-500' },
    ],
  },
  {
    label: 'Marketing',
    items: [
      { id: 'gift-campaigns', label: 'Gift Campaigns', icon: Gift, color: 'text-pink-500' },
      { id: 'launch-free', label: 'Launch Free', icon: Rocket, color: 'text-cyan-400' },
      { id: 'notifications', label: 'Notifications', icon: Bell, color: 'text-red-500' },
      { id: 'email-broadcast', label: 'Email Broadcast', icon: Send, color: 'text-rose-500' },
    ],
  },
  {
    label: 'Communication',
    items: [
      { id: 'qa', label: 'Q&A', icon: HelpCircle, color: 'text-yellow-500' },
      { id: 'support', label: 'Support', icon: MessageSquare, color: 'text-teal-500' },
      { id: 'email-testing', label: 'Email Testing', icon: Mail, color: 'text-violet-500' },
      { id: 'email-logs', label: 'Email Logs', icon: History, color: 'text-violet-500' },
      { id: 'contact-messages', label: 'Messages', icon: Inbox, color: 'text-emerald-500' },
    ],
  },
  {
    label: 'System',
    items: [
      { id: 'certificates', label: 'Certificates', icon: Award, color: 'text-amber-500' },
      { id: 'moderation', label: 'Moderation', icon: ShieldAlert, color: 'text-red-500' },
      { id: 'ai-mentor', label: 'AI Mentor', icon: Brain, color: 'text-purple-500' },
      { id: 'video-migration', label: 'Video Migration', icon: Cloud, color: 'text-sky-500' },
      { id: 'resource-scanner', label: 'Resource Scanner', icon: FolderSync, color: 'text-emerald-500' },
      { id: 'deploy', label: 'Deploy Functions', icon: Rocket, color: 'text-primary' },
      { id: 'settings', label: 'Settings', icon: Settings, color: 'text-gray-500' },
    ],
  },
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
            onError={(e) => { e.currentTarget.style.display = 'none'; }}
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

      {/* Menu Items - Grouped */}
      <ScrollArea className="flex-1 py-2">
        <nav className="px-3">
          {menuGroups.map((group, gi) => (
            <div key={group.label} className={gi > 0 ? 'mt-4' : ''}>
              {!collapsed && (
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60 px-3 mb-1">
                  {group.label}
                </p>
              )}
              {collapsed && gi > 0 && (
                <div className="mx-3 my-2 border-t border-border/40" />
              )}
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;

                  return (
                    <Button
                      key={item.id}
                      variant={isActive ? "secondary" : "ghost"}
                      className={cn(
                        "w-full justify-start gap-3 h-9 text-sm",
                        collapsed && "justify-center px-0",
                        isActive && "bg-accent/10 text-accent font-medium"
                      )}
                      onClick={() => onTabChange(item.id)}
                    >
                      <Icon className={cn("h-4 w-4 flex-shrink-0", isActive ? "text-accent" : item.color)} />
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
              </div>
            </div>
          ))}
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
