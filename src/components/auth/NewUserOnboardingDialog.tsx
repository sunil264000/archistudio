import { useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface NewUserOnboardingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  defaultName?: string;
  onCompleted?: () => void;
}

export function NewUserOnboardingDialog({
  open,
  onOpenChange,
  userId,
  defaultName,
  onCompleted,
}: NewUserOnboardingDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [fullName, setFullName] = useState(defaultName || '');
  const [age, setAge] = useState('');
  const [roleTrack, setRoleTrack] = useState('');
  const [discoverySource, setDiscoverySource] = useState('');
  const [primaryChallenge, setPrimaryChallenge] = useState('');
  const [notes, setNotes] = useState('');

  const isValid = useMemo(() => {
    return !!roleTrack && !!discoverySource && primaryChallenge.trim().length >= 12;
  }, [roleTrack, discoverySource, primaryChallenge]);

  const handleSubmit = async () => {
    if (!isValid) return;

    setLoading(true);
    try {
      await (supabase as any)
        .from('user_onboarding_intake')
        .upsert(
          {
            user_id: userId,
            full_name: fullName || null,
            age: age ? Number(age) : null,
            role_track: roleTrack,
            discovery_source: discoverySource,
            primary_challenge: primaryChallenge.trim(),
            notes: notes.trim() || null,
          },
          { onConflict: 'user_id' },
        );

      toast({ title: 'Thanks for sharing!', description: 'Your personalized learning setup is ready.' });
      onCompleted?.();
      onOpenChange(false);
    } catch (error) {
      console.error('Onboarding save failed:', error);
      toast({ title: 'Could not save', description: 'Please try once more.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl bg-background border-border/50">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Sparkles className="h-5 w-5 text-primary" />
            2-minute personalized setup
          </DialogTitle>
          <DialogDescription>
            Help us tailor your studio path with a few genuine questions.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="onboarding-name">Name</Label>
              <Input id="onboarding-name" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Your full name" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="onboarding-age">Age</Label>
              <Input id="onboarding-age" value={age} onChange={(e) => setAge(e.target.value.replace(/[^0-9]/g, ''))} placeholder="e.g. 21" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Are you currently a...</Label>
              <Select value={roleTrack} onValueChange={setRoleTrack}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose one" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="college_student">College student</SelectItem>
                  <SelectItem value="architect">Architect</SelectItem>
                  <SelectItem value="freelancer">Freelancer</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>How did you find us?</Label>
              <Select value={discoverySource} onValueChange={setDiscoverySource}>
                <SelectTrigger>
                  <SelectValue placeholder="Select source" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="instagram">Instagram</SelectItem>
                  <SelectItem value="youtube">YouTube</SelectItem>
                  <SelectItem value="friend_referral">Friend referral</SelectItem>
                  <SelectItem value="google_search">Google search</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="onboarding-challenge">
              What issue are you facing that brought you here?
              <span className="text-xs text-muted-foreground font-normal ml-1">(min 12 characters)</span>
            </Label>
            <Textarea
              id="onboarding-challenge"
              value={primaryChallenge}
              onChange={(e) => setPrimaryChallenge(e.target.value)}
              placeholder="Tell us your genuine challenge (skills gap, software confusion, portfolio, job prep, etc.)"
              className="min-h-24"
            />
            <p className={`text-xs ${primaryChallenge.trim().length < 12 ? 'text-muted-foreground' : 'text-green-500'}`}>
              {primaryChallenge.trim().length}/12 characters minimum
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="onboarding-notes">Anything else we should know? (optional)</Label>
            <Textarea
              id="onboarding-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Your goal, timeline, or preferred software"
              className="min-h-20"
            />
          </div>

          {!isValid && (
            <p className="text-xs text-muted-foreground text-center">
              Please select your role, how you found us, and write at least 12 characters about your challenge.
            </p>
          )}
          <Button className="w-full" onClick={handleSubmit} disabled={!isValid || loading}>
            {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
            Save and continue
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
