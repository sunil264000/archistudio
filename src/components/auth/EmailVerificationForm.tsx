import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Loader2, Mail, AlertCircle, RefreshCw, CheckCircle2, ShieldCheck } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface EmailVerificationFormProps {
  email: string;
  password: string;
  onVerified: () => void;
  onBack: () => void;
}

export function EmailVerificationForm({ email, password, onVerified, onBack }: EmailVerificationFormProps) {
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const { setVerifyingOTP } = useAuth();
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Countdown timer
  useEffect(() => {
    if (countdown > 0 && !canResend) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0) {
      setCanResend(true);
    }
  }, [countdown, canResend]);

  // Auto-focus first input
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const handleInputChange = (index: number, value: string) => {
    // Only allow digits
    const digit = value.replace(/\D/g, '').slice(-1);
    const newCode = [...code];
    newCode[index] = digit;
    setCode(newCode);

    // Auto-advance to next input
    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all 6 digits entered
    if (digit && index === 5) {
      const fullCode = newCode.join('');
      if (fullCode.length === 6) {
        handleVerify(fullCode);
      }
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      const newCode = pasted.split('');
      setCode(newCode);
      inputRefs.current[5]?.focus();
      handleVerify(pasted);
    }
  };

  const handleVerify = async (fullCode?: string) => {
    const codeStr = fullCode || code.join('');
    if (codeStr.length !== 6) {
      toast.error('Please enter the complete 6-digit code');
      return;
    }

    setVerifying(true);
    try {
      const { data, error } = await supabase.functions.invoke('verify-email-otp', {
        body: { action: 'verify', email, code: codeStr },
      });

      if (error || !data?.success) {
        toast.error(data?.error || 'Verification failed. Please try again.');
        setCode(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
        return;
      }

      // Email is now confirmed! Wait briefly for DB to propagate, then sign in
      toast.success('Email verified! Signing you in...');

      // Tell AuthContext to wait for us (don't kick out unverified user yet)
      setVerifyingOTP(true);

      // Give the edge function's profile update time to propagate
      await new Promise(r => setTimeout(r, 2000));

      // Retry signInWithPassword up to 4 times (Supabase auth propagation can be slow)
      let signInError: Error | null = null;
      for (let attempt = 0; attempt < 4; attempt++) {
        if (attempt > 0) await new Promise(r => setTimeout(r, 1000));
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (!error) { signInError = null; break; }
        signInError = error;
        console.warn(`Sign-in attempt ${attempt + 1} failed:`, error.message);
      }

      if (signInError) {
        console.error('All sign-in attempts failed after verification:', signInError);
        toast.error('Email verified! Please sign in manually with your new password.');
        setVerifyingOTP(false);
        onBack();
        return;
      }

      // Wait for auth state to settle before calling onVerified
      await new Promise(r => setTimeout(r, 500));
      setVerifyingOTP(false);
      onVerified();
    } catch (err) {
      toast.error('Verification failed. Please try again.');
    } finally {
      setVerifying(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    try {
      const { data, error } = await supabase.functions.invoke('verify-email-otp', {
        body: { action: 'send', email },
      });

      if (error || !data?.success) {
        toast.error('Failed to resend code. Please try again.');
        return;
      }

      toast.success('New verification code sent! Check your inbox.');
      setCountdown(60);
      setCanResend(false);
      setCode(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } catch (err) {
      toast.error('Failed to resend. Please try again.');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col items-center text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center">
          <ShieldCheck className="h-8 w-8 text-accent" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-foreground">Enter Verification Code</h3>
          <p className="text-sm text-muted-foreground mt-1">
            We sent a 6-digit code to
          </p>
          <p className="text-sm font-medium text-accent mt-1">{email}</p>
        </div>
      </div>

      {/* 6-digit code input */}
      <div className="flex justify-center gap-2 sm:gap-3" onPaste={handlePaste}>
        {code.map((digit, index) => (
          <Input
            key={index}
            ref={(el) => { inputRefs.current[index] = el; }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={(e) => handleInputChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            className="w-11 h-14 sm:w-12 sm:h-14 text-center text-xl font-bold bg-background border-2 focus:border-accent transition-colors"
            disabled={verifying}
          />
        ))}
      </div>

      {/* Verify button */}
      <Button
        onClick={() => handleVerify()}
        className="w-full"
        disabled={verifying || code.join('').length !== 6}
      >
        {verifying ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Verifying...
          </>
        ) : (
          <>
            <CheckCircle2 className="mr-2 h-4 w-4" />
            Verify & Sign In
          </>
        )}
      </Button>

      {/* Instructions */}
      <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 border border-border">
        <AlertCircle className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
        <div className="text-sm text-muted-foreground">
          <p>Can't find the email? Check your <strong>Spam</strong> or <strong>Junk</strong> folder.</p>
        </div>
      </div>

      {/* Resend */}
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
            Resend code
          </Button>
        ) : (
          <p className="text-sm text-muted-foreground">
            Resend in <span className="font-medium text-foreground">{countdown}s</span>
          </p>
        )}
      </div>

      {/* Back */}
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
