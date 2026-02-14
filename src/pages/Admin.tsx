import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Navbar } from '@/components/layout/Navbar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CourseEditDialog } from '@/components/admin/CourseEditDialog';
import { LessonManagement } from '@/components/admin/LessonManagement';
import { CourseManagement } from '@/components/admin/CourseManagement';
import { CouponManagement } from '@/components/admin/CouponManagement';
import { CertificateTemplateSettings } from '@/components/admin/CertificateTemplateSettings';
import { ManualEnrollment } from '@/components/admin/ManualEnrollment';
import { CourseBundleManagement } from '@/components/admin/CourseBundleManagement';
import { QAManagement } from '@/components/admin/QAManagement';
import { NotificationManagement } from '@/components/admin/NotificationManagement';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { AdminOverview } from '@/components/admin/AdminOverview';
import { SalesManagement } from '@/components/admin/SalesManagement';
import { AmbientAudioSettings } from '@/components/admin/AmbientAudioSettings';
import { EmailTesting } from '@/components/admin/EmailTesting';
import { EmailBroadcast } from '@/components/admin/EmailBroadcast';
import { EbookPricingSettings } from '@/components/admin/EbookPricingSettings';
import { EbookManagement } from '@/components/admin/EbookManagement';
// ManualEbookAccess is now unified into ManualEnrollment
import { GiftCampaignManagement } from '@/components/admin/GiftCampaignManagement';
import { EMISettingsManagement } from '@/components/admin/EMISettingsManagement';
import { LaunchFreeCourseManagement } from '@/components/admin/LaunchFreeCourseManagement';
import { RealtimeAnalytics } from '@/components/admin/RealtimeAnalytics';
import { RoleManagement } from '@/components/admin/RoleManagement';
import { EmailLogs } from '@/components/admin/EmailLogs';
import { AutoFixLogs } from '@/components/admin/AutoFixLogs';
import { ContactMessages } from '@/components/admin/ContactMessages';
import { LuluStreamMigration } from '@/components/admin/LuluStreamMigration';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { 
  Users, BookOpen, DollarSign, Settings, 
  ArrowLeft, CreditCard, MessageSquare, Pencil, 
  Copy, Eye, EyeOff, Save, Loader2, Trash2, Award,
  Package, UserPlus, Sparkles, Bell, HelpCircle, Video, BarChart3,
  Instagram, Send
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Telegram icon component
const TelegramIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
  </svg>
);

export default function Admin() {
  const { user, loading, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalCourses: 0,
    totalRevenue: 0,
    totalEnrollments: 0,
  });

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) {
      navigate('/', { replace: true });
    }
  }, [user, loading, isAdmin, navigate]);

  useEffect(() => {
    const fetchStats = async () => {
      const [profiles, courses, payments, enrollments] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact' }),
        supabase.from('courses').select('id', { count: 'exact' }),
        supabase.from('payments').select('amount').eq('status', 'completed'),
        supabase.from('enrollments').select('id', { count: 'exact' }),
      ]);
      
      setStats({
        totalUsers: profiles.count || 0,
        totalCourses: courses.count || 0,
        totalRevenue: payments.data?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0,
        totalEnrollments: enrollments.count || 0,
      });
    };
    if (isAdmin) fetchStats();
  }, [isAdmin]);

  if (loading || !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin text-accent" />
          <span>Loading admin panel...</span>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return <AdminOverview stats={stats} onNavigate={setActiveTab} />;
      case 'realtime':
        return <RealtimeAnalytics />;
      case 'roles':
        return <RoleManagement />;
      case 'email-logs':
        return <EmailLogs />;
      case 'auto-fix-logs':
        return <AutoFixLogs />;
      case 'courses':
        return <CourseManagement />;
      case 'bundles':
        return <CourseBundleManagement />;
      case 'lessons':
        return <LessonManagement />;
      case 'users':
        return <UsersPanel />;
      case 'access':
        return <ManualEnrollment />;
      case 'gift-campaigns':
        return <GiftCampaignManagement />;
      case 'emi-settings':
        return <EMISettingsManagement />;
      case 'launch-free':
        return <LaunchFreeCourseManagement />;
      case 'qa':
        return <QAManagement />;
      case 'notifications':
        return <NotificationManagement />;
      case 'payments':
        return <PaymentsPanel />;
      case 'coupons':
        return <CouponManagement />;
      case 'sales':
        return <SalesManagement />;
      case 'certificates':
        return <CertificateTemplateSettings />;
      case 'email-testing':
        return <EmailTesting />;
      case 'email-broadcast':
        return <EmailBroadcast />;
      case 'ebooks':
        return <EbookPricingSettings />;
      case 'ebook-library':
        return <EbookManagement />;
      case 'ebook-access':
        return <ManualEnrollment />;
      case 'analytics':
        return <AnalyticsPanel />;
      case 'support':
        return <SupportPanel />;
      case 'contact-messages':
        return <ContactMessages />;
      case 'settings':
        return <SiteSettingsPanel />;
      case 'video-migration':
        return <LuluStreamMigration />;
      default:
        return <AdminOverview stats={stats} onNavigate={setActiveTab} />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <AdminSidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        collapsed={sidebarCollapsed}
        onCollapsedChange={setSidebarCollapsed}
      />
      
      <main
        className={cn(
          "pt-20 pb-8 transition-all duration-300",
          sidebarCollapsed ? "ml-[72px]" : "ml-64"
        )}
      >
        <div className="container mx-auto px-4 lg:px-8">
          {/* Breadcrumb */}
          <div className="flex items-center gap-4 mb-6">
            <Link to="/dashboard">
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Dashboard
              </Button>
            </Link>
            <span className="text-muted-foreground">/</span>
            <span className="font-medium capitalize">{activeTab}</span>
          </div>

          {/* Dynamic Content */}
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            {renderContent()}
          </motion.div>
        </div>
      </main>
    </div>
  );
}

