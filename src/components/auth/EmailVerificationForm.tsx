import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Loader2, Mail, AlertCircle, RefreshCw, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface EmailVerificationFormProps {
  email: string;
  onVerified: () => void;
  onBack: () => void;
}

export function EmailVerificationForm({ email, onVerified, onBack }: EmailVerificationFormProps) {
  const { user } = useAuth();
  const [resending, setResending] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(false);

  // Listen for auth state changes - user clicking the email link will trigger this
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user?.email_confirmed_at) {
        toast.success('Email verified successfully! Welcome to Archistudio.');
        onVerified();
      }
    });

    return () => subscription.unsubscribe();
  }, [onVerified]);

  // Countdown timer for resend button
  useEffect(() => {
    if (countdown > 0 && !canResend) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0) {
      setCanResend(true);
    }
  }, [countdown, canResend]);

  // Check if already verified (in case user clicked link in another tab)
  const handleCheckStatus = async () => {
    setCheckingStatus(true);
    try {
      const { data, error } = await supabase.auth.getUser();
      
      if (error) {
        toast.error('Could not check verification status');
        return;
      }

      if (data.user?.email_confirmed_at) {
        toast.success('Email already verified! Redirecting...');
        onVerified();
      } else {
        toast.info('Email not verified yet. Please check your inbox and click the verification link.');
      }
    } catch (err) {
      toast.error('Failed to check status. Please try again.');
    } finally {
      setCheckingStatus(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
        },
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      toast.success('Verification email sent! Please check your inbox.');
      setCountdown(60);
      setCanResend(false);
    } catch (err) {
      toast.error('Failed to resend email. Please try again.');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Email Icon Header */}
      <div className="flex flex-col items-center text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
          <Mail className="h-8 w-8 text-primary" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-foreground">Check your email</h3>
          <p className="text-sm text-muted-foreground mt-1">
            We sent a verification link to
          </p>
          <p className="text-sm font-medium text-foreground mt-1">{email}</p>
        </div>
      </div>

      {/* Instructions */}
      <div className="space-y-4">
        <div className="flex items-start gap-3 p-4 rounded-lg bg-accent/50 border border-accent">
          <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium text-foreground">What to do next:</p>
            <ol className="text-muted-foreground mt-2 space-y-1 list-decimal list-inside">
              <li>Open the email we just sent you</li>
              <li>Click the "Verify Email" button in the email</li>
              <li>You'll be automatically signed in</li>
            </ol>
          </div>
        </div>

        {/* Spam Notice */}
        <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 border border-border">
          <AlertCircle className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
          <div className="text-sm text-muted-foreground">
            <p className="font-medium">Can't find the email?</p>
            <p className="mt-0.5">
              Check your <strong>Spam</strong> or <strong>Junk</strong> folder. It may take a few minutes to arrive.
            </p>
          </div>
        </div>
      </div>

      {/* Check Status Button */}
      <Button 
        onClick={handleCheckStatus} 
        className="w-full" 
        disabled={checkingStatus}
      >
        {checkingStatus && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        I've Verified My Email
      </Button>

      {/* Resend Section */}
      <div className="text-center space-y-2">
        {canResend ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleResend}
            disabled={resending}
            className="text-muted-foreground hover:text-foreground"
          >
            {resending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" />
            )}
            Resend verification email
          </Button>
        ) : (
          <p className="text-sm text-muted-foreground">
            Resend email in <span className="font-medium text-foreground">{countdown}s</span>
          </p>
        )}
      </div>

      {/* Back Button */}
      <div className="text-center">
        <button
          type="button"
          onClick={onBack}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← Use a different email
        </button>
      </div>
    </div>
  );
}
