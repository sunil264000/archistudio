import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { EmailAuthForm } from '@/components/auth/EmailAuthForm';
import { GoogleAuthButton } from '@/components/auth/GoogleAuthButton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, ShieldCheck, Zap, Users, BookOpen, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import logoMark from '@/assets/logo-mark.png';

const ease = [0.22, 1, 0.36, 1] as const;

const testimonial = {
  quote: "Archistudio helped me understand what real studios actually expect. The working drawing course completely changed my approach.",
  name: "Architecture Student",
  role: "B.Arch Graduate",
};

const features = [
  { icon: BookOpen, label: '15+ professional courses' },
  { icon: Users, label: 'Active community of 1,000+ students' },
  { icon: Star, label: 'Sheet reviews & daily challenges' },
  { icon: ShieldCheck, label: 'Studio Hub with protected escrow' },
];

export default function Auth() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [mode, setMode] = useState<'login' | 'signup'>(
    searchParams.get('mode') === 'signup' ? 'signup' : 'login'
  );

  // Resolve redirect: ?redirect= param takes priority, then ProtectedRoute state.from, then '/'
  const getRedirect = () =>
    searchParams.get('redirect') ||
    (location.state as any)?.from?.pathname ||
    '/';

  useEffect(() => {
    if (!loading && user) {
      navigate(getRedirect(), { replace: true });
    }
  }, [user, loading, navigate, searchParams]);

  const handleSuccess = () => {
    navigate(getRedirect(), { replace: true });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="relative h-10 w-10">
            <div className="absolute inset-0 rounded-full border-2 border-accent/20" />
            <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-accent animate-spin" />
          </div>
          <p className="text-xs text-muted-foreground tracking-widest uppercase animate-pulse">Loading</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-background relative overflow-hidden">
      {/* Left Panel — Branded (hidden on mobile) */}
      <div className="hidden lg:flex lg:w-[45%] xl:w-[40%] relative bg-foreground text-background flex-col justify-between p-12 overflow-hidden">
        {/* Ambient orbs */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-20 right-20 h-[300px] w-[300px] rounded-full bg-[radial-gradient(circle,hsl(var(--accent)/0.12),transparent_65%)] blur-3xl" />
          <div className="absolute bottom-20 left-10 h-[250px] w-[250px] rounded-full bg-[radial-gradient(circle,hsl(var(--blueprint)/0.08),transparent_65%)] blur-3xl" />
          <div className="absolute inset-0 dot-grid opacity-[0.04]" />
        </div>

        <div className="relative z-10">
          <Link to="/" className="flex items-center gap-2.5 mb-16 group">
            <img src={logoMark} alt="Archistudio" className="h-8 w-8 rounded-lg object-cover transition-transform group-hover:scale-110" />
            <span className="font-display font-bold text-lg text-background">Archistudio</span>
          </Link>

          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: ease as unknown as any }}
          >
            <h2 className="font-display text-3xl xl:text-4xl font-semibold tracking-tight leading-tight mb-6">
              Learn architecture
              <br />
              <span className="text-background/50 italic font-light">the way it's practiced.</span>
            </h2>

            <div className="space-y-4 mb-12">
              {features.map((f, i) => (
                <motion.div
                  key={f.label}
                  initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + i * 0.08, duration: 0.5, ease: ease as unknown as any }}
                  className="flex items-center gap-3"
                >
                  <div className="p-1.5 rounded-lg bg-accent/15">
                    <f.icon className="h-3.5 w-3.5 text-accent" />
                  </div>
                  <span className="text-sm text-background/70">{f.label}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Testimonial */}
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.8 }}
          className="relative z-10 p-6 rounded-2xl bg-background/5 border border-background/10 backdrop-blur-sm"
        >
          <p className="text-sm text-background/60 leading-relaxed italic mb-4">
            "{testimonial.quote}"
          </p>
          <div>
            <p className="text-sm font-medium text-background/80">{testimonial.name}</p>
            <p className="text-xs text-background/40">{testimonial.role}</p>
          </div>
        </motion.div>
      </div>

      {/* Right Panel — Auth Form */}
      <div className="flex-1 flex flex-col">
        {/* Mobile header */}
        <header className="border-b border-border lg:border-0">
          <div className="container-wide py-4 flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="h-4 w-4" />
              <span className="text-sm">Back to home</span>
            </Link>
            <Link to="/" className="flex items-center gap-2 lg:hidden">
              <img src={logoMark} alt="Archistudio" className="h-6 w-6 rounded-md object-cover" />
              <span className="font-display font-bold text-base">Archistudio</span>
            </Link>
          </div>
        </header>

        <main className="flex-1 flex items-center justify-center py-12 px-4 relative">
          <div className="absolute inset-0 dot-grid opacity-10 pointer-events-none lg:hidden" />
          <motion.div
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: ease as unknown as any }}
            className="w-full max-w-md relative"
          >
            <Card className="card-premium border-border shadow-medium">
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
                      Or continue with email
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
                    <Link to="/reset-password" className="text-sm text-muted-foreground hover:text-accent transition-colors">
                      Forgot your password?
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Trust badges */}
            <div className="flex flex-wrap items-center justify-center gap-3 mt-6">
              {[
                { icon: ShieldCheck, label: 'Secure' },
                { icon: Zap, label: 'Instant access' },
                { icon: Users, label: 'Free to join' },
              ].map(b => (
                <span key={b.label} className="trust-badge text-[11px]">
                  <b.icon className="h-3 w-3 text-accent" />
                  {b.label}
                </span>
              ))}
            </div>

            {/* Terms */}
            <p className="mt-5 text-center text-xs text-muted-foreground">
              By continuing, you agree to our{' '}
              <Link to="/terms" className="underline hover:text-foreground">
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link to="/terms" className="underline hover:text-foreground">
                Privacy Policy
              </Link>
            </p>
          </motion.div>
        </main>
      </div>
    </div>
  );
}
