import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { 
  ArrowRight, 
  BookOpen, 
  CheckCircle, 
  GraduationCap, 
  Layers,
  LogOut,
  User
} from 'lucide-react';

export default function Index() {
  const { user, profile, signOut, loading } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <nav className="container-wide py-4 flex items-center justify-between">
          <Link to="/" className="font-display font-bold text-2xl tracking-tight">
            ArchLearn
          </Link>

          <div className="flex items-center gap-4">
            {loading ? (
              <div className="h-10 w-24 animate-pulse rounded bg-muted" />
            ) : user ? (
              <div className="flex items-center gap-3">
                <Link to="/dashboard">
                  <Button variant="ghost" size="sm" className="gap-2">
                    <User className="h-4 w-4" />
                    {profile?.full_name || 'Dashboard'}
                  </Button>
                </Link>
                <Button variant="outline" size="sm" onClick={signOut} className="gap-2">
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/auth">
                  <Button variant="ghost" size="sm">Sign In</Button>
                </Link>
                <Link to="/auth?mode=signup">
                  <Button size="sm" className="gap-2">
                    Get Started
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="section-padding">
        <div className="container-wide">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <div className="inline-block px-4 py-1.5 rounded-full bg-secondary text-secondary-foreground text-sm font-medium">
              Master Architecture Through Practice
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold tracking-tight leading-tight">
              Learn Architecture the Way{' '}
              <span className="text-accent">It Is Actually Practiced</span>
            </h1>
            
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              From site analysis to working drawings, construction logic to sustainability — 
              practical skills that colleges don't teach but the industry demands.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/auth?mode=signup">
                <Button size="lg" className="gap-2 text-base px-8">
                  Start Learning Free
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
              <Link to="/courses">
                <Button variant="outline" size="lg" className="gap-2 text-base px-8">
                  <BookOpen className="h-5 w-5" />
                  Browse Courses
                </Button>
              </Link>
            </div>

            {/* Trust indicators */}
            <div className="flex flex-wrap items-center justify-center gap-8 pt-8 text-muted-foreground">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-success" />
                <span className="text-sm">No prior CAD knowledge needed</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-success" />
                <span className="text-sm">Learn at your own pace</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-success" />
                <span className="text-sm">Certificate on completion</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Problem Statement Section */}
      <section className="section-padding bg-secondary/30">
        <div className="container-wide">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <h2 className="text-3xl md:text-4xl font-display font-bold">
              Architecture College Taught You Theory.{' '}
              <span className="text-muted-foreground">But Not How to Practice.</span>
            </h2>
            <p className="text-lg text-muted-foreground">
              You learned history, design concepts, and software basics. But when it comes to 
              reading a structural drawing, understanding construction sequences, or coordinating 
              with contractors — most graduates are lost. We fix that.
            </p>
          </div>
        </div>
      </section>

      {/* What You'll Learn Section */}
      <section className="section-padding">
        <div className="container-wide">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
              What You'll Actually Learn
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Practical, industry-relevant skills organized into progressive modules
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Layers, title: 'Site Analysis', desc: 'Read sites like seasoned architects' },
              { icon: BookOpen, title: 'Working Drawings', desc: 'Create drawings contractors can build from' },
              { icon: GraduationCap, title: 'Construction Logic', desc: 'Understand how buildings go up' },
              { icon: CheckCircle, title: 'Sustainability', desc: 'Design for climate and energy efficiency' },
            ].map((item, i) => (
              <div 
                key={i}
                className="card-architectural p-6 rounded-lg bg-card border border-border"
              >
                <item.icon className="h-10 w-10 text-accent mb-4" />
                <h3 className="font-semibold text-lg mb-2">{item.title}</h3>
                <p className="text-muted-foreground text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="section-padding bg-primary text-primary-foreground">
        <div className="container-wide text-center space-y-6">
          <h2 className="text-3xl md:text-4xl font-display font-bold">
            Stop Guessing Architecture.{' '}
            <span className="opacity-80">Start Understanding It.</span>
          </h2>
          <p className="text-lg opacity-80 max-w-2xl mx-auto">
            Join architects and students who are building real skills for real projects.
          </p>
          <Link to="/auth?mode=signup">
            <Button 
              size="lg" 
              variant="secondary" 
              className="gap-2 text-base px-8 mt-4"
            >
              Create Free Account
              <ArrowRight className="h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12">
        <div className="container-wide">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="font-display font-bold text-xl">ArchLearn</div>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <Link to="/courses" className="hover:text-foreground transition-colors">Courses</Link>
              <Link to="/pricing" className="hover:text-foreground transition-colors">Pricing</Link>
              <Link to="/about" className="hover:text-foreground transition-colors">About</Link>
              <Link to="/contact" className="hover:text-foreground transition-colors">Contact</Link>
            </div>
            <div className="text-sm text-muted-foreground">
              © 2024 ArchLearn. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
