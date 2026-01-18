import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Navbar } from '@/components/layout/Navbar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  Users, BookOpen, DollarSign, BarChart3, Settings, 
  ArrowLeft, TrendingUp, CreditCard, MessageSquare 
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
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="courses">Courses</TabsTrigger>
              <TabsTrigger value="users">Users</TabsTrigger>
              <TabsTrigger value="payments">Payments</TabsTrigger>
              <TabsTrigger value="support">Support</TabsTrigger>
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

            <TabsContent value="users">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    User Management
                  </CardTitle>
                  <CardDescription>View and manage users</CardDescription>
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
          </Tabs>
        </div>
      </main>
    </div>
  );
}

function CoursesTable() {
  const [courses, setCourses] = useState<any[]>([]);
  useEffect(() => {
    supabase.from('courses').select('*').order('created_at', { ascending: false }).then(({ data }) => {
      setCourses(data || []);
    });
  }, []);

  return courses.length === 0 ? (
    <p className="text-muted-foreground text-center py-8">No courses in database yet. Courses are loaded from local data.</p>
  ) : (
    <div className="space-y-2">
      {courses.map(course => (
        <div key={course.id} className="flex items-center justify-between p-3 border rounded-lg">
          <div>
            <p className="font-medium">{course.title}</p>
            <p className="text-sm text-muted-foreground">{course.level}</p>
          </div>
          <Badge variant={course.is_published ? "default" : "secondary"}>
            {course.is_published ? "Published" : "Draft"}
          </Badge>
        </div>
      ))}
    </div>
  );
}

function UsersTable() {
  const [users, setUsers] = useState<any[]>([]);
  useEffect(() => {
    supabase.from('profiles').select('*').order('created_at', { ascending: false }).then(({ data }) => {
      setUsers(data || []);
    });
  }, []);

  return users.length === 0 ? (
    <p className="text-muted-foreground text-center py-8">No users registered yet.</p>
  ) : (
    <div className="space-y-2">
      {users.map(user => (
        <div key={user.id} className="flex items-center justify-between p-3 border rounded-lg">
          <div>
            <p className="font-medium">{user.full_name || 'No name'}</p>
            <p className="text-sm text-muted-foreground">{user.email}</p>
          </div>
          <Badge>{user.role || 'student'}</Badge>
        </div>
      ))}
    </div>
  );
}

function PaymentsTable() {
  const [payments, setPayments] = useState<any[]>([]);
  useEffect(() => {
    supabase.from('payments').select('*').order('created_at', { ascending: false }).limit(20).then(({ data }) => {
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
            <p className="text-sm text-muted-foreground">{payment.payment_gateway}</p>
          </div>
          <Badge variant={payment.status === 'completed' ? "default" : "secondary"}>
            {payment.status}
          </Badge>
        </div>
      ))}
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
