import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2, Eye, EyeOff } from 'lucide-react';
import { EmailVerificationForm } from './EmailVerificationForm';
import { supabase } from '@/integrations/supabase/client';
import { isDisposableEmail } from '@/utils/disposableEmails';

const loginSchema = z.object({
  email: z.string().trim().email({ message: 'Please enter a valid email address' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
});

const signupSchema = z.object({
  fullName: z.string().trim().min(2, { message: 'Name must be at least 2 characters' }).max(100),
  email: z.string().trim().email({ message: 'Please enter a valid email address' })
    .refine((e) => !isDisposableEmail(e), { message: 'Temporary/disposable emails are not allowed. Please use a real email address.' }),
  password: z.string().min(8, { message: 'Password must be at least 8 characters' })
    .regex(/[A-Z]/, { message: 'Password must contain at least one uppercase letter' })
    .regex(/[a-z]/, { message: 'Password must contain at least one lowercase letter' })
    .regex(/[0-9]/, { message: 'Password must contain at least one number' }),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

type LoginFormData = z.infer<typeof loginSchema>;
type SignupFormData = z.infer<typeof signupSchema>;

interface EmailAuthFormProps {
  mode: 'login' | 'signup';
  onSuccess?: () => void;
}

export function EmailAuthForm({ mode, onSuccess }: EmailAuthFormProps) {
  const { signInWithEmail, signUpWithEmail } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showVerification, setShowVerification] = useState(false);
  const [pendingEmail, setPendingEmail] = useState('');
  const [pendingPassword, setPendingPassword] = useState('');
  const [pendingName, setPendingName] = useState('');

  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const signupForm = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: { fullName: '', email: '', password: '', confirmPassword: '' },
  });

  const onLoginSubmit = async (data: LoginFormData) => {
    setLoading(true);
    try {
      const { error } = await signInWithEmail(data.email, data.password);
      
      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          toast.error('Invalid email or password. Please try again.');
        } else if (error.message.includes('Email not confirmed')) {
          toast.info('Email not verified yet. Sending you a new verification code...');
          setPendingEmail(data.email);
          setPendingPassword(data.password);
          
          await supabase.functions.invoke('verify-email-otp', {
            body: { action: 'send', email: data.email },
          });
          
          setShowVerification(true);
        } else {
          toast.error(error.message);
        }
        return;
      }
      
      toast.success('Welcome back!');
      onSuccess?.();
    } catch (err) {
      toast.error('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const onSignupSubmit = async (data: SignupFormData) => {
    setLoading(true);
    try {
      const { error } = await signUpWithEmail(data.email, data.password, data.fullName);
      
      if (error) {
        if (error.message.includes('already registered')) {
          toast.error('This email is already registered. Please login instead.');
        } else {
          toast.error(error.message);
        }
        return;
      }
      
      // Send OTP via our edge function (this is the ONLY email sent on signup now)
      const { error: otpError } = await supabase.functions.invoke('verify-email-otp', {
        body: { action: 'send', email: data.email, name: data.fullName },
      });

      if (otpError) {
        toast.error('Failed to send verification code. Please try again.');
        return;
      }

      setPendingEmail(data.email);
      setPendingPassword(data.password);
      setPendingName(data.fullName);
      setShowVerification(true);
      toast.info('A 6-digit verification code has been sent to your email!');
    } catch (err) {
      toast.error('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerificationSuccess = () => {
    // Send welcome email ONLY after successful verification (single email)
    if (pendingEmail) {
      supabase.functions.invoke('send-welcome-email', {
        body: { email: pendingEmail, name: pendingName || pendingEmail.split('@')[0] }
      }).catch(err => console.error('Welcome email error:', err));

      // Notify admin about new signup
      supabase.functions.invoke('notify-admin', {
        body: { 
          type: 'new_signup',
          email: pendingEmail,
          name: pendingName || pendingEmail.split('@')[0],
        }
      }).catch(err => console.error('Admin notify error:', err));
    }
    
    toast.success('Email verified! Welcome to Archistudio.');
    onSuccess?.();
  };

  const handleBackToForm = () => {
    setShowVerification(false);
    setPendingEmail('');
    setPendingPassword('');
    setPendingName('');
  };

  if (showVerification) {
    return (
      <EmailVerificationForm
        email={pendingEmail}
        password={pendingPassword}
        onVerified={handleVerificationSuccess}
        onBack={handleBackToForm}
      />
    );
  }

  if (mode === 'login') {
    return (
      <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" placeholder="you@example.com" {...loginForm.register('email')} className="bg-background" />
          {loginForm.formState.errors.email && (
            <p className="text-sm text-destructive">{loginForm.formState.errors.email.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Input id="password" type={showPassword ? 'text' : 'password'} placeholder="••••••••" {...loginForm.register('password')} className="bg-background pr-10" />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {loginForm.formState.errors.password && (
            <p className="text-sm text-destructive">{loginForm.formState.errors.password.message}</p>
          )}
        </div>
        <Button type="submit" className="w-full" disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Sign In
        </Button>
      </form>
    );
  }

  return (
    <form onSubmit={signupForm.handleSubmit(onSignupSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="fullName">Full Name</Label>
        <Input id="fullName" type="text" placeholder="Your full name" {...signupForm.register('fullName')} className="bg-background" />
        {signupForm.formState.errors.fullName && (
          <p className="text-sm text-destructive">{signupForm.formState.errors.fullName.message}</p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="signupEmail">Email</Label>
        <Input id="signupEmail" type="email" placeholder="you@example.com" {...signupForm.register('email')} className="bg-background" />
        {signupForm.formState.errors.email && (
          <p className="text-sm text-destructive">{signupForm.formState.errors.email.message}</p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="signupPassword">Password</Label>
        <div className="relative">
          <Input id="signupPassword" type={showPassword ? 'text' : 'password'} placeholder="••••••••" {...signupForm.register('password')} className="bg-background pr-10" />
          <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {signupForm.formState.errors.password && (
          <p className="text-sm text-destructive">{signupForm.formState.errors.password.message}</p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirm Password</Label>
        <Input id="confirmPassword" type="password" placeholder="••••••••" {...signupForm.register('confirmPassword')} className="bg-background" />
        {signupForm.formState.errors.confirmPassword && (
          <p className="text-sm text-destructive">{signupForm.formState.errors.confirmPassword.message}</p>
        )}
      </div>
      <Button type="submit" className="w-full" disabled={loading}>
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Create Account
      </Button>
    </form>
  );
}
