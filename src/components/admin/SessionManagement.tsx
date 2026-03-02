import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Monitor, Search, Shield, XCircle, Loader2, Users, Clock } from 'lucide-react';
import { format } from 'date-fns';

interface UserSession {
  id: string;
  user_id: string;
  session_token: string;
  device_info: string | null;
  ip_address: string | null;
  browser: string | null;
  os: string | null;
  logged_in_at: string;
  last_active_at: string;
  is_active: boolean;
  logged_out_at: string | null;
  logout_reason: string | null;
}

interface UserProfile {
  user_id: string;
  email: string | null;
  full_name: string | null;
}

export function SessionManagement() {
  const [sessions, setSessions] = useState<UserSession[]>([]);
  const [profiles, setProfiles] = useState<Record<string, UserProfile>>({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [revoking, setRevoking] = useState<string | null>(null);

  const fetchSessions = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('user_sessions')
      .select('*')
      .order('logged_in_at', { ascending: false })
      .limit(200);

    if (error) {
      toast.error('Failed to fetch sessions');
      setLoading(false);
      return;
    }

    setSessions(data || []);

    // Fetch profiles for unique user IDs
    const userIds = [...new Set((data || []).map(s => s.user_id))];
    if (userIds.length > 0) {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('user_id, email, full_name')
        .in('user_id', userIds);

      const profileMap: Record<string, UserProfile> = {};
      (profileData || []).forEach(p => { profileMap[p.user_id] = p; });
      setProfiles(profileMap);
    }

    setLoading(false);
  };

  useEffect(() => { fetchSessions(); }, []);

  const handleRevokeSession = async (sessionId: string) => {
    setRevoking(sessionId);
    const { error } = await supabase
      .from('user_sessions')
      .update({ 
        is_active: false, 
        logged_out_at: new Date().toISOString(),
        logout_reason: 'admin_revoked'
      })
      .eq('id', sessionId);

    if (error) {
      toast.error('Failed to revoke session');
    } else {
      toast.success('Session revoked');
      fetchSessions();
    }
    setRevoking(null);
  };

  const handleRevokeAllForUser = async (userId: string) => {
    const { error } = await supabase
      .from('user_sessions')
      .update({ 
        is_active: false, 
        logged_out_at: new Date().toISOString(),
        logout_reason: 'admin_revoked_all'
      })
      .eq('user_id', userId)
      .eq('is_active', true);

    if (error) {
      toast.error('Failed to revoke sessions');
    } else {
      toast.success('All sessions revoked for this user');
      fetchSessions();
    }
  };

  const filtered = sessions.filter(s => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    const profile = profiles[s.user_id];
    return (
      profile?.email?.toLowerCase().includes(term) ||
      profile?.full_name?.toLowerCase().includes(term) ||
      s.device_info?.toLowerCase().includes(term) ||
      s.ip_address?.includes(term)
    );
  });

  const activeSessions = filtered.filter(s => s.is_active);
  const inactiveSessions = filtered.filter(s => !s.is_active);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="h-6 w-6 text-accent" />
            Session Management
          </h2>
          <p className="text-muted-foreground text-sm mt-1">
            Monitor active logins, revoke access, enforce single-device policy
          </p>
        </div>
        <Button variant="outline" onClick={fetchSessions} disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Refresh'}
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by email, name, device..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Users className="h-4 w-4" />
          {activeSessions.length} active
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="space-y-4">
          {/* Active Sessions */}
          {activeSessions.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Active Sessions</h3>
              {activeSessions.map(session => {
                const profile = profiles[session.user_id];
                return (
                  <Card key={session.id} className="border-success/20">
                    <CardContent className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-full bg-success/10 flex items-center justify-center">
                          <Monitor className="h-5 w-5 text-success" />
                        </div>
                        <div>
                          <div className="font-medium">{profile?.full_name || 'Unknown'}</div>
                          <div className="text-sm text-muted-foreground">{profile?.email || session.user_id}</div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                            <span>{session.device_info || 'Unknown device'}</span>
                            <span>•</span>
                            <Clock className="h-3 w-3" />
                            <span>{format(new Date(session.logged_in_at), 'dd MMM, hh:mm a')}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className="bg-success/10 text-success border-success/30">Active</Badge>
                        <Button 
                          variant="destructive" 
                          size="sm"
                          onClick={() => handleRevokeSession(session.id)}
                          disabled={revoking === session.id}
                        >
                          {revoking === session.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <XCircle className="h-3 w-3 mr-1" />}
                          Revoke
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {/* Recent Inactive */}
          {inactiveSessions.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Recent Sessions</h3>
              {inactiveSessions.slice(0, 50).map(session => {
                const profile = profiles[session.user_id];
                return (
                  <Card key={session.id} className="border-border/50 opacity-70">
                    <CardContent className="p-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Monitor className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div className="text-sm">{profile?.email || session.user_id}</div>
                          <div className="text-xs text-muted-foreground">
                            {session.device_info} • {format(new Date(session.logged_in_at), 'dd MMM, hh:mm a')}
                            {session.logout_reason && ` • ${session.logout_reason.replace(/_/g, ' ')}`}
                          </div>
                        </div>
                      </div>
                      <Badge variant="secondary" className="text-xs">Ended</Badge>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {filtered.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              No sessions found
            </div>
          )}
        </div>
      )}
    </div>
  );
}
