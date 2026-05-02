import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Search, ShieldCheck, Zap, User, Loader2, Check, X, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export function AdminSubscriptionManager() {
  const [search, setSearch] = useState('');
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchUsers = async () => {
    if (!search || search.length < 3) {
      toast.info('Enter at least 3 characters to search');
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('user_id, full_name, email, subscription_tier, is_verified_pro')
      .or(`full_name.ilike.%${search}%,email.ilike.%${search}%`)
      .limit(10);

    if (error) {
      toast.error(error.message);
    } else {
      setUsers(data || []);
    }
    setLoading(false);
  };

  const updateTier = async (userId: string, tier: string) => {
    const { error } = await supabase
      .from('profiles')
      .update({ subscription_tier: tier })
      .eq('user_id', userId);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success(`User updated to ${tier.toUpperCase()}`);
      setUsers(users.map(u => u.user_id === userId ? { ...u, subscription_tier: tier } : u));
    }
  };

  const toggleVerification = async (userId: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from('profiles')
      .update({ is_verified_pro: !currentStatus })
      .eq('user_id', userId);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success(`Verification status updated`);
      setUsers(users.map(u => u.user_id === userId ? { ...u, is_verified_pro: !currentStatus } : u));
    }
  };

  return (
    <Card className="bg-card/50 backdrop-blur-sm border-border/40 shadow-xl">
      <CardHeader>
        <CardTitle className="text-xl font-display flex items-center gap-2">
          <ShieldAlert className="h-5 w-5 text-accent" /> Manage Memberships & Pro Status
        </CardTitle>
        <p className="text-xs text-muted-foreground">Search for users to grant Pro status or verify their profiles manually.</p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search by name or email..." 
              value={search} 
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 h-11 rounded-xl"
              onKeyDown={(e) => e.key === 'Enter' && fetchUsers()}
            />
          </div>
          <Button onClick={fetchUsers} disabled={loading} className="h-11 rounded-xl">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Search'}
          </Button>
        </div>

        <div className="space-y-3">
          {users.map((u) => (
            <div key={u.user_id} className="p-4 rounded-2xl border border-border/30 bg-muted/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-accent/10 flex items-center justify-center">
                  <User className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <p className="font-semibold text-sm">{u.full_name || 'No Name'}</p>
                  <p className="text-[10px] text-muted-foreground font-mono">{u.email}</p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="flex flex-col gap-1">
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Tier</p>
                  <Select value={u.subscription_tier} onValueChange={(v) => updateTier(u.user_id, v)}>
                    <SelectTrigger className="h-9 w-28 rounded-lg text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="free">Free</SelectItem>
                      <SelectItem value="pro">Pro (Elite)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex flex-col gap-1">
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Verification</p>
                  <Button 
                    variant={u.is_verified_pro ? 'default' : 'outline'} 
                    size="sm" 
                    className={`h-9 rounded-lg gap-2 text-xs ${u.is_verified_pro ? 'bg-amber-500 hover:bg-amber-600' : ''}`}
                    onClick={() => toggleVerification(u.user_id, u.is_verified_pro)}
                  >
                    {u.is_verified_pro ? <ShieldCheck className="h-3.5 w-3.5" /> : <ShieldAlert className="h-3.5 w-3.5" />}
                    {u.is_verified_pro ? 'Verified' : 'Unverified'}
                  </Button>
                </div>
              </div>
            </div>
          ))}

          {users.length === 0 && !loading && search.length >= 3 && (
            <div className="text-center py-8 text-muted-foreground text-sm">
              No users found matching "{search}"
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
