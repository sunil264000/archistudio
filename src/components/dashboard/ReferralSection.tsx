import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Copy, Users, Gift, Share2, Loader2 } from 'lucide-react';

interface Referral {
  id: string;
  referral_code: string;
  total_referrals: number;
  total_earned_discount: number;
}

export function ReferralSection() {
  const { user } = useAuth();
  const [referral, setReferral] = useState<Referral | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!user) return;
    fetchReferral();
  }, [user]);

  const fetchReferral = async () => {
    try {
      const { data, error } = await supabase
        .from('referrals')
        .select('*')
        .eq('referrer_id', user?.id)
        .maybeSingle();

      if (error) throw error;
      setReferral(data);
    } catch (error) {
      console.error('Error fetching referral:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateReferralCode = async () => {
    if (!user) return;
    setCreating(true);
    
    try {
      // Generate unique code
      const code = `CL${user.id.substring(0, 4).toUpperCase()}${Date.now().toString(36).toUpperCase()}`;
      
      const { data, error } = await supabase
        .from('referrals')
        .insert({
          referrer_id: user.id,
          referral_code: code,
        })
        .select()
        .single();

      if (error) throw error;
      setReferral(data);
      toast.success('Referral code created!');
    } catch (error) {
      console.error('Error creating referral:', error);
      toast.error('Failed to create referral code');
    } finally {
      setCreating(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  const shareReferral = async () => {
    if (!referral) return;
    
    const shareUrl = `${window.location.origin}/auth?mode=signup&ref=${referral.referral_code}`;
    const shareText = `Join me on Archistudio and learn practical architecture skills! Use my referral code for 10% off: ${referral.referral_code}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Learn Architecture with Archistudio',
          text: shareText,
          url: shareUrl,
        });
      } catch (error) {
        copyToClipboard(shareUrl);
      }
    } else {
      copyToClipboard(shareUrl);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="h-32 animate-pulse bg-muted rounded" />
        </CardContent>
      </Card>
    );
  }

  const shareUrl = referral 
    ? `${window.location.origin}/auth?mode=signup&ref=${referral.referral_code}`
    : '';

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Gift className="h-5 w-5 text-accent" />
          Refer & Earn ₹100
        </CardTitle>
        <CardDescription>
          When your friend purchases a course above ₹500, you get a ₹100 discount coupon!
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {!referral ? (
          <div className="text-center py-8 space-y-4">
            <div className="p-4 bg-muted/50 rounded-lg inline-block">
              <Users className="h-12 w-12 text-muted-foreground mx-auto" />
            </div>
            <div>
              <h3 className="font-semibold mb-1">Start Earning Rewards</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Generate your unique referral code to start inviting friends
              </p>
              <Button onClick={generateReferralCode} disabled={creating}>
                {creating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Generate Referral Code'
                )}
              </Button>
            </div>
          </div>
        ) : (
          <>
            {/* Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-muted/50 rounded-lg text-center">
                <p className="text-3xl font-bold text-primary">{referral.total_referrals}</p>
                <p className="text-sm text-muted-foreground">Total Referrals</p>
              </div>
              <div className="p-4 bg-muted/50 rounded-lg text-center">
                <p className="text-3xl font-bold text-green-600">₹{referral.total_earned_discount}</p>
                <p className="text-sm text-muted-foreground">Earned Credits</p>
              </div>
            </div>

            {/* Referral Code */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Your Referral Code</label>
              <div className="flex gap-2">
                <Input 
                  value={referral.referral_code} 
                  readOnly 
                  className="font-mono text-lg tracking-wider"
                />
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={() => copyToClipboard(referral.referral_code)}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Share Link */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Share Link</label>
              <div className="flex gap-2">
                <Input 
                  value={shareUrl} 
                  readOnly 
                  className="text-sm"
                />
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={() => copyToClipboard(shareUrl)}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Share Button */}
            <Button onClick={shareReferral} className="w-full gap-2">
              <Share2 className="h-4 w-4" />
              Share with Friends
            </Button>

            {/* How it works */}
            <div className="p-4 bg-accent/10 rounded-lg">
              <h4 className="font-semibold text-sm mb-2">How Refer & Earn Works</h4>
              <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                <li>Share your unique referral code with friends</li>
                <li>They sign up using your code</li>
                <li>When they buy any course above ₹500</li>
                <li>You automatically get a ₹100 discount coupon!</li>
              </ol>
              <p className="text-xs text-muted-foreground mt-3 italic">
                * Coupons are valid for 90 days and require minimum ₹500 purchase
              </p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}