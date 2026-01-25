import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity, Users, Eye, ShoppingCart, Play, Trash2,
  RefreshCw, Clock, TrendingUp, AlertCircle, CheckCircle,
  XCircle, Loader2, Mail, ShieldCheck, UserX, Search,
  BarChart3, Zap, Globe
} from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface LiveActivity {
  id: string;
  user_id: string;
  session_id: string;
  activity_type: string;
  course_id: string | null;
  lesson_id: string | null;
  page_url: string | null;
  last_ping: string;
  started_at: string;
  metadata: any;
}

interface PurchaseAttempt {
  id: string;
  user_id: string | null;
  course_id: string | null;
  amount: number | null;
  status: string;
  created_at: string;
  metadata: any;
}

interface UserProfile {
  id: string;
  user_id: string;
  full_name: string | null;
  email: string | null;
  email_verified: boolean | null;
  phone: string | null;
  role: string | null;
  created_at: string;
}

export function RealtimeAnalytics() {
  const [activeUsers, setActiveUsers] = useState<LiveActivity[]>([]);
  const [purchaseAttempts, setPurchaseAttempts] = useState<PurchaseAttempt[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [courses, setCourses] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const [deletingUser, setDeletingUser] = useState<UserProfile | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [sendingVerification, setSendingVerification] = useState<string | null>(null);
  
  // Stats
  const [stats, setStats] = useState({
    totalActiveNow: 0,
    viewingCourses: 0,
    purchaseAttempts24h: 0,
    successfulPurchases24h: 0,
    failedPurchases24h: 0,
    newUsers24h: 0,
  });

  const fetchCourses = useCallback(async () => {
    const { data } = await supabase.from('courses').select('id, title');
    if (data) {
      const map: Record<string, string> = {};
      data.forEach(c => { map[c.id] = c.title; });
      setCourses(map);
    }
  }, []);

  const fetchActiveUsers = useCallback(async () => {
    // Get activity from last 5 minutes as "active"
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    
    const { data, error } = await supabase
      .from('live_activity')
      .select('*')
      .gte('last_ping', fiveMinutesAgo)
      .is('ended_at', null)
      .order('last_ping', { ascending: false });
    
    if (!error && data) {
      setActiveUsers(data);
      setStats(prev => ({
        ...prev,
        totalActiveNow: data.length,
        viewingCourses: data.filter(a => a.activity_type === 'viewing' || a.activity_type === 'video_play').length,
      }));
    }
  }, []);

  const fetchPurchaseAttempts = useCallback(async () => {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    
    const { data, error } = await supabase
      .from('purchase_attempts')
      .select('*')
      .gte('created_at', twentyFourHoursAgo)
      .order('created_at', { ascending: false })
      .limit(100);
    
    if (!error && data) {
      setPurchaseAttempts(data);
      setStats(prev => ({
        ...prev,
        purchaseAttempts24h: data.length,
        successfulPurchases24h: data.filter(p => p.status === 'completed').length,
        failedPurchases24h: data.filter(p => p.status === 'failed' || p.status === 'abandoned').length,
      }));
    }
  }, []);

  const fetchUsers = useCallback(async () => {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (data) {
      setUsers(data);
      const newUsers = data.filter(u => new Date(u.created_at) >= new Date(twentyFourHoursAgo));
      setStats(prev => ({ ...prev, newUsers24h: newUsers.length }));
    }
  }, []);

  const refreshAll = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      fetchActiveUsers(),
      fetchPurchaseAttempts(),
      fetchUsers(),
    ]);
    setRefreshing(false);
    toast.success('Data refreshed');
  }, [fetchActiveUsers, fetchPurchaseAttempts, fetchUsers]);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await fetchCourses();
      await Promise.all([
        fetchActiveUsers(),
        fetchPurchaseAttempts(),
        fetchUsers(),
      ]);
      setLoading(false);
    };
    init();

    // Set up realtime subscriptions
    const activityChannel = supabase
      .channel('live-activity-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'live_activity' }, () => {
        fetchActiveUsers();
      })
      .subscribe();

    const purchaseChannel = supabase
      .channel('purchase-attempts-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'purchase_attempts' }, () => {
        fetchPurchaseAttempts();
      })
      .subscribe();

    const profileChannel = supabase
      .channel('profiles-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
        fetchUsers();
      })
      .subscribe();

    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      fetchActiveUsers();
      fetchPurchaseAttempts();
    }, 30000);

    return () => {
      supabase.removeChannel(activityChannel);
      supabase.removeChannel(purchaseChannel);
      supabase.removeChannel(profileChannel);
      clearInterval(interval);
    };
  }, [fetchCourses, fetchActiveUsers, fetchPurchaseAttempts, fetchUsers]);

  const handleDeleteUser = async () => {
    if (!deletingUser) return;
    setDeleteLoading(true);
    
    try {
      // Delete user profile (cascade will handle related data)
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('user_id', deletingUser.user_id);
      
      if (error) throw error;
      
      toast.success(`User ${deletingUser.email || deletingUser.full_name} deleted`);
      setUsers(prev => prev.filter(u => u.id !== deletingUser.id));
      setDeletingUser(null);
    } catch (error: any) {
      toast.error(`Failed to delete user: ${error.message}`);
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleSendVerification = async (user: UserProfile) => {
    if (!user.email) {
      toast.error('User has no email address');
      return;
    }
    
    setSendingVerification(user.id);
    try {
      // Use Supabase to resend verification
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: user.email,
      });
      
      if (error) throw error;
      toast.success(`Verification email sent to ${user.email}`);
    } catch (error: any) {
      toast.error(`Failed to send verification: ${error.message}`);
    } finally {
      setSendingVerification(null);
    }
  };

  const filteredUsers = users.filter(user =>
    user.full_name?.toLowerCase().includes(userSearch.toLowerCase()) ||
    user.email?.toLowerCase().includes(userSearch.toLowerCase())
  );

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'viewing': return <Eye className="h-4 w-4" />;
      case 'video_play': return <Play className="h-4 w-4" />;
      case 'purchase_attempt': return <ShoppingCart className="h-4 w-4" />;
      case 'page_visit': return <Globe className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20"><CheckCircle className="h-3 w-3 mr-1" />Completed</Badge>;
      case 'failed':
        return <Badge className="bg-destructive/10 text-destructive border-destructive/20"><XCircle className="h-3 w-3 mr-1" />Failed</Badge>;
      case 'abandoned':
        return <Badge className="bg-orange-500/10 text-orange-600 border-orange-500/20"><AlertCircle className="h-3 w-3 mr-1" />Abandoned</Badge>;
      case 'payment_started':
        return <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20"><Loader2 className="h-3 w-3 mr-1 animate-spin" />In Progress</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getTimeAgo = (date: string) => {
    const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return new Date(date).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
        <span className="ml-3">Loading realtime data...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Zap className="h-6 w-6 text-accent" />
            Realtime Analytics
          </h2>
          <p className="text-muted-foreground">Live activity monitoring & user management</p>
        </div>
        <Button onClick={refreshAll} disabled={refreshing} variant="outline" className="gap-2">
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-xl border bg-gradient-to-br from-emerald-500/10 to-transparent"
        >
          <div className="flex items-center gap-2 text-emerald-600">
            <Activity className="h-5 w-5" />
            <span className="text-xs font-medium">Active Now</span>
          </div>
          <p className="text-3xl font-bold mt-2">{stats.totalActiveNow}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="p-4 rounded-xl border bg-gradient-to-br from-blue-500/10 to-transparent"
        >
          <div className="flex items-center gap-2 text-blue-600">
            <Eye className="h-5 w-5" />
            <span className="text-xs font-medium">Watching</span>
          </div>
          <p className="text-3xl font-bold mt-2">{stats.viewingCourses}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="p-4 rounded-xl border bg-gradient-to-br from-purple-500/10 to-transparent"
        >
          <div className="flex items-center gap-2 text-purple-600">
            <ShoppingCart className="h-5 w-5" />
            <span className="text-xs font-medium">Purchase Attempts</span>
          </div>
          <p className="text-3xl font-bold mt-2">{stats.purchaseAttempts24h}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="p-4 rounded-xl border bg-gradient-to-br from-green-500/10 to-transparent"
        >
          <div className="flex items-center gap-2 text-green-600">
            <CheckCircle className="h-5 w-5" />
            <span className="text-xs font-medium">Successful</span>
          </div>
          <p className="text-3xl font-bold mt-2">{stats.successfulPurchases24h}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="p-4 rounded-xl border bg-gradient-to-br from-red-500/10 to-transparent"
        >
          <div className="flex items-center gap-2 text-red-600">
            <XCircle className="h-5 w-5" />
            <span className="text-xs font-medium">Failed/Abandoned</span>
          </div>
          <p className="text-3xl font-bold mt-2">{stats.failedPurchases24h}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="p-4 rounded-xl border bg-gradient-to-br from-cyan-500/10 to-transparent"
        >
          <div className="flex items-center gap-2 text-cyan-600">
            <Users className="h-5 w-5" />
            <span className="text-xs font-medium">New Users (24h)</span>
          </div>
          <p className="text-3xl font-bold mt-2">{stats.newUsers24h}</p>
        </motion.div>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="live" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 max-w-md">
          <TabsTrigger value="live" className="gap-2">
            <Activity className="h-4 w-4" />
            Live Activity
          </TabsTrigger>
          <TabsTrigger value="purchases" className="gap-2">
            <ShoppingCart className="h-4 w-4" />
            Purchases
          </TabsTrigger>
          <TabsTrigger value="users" className="gap-2">
            <Users className="h-4 w-4" />
            Users
          </TabsTrigger>
        </TabsList>

        {/* Live Activity Tab */}
        <TabsContent value="live">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-emerald-500" />
                Live User Activity
                <Badge variant="secondary" className="ml-2 animate-pulse">
                  {activeUsers.length} online
                </Badge>
              </CardTitle>
              <CardDescription>Real-time view of user activity across the platform</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                {activeUsers.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Activity className="h-12 w-12 mx-auto mb-4 opacity-20" />
                    <p>No active users right now</p>
                  </div>
                ) : (
                  <AnimatePresence>
                    <div className="space-y-3">
                      {activeUsers.map((activity, index) => (
                        <motion.div
                          key={activity.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="flex items-center justify-between p-4 border rounded-xl hover:bg-muted/30 transition-colors"
                        >
                          <div className="flex items-center gap-4">
                            <div className="h-10 w-10 rounded-full bg-accent/10 flex items-center justify-center">
                              {getActivityIcon(activity.activity_type)}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="capitalize">
                                  {activity.activity_type.replace('_', ' ')}
                                </Badge>
                                {activity.course_id && courses[activity.course_id] && (
                                  <span className="text-sm text-muted-foreground">
                                    {courses[activity.course_id]}
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground mt-1">
                                {activity.page_url || 'Unknown page'}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              {getTimeAgo(activity.last_ping)}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              Session: {activity.session_id.slice(0, 8)}...
                            </p>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </AnimatePresence>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Purchase Attempts Tab */}
        <TabsContent value="purchases">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5 text-purple-500" />
                Purchase Attempts (Last 24h)
              </CardTitle>
              <CardDescription>Track checkout attempts and conversion status</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                {purchaseAttempts.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <ShoppingCart className="h-12 w-12 mx-auto mb-4 opacity-20" />
                    <p>No purchase attempts in the last 24 hours</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {purchaseAttempts.map((attempt, index) => (
                      <motion.div
                        key={attempt.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.03 }}
                        className="flex items-center justify-between p-4 border rounded-xl hover:bg-muted/30 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div className="h-10 w-10 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-600">
                            <ShoppingCart className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="font-medium">
                              {attempt.course_id && courses[attempt.course_id]
                                ? courses[attempt.course_id]
                                : 'Unknown Course'}
                            </p>
                            {attempt.amount && (
                              <p className="text-sm text-muted-foreground">
                                ₹{attempt.amount.toLocaleString()}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          {getStatusBadge(attempt.status)}
                          <span className="text-xs text-muted-foreground">
                            {getTimeAgo(attempt.created_at)}
                          </span>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* User Management Tab */}
        <TabsContent value="users">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-cyan-500" />
                    User Management
                  </CardTitle>
                  <CardDescription>{users.length} registered users</CardDescription>
                </div>
                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search users..."
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                {filteredUsers.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Users className="h-12 w-12 mx-auto mb-4 opacity-20" />
                    <p>No users found</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredUsers.map((user, index) => (
                      <motion.div
                        key={user.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.02 }}
                        className="flex items-center justify-between p-4 border rounded-xl hover:bg-muted/30 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div className="h-12 w-12 rounded-full bg-accent/10 flex items-center justify-center">
                            <span className="text-accent font-bold text-lg">
                              {(user.full_name || user.email || 'U').charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium">{user.full_name || 'No name'}</p>
                            <p className="text-sm text-muted-foreground">{user.email}</p>
                            <div className="flex items-center gap-3 mt-1">
                              <Badge variant={user.role === 'admin' ? 'default' : 'secondary'} className="text-xs">
                                {user.role || 'student'}
                              </Badge>
                              {user.email_verified ? (
                                <span className="flex items-center gap-1 text-xs text-emerald-600">
                                  <ShieldCheck className="h-3 w-3" />
                                  Verified
                                </span>
                              ) : (
                                <span className="flex items-center gap-1 text-xs text-orange-600">
                                  <AlertCircle className="h-3 w-3" />
                                  Unverified
                                </span>
                              )}
                              <span className="text-xs text-muted-foreground">
                                Joined {getTimeAgo(user.created_at)}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {!user.email_verified && user.email && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleSendVerification(user)}
                              disabled={sendingVerification === user.id}
                              className="gap-1"
                            >
                              {sendingVerification === user.id ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <Mail className="h-3 w-3" />
                              )}
                              Verify
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeletingUser(user)}
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          >
                            <UserX className="h-4 w-4" />
                          </Button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Delete User Confirmation Dialog */}
      <AlertDialog open={!!deletingUser} onOpenChange={() => setDeletingUser(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="h-5 w-5" />
              Delete User Account
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {deletingUser?.full_name || deletingUser?.email}? 
              This will permanently remove their profile and all associated data. 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteUser}
              disabled={deleteLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete User
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
