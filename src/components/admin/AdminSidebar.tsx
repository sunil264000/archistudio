import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  BookOpen, Package, Video, Users, UserPlus, HelpCircle, Bell,
  CreditCard, Sparkles, Award, BarChart3, MessageSquare, Settings,
  ChevronLeft, ChevronRight, LayoutDashboard, Timer, Mail, Send, Library, FileText, KeyRound,
  Gift, Wallet, Rocket, Zap, Shield, History, Wrench, Inbox, Cloud, Monitor, FolderSync, Download, TrendingUp,
  HeartPulse, Activity, Brain, ShieldAlert, ListTodo, Flag, Gauge
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

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
      { id: 'realtime', label: 'Realtime', icon: Zap, color: 'text-amber-500' },
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
      { id: 'course-resource-requests', label: 'Resource Requests', icon: Inbox, color: 'text-rose-500' },
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
    label: 'Studio Hub',
    items: [
      { id: 'studio-hub', label: 'Escrow & Payouts', icon: Wallet, color: 'text-emerald-500' },
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
      { id: 'job-queue', label: 'Job Queue', icon: ListTodo, color: 'text-cyan-500' },
      { id: 'feature-flags', label: 'Feature Flags', icon: Flag, color: 'text-orange-500' },
      { id: 'system-monitor', label: 'Monitoring', icon: Gauge, color: 'text-pink-500' },
      { id: 'video-migration', label: 'Video Migration', icon: Cloud, color: 'text-sky-500' },
      { id: 'resource-scanner', label: 'Resource Scanner', icon: FolderSync, color: 'text-emerald-500' },
      { id: 'deploy', label: 'Deploy Functions', icon: Rocket, color: 'text-primary' },
      { id: 'settings', label: 'Settings', icon: Settings, color: 'text-muted-foreground' },
    ],
  },
];

export function AdminSidebar({ activeTab, onTabChange, collapsed, onCollapsedChange }: AdminSidebarProps) {
  return (
    <TooltipProvider delayDuration={0}>
      <motion.aside
        initial={false}
        animate={{ width: collapsed ? 64 : 260 }}
        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
        className={cn(
          "fixed left-0 top-16 bottom-0 z-40 bg-card/95 backdrop-blur-sm border-r border-border/50 flex flex-col",
        )}
      >
        {/* Brand */}
        <div className="p-3 border-b border-border/40 flex items-center gap-3 shrink-0">
          <div className={cn(
            "h-9 w-9 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0",
            "border border-accent/10"
          )}>
            <LayoutDashboard className="h-4 w-4 text-accent" />
          </div>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex-1 min-w-0"
            >
              <h2 className="font-semibold text-sm truncate">Command Center</h2>
              <p className="text-[10px] text-muted-foreground/70">Admin Panel</p>
            </motion.div>
          )}
        </div>

        {/* Menu */}
        <ScrollArea className="flex-1 py-2">
          <nav className={cn("px-2", collapsed && "px-1.5")}>
            {menuGroups.map((group, gi) => (
              <div key={group.label} className={gi > 0 ? 'mt-3' : ''}>
                {!collapsed && (
                  <p className="text-[9px] font-semibold uppercase tracking-[0.15em] text-muted-foreground/50 px-3 mb-1.5 mt-1">
                    {group.label}
                  </p>
                )}
                {collapsed && gi > 0 && (
                  <div className="mx-2 my-2 border-t border-border/30" />
                )}
                <div className="space-y-0.5">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;

                    const btn = (
                      <button
                        key={item.id}
                        className={cn(
                          "w-full flex items-center gap-2.5 rounded-lg text-sm transition-all duration-200",
                          collapsed ? "justify-center h-9 w-9 mx-auto" : "h-8 px-3",
                          isActive
                            ? "bg-accent/12 text-accent font-medium shadow-sm shadow-accent/5"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                        )}
                        onClick={() => onTabChange(item.id)}
                      >
                        <Icon className={cn(
                          "h-4 w-4 flex-shrink-0 transition-colors",
                          isActive ? "text-accent" : item.color
                        )} />
                        {!collapsed && (
                          <span className="truncate text-[13px]">{item.label}</span>
                        )}
                        {isActive && !collapsed && (
                          <div className="ml-auto h-1.5 w-1.5 rounded-full bg-accent" />
                        )}
                      </button>
                    );

                    if (collapsed) {
                      return (
                        <Tooltip key={item.id}>
                          <TooltipTrigger asChild>{btn}</TooltipTrigger>
                          <TooltipContent side="right" className="text-xs">
                            {item.label}
                          </TooltipContent>
                        </Tooltip>
                      );
                    }

                    return btn;
                  })}
                </div>
              </div>
            ))}
          </nav>
        </ScrollArea>

        {/* Collapse Toggle */}
        <div className="p-2 border-t border-border/40 shrink-0">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-center h-8 text-muted-foreground hover:text-foreground"
            onClick={() => onCollapsedChange(!collapsed)}
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <>
                <ChevronLeft className="h-4 w-4 mr-2" />
                <span className="text-xs">Collapse</span>
              </>
            )}
          </Button>
        </div>
      </motion.aside>
    </TooltipProvider>
  );
}
