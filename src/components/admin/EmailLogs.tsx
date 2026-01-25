import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import {
  Mail, Search, RefreshCw, Loader2, CheckCircle, XCircle,
  Clock, Send, Gift, UserPlus, CreditCard, Key, Filter,
  BarChart3
} from 'lucide-react';

interface EmailLog {
  id: string;
  recipient_email: string;
  recipient_name: string | null;
  email_type: string;
  subject: string;
  status: string;
  metadata: any;
  error_message: string | null;
  sent_at: string;
}

const EMAIL_TYPE_CONFIG: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  welcome: {
    label: 'Welcome',
    icon: <UserPlus className="h-4 w-4" />,
    color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  },
  enrollment: {
    label: 'Enrollment',
    icon: <CheckCircle className="h-4 w-4" />,
    color: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  },
  emi: {
    label: 'EMI Payment',
    icon: <CreditCard className="h-4 w-4" />,
    color: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
  },
  gift: {
    label: 'Gift',
    icon: <Gift className="h-4 w-4" />,
    color: 'bg-pink-500/10 text-pink-600 border-pink-500/20',
  },
  verification: {
    label: 'Verification',
    icon: <Key className="h-4 w-4" />,
    color: 'bg-orange-500/10 text-orange-600 border-orange-500/20',
  },
  ebook_purchase: {
    label: 'Ebook Purchase',
    icon: <Send className="h-4 w-4" />,
    color: 'bg-cyan-500/10 text-cyan-600 border-cyan-500/20',
  },
  ebook_gift: {
    label: 'Ebook Gift',
    icon: <Gift className="h-4 w-4" />,
    color: 'bg-rose-500/10 text-rose-600 border-rose-500/20',
  },
  broadcast: {
    label: 'Broadcast',
    icon: <Send className="h-4 w-4" />,
    color: 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20',
  },
};

export function EmailLogs() {
  const [logs, setLogs] = useState<EmailLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  const [stats, setStats] = useState({
    total: 0,
    sent: 0,
    failed: 0,
    todaySent: 0,
  });

  const fetchLogs = useCallback(async () => {
    const { data, error } = await supabase
      .from('email_logs')
      .select('*')
      .order('sent_at', { ascending: false })
      .limit(500);

    if (error) {
      console.error('Error fetching email logs:', error);
      return;
    }

    if (data) {
      setLogs(data);
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      setStats({
        total: data.length,
        sent: data.filter(l => l.status === 'sent').length,
        failed: data.filter(l => l.status === 'failed').length,
        todaySent: data.filter(l => new Date(l.sent_at) >= today && l.status === 'sent').length,
      });
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await fetchLogs();
      setLoading(false);
    };
    init();

    // Realtime subscription
    const channel = supabase
      .channel('email-logs-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'email_logs' }, () => {
        fetchLogs();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchLogs]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchLogs();
    setRefreshing(false);
    toast.success('Email logs refreshed');
  };

  const filteredLogs = logs.filter(log => {
    const matchesSearch =
      log.recipient_email.toLowerCase().includes(search.toLowerCase()) ||
      log.recipient_name?.toLowerCase().includes(search.toLowerCase()) ||
      log.subject.toLowerCase().includes(search.toLowerCase());
    
    const matchesType = typeFilter === 'all' || log.email_type === typeFilter;
    const matchesStatus = statusFilter === 'all' || log.status === statusFilter;
    
    return matchesSearch && matchesType && matchesStatus;
  });

  const getTimeAgo = (date: string) => {
    const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(date).toLocaleDateString();
  };

  const getTypeConfig = (type: string) => {
    return EMAIL_TYPE_CONFIG[type] || {
      label: type,
      icon: <Mail className="h-4 w-4" />,
      color: 'bg-zinc-500/10 text-zinc-600 border-zinc-500/20',
    };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
        <span className="ml-3">Loading email logs...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Mail className="h-6 w-6 text-accent" />
            Email Logs
          </h2>
          <p className="text-muted-foreground">Track all sent emails and their delivery status</p>
        </div>
        <Button onClick={handleRefresh} disabled={refreshing} variant="outline" className="gap-2">
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-xl border bg-gradient-to-br from-blue-500/10 to-transparent"
        >
          <div className="flex items-center gap-2 text-blue-600">
            <BarChart3 className="h-5 w-5" />
            <span className="text-xs font-medium">Total Emails</span>
          </div>
          <p className="text-3xl font-bold mt-2">{stats.total}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="p-4 rounded-xl border bg-gradient-to-br from-emerald-500/10 to-transparent"
        >
          <div className="flex items-center gap-2 text-emerald-600">
            <CheckCircle className="h-5 w-5" />
            <span className="text-xs font-medium">Sent Successfully</span>
          </div>
          <p className="text-3xl font-bold mt-2">{stats.sent}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="p-4 rounded-xl border bg-gradient-to-br from-red-500/10 to-transparent"
        >
          <div className="flex items-center gap-2 text-red-600">
            <XCircle className="h-5 w-5" />
            <span className="text-xs font-medium">Failed</span>
          </div>
          <p className="text-3xl font-bold mt-2">{stats.failed}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="p-4 rounded-xl border bg-gradient-to-br from-purple-500/10 to-transparent"
        >
          <div className="flex items-center gap-2 text-purple-600">
            <Clock className="h-5 w-5" />
            <span className="text-xs font-medium">Today</span>
          </div>
          <p className="text-3xl font-bold mt-2">{stats.todaySent}</p>
        </motion.div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Email History
              </CardTitle>
              <CardDescription>{filteredLogs.length} emails found</CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              <div className="relative flex-1 md:w-48">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {Object.keys(EMAIL_TYPE_CONFIG).map(type => (
                    <SelectItem key={type} value={type}>
                      {EMAIL_TYPE_CONFIG[type].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="sent">Sent</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[500px]">
            {filteredLogs.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Mail className="h-12 w-12 mx-auto mb-4 opacity-20" />
                <p>No emails found</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredLogs.map((log, index) => {
                  const typeConfig = getTypeConfig(log.email_type);
                  return (
                    <motion.div
                      key={log.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.02 }}
                      className="flex items-center justify-between p-4 border rounded-xl hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`h-10 w-10 rounded-full flex items-center justify-center ${typeConfig.color}`}>
                          {typeConfig.icon}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{log.recipient_name || log.recipient_email}</p>
                            <Badge className={typeConfig.color} variant="outline">
                              {typeConfig.label}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-1">
                            {log.subject}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {log.recipient_email}
                          </p>
                        </div>
                      </div>
                      <div className="text-right flex flex-col items-end gap-1">
                        <Badge
                          variant="outline"
                          className={log.status === 'sent'
                            ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                            : 'bg-destructive/10 text-destructive border-destructive/20'
                          }
                        >
                          {log.status === 'sent' ? (
                            <CheckCircle className="h-3 w-3 mr-1" />
                          ) : (
                            <XCircle className="h-3 w-3 mr-1" />
                          )}
                          {log.status}
                        </Badge>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {getTimeAgo(log.sent_at)}
                        </span>
                        {log.error_message && (
                          <span className="text-xs text-destructive max-w-[200px] truncate">
                            {log.error_message}
                          </span>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
