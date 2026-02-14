import { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Award, Download, Loader2, PartyPopper, Star } from 'lucide-react';
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

  const handleDownloadCertificate = async () => {
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-certificate', {
        body: { userId, courseId },
      });

      if (error) throw error;

      // The function returns HTML - open it in a new tab for printing/saving as PDF
      if (typeof data === 'string') {
        const blob = new Blob([data], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
      } else if (data?.pdfUrl) {
        window.open(data.pdfUrl, '_blank');
      }

      toast.success('Certificate opened! Use Ctrl+P to save as PDF.');
    } catch (err) {
      console.error('Certificate generation error:', err);
      toast.error('Failed to generate certificate. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md border-0 bg-gradient-to-br from-card via-card to-accent/5 overflow-hidden">
        {/* Decorative elements */}
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

          {/* Congratulation text */}
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-foreground">
              🎉 Congratulations!
            </h2>
            <p className="text-muted-foreground text-sm leading-relaxed max-w-xs mx-auto">
              You have successfully completed
            </p>
            <p className="text-lg font-semibold text-accent">
              {courseName}
            </p>
            <p className="text-muted-foreground text-xs">
              Your Proof of Completion is ready!
            </p>
          </div>

          {/* Certificate preview card */}
          <div className="mx-auto max-w-xs p-4 rounded-xl border bg-gradient-to-br from-background to-muted/30 shadow-inner">
            <div className="border border-dashed border-accent/30 rounded-lg p-3 space-y-1">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Proof of Completion</p>
              <p className="text-sm font-semibold text-foreground">{courseName}</p>
              <p className="text-[10px] text-muted-foreground">
                Issued on {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
              <p className="text-[10px] text-muted-foreground italic">Signed by Sunil Kumar • Archistudio</p>
            </div>
          </div>

          {/* Actions */}
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
                  Download Certificate
                </>
              )}
            </Button>
            <Button
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="text-muted-foreground"
            >
              Maybe Later
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
