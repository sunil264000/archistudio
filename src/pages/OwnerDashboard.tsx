import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Navbar } from '@/components/layout/Navbar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, ShieldAlert, Users, Wallet, Briefcase, MessageSquare, Key, ArrowRight, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { AdminAIHelper } from '@/components/admin/AdminAIHelper';
import { AdminSubscriptionManager } from '@/components/admin/AdminSubscriptionManager';

export default function OwnerDashboard() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState('overview');
  const [loading, setLoading] = useState(true);

  // Stats
  const [stats, setStats] = useState({ income: 0, escrow: 0, payouts: 0, users: 0, jobs: 0 });
  const [users, setUsers] = useState<any[]>([]);
  const [contracts, setContracts] = useState<any[]>([]);
  const [selectedContract, setSelectedContract] = useState<any>(null);

  const isOwner = user?.email === 'KS.SUNILKUMAR.264@GMAIL.COM';

  useEffect(() => {
    if (!authLoading) {
      if (!user || !isOwner) {
        toast.error('Unauthorized. Owner access only.');
        navigate('/');
      } else {
        fetchGodView();
      }
    }
  }, [user, authLoading, isOwner, navigate]);

  const fetchGodView = async () => {
    setLoading(true);
    try {
      const [profilesRes, contractsRes, jobsRes] = await Promise.all([
        supabase.from('profiles').select('*').order('created_at', { ascending: false }),
        supabase.from('marketplace_contracts').select(`*, marketplace_jobs(title, client_id)`).order('created_at', { ascending: false }),
        supabase.from('marketplace_jobs').select('id', { count: 'exact' })
      ]);

      const allProfiles = profilesRes.data || [];
      const allContracts = contractsRes.data || [];

      let totalIncome = 0;
      let totalEscrow = 0;
      let totalPayouts = 0;

      allContracts.forEach(c => {
        if (c.payment_status === 'held_in_escrow') {
          totalEscrow += Number(c.agreed_amount || 0);
        } else if (c.payment_status === 'released') {
          totalPayouts += Number(c.worker_payout || 0);
          totalIncome += Number(c.platform_fee_amount || 0);
        }
      });

      setStats({
        income: totalIncome,
        escrow: totalEscrow,
        payouts: totalPayouts,
        users: allProfiles.length,
        jobs: jobsRes.count || 0
      });

      setUsers(allProfiles);
      setContracts(allContracts);
    } catch (error) {
      console.error(error);
      toast.error('Failed to load God-View data');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async (email: string) => {
    if (!confirm(`Send password reset email to ${email}?`)) return;
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/update-password`,
    });
    if (error) {
      toast.error(error.message);
    } else {
      toast.success(`Password reset email sent to ${email}`);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-accent" />
        </div>
      </div>
    );
  }

  if (!isOwner) return null;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      
      <main className="flex-1 container-wide py-12 pt-28">
        <div className="mb-8 border-b border-border pb-6">
          <Badge className="bg-red-500/20 text-red-500 hover:bg-red-500/30 mb-4 px-3 py-1">
            <ShieldAlert className="h-3.5 w-3.5 mr-2" /> God Mode
          </Badge>
          <h1 className="text-4xl font-display font-bold mb-2">Owner Dashboard</h1>
          <p className="text-muted-foreground">Welcome back, Sunil. Ultimate platform control.</p>
        </div>

        {/* Admin AI Section */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-8 mb-8">
          <div className="space-y-4">
            <h2 className="text-xl font-display font-bold">Platform Status</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="border-border/40 bg-card/40">
                <CardContent className="p-6">
                  <p className="text-sm text-muted-foreground mb-1 uppercase tracking-wider font-semibold text-[10px]">Income</p>
                  <p className="text-2xl font-bold text-emerald-500">₹{stats.income.toLocaleString()}</p>
                </CardContent>
              </Card>
              <Card className="border-border/40 bg-card/40">
                <CardContent className="p-6">
                  <p className="text-sm text-muted-foreground mb-1 uppercase tracking-wider font-semibold text-[10px]">Escrow</p>
                  <p className="text-2xl font-bold text-blue-500">₹{stats.escrow.toLocaleString()}</p>
                </CardContent>
              </Card>
              <Card className="border-border/40 bg-card/40">
                <CardContent className="p-6">
                  <p className="text-sm text-muted-foreground mb-1 uppercase tracking-wider font-semibold text-[10px]">Payouts</p>
                  <p className="text-2xl font-bold text-purple-500">₹{stats.payouts.toLocaleString()}</p>
                </CardContent>
              </Card>
              <Card className="border-border/40 bg-card/40">
                <CardContent className="p-6">
                  <p className="text-sm text-muted-foreground mb-1 uppercase tracking-wider font-semibold text-[10px]">Users</p>
                  <p className="text-2xl font-bold text-foreground">{stats.users}</p>
                </CardContent>
              </Card>
            </div>
            {/* Admin Tools: AI & Memberships */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <AdminAIHelper />
              <AdminSubscriptionManager />
            </div>
          </div>

        <Tabs value={tab} onValueChange={setTab} className="w-full">
          <TabsList className="w-full justify-start border-b border-border rounded-none bg-transparent p-0 h-auto mb-6">
            <TabsTrigger value="overview" className="data-[state=active]:border-accent data-[state=active]:bg-transparent data-[state=active]:shadow-none border-b-2 border-transparent rounded-none px-6 py-3">
              Contracts & Master Chat
            </TabsTrigger>
            <TabsTrigger value="users" className="data-[state=active]:border-accent data-[state=active]:bg-transparent data-[state=active]:shadow-none border-b-2 border-transparent rounded-none px-6 py-3">
              User Management
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-0">
            <Card className="border-border/40">
              <CardHeader>
                <CardTitle>All Platform Contracts</CardTitle>
                <CardDescription>View every contract, project files, and read real-time chats secretly.</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[600px]">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-card/95 backdrop-blur">
                      <tr className="text-left text-muted-foreground border-b border-border/40">
                        <th className="px-4 py-3">Project Title</th>
                        <th className="px-4 py-3">Amount</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3">Date</th>
                        <th className="px-4 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {contracts.map(c => (
                        <tr key={c.id} className="border-b border-border/20 hover:bg-muted/20">
                          <td className="px-4 py-3 font-medium">{c.marketplace_jobs?.title || 'Unknown Job'}</td>
                          <td className="px-4 py-3 text-emerald-500 font-medium">₹{Number(c.agreed_amount).toLocaleString()}</td>
                          <td className="px-4 py-3">
                            <Badge variant="outline" className="text-[10px] uppercase">
                              {c.status}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">
                            {new Date(c.created_at).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <Button variant="ghost" size="sm" onClick={() => navigate(`/studio-hub/contracts/${c.id}`)}>
                              <Eye className="h-4 w-4 mr-2" /> God View
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users" className="mt-0">
            <Card className="border-border/40">
              <CardHeader>
                <CardTitle>Global User Management</CardTitle>
                <CardDescription>Control passwords, view profiles, and manage access.</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[600px]">
                  <div className="grid gap-3">
                    {users.map(u => (
                      <div key={u.id} className="flex flex-wrap items-center justify-between p-4 border border-border/40 rounded-xl bg-card/30 hover:bg-card/60 transition-colors">
                        <div>
                          <div className="flex items-center gap-3">
                            <h3 className="font-semibold text-lg">{u.full_name || 'No Name'}</h3>
                            <Badge variant={u.role === 'admin' ? 'destructive' : 'default'} className="uppercase text-[10px]">
                              {u.role || 'student'}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{u.email}</p>
                          <p className="text-xs text-muted-foreground mt-1">ID: {u.user_id}</p>
                        </div>
                        <div className="flex gap-2 mt-4 md:mt-0">
                          <Button variant="outline" size="sm" onClick={() => handlePasswordReset(u.email)}>
                            <Key className="h-4 w-4 mr-2" /> Reset Password
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => window.open(`/profile/${u.user_id}`, '_blank')}>
                            View Profile <ArrowRight className="h-4 w-4 ml-2" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

      </main>
    </div>
  );
}
