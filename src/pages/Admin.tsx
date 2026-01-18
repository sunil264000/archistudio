import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Navbar } from '@/components/layout/Navbar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CourseEditDialog } from '@/components/admin/CourseEditDialog';
import { LessonManagement } from '@/components/admin/LessonManagement';
import { toast } from 'sonner';
import { 
  Users, BookOpen, DollarSign, Settings, 
  ArrowLeft, TrendingUp, CreditCard, MessageSquare, Pencil, 
  BarChart3, Copy, Eye, EyeOff, Instagram, Save, Loader2, Video
} from 'lucide-react';

export default function Admin() {
  const { user, loading, isAdmin } = useAuth();
  const navigate = useNavigate();
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
        <div className="animate-pulse">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="py-8">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-4 mb-8">
            <Link to="/dashboard">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold">Admin Panel</h1>
              <p className="text-muted-foreground">Manage your platform</p>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid md:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Users</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold flex items-center gap-2">
                  <Users className="h-5 w-5 text-blue-500" />
                  {stats.totalUsers}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Courses</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-green-500" />
                  {stats.totalCourses}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-yellow-500" />
                  ₹{stats.totalRevenue.toLocaleString()}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Enrollments</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-purple-500" />
                  {stats.totalEnrollments}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Management Tabs */}
          <Tabs defaultValue="courses" className="space-y-4">
            <TabsList className="grid w-full grid-cols-7">
              <TabsTrigger value="courses">Courses</TabsTrigger>
              <TabsTrigger value="lessons">Lessons</TabsTrigger>
              <TabsTrigger value="users">Users</TabsTrigger>
              <TabsTrigger value="payments">Payments</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
              <TabsTrigger value="support">Support</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>

            <TabsContent value="courses">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5" />
                    Course Management
                  </CardTitle>
                  <CardDescription>Manage all courses on the platform</CardDescription>
                </CardHeader>
                <CardContent>
                  <CoursesTable />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="lessons">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Video className="h-5 w-5" />
                    Lesson & Video Management
                  </CardTitle>
                  <CardDescription>Add modules, lessons, and upload videos</CardDescription>
                </CardHeader>
                <CardContent>
                  <LessonManagement />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="users">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    User Management
                  </CardTitle>
                  <CardDescription>View user details including IDs and credentials</CardDescription>
                </CardHeader>
                <CardContent>
                  <UsersTable />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="payments">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Payment History
                  </CardTitle>
                  <CardDescription>View all transactions</CardDescription>
                </CardHeader>
                <CardContent>
                  <PaymentsTable />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="analytics">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Analytics Dashboard
                  </CardTitle>
                  <CardDescription>View platform analytics and insights</CardDescription>
                </CardHeader>
                <CardContent>
                  <AnalyticsPanel />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="support">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" />
                    Support Tickets
                  </CardTitle>
                  <CardDescription>Manage support requests</CardDescription>
                </CardHeader>
                <CardContent>
                  <SupportTable />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="settings">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Site Settings
                  </CardTitle>
                  <CardDescription>Configure social links and site settings</CardDescription>
                </CardHeader>
                <CardContent>
                  <SiteSettingsPanel />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}

