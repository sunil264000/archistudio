import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Award, Download, ShieldCheck, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

interface Certificate {
  id: string;
  certificate_number: string;
  issued_at: string;
  pdf_url: string | null;
  course: {
    id: string;
    title: string;
    slug: string;
  };
}

export function Certificates() {
  const { user } = useAuth();
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState<string | null>(null);

  useEffect(() => {
    if (user) fetchCertificates();
  }, [user]);

  const fetchCertificates = async () => {
    if (!user) return;
    setLoading(true);

    const { data } = await supabase
      .from('certificates')
      .select(`
        id, certificate_number, issued_at, pdf_url,
        courses:course_id (id, title, slug)
      `)
      .eq('user_id', user.id)
      .order('issued_at', { ascending: false });

    setCertificates((data || []).map(c => ({
      ...c,
      course: c.courses as any,
    })));
    setLoading(false);
  };

  const downloadCertificate = async (cert: Certificate) => {
    if (cert.pdf_url) {
      window.open(cert.pdf_url, '_blank');
      return;
    }

    setGenerating(cert.id);
    try {
      const { data, error } = await supabase.functions.invoke('generate-certificate', {
        body: { certificateId: cert.id },
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
    } catch (error) {
      toast.error('Failed to generate certificate');
    } finally {
      setGenerating(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Award className="h-5 w-5 text-accent" />
          Proof of Completion
        </CardTitle>
        <CardDescription>Download your Archistudio certificates for completed studio programs</CardDescription>
      </CardHeader>
      <CardContent>
        {certificates.length === 0 ? (
          <div className="text-center py-12">
            <Award className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No completions yet</h3>
            <p className="text-muted-foreground text-sm">Complete a studio program to receive your proof of completion.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {certificates.map((cert) => (
              <div
                key={cert.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 border rounded-xl bg-gradient-to-r from-accent/5 via-transparent to-primary/5"
              >
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
                    <Award className="h-7 w-7 text-accent" />
                  </div>
                  <div className="space-y-1.5">
                    <h4 className="font-bold text-base text-foreground">{cert.course?.title}</h4>
                    <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                      <Badge variant="outline" className="font-mono text-xs">
                        #{cert.certificate_number}
                      </Badge>
                      <span>•</span>
                      <span>Issued {new Date(cert.issued_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-accent">
                      <ShieldCheck className="h-3.5 w-3.5" />
                      <span>Digitally Authenticated by Archistudio</span>
                    </div>
                  </div>
                </div>
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => downloadCertificate(cert)}
                  disabled={generating === cert.id}
                  className="shrink-0 gap-2"
                >
                  {generating === cert.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Download className="h-4 w-4" />
                      Download PDF
                    </>
                  )}
                </Button>
              </div>
            ))}

            <div className="flex items-center gap-2 pt-2 text-xs text-muted-foreground justify-center">
              <Sparkles className="h-3.5 w-3.5" />
              <span>All certificates are verifiable at archistudio.lovable.app/verify</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
