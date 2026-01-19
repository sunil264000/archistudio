import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Loader2, Bell, Send, Users, User, Trash2, Globe } from 'lucide-react';

interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  created_at: string;
  is_global: boolean;
  user_name?: string;
}

interface UserProfile {
  user_id: string;
  full_name: string;
  email: string;
}

export function NotificationManagement() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [notificationType, setNotificationType] = useState('info');
  const [actionUrl, setActionUrl] = useState('');
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [isGlobal, setIsGlobal] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch users
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('user_id, full_name, email')
        .order('full_name');
      setUsers(profilesData || []);

      // Fetch recent notifications
      const { data: notificationsData } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (notificationsData && notificationsData.length > 0) {
        const userIds = [...new Set(notificationsData.map(n => n.user_id))];
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, full_name')
          .in('user_id', userIds);

        const profileMap = new Map(profiles?.map(p => [p.user_id, p.full_name]) || []);
        
        const enrichedNotifications = notificationsData.map(n => ({
          ...n,
          is_global: (n as any).is_global || false,
          user_name: profileMap.get(n.user_id) || 'Unknown',
        }));

        setNotifications(enrichedNotifications);
      } else {
        setNotifications([]);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    if (!title.trim() || !message.trim()) {
      toast.error('Please enter title and message');
      return;
    }

    if (!isGlobal && !selectedUser) {
      toast.error('Please select a user or enable "Send to all users"');
      return;
    }

    setSending(true);
    try {
      if (isGlobal) {
        // Send to all users
        const notificationsToInsert = users.map(user => ({
          user_id: user.user_id,
          title: title.trim(),
          message: message.trim(),
          type: notificationType,
          action_url: actionUrl.trim() || null,
          is_global: true,
        }));

        const { error } = await supabase
          .from('notifications')
          .insert(notificationsToInsert);

        if (error) throw error;
        toast.success(`Notification sent to ${users.length} users!`);
      } else {
        // Send to specific user
        const { error } = await supabase
          .from('notifications')
          .insert({
            user_id: selectedUser,
            title: title.trim(),
            message: message.trim(),
            type: notificationType,
            action_url: actionUrl.trim() || null,
            is_global: false,
          });

        if (error) throw error;
        toast.success('Notification sent!');
      }

      // Reset form
      setTitle('');
      setMessage('');
      setActionUrl('');
      setSelectedUser('');
      setIsGlobal(false);
      fetchData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to send notification');
    } finally {
      setSending(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this notification?')) return;

    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Notification deleted');
      fetchData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Send Notification Form */}
      <div className="p-6 border rounded-lg bg-muted/20">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Send New Notification
        </h3>
        
        <div className="grid gap-4">
          {/* Global Toggle */}
          <div className="flex items-center justify-between p-4 border rounded-lg bg-background">
            <div className="flex items-center gap-3">
              <Globe className="h-5 w-5 text-primary" />
              <div>
                <p className="font-medium">Send to All Users</p>
                <p className="text-sm text-muted-foreground">
                  Broadcast to {users.length} users
                </p>
              </div>
            </div>
            <Switch
              checked={isGlobal}
              onCheckedChange={setIsGlobal}
            />
          </div>

          {/* User Selection (if not global) */}
          {!isGlobal && (
            <div className="space-y-2">
              <Label>Select User</Label>
              <Select value={selectedUser} onValueChange={setSelectedUser}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a user..." />
                </SelectTrigger>
                <SelectContent>
                  {users.map(user => (
                    <SelectItem key={user.user_id} value={user.user_id}>
                      <span className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        {user.full_name || user.email}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Title */}
          <div className="space-y-2">
            <Label>Title</Label>
            <Input
              placeholder="Notification title..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          {/* Message */}
          <div className="space-y-2">
            <Label>Message</Label>
            <Textarea
              placeholder="Notification message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
            />
          </div>

          {/* Type */}
          <div className="space-y-2">
            <Label>Type</Label>
            <Select value={notificationType} onValueChange={setNotificationType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="info">ℹ️ Info</SelectItem>
                <SelectItem value="success">✅ Success</SelectItem>
                <SelectItem value="warning">⚠️ Warning</SelectItem>
                <SelectItem value="promo">🎉 Promotion</SelectItem>
                <SelectItem value="announcement">📢 Announcement</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Action URL */}
          <div className="space-y-2">
            <Label>Action URL (optional)</Label>
            <Input
              placeholder="/courses or /dashboard"
              value={actionUrl}
              onChange={(e) => setActionUrl(e.target.value)}
            />
          </div>

          <Button 
            onClick={handleSend} 
            disabled={sending}
            className="gap-2"
          >
            {sending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : isGlobal ? (
              <Users className="h-4 w-4" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            {isGlobal ? `Send to All (${users.length})` : 'Send Notification'}
          </Button>
        </div>
      </div>

      {/* Recent Notifications */}
      <div>
        <h3 className="font-semibold mb-4">Recent Notifications</h3>
        {notifications.length === 0 ? (
          <p className="text-center py-8 text-muted-foreground">
            No notifications sent yet
          </p>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {notifications.map(n => (
              <div 
                key={n.id} 
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm">{n.title}</span>
                    <Badge variant="outline" className="text-xs">{n.type}</Badge>
                    {n.is_global && (
                      <Badge variant="secondary" className="text-xs gap-1">
                        <Globe className="h-3 w-3" />
                        Global
                      </Badge>
                    )}
                    {n.read && (
                      <Badge variant="secondary" className="text-xs">Read</Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-1">
                    {n.message}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    To: {n.user_name} • {new Date(n.created_at).toLocaleString()}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDelete(n.id)}
                  className="text-destructive shrink-0"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