function CoursesTable() {
  const [courses, setCourses] = useState<any[]>([]);
  const [editingCourse, setEditingCourse] = useState<any | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const fetchCourses = () => {
    supabase.from('courses').select('*').order('created_at', { ascending: false }).then(({ data }) => {
      setCourses(data || []);
    });
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const handleEdit = (course: any) => {
    setEditingCourse(course);
    setDialogOpen(true);
  };

  return (
    <>
      {courses.length === 0 ? (
        <p className="text-muted-foreground text-center py-8">No courses in database yet.</p>
      ) : (
        <div className="space-y-2">
          {courses.map(course => (
            <div key={course.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-4">
                {course.thumbnail_url && (
                  <img 
                    src={course.thumbnail_url} 
                    alt={course.title}
                    className="h-12 w-16 object-cover rounded"
                    onError={(e) => (e.currentTarget.style.display = 'none')}
                  />
                )}
                <div>
                  <p className="font-medium">{course.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {course.level} • ₹{course.price_inr || 0}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={course.is_published ? "default" : "secondary"}>
                  {course.is_published ? "Published" : "Draft"}
                </Badge>
                <Button variant="ghost" size="icon" onClick={() => handleEdit(course)}>
                  <Pencil className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
      
      <CourseEditDialog
        course={editingCourse}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSave={fetchCourses}
      />
    </>
  );
}

function UsersTable() {
  const [users, setUsers] = useState<any[]>([]);
  const [showIds, setShowIds] = useState<Record<string, boolean>>({});

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

  return users.length === 0 ? (
    <p className="text-muted-foreground text-center py-8">No users registered yet.</p>
  ) : (
    <div className="space-y-3">
      {users.map(user => (
        <div key={user.id} className="p-4 border rounded-lg space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">{user.full_name || 'No name'}</p>
              <p className="text-sm text-muted-foreground">{user.email}</p>
              {user.phone && (
                <p className="text-sm text-muted-foreground">Phone: {user.phone}</p>
              )}
            </div>
            <Badge>{user.role || 'student'}</Badge>
          </div>
          
          {/* User ID Section */}
          <div className="flex items-center gap-2 p-2 bg-muted/50 rounded text-sm">
            <span className="text-muted-foreground">User ID:</span>
            <code className="flex-1 font-mono text-xs">
              {showIds[user.id] ? user.user_id : '••••••••-••••-••••-••••-••••••••••••'}
            </code>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-6 w-6"
              onClick={() => toggleShowId(user.id)}
            >
              {showIds[user.id] ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-6 w-6"
              onClick={() => copyToClipboard(user.user_id, 'User ID')}
            >
              <Copy className="h-3 w-3" />
            </Button>
          </div>

          <div className="flex gap-4 text-xs text-muted-foreground">
            <span>Email verified: {user.email_verified ? '✓' : '✗'}</span>
            <span>Phone verified: {user.phone_verified ? '✓' : '✗'}</span>
            <span>Joined: {new Date(user.created_at).toLocaleDateString()}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function PaymentsTable() {
  const [payments, setPayments] = useState<any[]>([]);
  useEffect(() => {
    supabase.from('payments').select('*').order('created_at', { ascending: false }).limit(50).then(({ data }) => {
      setPayments(data || []);
    });
  }, []);

  return payments.length === 0 ? (
    <p className="text-muted-foreground text-center py-8">No payments recorded yet.</p>
  ) : (
    <div className="space-y-2">
      {payments.map(payment => (
        <div key={payment.id} className="flex items-center justify-between p-3 border rounded-lg">
          <div>
            <p className="font-medium">₹{payment.amount}</p>
            <p className="text-sm text-muted-foreground">
              {payment.payment_gateway} • {new Date(payment.created_at).toLocaleDateString()}
            </p>
          </div>
          <Badge variant={payment.status === 'completed' ? "default" : payment.status === 'failed' ? "destructive" : "secondary"}>
            {payment.status}
          </Badge>
        </div>
      ))}
    </div>
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
        const pageViews = events.filter(e => e.event_type === 'page_view').length;
        const signups = events.filter(e => e.event_type === 'signup').length;
        const conversions = events.filter(e => e.event_type === 'purchase').length;

        setAnalytics({
          pageViews,
          signups,
          conversions,
          recentEvents: events.slice(0, 20),
        });
      }
    };

    fetchAnalytics();
  }, []);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <div className="p-4 border rounded-lg text-center">
          <p className="text-2xl font-bold">{analytics.pageViews}</p>
          <p className="text-sm text-muted-foreground">Page Views</p>
        </div>
        <div className="p-4 border rounded-lg text-center">
          <p className="text-2xl font-bold">{analytics.signups}</p>
          <p className="text-sm text-muted-foreground">Sign Ups</p>
        </div>
        <div className="p-4 border rounded-lg text-center">
          <p className="text-2xl font-bold">{analytics.conversions}</p>
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
              <div key={event.id} className="flex items-center justify-between p-2 border rounded text-sm">
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
        await supabase
          .from('site_settings')
          .update({ value, updated_at: new Date().toISOString() })
          .eq('key', key);
      }
      toast.success('Settings saved successfully');
    } catch (error) {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <Instagram className="h-4 w-4" />
          Social Media Links
        </h3>
        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="instagram">Instagram URL</Label>
            <Input
              id="instagram"
              placeholder="https://instagram.com/yourusername"
              value={settings.instagram_url}
              onChange={(e) => setSettings(prev => ({ ...prev, instagram_url: e.target.value }))}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="facebook">Facebook URL</Label>
            <Input
              id="facebook"
              placeholder="https://facebook.com/yourpage"
              value={settings.facebook_url}
              onChange={(e) => setSettings(prev => ({ ...prev, facebook_url: e.target.value }))}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="twitter">Twitter/X URL</Label>
            <Input
              id="twitter"
              placeholder="https://twitter.com/yourusername"
              value={settings.twitter_url}
              onChange={(e) => setSettings(prev => ({ ...prev, twitter_url: e.target.value }))}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="youtube">YouTube URL</Label>
            <Input
              id="youtube"
              placeholder="https://youtube.com/@yourchannel"
              value={settings.youtube_url}
              onChange={(e) => setSettings(prev => ({ ...prev, youtube_url: e.target.value }))}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="linkedin">LinkedIn URL</Label>
            <Input
              id="linkedin"
              placeholder="https://linkedin.com/in/yourprofile"
              value={settings.linkedin_url}
              onChange={(e) => setSettings(prev => ({ ...prev, linkedin_url: e.target.value }))}
            />
          </div>
        </div>
      </div>

      <Button onClick={handleSave} disabled={saving} className="gap-2">
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
        Save Settings
      </Button>
    </div>
  );
}

function SupportTable() {
  const [tickets, setTickets] = useState<any[]>([]);
  useEffect(() => {
    supabase.from('support_tickets').select('*').order('created_at', { ascending: false }).limit(20).then(({ data }) => {
      setTickets(data || []);
    });
  }, []);

  return tickets.length === 0 ? (
    <p className="text-muted-foreground text-center py-8">No support tickets yet.</p>
  ) : (
    <div className="space-y-2">
      {tickets.map(ticket => (
        <div key={ticket.id} className="flex items-center justify-between p-3 border rounded-lg">
          <div>
            <p className="font-medium">{ticket.subject}</p>
            <p className="text-sm text-muted-foreground">{ticket.message.substring(0, 50)}...</p>
          </div>
          <Badge variant={ticket.status === 'open' ? "destructive" : "default"}>
            {ticket.status}
          </Badge>
        </div>
      ))}
    </div>
  );
}
