import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, ShieldCheck, Award, CheckCircle2, XCircle, Calendar, BookOpen, User } from 'lucide-react';
import { SEOHead } from '@/components/seo/SEOHead';

interface CertificateData {
  certificate_number: string;
  issued_at: string;
  student_name: string;
  course_title: string;
}

export default function VerifyCertificate() {
  const { certNumber } = useParams<{ certNumber: string }>();
  const [loading, setLoading] = useState(true);
  const [certificate, setCertificate] = useState<CertificateData | null>(null);

  useEffect(() => {
    if (certNumber) verifyCertificate(certNumber);
  }, [certNumber]);

  const verifyCertificate = async (num: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('verify-certificate', {
        body: { certificateNumber: num },
      });

      if (!error && data && !data.error) {
        setCertificate(data);
      } else {
        setCertificate(null);
      }
    } catch {
      setCertificate(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <SEOHead
        title="Verify Certificate | Archistudio"
        description="Verify the authenticity of an Archistudio Proof of Completion certificate."
      />
      <Navbar />
      <main className="min-h-screen bg-background flex items-center justify-center px-4 py-20">
        <div className="w-full max-w-lg">
          {loading ? (
            <div className="flex flex-col items-center gap-4 py-16">
              <Loader2 className="h-10 w-10 animate-spin text-accent" />
              <p className="text-muted-foreground">Verifying certificate...</p>
            </div>
          ) : certificate ? (
            <Card className="border-accent/20 shadow-2xl overflow-hidden">
              {/* Success header */}
              <div className="bg-gradient-to-r from-accent/10 via-accent/5 to-primary/5 p-6 text-center border-b border-accent/10">
                <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-3">
                  <CheckCircle2 className="h-9 w-9 text-green-500" />
                </div>
                <h1 className="text-xl font-bold text-foreground mb-1">Certificate Verified</h1>
                <p className="text-sm text-muted-foreground">This is an authentic Archistudio Proof of Completion</p>
              </div>

              <CardContent className="p-6 space-y-5">
                {/* Student */}
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                    <User className="h-5 w-5 text-accent" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Awarded To</p>
                    <p className="text-lg font-semibold text-foreground">{certificate.student_name}</p>
                  </div>
                </div>

                {/* Course */}
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <BookOpen className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Studio Program</p>
                    <p className="text-base font-medium text-foreground">{certificate.course_title}</p>
                  </div>
                </div>

                {/* Date & Certificate Number */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                      <Calendar className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Issued</p>
                      <p className="text-sm font-medium text-foreground">
                        {new Date(certificate.issued_at).toLocaleDateString('en-US', {
                          year: 'numeric', month: 'short', day: 'numeric',
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                      <Award className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Cert No.</p>
                      <Badge variant="outline" className="font-mono text-xs mt-0.5">
                        {certificate.certificate_number}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Authenticity badge */}
                <div className="flex items-center gap-2 p-3 rounded-lg bg-green-500/5 border border-green-500/15">
                  <ShieldCheck className="h-5 w-5 text-green-500 shrink-0" />
                  <p className="text-sm text-green-600 dark:text-green-400 font-medium">
                    Digitally Authenticated by Archistudio
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-destructive/20 shadow-xl overflow-hidden">
              <div className="p-8 text-center">
                <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
                  <XCircle className="h-9 w-9 text-destructive" />
                </div>
                <h1 className="text-xl font-bold text-foreground mb-2">Certificate Not Found</h1>
                <p className="text-muted-foreground text-sm mb-6">
                  No certificate with number <span className="font-mono font-medium">{certNumber}</span> was found. Please check the certificate number and try again.
                </p>
                <Button asChild variant="outline">
                  <Link to="/">Back to Home</Link>
                </Button>
              </div>
            </Card>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
