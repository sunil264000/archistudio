import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Mail, Send, Loader2, CheckCircle, Users, 
  Megaphone, Gift, Sparkles, Newspaper, 
  AlertTriangle, Eye, UserCheck, UserX
} from 'lucide-react';

type EmailCategory = 'announcement' | 'promotion' | 'update' | 'newsletter';
type TargetAudience = 'all' | 'enrolled' | 'not-enrolled';

interface CategoryConfig {
  id: EmailCategory;
  label: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
}

interface AudienceConfig {
  id: TargetAudience;
  label: string;
  description: string;
  icon: React.ReactNode;
}

const categories: CategoryConfig[] = [
  {
    id: 'announcement',
    label: 'Announcement',
    description: 'Important updates and news',
    icon: <Megaphone className="h-5 w-5" />,
    color: 'text-amber-500',
    bgColor: 'bg-amber-500/10 border-amber-500/30',
  },
  {
    id: 'promotion',
    label: 'Promotion',
    description: 'Special offers and discounts',
    icon: <Gift className="h-5 w-5" />,
    color: 'text-pink-500',
    bgColor: 'bg-pink-500/10 border-pink-500/30',
  },
  {
    id: 'update',
    label: 'Course Update',
    description: 'New lessons and content',
    icon: <Sparkles className="h-5 w-5" />,
    color: 'text-green-500',
    bgColor: 'bg-green-500/10 border-green-500/30',
  },
  {
    id: 'newsletter',
    label: 'Newsletter',
    description: 'Regular community updates',
    icon: <Newspaper className="h-5 w-5" />,
    color: 'text-indigo-500',
    bgColor: 'bg-indigo-500/10 border-indigo-500/30',
  },
];

const audiences: AudienceConfig[] = [
  {
    id: 'all',
    label: 'All Members',
    description: 'Every registered user',
    icon: <Users className="h-5 w-5" />,
  },
  {
    id: 'enrolled',
    label: 'Enrolled Students',
    description: 'Users with active courses',
    icon: <UserCheck className="h-5 w-5" />,
  },
  {
    id: 'not-enrolled',
    label: 'Not Enrolled',
    description: 'Users without any courses',
    icon: <UserX className="h-5 w-5" />,
  },
];

