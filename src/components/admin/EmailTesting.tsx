import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { Mail, Send, Loader2, CheckCircle, Gift, CreditCard, Sparkles, AlertCircle } from 'lucide-react';

type EmailType = 'paid' | 'free' | 'gift' | 'welcome';

interface EmailTypeConfig {
  id: EmailType;
  label: string;
  description: string;
  icon: React.ReactNode;
  color: string;
}

const emailTypes: EmailTypeConfig[] = [
  {
    id: 'paid',
    label: 'Paid Invoice',
    description: 'Payment confirmation with invoice details',
    icon: <CreditCard className="h-5 w-5" />,
    color: 'text-green-500',
  },
  {
    id: 'free',
    label: 'Free Enrollment',
    description: 'Self-enrolled free course confirmation',
    icon: <Sparkles className="h-5 w-5" />,
    color: 'text-blue-500',
  },
  {
    id: 'gift',
    label: 'Admin Gift',
    description: 'Complimentary access granted by admin',
    icon: <Gift className="h-5 w-5" />,
    color: 'text-purple-500',
  },
  {
    id: 'welcome',
    label: 'Welcome Email',
    description: 'New user signup welcome message',
    icon: <Mail className="h-5 w-5" />,
    color: 'text-amber-500',
  },
];

export function EmailTesting() {
  const [testEmail, setTestEmail] = useState('');
  const [testName, setTestName] = useState('Test User');
  const [selectedType, setSelectedType] = useState<EmailType>('paid');
  const [loading, setLoading] = useState(false);
  const [lastSent, setLastSent] = useState<{ type: EmailType; email: string; time: Date } | null>(null);

  const sendTestEmail = async () => {
    if (!testEmail) {
      toast.error('Please enter a test email address');
      return;
    }

    if (!testEmail.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }

    setLoading(true);
    try {
      let result;
      
      if (selectedType === 'welcome') {
        // Send welcome email
        result = await supabase.functions.invoke('send-welcome-email', {
          body: {
            email: testEmail,
            name: testName,
          }
        });
      } else {
        // Send enrollment emails
        const emailData: any = {
          email: testEmail,
          name: testName,
          courseName: '3ds Max Complete Masterclass (TEST)',
          courseSlug: '3ds-max',
        };

        if (selectedType === 'paid') {
          emailData.isFree = false;
          emailData.amount = 599;
          emailData.orderId = `TEST_ORDER_${Date.now()}`;
          emailData.paymentDate = new Date().toISOString();
        } else if (selectedType === 'free') {
          emailData.isFree = true;
          emailData.isGift = false;
        } else if (selectedType === 'gift') {
          emailData.isFree = true;
          emailData.isGift = true;
        }

        result = await supabase.functions.invoke('send-enrollment-email', {
          body: emailData
        });
      }

      if (result.error) {
        throw result.error;
      }

      // Check for Resend sandbox mode error
      if (result.data?.data?.statusCode === 403) {
        toast.warning(
          'Email sent in sandbox mode - Only works for verified email (p27373872827@gmail.com). Verify a domain at resend.com/domains to send to all addresses.',
          { duration: 8000 }
        );
      } else {
        toast.success(`Test ${selectedType} email sent to ${testEmail}`);
      }

      setLastSent({ type: selectedType, email: testEmail, time: new Date() });
    } catch (error: any) {
      console.error('Test email error:', error);
      toast.error(`Failed to send test email: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const selectedTypeConfig = emailTypes.find(t => t.id === selectedType);

  return (
    <div className="space-y-6">
      <Card className="border-2 border-dashed border-primary/30 bg-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Mail className="h-5 w-5 text-primary" />
            Email Template Testing
          </CardTitle>
          <CardDescription>
            Send test emails to verify templates before production. All emails will show "[TEST]" indicators.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Email Type Selection */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {emailTypes.map((type) => (
              <motion.button
                key={type.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedType(type.id)}
                className={`p-4 rounded-lg border-2 text-left transition-all ${
                  selectedType === type.id
                    ? 'border-primary bg-primary/10'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <div className={`${type.color} mb-2`}>{type.icon}</div>
                <p className="font-medium text-sm">{type.label}</p>
                <p className="text-xs text-muted-foreground line-clamp-2">{type.description}</p>
              </motion.button>
            ))}
          </div>

          {/* Form */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Recipient Email</Label>
              <Input
                type="email"
                placeholder="your@email.com"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
              />
              <p className="text-xs text-green-500">
                ✓ Domain verified: Emails sent from hello@archistudio.shop
              </p>
            </div>
            <div className="space-y-2">
              <Label>Recipient Name</Label>
              <Input
                placeholder="Test User"
                value={testName}
                onChange={(e) => setTestName(e.target.value)}
              />
            </div>
          </div>

          {/* Preview Card */}
          {selectedTypeConfig && (
            <div className="p-4 rounded-lg bg-muted/50 border">
              <div className="flex items-center gap-2 mb-2">
                <div className={selectedTypeConfig.color}>{selectedTypeConfig.icon}</div>
                <span className="font-medium">{selectedTypeConfig.label} Preview</span>
              </div>
              <div className="text-sm text-muted-foreground space-y-1">
                {selectedType === 'paid' && (
                  <>
                    <p>📧 Subject: Payment Confirmed - Invoice for 3ds Max Complete Masterclass (TEST) 🎉</p>
                    <p>💰 Amount: ₹599</p>
                    <p>🆔 Order ID: TEST_ORDER_[timestamp]</p>
                  </>
                )}
                {selectedType === 'free' && (
                  <>
                    <p>📧 Subject: You're enrolled in 3ds Max Complete Masterclass (TEST)! 🎓</p>
                    <p>💰 Price: FREE</p>
                  </>
                )}
                {selectedType === 'gift' && (
                  <>
                    <p>📧 Subject: 🎁 You've Received a Gift! Free Access to 3ds Max Complete Masterclass (TEST)</p>
                    <p>🎉 Complimentary Access by Admin</p>
                  </>
                )}
                {selectedType === 'welcome' && (
                  <>
                    <p>📧 Subject: Welcome to Archistudio! 🎉</p>
                    <p>👋 New user onboarding email</p>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Send Button */}
          <Button 
            onClick={sendTestEmail} 
            disabled={loading || !testEmail}
            className="w-full gap-2"
            size="lg"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            Send Test {selectedTypeConfig?.label} Email
          </Button>

          {/* Last Sent Indicator */}
          {lastSent && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 p-3 bg-success/10 border border-success/30 rounded-lg"
            >
              <CheckCircle className="h-4 w-4 text-success" />
              <span className="text-sm">
                Last sent: <strong>{emailTypes.find(t => t.id === lastSent.type)?.label}</strong> to{' '}
                <strong>{lastSent.email}</strong> at {lastSent.time.toLocaleTimeString()}
              </span>
            </motion.div>
          )}
        </CardContent>
      </Card>

      {/* Domain Status */}
      <Card className="border-green-500/30 bg-green-500/5">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <CheckCircle className="h-5 w-5 text-green-500" />
            Production Email Ready
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p className="text-muted-foreground">
            Your domain is verified and ready to send emails to all users.
          </p>
          <div className="pt-2 flex gap-2 flex-wrap">
            <Badge variant="outline" className="text-green-600 border-green-500/30">
              ✓ Domain: archistudio.shop
            </Badge>
            <Badge variant="outline" className="text-green-600 border-green-500/30">
              ✓ From: hello@archistudio.shop
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}