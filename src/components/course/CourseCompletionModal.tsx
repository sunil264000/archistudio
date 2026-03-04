import { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Award, Download, Loader2, PartyPopper, Star, Truck, CreditCard } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface CourseCompletionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courseName: string;
  courseId: string;
  userId: string;
}

export function CourseCompletionModal({
  open,
  onOpenChange,
  courseName,
  courseId,
  userId,
}: CourseCompletionModalProps) {
  const [generating, setGenerating] = useState(false);
  const [showPhysical, setShowPhysical] = useState(false);
  const [address, setAddress] = useState({ name: '', line1: '', city: '', state: '', pincode: '', phone: '' });

  const handleDownloadCertificate = async () => {
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-certificate', {
        body: { userId, courseId },
      });

      if (error) throw error;

      const html = typeof data === 'string' ? data : '';
      if (!html) throw new Error('Empty certificate response');
      const win = window.open('', '_blank');
      if (win) {
        win.document.write(html);
        win.document.close();
      }

      toast.success('Certificate opened! Use Ctrl+P to save as PDF.');
    } catch (err) {
      console.error('Certificate generation error:', err);
      toast.error('Failed to generate certificate. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const handlePhysicalOrder = async () => {
    if (!address.name || !address.line1 || !address.city || !address.pincode || !address.phone) {
      toast.error('Please fill all address fields');
      return;
    }
    // For now, notify admin about physical certificate request
    try {
      await supabase.from('support_tickets').insert({
        user_id: userId,
        subject: `Physical Certificate Request - ${courseName}`,
        message: `User requests physical certificate for "${courseName}". Address: ${address.name}, ${address.line1}, ${address.city}, ${address.state} - ${address.pincode}. Phone: ${address.phone}. Amount: ₹699 + delivery.`,
        status: 'open',
        priority: 'normal',
      });
      toast.success('Physical certificate request submitted! Admin will contact you for payment.');
      setShowPhysical(false);
    } catch {
      toast.error('Failed to submit request');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md border-0 bg-gradient-to-br from-card via-card to-accent/5 overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-accent via-primary to-accent" />

        <div className="text-center py-4 space-y-6">
          {/* Celebration icon */}
          <div className="relative mx-auto w-24 h-24">
            <div className="absolute inset-0 rounded-full bg-accent/20 animate-ping" style={{ animationDuration: '2s' }} />
            <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-accent to-accent/70 flex items-center justify-center shadow-lg shadow-accent/30">
              <Award className="h-12 w-12 text-accent-foreground" />
            </div>
            <PartyPopper className="absolute -top-2 -right-2 h-8 w-8 text-yellow-500 animate-bounce" />
            <Star className="absolute -bottom-1 -left-2 h-6 w-6 text-yellow-400 animate-pulse" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-foreground">🎉 Congratulations!</h2>
            <p className="text-muted-foreground text-sm leading-relaxed max-w-xs mx-auto">
              You have successfully completed
            </p>
            <p className="text-lg font-semibold text-accent">{courseName}</p>
            <p className="text-muted-foreground text-xs">Your Proof of Completion is ready!</p>
          </div>

          {/* Certificate preview */}
          <div className="mx-auto max-w-xs p-4 rounded-xl border bg-gradient-to-br from-background to-muted/30 shadow-inner">
            <div className="border border-dashed border-accent/30 rounded-lg p-3 space-y-1">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Proof of Completion</p>
              <p className="text-sm font-semibold text-foreground">{courseName}</p>
              <p className="text-[10px] text-muted-foreground">
                Issued on {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
              <p className="text-[10px] text-muted-foreground italic">Signed by Archistudio Team</p>
            </div>
          </div>

          {!showPhysical ? (
            <div className="flex flex-col gap-3">
              <Button
                onClick={handleDownloadCertificate}
                disabled={generating}
                className="w-full bg-accent hover:bg-accent/90 text-accent-foreground shadow-md"
                size="lg"
              >
                {generating ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Generating Certificate...
                  </>
                ) : (
                  <>
                    <Download className="h-5 w-5 mr-2" />
                    Download PDF Certificate
                  </>
                )}
              </Button>

              <Button
                variant="outline"
                onClick={() => setShowPhysical(true)}
                className="w-full gap-2"
              >
                <Truck className="h-4 w-4" />
                Get Physical Certificate (₹699 + Delivery)
              </Button>

              <Button variant="ghost" onClick={() => onOpenChange(false)} className="text-muted-foreground">
                Maybe Later
              </Button>
            </div>
          ) : (
            <div className="space-y-3 text-left">
              <p className="text-sm font-medium text-center">Enter your delivery address</p>
              <Input placeholder="Full Name" value={address.name} onChange={e => setAddress(p => ({ ...p, name: e.target.value }))} />
              <Input placeholder="Address Line 1" value={address.line1} onChange={e => setAddress(p => ({ ...p, line1: e.target.value }))} />
              <div className="grid grid-cols-2 gap-2">
                <Input placeholder="City" value={address.city} onChange={e => setAddress(p => ({ ...p, city: e.target.value }))} />
                <Input placeholder="State" value={address.state} onChange={e => setAddress(p => ({ ...p, state: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Input placeholder="Pincode" value={address.pincode} onChange={e => setAddress(p => ({ ...p, pincode: e.target.value }))} />
                <Input placeholder="Phone" value={address.phone} onChange={e => setAddress(p => ({ ...p, phone: e.target.value }))} />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setShowPhysical(false)} className="flex-1">Back</Button>
                <Button onClick={handlePhysicalOrder} className="flex-1 gap-2 bg-accent hover:bg-accent/90 text-accent-foreground">
                  <CreditCard className="h-4 w-4" />
                  Request (₹699)
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
