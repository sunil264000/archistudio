import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { EmailAuthForm } from '@/components/auth/EmailAuthForm';
import { GoogleAuthButton } from '@/components/auth/GoogleAuthButton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { AnimatedBackground } from '@/components/layout/AnimatedBackground';

export default function Auth() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [mode, setMode] = useState<'login' | 'signup'>(
    searchParams.get('mode') === 'signup' ? 'signup' : 'login'
  );

  useEffect(() => {
    if (!loading && user) {
      const redirect = searchParams.get('redirect') || '/';
      navigate(redirect, { replace: true });
    }
  }, [user, loading, navigate, searchParams]);

  const handleSuccess = () => {
    const redirect = searchParams.get('redirect') || '/';
    navigate(redirect, { replace: true });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-muted" />
          <div className="h-4 w-32 rounded bg-muted" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background relative overflow-hidden">
      {/* Animated Background */}
      <AnimatedBackground intensity="light" />
      {/* Header */}
      <header className="border-b border-border">
        <div className="container-wide py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" />
            <span className="text-sm">Back to home</span>
          </Link>
          <Link to="/" className="font-display font-bold text-xl tracking-tight">
            Archistudio
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center py-12 px-4">
        <div className="w-full max-w-md">
          <Card className="border-border shadow-medium">
            <CardHeader className="text-center pb-2">
              <CardTitle className="text-2xl font-display">
                {mode === 'login' ? 'Welcome back' : 'Create your account'}
              </CardTitle>
              <CardDescription>
                {mode === 'login'
                  ? 'Sign in to access your courses and continue learning'
                  : 'Join thousands of architects mastering their craft'}
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Google Sign In */}
              <GoogleAuthButton />

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <Separator className="w-full" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">
                    Or continue with
                  </span>
                </div>
              </div>

              {/* Email Auth Form */}
              <EmailAuthForm mode={mode} onSuccess={handleSuccess} />

              {/* Toggle Login/Signup */}
              <div className="text-center text-sm">
                {mode === 'login' ? (
                  <p className="text-muted-foreground">
                    Don't have an account?{' '}
                    <button
                      type="button"
                      onClick={() => setMode('signup')}
                      className="text-accent hover:underline font-medium"
                    >
                      Sign up
                    </button>
                  </p>
                ) : (
                  <p className="text-muted-foreground">
                    Already have an account?{' '}
                    <button
                      type="button"
                      onClick={() => setMode('login')}
                      className="text-accent hover:underline font-medium"
                    >
                      Sign in
                    </button>
                  </p>
                )}
              </div>

              {/* Forgot Password */}
              {mode === 'login' && (
                <div className="text-center">
                  <Link to="/reset-password" className="text-sm text-muted-foreground hover:text-accent">
                    Forgot your password?
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Terms */}
          <p className="mt-6 text-center text-xs text-muted-foreground">
            By continuing, you agree to our{' '}
            <Link to="/terms" className="underline hover:text-foreground">
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link to="/privacy" className="underline hover:text-foreground">
              Privacy Policy
            </Link>
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-6">
        <div className="container-wide text-center text-sm text-muted-foreground">
          <p>© 2024 Archistudio. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
