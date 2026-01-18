import { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { ShieldCheck } from 'lucide-react';
import { EnrolledCourses } from '@/components/dashboard/EnrolledCourses';
import { Certificates } from '@/components/dashboard/Certificates';

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
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
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

          <EnrolledCourses />
          <Certificates />
        </div>
      </main>
      <Footer />
    </div>
  );
}
