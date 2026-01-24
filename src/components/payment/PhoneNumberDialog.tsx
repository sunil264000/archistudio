import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Phone } from 'lucide-react';

interface PhoneNumberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (phone: string) => void;
  isLoading?: boolean;
}

export function PhoneNumberDialog({ 
  open, 
  onOpenChange, 
  onSubmit,
  isLoading = false 
}: PhoneNumberDialogProps) {
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');

  const validatePhone = (value: string): boolean => {
    const cleaned = value.replace(/[\s-]/g, '');
    const phoneRegex = /^[0-9]{10}$/;
    return phoneRegex.test(cleaned);
  };

  const handleSubmit = () => {
    const cleaned = phone.replace(/[\s-]/g, '');
    
    if (!validatePhone(cleaned)) {
      setError('Please enter a valid 10-digit phone number');
      return;
    }
    
    setError('');
    onSubmit(cleaned);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5 text-primary" />
            Enter Phone Number
          </DialogTitle>
          <DialogDescription>
            Your phone number is required for payment verification and order updates.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <div className="flex gap-2">
              <div className="flex items-center px-3 bg-muted rounded-md border">
                +91
              </div>
              <Input
                id="phone"
                type="tel"
                placeholder="10-digit number"
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value.replace(/[^0-9]/g, '').slice(0, 10));
                  setError('');
                }}
                className="flex-1"
                maxLength={10}
              />
            </div>
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading || phone.length !== 10}>
            {isLoading ? 'Processing...' : 'Continue to Payment'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
