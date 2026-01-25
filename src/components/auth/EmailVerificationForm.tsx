import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { toast } from 'sonner';
import { Loader2, Mail, AlertCircle, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface EmailVerificationFormProps {
  email: string;
  onVerified: () => void;
  onBack: () => void;
}

export function EmailVerificationForm({ email, onVerified, onBack }: EmailVerificationFormProps) {
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);

  useEffect(() => {
    if (countdown > 0 && !canResend) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0) {
      setCanResend(true);
    }
  }, [countdown, canResend]);

  const handleVerify = async () => {
    if (otp.length !== 6) {
      toast.error('Please enter the complete 6-digit code');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.verifyOtp({
        email,
        token: otp,
        type: 'signup',
      });

      if (error) {
        if (error.message.includes('expired')) {
          toast.error('Code expired. Please request a new one.');
        } else if (error.message.includes('invalid')) {
          toast.error('Invalid code. Please check and try again.');
        } else {
          toast.error(error.message);
        }
        return;
      }

      toast.success('Email verified successfully! Welcome to Archistudio.');
      onVerified();
    } catch (err) {
      toast.error('Verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      toast.success('New verification code sent!');
      setCountdown(60);
      setCanResend(false);
      setOtp('');
    } catch (err) {
      toast.error('Failed to resend code. Please try again.');
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
            We sent a 6-digit verification code to
          </p>
          <p className="text-sm font-medium text-foreground mt-1">{email}</p>
        </div>
      </div>

      {/* OTP Input */}
      <div className="flex justify-center">
        <InputOTP
          maxLength={6}
          value={otp}
          onChange={setOtp}
          disabled={loading}
        >
          <InputOTPGroup>
            <InputOTPSlot index={0} />
            <InputOTPSlot index={1} />
            <InputOTPSlot index={2} />
            <InputOTPSlot index={3} />
            <InputOTPSlot index={4} />
            <InputOTPSlot index={5} />
          </InputOTPGroup>
        </InputOTP>
      </div>

      {/* Spam Notice */}
      <div className="flex items-start gap-3 p-3 rounded-lg bg-accent/50 border border-accent">
        <AlertCircle className="h-5 w-5 text-accent-foreground shrink-0 mt-0.5" />
        <div className="text-sm text-accent-foreground">
          <p className="font-medium">Can't find the email?</p>
          <p className="text-muted-foreground mt-0.5">
            Check your <strong>Spam</strong> or <strong>Junk</strong> folder. The email may take a few minutes to arrive.
          </p>
        </div>
      </div>

      {/* Verify Button */}
      <Button 
        onClick={handleVerify} 
        className="w-full" 
        disabled={loading || otp.length !== 6}
      >
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Verify Email
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
            Resend verification code
          </Button>
        ) : (
          <p className="text-sm text-muted-foreground">
            Resend code in <span className="font-medium text-foreground">{countdown}s</span>
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
