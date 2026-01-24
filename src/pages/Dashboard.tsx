import { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ShieldCheck, BookOpen, Award, BarChart3, Gift } from 'lucide-react';
import { EnrolledCourses } from '@/components/dashboard/EnrolledCourses';
import { Certificates } from '@/components/dashboard/Certificates';
import { ProgressAnalytics } from '@/components/dashboard/ProgressAnalytics';
import { ReferralSection } from '@/components/dashboard/ReferralSection';
import { AnimatedBackground } from '@/components/layout/AnimatedBackground';

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
              <p className="text-muted-foreground">Continue your learning journey</p>
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
            <TabsList className="grid w-full grid-cols-4 max-w-lg">
              <TabsTrigger value="courses" className="gap-2">
                <BookOpen className="h-4 w-4" />
                <span className="hidden sm:inline">Courses</span>
              </TabsTrigger>
              <TabsTrigger value="progress" className="gap-2">
                <BarChart3 className="h-4 w-4" />
                <span className="hidden sm:inline">Progress</span>
              </TabsTrigger>
              <TabsTrigger value="certificates" className="gap-2">
                <Award className="h-4 w-4" />
                <span className="hidden sm:inline">Certificates</span>
              </TabsTrigger>
              <TabsTrigger value="referrals" className="gap-2">
                <Gift className="h-4 w-4" />
                <span className="hidden sm:inline">Referrals</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="courses">
              <EnrolledCourses />
            </TabsContent>

            <TabsContent value="progress">
              <ProgressAnalytics />
            </TabsContent>

            <TabsContent value="certificates">
              <Certificates />
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
