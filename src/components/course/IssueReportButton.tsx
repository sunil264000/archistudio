import { useState } from 'react';
import { AlertCircle, Camera, Send, X, Loader2, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface IssueReportButtonProps {
    courseId: string;
    courseTitle: string;
    lessonId?: string;
    lessonTitle?: string;
}

export function IssueReportButton({ courseId, courseTitle, lessonId, lessonTitle }: IssueReportButtonProps) {
    const { user } = useAuth();
    const [open, setOpen] = useState(false);
    const [issueText, setIssueText] = useState('');
    const [screenshot, setScreenshot] = useState<string | null>(null);
    const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const handleCapture = async () => {
        try {
            // Use screen capture API if available
            if (navigator.mediaDevices && 'getDisplayMedia' in navigator.mediaDevices) {
                const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
                const track = stream.getVideoTracks()[0];
                const imageCapture = new (window as any).ImageCapture(track);
                const bitmap = await imageCapture.grabFrame();
                track.stop();

                const canvas = document.createElement('canvas');
                canvas.width = bitmap.width;
                canvas.height = bitmap.height;
                const ctx = canvas.getContext('2d')!;
                ctx.drawImage(bitmap, 0, 0);
                const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
                setScreenshot(dataUrl);

                // Convert to File for upload
                const blob = await (await fetch(dataUrl)).blob();
                setScreenshotFile(new File([blob], 'screenshot.jpg', { type: 'image/jpeg' }));
            } else {
                toast.error('Screen capture not supported on this browser. Please upload a screenshot manually.');
            }
        } catch (err) {
            // User cancelled or permission denied
            console.log('Screen capture cancelled or failed:', err);
        }
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setScreenshotFile(file);
        const reader = new FileReader();
        reader.onload = (ev) => setScreenshot(ev.target?.result as string);
        reader.readAsDataURL(file);
    };

    const handleSubmit = async () => {
        if (!user) {
            toast.error('Please log in to report an issue');
            return;
        }
        if (!issueText.trim()) {
            toast.error('Please describe the issue');
            return;
        }

        setSubmitting(true);
        try {
            let screenshotUrl: string | null = null;

            // Upload screenshot to Supabase Storage if provided
            if (screenshotFile) {
                const fileName = `${user.id}/${Date.now()}_screenshot.jpg`;
                const { data: uploadData, error: uploadError } = await supabase.storage
                    .from('support-screenshots')
                    .upload(fileName, screenshotFile, { contentType: 'image/jpeg' });

                if (!uploadError && uploadData) {
                    const { data: urlData } = supabase.storage
                        .from('support-screenshots')
                        .getPublicUrl(fileName);
                    screenshotUrl = urlData.publicUrl;
                }
            }

            // Get user profile for email
            const { data: profile } = await supabase
                .from('profiles')
                .select('email, full_name')
                .eq('user_id', user.id)
                .single();

            // Insert support ticket (cast to any — new table not yet in generated types)
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { error } = await (supabase as any).from('support_tickets').insert({
                user_id: user.id,
                user_email: profile?.email || user.email || '',
                user_name: profile?.full_name || user.email || '',
                course_id: courseId,
                course_title: courseTitle,
                lesson_id: lessonId || null,
                lesson_title: lessonTitle || null,
                issue_text: issueText.trim(),
                screenshot_url: screenshotUrl,
                status: 'open',
            });

            if (error) throw error;

            setSubmitted(true);
            toast.success('Issue reported! Our team will review it shortly.');

            // Reset after a moment
            setTimeout(() => {
                setOpen(false);
                setSubmitted(false);
                setIssueText('');
                setScreenshot(null);
                setScreenshotFile(null);
            }, 2500);
        } catch (err: any) {
            console.error('Error submitting issue:', err);
            toast.error(err.message || 'Failed to submit issue. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    if (!user) return null;

    return (
        <>
            <Button
                variant="ghost"
                size="sm"
                onClick={() => setOpen(true)}
                className="gap-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 text-xs h-8"
                title="Report an issue with this lesson"
            >
                <AlertCircle className="h-3.5 w-3.5" />
                Report Issue
            </Button>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-base">
                            <AlertCircle className="h-4 w-4 text-destructive" />
                            Report an Issue
                        </DialogTitle>
                    </DialogHeader>

                    {submitted ? (
                        <div className="flex flex-col items-center gap-3 py-6 text-center">
                            <div className="h-14 w-14 rounded-full bg-success/10 flex items-center justify-center">
                                <CheckCircle className="h-7 w-7 text-success" />
                            </div>
                            <p className="font-semibold">Issue Reported!</p>
                            <p className="text-sm text-muted-foreground">Our team will review your report and get back to you.</p>
                        </div>
                    ) : (
                        <div className="space-y-4 pt-1">
                            {/* Context */}
                            <div className="flex flex-wrap gap-1.5">
                                <Badge variant="outline" className="text-xs">{courseTitle}</Badge>
                                {lessonTitle && (
                                    <Badge variant="outline" className="text-xs text-muted-foreground">{lessonTitle}</Badge>
                                )}
                            </div>

                            {/* Issue description */}
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium">Describe the issue</label>
                                <Textarea
                                    value={issueText}
                                    onChange={(e) => setIssueText(e.target.value)}
                                    placeholder="e.g. Video won't load, audio is out of sync, content is incorrect..."
                                    rows={4}
                                    className="text-sm resize-none"
                                />
                            </div>

                            {/* Screenshot */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Screenshot (optional)</label>
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={handleCapture}
                                        className="gap-1.5 text-xs flex-1"
                                        type="button"
                                    >
                                        <Camera className="h-3.5 w-3.5" />
                                        Capture Screen
                                    </Button>
                                    <label className="flex-1">
                                        <input
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            onChange={handleFileUpload}
                                        />
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="gap-1.5 text-xs w-full"
                                            type="button"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                (e.currentTarget.parentElement?.querySelector('input') as HTMLInputElement)?.click();
                                            }}
                                        >
                                            Upload Image
                                        </Button>
                                    </label>
                                </div>

                                {screenshot && (
                                    <div className="relative rounded-lg overflow-hidden border border-border/50">
                                        <img src={screenshot} alt="Screenshot" className="w-full max-h-32 object-cover" />
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="absolute top-1 right-1 h-6 w-6 bg-background/80 hover:bg-background"
                                            onClick={() => { setScreenshot(null); setScreenshotFile(null); }}
                                        >
                                            <X className="h-3 w-3" />
                                        </Button>
                                    </div>
                                )}
                            </div>

                            {/* Submit */}
                            <div className="flex gap-2 pt-1">
                                <Button variant="outline" size="sm" onClick={() => setOpen(false)} className="flex-1">
                                    Cancel
                                </Button>
                                <Button
                                    size="sm"
                                    onClick={handleSubmit}
                                    disabled={submitting || !issueText.trim()}
                                    className="flex-1 gap-1.5"
                                >
                                    {submitting ? (
                                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                    ) : (
                                        <Send className="h-3.5 w-3.5" />
                                    )}
                                    {submitting ? 'Sending...' : 'Submit Report'}
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
}
