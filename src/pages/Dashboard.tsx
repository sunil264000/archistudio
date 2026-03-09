import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ShieldCheck, BookOpen, Award, BarChart3, Gift, Library, Search, Lock, Compass, FileImage, Zap, Bell } from 'lucide-react';
import { EnrolledCourses } from '@/components/dashboard/EnrolledCourses';
import { Certificates } from '@/components/dashboard/Certificates';
import { ProgressAnalytics } from '@/components/dashboard/ProgressAnalytics';
import { ReferralSection } from '@/components/dashboard/ReferralSection';
import { PurchasedEbooks } from '@/components/dashboard/PurchasedEbooks';
import { JourneyOverview } from '@/components/dashboard/JourneyOverview';
import { SheetCritiqueFeed } from '@/components/dashboard/SheetCritiqueFeed';
import { UnifiedSearch } from '@/components/dashboard/UnifiedSearch';
import { ContinueLearning } from '@/components/dashboard/ContinueLearning';
import { LiveCommunityFeed } from '@/components/dashboard/LiveCommunityFeed';
import { SkillTree } from '@/components/dashboard/SkillTree';
import { AnimatedBackground } from '@/components/layout/AnimatedBackground';
import { ProfileCompletion } from '@/components/profile/ProfileCompletion';
import { UsernameSetup } from '@/components/profile/UsernameSetup';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, CheckCircle2, XCircle, User, BookOpen as BookOpenIcon, Calendar, Users, Activity } from 'lucide-react';

function AccountTab() {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) { toast.error('New passwords do not match'); return; }
    if (newPassword.length < 8) { toast.error('Password must be at least 8 characters'); return; }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) { toast.error(error.message); }
      else { setSuccess(true); setNewPassword(''); setConfirmPassword(''); toast.success('Password updated!'); setTimeout(() => setSuccess(false), 4000); }
    } finally { setLoading(false); }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Lock className="h-5 w-5 text-accent" /> Change Password</CardTitle>
        <CardDescription>Update your account password.</CardDescription>
      </CardHeader>
      <CardContent>
        {success ? (
          <div className="flex items-center gap-3 p-4 rounded-lg bg-accent/10 border border-accent/20 text-accent">
            <CheckCircle2 className="h-5 w-5 shrink-0" />
            <p className="text-sm font-medium">Password updated successfully!</p>
          </div>
        ) : (
          <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">New Password</label>
              <Input type="password" placeholder="At least 8 characters" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength={8} className="bg-background" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Confirm New Password</label>
              <Input type="password" placeholder="Repeat new password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required className="bg-background" />
            </div>
            <Button type="submit" disabled={loading} className="w-full sm:w-auto">
              {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Updating...</> : 'Update Password'}
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}

function VerifyTab() {
  const [certNumber, setCertNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [searched, setSearched] = useState(false);

  const handleVerify = async () => {
    if (!certNumber.trim()) return;
    setLoading(true); setSearched(true);
    try {
      const { data, error } = await supabase.functions.invoke('verify-certificate', { body: { certificateNumber: certNumber.trim() } });
      setResult(!error && data && !data.error ? data : null);
    } catch { setResult(null); toast.error('Verification failed'); }
    finally { setLoading(false); }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-accent" /> Verify Certificate</CardTitle>
        <CardDescription>Enter a certificate number to verify its authenticity</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex gap-3 max-w-md">
          <Input placeholder="e.g. ASMLMF2ZG9JWH1" value={certNumber} onChange={(e) => setCertNumber(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleVerify()} className="font-mono" />
          <Button onClick={handleVerify} disabled={loading || !certNumber.trim()}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Verify'}
          </Button>
        </div>
        {searched && !loading && (
          result ? (
            <div className="p-5 rounded-xl border border-accent/20 bg-gradient-to-r from-accent/5 via-transparent to-primary/5 space-y-4 max-w-md">
              <div className="flex items-center gap-2 text-accent"><CheckCircle2 className="h-5 w-5" /><span className="font-semibold text-sm">Certificate Verified ✓</span></div>
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
  const { profile, isAdmin } = useAuth();
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-background overflow-hidden">
      <Navbar />
      <AnimatedBackground intensity="light" />
      <main className="flex-1 py-8">
        <div className="container mx-auto px-4 space-y-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Welcome, {profile?.full_name || 'Student'}!</h1>
              <p className="text-muted-foreground">Your learning journey at a glance</p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => setSearchOpen(true)} className="gap-2">
                <Search className="h-4 w-4" /> Search
              </Button>
              {isAdmin && (
                <Link to="/admin">
                  <Button className="gap-2"><ShieldCheck className="h-4 w-4" /> Admin</Button>
                </Link>
              )}
            </div>
          </div>

          <Tabs defaultValue="journey" className="space-y-6">
            <TabsList className="w-full max-w-3xl overflow-x-auto flex no-scrollbar">
              <TabsTrigger value="journey" className="flex-1 gap-1.5 text-xs sm:text-sm px-2 sm:px-3">
                <Compass className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">Journey</span>
              </TabsTrigger>
              <TabsTrigger value="courses" className="flex-1 gap-1.5 text-xs sm:text-sm px-2 sm:px-3">
                <BookOpen className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">Courses</span>
              </TabsTrigger>
              <TabsTrigger value="sheets" className="flex-1 gap-1.5 text-xs sm:text-sm px-2 sm:px-3">
                <FileImage className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">Sheets</span>
              </TabsTrigger>
              <TabsTrigger value="ebooks" className="flex-1 gap-1.5 text-xs sm:text-sm px-2 sm:px-3">
                <Library className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">eBooks</span>
              </TabsTrigger>
              <TabsTrigger value="progress" className="flex-1 gap-1.5 text-xs sm:text-sm px-2 sm:px-3">
                <BarChart3 className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">Progress</span>
              </TabsTrigger>
              <TabsTrigger value="certificates" className="flex-1 gap-1.5 text-xs sm:text-sm px-2 sm:px-3">
                <Award className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">Certs</span>
              </TabsTrigger>
              <TabsTrigger value="referrals" className="flex-1 gap-1.5 text-xs sm:text-sm px-2 sm:px-3">
                <Gift className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">Refer</span>
              </TabsTrigger>
              <TabsTrigger value="verify" className="flex-1 gap-1.5 text-xs sm:text-sm px-2 sm:px-3">
                <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">Verify</span>
              </TabsTrigger>
              <TabsTrigger value="account" className="flex-1 gap-1.5 text-xs sm:text-sm px-2 sm:px-3">
                <Lock className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">Account</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="journey">
              <div className="grid lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                  <ContinueLearning />
                  <JourneyOverview />
                </div>
                <div className="space-y-6">
                  <ProfileCompletion />
                  <UsernameSetup />
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Activity className="h-4 w-4 text-accent" /> Community Activity
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <LiveCommunityFeed maxItems={10} />
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>
            <TabsContent value="courses"><EnrolledCourses /></TabsContent>
            <TabsContent value="sheets"><SheetCritiqueFeed /></TabsContent>
            <TabsContent value="ebooks"><PurchasedEbooks /></TabsContent>
            <TabsContent value="progress"><ProgressAnalytics /></TabsContent>
            <TabsContent value="certificates"><Certificates /></TabsContent>
            <TabsContent value="referrals"><ReferralSection /></TabsContent>
            <TabsContent value="verify"><VerifyTab /></TabsContent>
            <TabsContent value="account"><AccountTab /></TabsContent>
          </Tabs>

          <UnifiedSearch open={searchOpen} onOpenChange={setSearchOpen} />
        </div>
      </main>
      <Footer />
    </div>
  );
}