// ==================== Panel Components ====================

function CoursesPanel() {
  const [courses, setCourses] = useState<any[]>([]);
  const [editingCourse, setEditingCourse] = useState<any | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchCourses = () => {
    supabase.from('courses').select('*').order('created_at', { ascending: false }).then(({ data }) => {
      setCourses(data || []);
    });
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const filteredCourses = courses.filter(course =>
    course.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    course.slug?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-accent" />
              Course Management
            </CardTitle>
            <CardDescription>
              {courses.length} courses total • Edit pricing, thumbnails, and course details
            </CardDescription>
          </div>
          <Input
            placeholder="Search courses..."
            className="w-64"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </CardHeader>
      <CardContent>
        {filteredCourses.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">No courses found.</p>
        ) : (
          <div className="grid gap-3">
            {filteredCourses.map(course => (
              <motion.div
                key={course.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center justify-between p-4 border rounded-xl hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  {course.thumbnail_url ? (
                    <img 
                      src={course.thumbnail_url} 
                      alt={course.title}
                      className="h-14 w-20 object-cover rounded-lg"
                      onError={(e) => (e.currentTarget.style.display = 'none')}
                    />
                  ) : (
                    <div className="h-14 w-20 bg-muted rounded-lg flex items-center justify-center">
                      <BookOpen className="h-6 w-6 text-muted-foreground" />
                    </div>
                  )}
                  <div>
                    <p className="font-medium">{course.title}</p>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                      <span className="capitalize">{course.level || 'beginner'}</span>
                      <span>•</span>
                      <span className="font-medium text-foreground">₹{course.price_inr?.toLocaleString() || 0}</span>
                      <span className="text-xs">(${course.price_usd || 0})</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant={course.is_published ? "default" : "secondary"}>
                    {course.is_published ? "Published" : "Draft"}
                  </Badge>
                  {course.is_featured && (
                    <Badge variant="outline" className="border-warning text-warning">
                      Featured
                    </Badge>
                  )}
                  <Button variant="outline" size="sm" onClick={() => {
                    setEditingCourse(course);
                    setDialogOpen(true);
                  }}>
                    <Pencil className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
        
        <CourseEditDialog
          course={editingCourse}
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          onSave={fetchCourses}
        />
      </CardContent>
    </Card>
  );
}

function UsersPanel() {
  const [users, setUsers] = useState<any[]>([]);
  const [showIds, setShowIds] = useState<Record<string, boolean>>({});
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    supabase.from('profiles').select('*').order('created_at', { ascending: false }).then(({ data }) => {
      setUsers(data || []);
    });
  }, []);

  const toggleShowId = (id: string) => {
    setShowIds(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  const filteredUsers = users.filter(user =>
    user.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-accent" />
              User Management
            </CardTitle>
            <CardDescription>{users.length} registered users</CardDescription>
          </div>
          <Input
            placeholder="Search users..."
            className="w-64"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </CardHeader>
      <CardContent>
        {filteredUsers.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">No users found.</p>
        ) : (
          <div className="space-y-3">
            {filteredUsers.map(user => (
              <div key={user.id} className="p-4 border rounded-xl space-y-3 hover:bg-muted/30 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-accent/10 flex items-center justify-center">
                      <span className="text-accent font-medium">
                        {(user.full_name || user.email || 'U').charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium">{user.full_name || 'No name'}</p>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                    </div>
                  </div>
                  <Badge>{user.role || 'student'}</Badge>
                </div>
                
                <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg text-sm">
                  <span className="text-muted-foreground">User ID:</span>
                  <code className="flex-1 font-mono text-xs">
                    {showIds[user.id] ? user.user_id : '••••••••-••••-••••-••••-••••••••••••'}
                  </code>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => toggleShowId(user.id)}>
                    {showIds[user.id] ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => copyToClipboard(user.user_id, 'User ID')}>
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>

                <div className="flex gap-4 text-xs text-muted-foreground">
                  <span className={user.email_verified ? 'text-emerald-600' : ''}>
                    Email: {user.email_verified ? '✓ Verified' : '✗ Unverified'}
                  </span>
                  <span>•</span>
                  <span>Joined: {new Date(user.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function PaymentsPanel() {
  const [payments, setPayments] = useState<any[]>([]);
  const [filter, setFilter] = useState<'all' | 'completed' | 'failed' | 'pending'>('all');
  const [stats, setStats] = useState({ total: 0, monthly: 0, successful: 0, failed: 0 });
  const [deleting, setDeleting] = useState<string | null>(null);
  const [selectedPayments, setSelectedPayments] = useState<Set<string>>(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);

  const fetchPayments = async () => {
    const { data } = await supabase
      .from('payments')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);
    
    const allPayments = data || [];
    setPayments(allPayments);
    setSelectedPayments(new Set());
    
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const completed = allPayments.filter(p => p.status === 'completed');
    const monthlyPayments = completed.filter(p => new Date(p.created_at) >= startOfMonth);
    
    setStats({
      total: completed.reduce((sum, p) => sum + (p.amount || 0), 0),
      monthly: monthlyPayments.reduce((sum, p) => sum + (p.amount || 0), 0),
      successful: completed.length,
      failed: allPayments.filter(p => p.status === 'failed').length,
    });
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  const handleDelete = async (paymentId: string) => {
    if (!confirm('Are you sure you want to delete this payment record?')) return;
    setDeleting(paymentId);
    try {
      await supabase.from('payments').delete().eq('id', paymentId);
      toast.success('Payment record deleted');
      fetchPayments();
    } catch (error) {
      toast.error('Failed to delete payment');
    } finally {
      setDeleting(null);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedPayments.size === 0) return;
    if (!confirm(`Are you sure you want to delete ${selectedPayments.size} payment records?`)) return;
    
    setBulkDeleting(true);
    try {
      const { error } = await supabase
        .from('payments')
        .delete()
        .in('id', Array.from(selectedPayments));
      
      if (error) throw error;
      toast.success(`Deleted ${selectedPayments.size} payment records`);
      fetchPayments();
    } catch (error) {
      toast.error('Failed to delete payments');
    } finally {
      setBulkDeleting(false);
    }
  };

  const toggleSelectPayment = (id: string) => {
    setSelectedPayments(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const toggleSelectAll = () => {
    if (selectedPayments.size === filteredPayments.length) {
      setSelectedPayments(new Set());
    } else {
      setSelectedPayments(new Set(filteredPayments.map(p => p.id)));
    }
  };

  const filteredPayments = payments.filter(p => {
    if (filter === 'all') return true;
    return p.status === filter;
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-accent" />
            Payment History
          </CardTitle>
          {selectedPayments.size > 0 && (
            <Button 
              variant="destructive" 
              size="sm" 
              onClick={handleBulkDelete}
              disabled={bulkDeleting}
            >
              {bulkDeleting ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Trash2 className="h-4 w-4 mr-2" />
              )}
              Delete {selectedPayments.size} Selected
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 border rounded-xl text-center bg-emerald-500/10">
            <p className="text-2xl font-bold text-emerald-600">₹{stats.total.toLocaleString()}</p>
            <p className="text-sm text-muted-foreground">Total Revenue</p>
          </div>
          <div className="p-4 border rounded-xl text-center bg-blue-500/10">
            <p className="text-2xl font-bold text-blue-600">₹{stats.monthly.toLocaleString()}</p>
            <p className="text-sm text-muted-foreground">This Month</p>
          </div>
          <div className="p-4 border rounded-xl text-center bg-success/10">
            <p className="text-2xl font-bold text-success">{stats.successful}</p>
            <p className="text-sm text-muted-foreground">Successful</p>
          </div>
          <div className="p-4 border rounded-xl text-center bg-destructive/10">
            <p className="text-2xl font-bold text-destructive">{stats.failed}</p>
            <p className="text-sm text-muted-foreground">Failed</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-2 flex-wrap">
          {(['all', 'completed', 'failed', 'pending'] as const).map(status => (
            <Button
              key={status}
              variant={filter === status ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter(status)}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </Button>
          ))}
        </div>

        {/* Payments List */}
        {filteredPayments.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">No payments found.</p>
        ) : (
          <div className="space-y-2">
            {/* Select All */}
            <div className="flex items-center gap-2 p-2 bg-muted/30 rounded-lg">
              <input
                type="checkbox"
                checked={selectedPayments.size === filteredPayments.length && filteredPayments.length > 0}
                onChange={toggleSelectAll}
                className="h-4 w-4 rounded border-input"
              />
              <span className="text-sm text-muted-foreground">
                Select All ({filteredPayments.length})
              </span>
            </div>
            
            {filteredPayments.map(payment => (
              <div key={payment.id} className="flex items-center gap-3 p-4 border rounded-xl">
                <input
                  type="checkbox"
                  checked={selectedPayments.has(payment.id)}
                  onChange={() => toggleSelectPayment(payment.id)}
                  className="h-4 w-4 rounded border-input"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <p className="font-bold text-lg">₹{payment.amount}</p>
                    <Badge variant={payment.status === 'completed' ? "default" : payment.status === 'failed' ? "destructive" : "secondary"}>
                      {payment.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {payment.payment_gateway || 'Unknown'} • {new Date(payment.created_at).toLocaleString()}
                  </p>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => handleDelete(payment.id)}
                  disabled={deleting === payment.id}
                >
                  {deleting === payment.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4 text-destructive" />
                  )}
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function AnalyticsPanel() {
  const [analytics, setAnalytics] = useState({
    pageViews: 0,
    signups: 0,
    conversions: 0,
    recentEvents: [] as any[],
  });

  useEffect(() => {
    const fetchAnalytics = async () => {
      const { data: events } = await supabase
        .from('analytics_events')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (events) {
        setAnalytics({
          pageViews: events.filter(e => e.event_type === 'page_view').length,
          signups: events.filter(e => e.event_type === 'signup').length,
          conversions: events.filter(e => e.event_type === 'purchase').length,
          recentEvents: events.slice(0, 20),
        });
      }
    };

    fetchAnalytics();
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-accent" />
          Analytics Dashboard
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-3 gap-4">
          <div className="p-6 border rounded-xl text-center">
            <p className="text-3xl font-bold">{analytics.pageViews}</p>
            <p className="text-sm text-muted-foreground">Page Views</p>
          </div>
          <div className="p-6 border rounded-xl text-center">
            <p className="text-3xl font-bold">{analytics.signups}</p>
            <p className="text-sm text-muted-foreground">Sign Ups</p>
          </div>
          <div className="p-6 border rounded-xl text-center">
            <p className="text-3xl font-bold">{analytics.conversions}</p>
            <p className="text-sm text-muted-foreground">Purchases</p>
          </div>
        </div>

        <div>
          <h3 className="font-semibold mb-3">Recent Events</h3>
          {analytics.recentEvents.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">No analytics events yet.</p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {analytics.recentEvents.map(event => (
                <div key={event.id} className="flex items-center justify-between p-3 border rounded-lg text-sm">
                  <div>
                    <Badge variant="outline">{event.event_type}</Badge>
                    <span className="ml-2 text-muted-foreground">{event.page_url}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {new Date(event.created_at).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function SupportPanel() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [response, setResponse] = useState('');
  const [sending, setSending] = useState(false);

  const fetchTickets = async () => {
    const { data } = await supabase
      .from('support_tickets')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);
    setTickets(data || []);
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const handleRespond = async () => {
    if (!selectedTicket || !response) return;
    setSending(true);
    try {
      await supabase
        .from('support_tickets')
        .update({ 
          admin_response: response, 
          status: 'resolved',
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedTicket.id);
      
      toast.success('Response sent!');
      setResponse('');
      setSelectedTicket(null);
      fetchTickets();
    } catch (error) {
      toast.error('Failed to send response');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-accent" />
            Support Tickets
          </CardTitle>
          <CardDescription>{tickets.filter(t => t.status === 'open').length} open tickets</CardDescription>
        </CardHeader>
        <CardContent>
          {tickets.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No support tickets yet.</p>
          ) : (
            <div className="space-y-2 max-h-[500px] overflow-y-auto">
              {tickets.map(ticket => (
                <div
                  key={ticket.id}
                  className={cn(
                    "p-4 border rounded-xl cursor-pointer transition-colors",
                    selectedTicket?.id === ticket.id ? "border-accent bg-accent/5" : "hover:bg-muted/50"
                  )}
                  onClick={() => setSelectedTicket(ticket)}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium">{ticket.subject}</p>
                      <p className="text-sm text-muted-foreground line-clamp-2">{ticket.message}</p>
                    </div>
                    <Badge variant={ticket.status === 'open' ? "destructive" : "default"}>
                      {ticket.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    {new Date(ticket.created_at).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Respond to Ticket</CardTitle>
        </CardHeader>
        <CardContent>
          {selectedTicket ? (
            <div className="space-y-4">
              <div className="p-4 bg-muted/50 rounded-xl">
                <p className="font-medium">{selectedTicket.subject}</p>
                <p className="text-sm text-muted-foreground mt-2">{selectedTicket.message}</p>
              </div>
              
              {selectedTicket.admin_response && (
                <div className="p-4 bg-accent/10 rounded-xl">
                  <p className="text-sm font-medium">Previous Response:</p>
                  <p className="text-sm text-muted-foreground mt-1">{selectedTicket.admin_response}</p>
                </div>
              )}

              <div className="space-y-2">
                <Label>Your Response</Label>
                <textarea
                  className="w-full min-h-[150px] p-3 border rounded-xl resize-none bg-background"
                  placeholder="Type your response..."
                  value={response}
                  onChange={(e) => setResponse(e.target.value)}
                />
              </div>

              <Button onClick={handleRespond} disabled={sending || !response} className="w-full gap-2">
                {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                Send Response
              </Button>
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-12">
              Select a ticket to respond
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function SiteSettingsPanel() {
  const [settings, setSettings] = useState({
    instagram_url: '',
    facebook_url: '',
    twitter_url: '',
    youtube_url: '',
    linkedin_url: '',
    telegram_url: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      const { data } = await supabase
        .from('site_settings')
        .select('key, value');

      if (data) {
        const settingsObj: Record<string, string> = {};
        data.forEach(item => {
          settingsObj[item.key] = item.value || '';
        });
        setSettings(prev => ({ ...prev, ...settingsObj }));
      }
    };

    fetchSettings();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      for (const [key, value] of Object.entries(settings)) {
        // Try update first, then insert if doesn't exist
        const { error: updateError } = await supabase
          .from('site_settings')
          .update({ value, updated_at: new Date().toISOString() })
          .eq('key', key);
        
        if (updateError) {
          // Insert if update failed
          await supabase
            .from('site_settings')
            .insert({ key, value, description: `${key} setting` });
        }
      }
      toast.success('Settings saved successfully');
    } catch (error) {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const settingsFields = [
    { key: 'instagram_url', label: 'Instagram URL', placeholder: 'https://instagram.com/yourusername', icon: Instagram },
    { key: 'telegram_url', label: 'Telegram URL', placeholder: 'https://t.me/yourchannel', icon: TelegramIcon },
    { key: 'facebook_url', label: 'Facebook URL', placeholder: 'https://facebook.com/yourpage' },
    { key: 'twitter_url', label: 'Twitter/X URL', placeholder: 'https://twitter.com/yourusername' },
    { key: 'youtube_url', label: 'YouTube URL', placeholder: 'https://youtube.com/@yourchannel' },
    { key: 'linkedin_url', label: 'LinkedIn URL', placeholder: 'https://linkedin.com/in/yourprofile' },
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-accent" />
            Site Settings
          </CardTitle>
          <CardDescription>Configure social media links and site settings. Students can contact you via these links.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            {settingsFields.map(field => (
              <div key={field.key} className="space-y-2">
                <Label htmlFor={field.key} className="flex items-center gap-2">
                  {field.icon && <field.icon className="h-4 w-4" />}
                  {field.label}
                </Label>
                <Input
                  id={field.key}
                  placeholder={field.placeholder}
                  value={settings[field.key as keyof typeof settings]}
                  onChange={(e) => setSettings(prev => ({ ...prev, [field.key]: e.target.value }))}
                />
              </div>
            ))}
          </div>

          <Button onClick={handleSave} disabled={saving} className="gap-2">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save Settings
          </Button>
        </CardContent>
      </Card>

      {/* Ambient Audio Settings */}
      <AmbientAudioSettings />
    </div>
  );
}
