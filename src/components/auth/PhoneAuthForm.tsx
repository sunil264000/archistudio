import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2, Phone, ArrowLeft } from 'lucide-react';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';

const phoneSchema = z.object({
  phone: z.string()
    .min(10, { message: 'Please enter a valid phone number' })
    .max(15, { message: 'Phone number is too long' })
    .regex(/^\+?[1-9]\d{9,14}$/, { message: 'Please enter a valid phone number with country code (e.g., +91XXXXXXXXXX)' }),
});

type PhoneFormData = z.infer<typeof phoneSchema>;

interface PhoneAuthFormProps {
  onSuccess?: () => void;
}

export function PhoneAuthForm({ onSuccess }: PhoneAuthFormProps) {
  const { signInWithPhone, verifyPhoneOTP } = useAuth();
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');

  const form = useForm<PhoneFormData>({
    resolver: zodResolver(phoneSchema),
    defaultValues: { phone: '' },
  });

  const handleSendOTP = async (data: PhoneFormData) => {
    setLoading(true);

    try {
      const { error } = await signInWithPhone(data.phone);
      
      if (error) {
        if (error.message.includes('Phone signups are disabled')) {
          toast.error('Phone authentication is not enabled. Please contact support.');
        } else {
          toast.error(error.message);
        }
        return;
      }
      
      setPhone(data.phone);
      setOtpSent(true);
      toast.success('OTP sent to your phone!');
    } catch (err) {
      toast.error('Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (otp.length !== 6) {
      toast.error('Please enter the complete 6-digit OTP');
      return;
    }

    setLoading(true);

    try {
      const { error } = await verifyPhoneOTP(phone, otp);
      
      if (error) {
        if (error.message.includes('Invalid')) {
          toast.error('Invalid OTP. Please try again.');
        } else if (error.message.includes('expired')) {
          toast.error('OTP has expired. Please request a new one.');
        } else {
          toast.error(error.message);
        }
        return;
      }
      
      toast.success('Phone verified successfully!');
      onSuccess?.();
    } catch (err) {
      toast.error('Verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setLoading(true);

    try {
      const { error } = await signInWithPhone(phone);
      
      if (error) {
        toast.error(error.message);
        return;
      }
      
      setOtp('');
      toast.success('New OTP sent!');
    } catch (err) {
      toast.error('Failed to resend OTP.');
    } finally {
      setLoading(false);
    }
  };

  if (otpSent) {
    return (
      <div className="space-y-6">
        <button
          type="button"
          onClick={() => {
            setOtpSent(false);
            setOtp('');
          }}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Change phone number
        </button>

        <div className="text-center space-y-2">
          <Phone className="h-12 w-12 mx-auto text-accent" />
          <h3 className="font-semibold text-lg">Enter verification code</h3>
          <p className="text-sm text-muted-foreground">
            We sent a 6-digit code to {phone}
          </p>
        </div>

        <div className="flex justify-center">
          <InputOTP
            maxLength={6}
            value={otp}
            onChange={setOtp}
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

        <Button
          type="button"
          className="w-full"
          onClick={handleVerifyOTP}
          disabled={loading || otp.length !== 6}
        >
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Verify & Continue
        </Button>

        <div className="text-center">
          <button
            type="button"
            onClick={handleResendOTP}
            disabled={loading}
            className="text-sm text-accent hover:underline disabled:opacity-50"
          >
            Didn't receive code? Resend
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={form.handleSubmit(handleSendOTP)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="phone">Phone Number</Label>
        <Input
          id="phone"
          type="tel"
          placeholder="+91 98765 43210"
          {...form.register('phone')}
          className="bg-background"
        />
        {form.formState.errors.phone && (
          <p className="text-sm text-destructive">{form.formState.errors.phone.message}</p>
        )}
        <p className="text-xs text-muted-foreground">
          Include country code (e.g., +91 for India)
        </p>
      </div>

      <Button type="submit" className="w-full" disabled={loading}>
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Send OTP
      </Button>
    </form>
  );
}
