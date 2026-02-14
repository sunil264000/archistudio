import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Award, Download, ExternalLink } from 'lucide-react';
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
      
      if (typeof data === 'string') {
        const blob = new Blob([data], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
        toast.success('Certificate opened! Use Ctrl+P to save as PDF.');
      } else if (data?.pdfUrl) {
        window.open(data.pdfUrl, '_blank');
        fetchCertificates();
      }
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
          <Award className="h-5 w-5" />
          Proof of Completion
        </CardTitle>
        <CardDescription>Documentation of your completed studio programs</CardDescription>
      </CardHeader>
      <CardContent>
        {certificates.length === 0 ? (
          <div className="text-center py-12">
            <Award className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No completions yet</h3>
            <p className="text-muted-foreground">Complete a studio program to receive your proof of completion.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {certificates.map((cert) => (
              <div
                key={cert.id}
                className="flex items-center justify-between p-4 border rounded-lg bg-gradient-to-r from-primary/5 to-transparent"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Award className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold">{cert.course?.title}</h4>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Badge variant="outline" className="font-mono text-xs">
                        #{cert.certificate_number}
                      </Badge>
                      <span>•</span>
                      <span>Issued {new Date(cert.issued_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => downloadCertificate(cert)}
                    disabled={generating === cert.id}
                  >
                    {generating === cert.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </>
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