export function EmailBroadcast() {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [category, setCategory] = useState<EmailCategory>('announcement');
  const [targetAudience, setTargetAudience] = useState<TargetAudience>('all');
  const [testMode, setTestMode] = useState(true);
  const [testEmail, setTestEmail] = useState('');
  const [loading, setSending] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [stats, setStats] = useState({ total: 0, enrolled: 0, notEnrolled: 0 });
  const [lastBroadcast, setLastBroadcast] = useState<{ sentCount: number; time: Date } | null>(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      // Get total users
      const { count: totalCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .not('email', 'is', null);

      // Get enrolled users
      const { data: enrollments } = await supabase
        .from('enrollments')
        .select('user_id')
        .eq('status', 'active');
      
      const enrolledCount = new Set(enrollments?.map(e => e.user_id) || []).size;

      setStats({
        total: totalCount || 0,
        enrolled: enrolledCount,
        notEnrolled: (totalCount || 0) - enrolledCount,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const getRecipientCount = (): number => {
    switch (targetAudience) {
      case 'all': return stats.total;
      case 'enrolled': return stats.enrolled;
      case 'not-enrolled': return stats.notEnrolled;
      default: return 0;
    }
  };

  const sendBroadcast = async () => {
    if (!subject.trim()) {
      toast.error('Please enter a subject');
      return;
    }
    if (!message.trim()) {
      toast.error('Please enter a message');
      return;
    }
    if (testMode && !testEmail.trim()) {
      toast.error('Please enter a test email address');
      return;
    }

    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-broadcast-email', {
        body: {
          subject,
          message,
          category,
          targetAudience,
          testMode,
          testEmail: testMode ? testEmail : undefined,
        }
      });

      if (error) throw error;

      if (data.success) {
        if (testMode) {
          toast.success(`Test email sent to ${testEmail}`);
        } else {
          toast.success(`Broadcast sent to ${data.sentCount} recipients!`, {
            description: data.failedCount > 0 ? `${data.failedCount} failed` : undefined,
          });
          setLastBroadcast({ sentCount: data.sentCount, time: new Date() });
          // Reset form after successful broadcast
          setSubject('');
          setMessage('');
        }
      } else {
        throw new Error(data.error || 'Failed to send broadcast');
      }
    } catch (error: any) {
      console.error('Broadcast error:', error);
      toast.error(`Failed to send: ${error.message}`);
    } finally {
      setSending(false);
    }
  };

  const selectedCategory = categories.find(c => c.id === category);
  const selectedAudience = audiences.find(a => a.id === targetAudience);

  return (
    <div className="space-y-6">
      {/* Stats Banner */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <CardContent className="p-4 text-center">
            <Users className="h-6 w-6 mx-auto mb-2 text-primary" />
            <p className="text-2xl font-bold">{stats.total}</p>
            <p className="text-xs text-muted-foreground">Total Members</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20">
          <CardContent className="p-4 text-center">
            <UserCheck className="h-6 w-6 mx-auto mb-2 text-green-500" />
            <p className="text-2xl font-bold">{stats.enrolled}</p>
            <p className="text-xs text-muted-foreground">Enrolled</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-amber-500/10 to-amber-500/5 border-amber-500/20">
          <CardContent className="p-4 text-center">
            <UserX className="h-6 w-6 mx-auto mb-2 text-amber-500" />
            <p className="text-2xl font-bold">{stats.notEnrolled}</p>
            <p className="text-xs text-muted-foreground">Not Enrolled</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Compose Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-primary" />
              Compose Broadcast
            </CardTitle>
            <CardDescription>
              Send emails to your community members
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Category Selection */}
            <div className="space-y-3">
              <Label>Email Category</Label>
              <div className="grid grid-cols-2 gap-2">
                {categories.map((cat) => (
                  <motion.button
                    key={cat.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setCategory(cat.id)}
                    className={`p-3 rounded-lg border text-left transition-all ${
                      category === cat.id
                        ? cat.bgColor + ' border-2'
                        : 'border-border hover:border-primary/30'
                    }`}
                  >
                    <div className={`${cat.color} mb-1`}>{cat.icon}</div>
                    <p className="font-medium text-sm">{cat.label}</p>
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Target Audience */}
            <div className="space-y-3">
              <Label>Target Audience</Label>
              <Select value={targetAudience} onValueChange={(v: TargetAudience) => setTargetAudience(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {audiences.map((aud) => (
                    <SelectItem key={aud.id} value={aud.id}>
                      <div className="flex items-center gap-2">
                        {aud.icon}
                        <span>{aud.label}</span>
                        <Badge variant="outline" className="ml-2">
                          {aud.id === 'all' ? stats.total : aud.id === 'enrolled' ? stats.enrolled : stats.notEnrolled}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Subject */}
            <div className="space-y-2">
              <Label>Subject Line</Label>
              <Input
                placeholder="Enter a compelling subject..."
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="text-base"
              />
            </div>

            {/* Message */}
            <div className="space-y-2">
              <Label>Message</Label>
              <Textarea
                placeholder="Write your message here...&#10;&#10;You can use multiple paragraphs.&#10;The formatting will be preserved."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="min-h-[200px] text-base"
              />
            </div>

            {/* Test Mode Toggle */}
            <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50 border">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                <div>
                  <p className="font-medium text-sm">Test Mode</p>
                  <p className="text-xs text-muted-foreground">
                    {testMode ? 'Send only to test email' : 'Will send to all recipients!'}
                  </p>
                </div>
              </div>
              <Switch
                checked={testMode}
                onCheckedChange={setTestMode}
              />
            </div>

            {/* Test Email Input */}
            <AnimatePresence>
              {testMode && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-2"
                >
                  <Label>Test Email Address</Label>
                  <Input
                    type="email"
                    placeholder="your@email.com"
                    value={testEmail}
                    onChange={(e) => setTestEmail(e.target.value)}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Send Button */}
            <Button
              onClick={sendBroadcast}
              disabled={loading || !subject || !message || (testMode && !testEmail)}
              className="w-full gap-2"
              size="lg"
              variant={testMode ? 'outline' : 'default'}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              {testMode 
                ? 'Send Test Email' 
                : `Send to ${getRecipientCount()} Recipients`}
            </Button>

            {/* Last Broadcast */}
            {lastBroadcast && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/30 rounded-lg"
              >
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm">
                  Last broadcast: <strong>{lastBroadcast.sentCount}</strong> emails at{' '}
                  {lastBroadcast.time.toLocaleTimeString()}
                </span>
              </motion.div>
            )}
          </CardContent>
        </Card>

        {/* Preview Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Email Preview
              </CardTitle>
              {selectedCategory && (
                <Badge className={selectedCategory.bgColor}>
                  <span className={selectedCategory.color}>{selectedCategory.icon}</span>
                  <span className="ml-1">{selectedCategory.label}</span>
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border bg-[#0f172a] p-6 text-white">
              {/* Mock Email Header */}
              <div className="text-center mb-6">
                <div className="inline-block px-5 py-3 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-xl border border-green-500/30">
                  <span className="text-xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                    ARCHISTUDIO
                  </span>
                </div>
              </div>

              {/* Category Badge */}
              {selectedCategory && (
                <div className="text-center mb-4">
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${selectedCategory.bgColor} ${selectedCategory.color}`}>
                    {category.toUpperCase()}
                  </span>
                </div>
              )}

              {/* Subject */}
              <h2 className="text-xl font-bold text-center mb-4">
                {subject || 'Your Subject Line Here'}
              </h2>

              {/* Message */}
              <div className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">
                {message || 'Your message content will appear here. You can write multiple paragraphs and the formatting will be preserved.'}
              </div>

              {/* CTA Button */}
              <div className="text-center mt-6">
                <span 
                  className="inline-block px-6 py-3 rounded-lg font-semibold text-sm"
                  style={{ 
                    background: selectedCategory 
                      ? `linear-gradient(90deg, ${selectedCategory.color === 'text-amber-500' ? '#f59e0b' : selectedCategory.color === 'text-pink-500' ? '#ec4899' : selectedCategory.color === 'text-green-500' ? '#22c55e' : '#6366f1'}, ${selectedCategory.color === 'text-amber-500' ? '#f59e0b' : selectedCategory.color === 'text-pink-500' ? '#ec4899' : selectedCategory.color === 'text-green-500' ? '#22c55e' : '#6366f1'}dd)`
                      : 'linear-gradient(90deg, #3b82f6, #8b5cf6)'
                  }}
                >
                  Explore Courses →
                </span>
              </div>

              {/* Footer */}
              <div className="mt-8 pt-6 border-t border-white/10 text-center text-gray-500 text-xs">
                <p>Instagram • Telegram • Website</p>
                <p className="mt-2">© {new Date().getFullYear()} Archistudio. All rights reserved.</p>
              </div>
            </div>

            {/* Recipient Info */}
            <div className="mt-4 p-4 rounded-lg bg-muted/50 border">
              <div className="flex items-center gap-2 mb-2">
                {selectedAudience?.icon}
                <span className="font-medium">{selectedAudience?.label}</span>
              </div>
              <p className="text-sm text-muted-foreground">
                {testMode 
                  ? `Test email will be sent to: ${testEmail || 'Enter email above'}`
                  : `This email will be sent to ${getRecipientCount()} recipients`}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
