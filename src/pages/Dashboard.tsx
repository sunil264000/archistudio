import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ShieldCheck, BookOpen, Award, BarChart3, Gift, Library, Search } from 'lucide-react';
import { EnrolledCourses } from '@/components/dashboard/EnrolledCourses';
import { Certificates } from '@/components/dashboard/Certificates';
import { ProgressAnalytics } from '@/components/dashboard/ProgressAnalytics';
import { ReferralSection } from '@/components/dashboard/ReferralSection';
import { PurchasedEbooks } from '@/components/dashboard/PurchasedEbooks';
import { AnimatedBackground } from '@/components/layout/AnimatedBackground';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, CheckCircle2, XCircle, User, BookOpen as BookOpenIcon, Calendar } from 'lucide-react';

function VerifyTab() {
  const [certNumber, setCertNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [searched, setSearched] = useState(false);

  const handleVerify = async () => {
    if (!certNumber.trim()) return;
    setLoading(true);
    setSearched(true);
    try {
      const { data, error } = await supabase.functions.invoke('verify-certificate', {
        body: { certificateNumber: certNumber.trim() },
      });
      if (!error && data && !data.error) {
        setResult(data);
      } else {
        setResult(null);
      }
    } catch {
      setResult(null);
      toast.error('Verification failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-accent" />
          Verify Certificate
        </CardTitle>
        <CardDescription>Enter a certificate number to verify its authenticity</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex gap-3 max-w-md">
          <Input
            placeholder="e.g. ASMLMF2ZG9JWH1"
            value={certNumber}
            onChange={(e) => setCertNumber(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleVerify()}
            className="font-mono"
          />
          <Button onClick={handleVerify} disabled={loading || !certNumber.trim()}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Verify'}
          </Button>
        </div>

        {searched && !loading && (
          result ? (
            <div className="p-5 rounded-xl border border-accent/20 bg-gradient-to-r from-accent/5 via-transparent to-primary/5 space-y-4 max-w-md">
              <div className="flex items-center gap-2 text-green-500">
                <CheckCircle2 className="h-5 w-5" />
                <span className="font-semibold text-sm">Certificate Verified ✓</span>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2"><User className="h-4 w-4 text-muted-foreground" /> <span className="font-medium">{result.student_name}</span></div>
                <div className="flex items-center gap-2"><BookOpenIcon className="h-4 w-4 text-muted-foreground" /> <span>{result.course_title}</span></div>
                <div className="flex items-center gap-2"><Calendar className="h-4 w-4 text-muted-foreground" /> <span>{new Date(result.issued_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</span></div>
              </div>
              <Badge variant="outline" className="font-mono text-xs">#{result.certificate_number}</Badge>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-destructive p-4 rounded-lg border border-destructive/20 max-w-md">
              <XCircle className="h-5 w-5" />
              <span className="text-sm font-medium">No certificate found with that number</span>
            </div>
          )
        )}
      </CardContent>
    </Card>
  );
}

export default function Dashboard() {
  const { user, profile, loading, isAdmin } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth', { replace: true });
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background overflow-hidden">
      <Navbar />
      
      {/* Animated Background */}
      <AnimatedBackground intensity="light" showOrbs={true} showGrid={false} />
      <main className="flex-1 py-8">
        <div className="container mx-auto px-4 space-y-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Welcome, {profile?.full_name || 'Student'}!</h1>
              <p className="text-muted-foreground">Continue your practice</p>
            </div>
            {isAdmin && (
              <Link to="/admin">
                <Button className="gap-2">
                  <ShieldCheck className="h-4 w-4" />
                  Admin Panel
                </Button>
              </Link>
            )}
          </div>

          <Tabs defaultValue="courses" className="space-y-6">
            <TabsList className="grid w-full grid-cols-6 max-w-2xl overflow-x-auto">
              <TabsTrigger value="courses" className="gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3">
                <BookOpen className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="hidden xs:inline sm:inline">Studios</span>
              </TabsTrigger>
              <TabsTrigger value="ebooks" className="gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3">
                <Library className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="hidden xs:inline sm:inline">eBooks</span>
              </TabsTrigger>
              <TabsTrigger value="progress" className="gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3">
                <BarChart3 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="hidden xs:inline sm:inline">Progress</span>
              </TabsTrigger>
              <TabsTrigger value="certificates" className="gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3">
                <Award className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="hidden xs:inline sm:inline">Certs</span>
              </TabsTrigger>
              <TabsTrigger value="verify" className="gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3">
                <Search className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="hidden xs:inline sm:inline">Verify</span>
              </TabsTrigger>
              <TabsTrigger value="referrals" className="gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3">
                <Gift className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="hidden xs:inline sm:inline">Refer</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="courses">
              <EnrolledCourses />
            </TabsContent>

            <TabsContent value="ebooks">
              <PurchasedEbooks />
            </TabsContent>

            <TabsContent value="progress">
              <ProgressAnalytics />
            </TabsContent>

            <TabsContent value="certificates">
              <Certificates />
            </TabsContent>

            <TabsContent value="verify">
              <VerifyTab />
            </TabsContent>

            <TabsContent value="referrals">
              <ReferralSection />
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Footer />
    </div>
  );
}