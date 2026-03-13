import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { ArrowRight, LogOut, User, Menu, X, Moon, Sun, ShieldCheck, Library, ChevronDown } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import logoMark from '@/assets/logo-mark.png';
import { useState, useEffect } from 'react';
import { CartSheet } from '@/components/cart/CartSheet';
import { supabase } from '@/integrations/supabase/client';
import { GlobalSearch } from '@/components/search/GlobalSearch';
import { NotificationCenter } from '@/components/notifications/NotificationCenter';

export function Navbar() {
  const { user, profile, signOut, loading, isAdmin } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== 'undefined') {
      return document.documentElement.classList.contains('dark');
    }
    return true;
  });

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Notifications are now handled by the NotificationCenter component

  const toggleDarkMode = () => {
    const newDark = !isDark;
    setIsDark(newDark);
    document.documentElement.classList.toggle('dark', newDark);
    localStorage.setItem('theme', newDark ? 'dark' : 'light');
  };

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') {
      document.documentElement.classList.remove('dark');
      setIsDark(false);
    } else {
      document.documentElement.classList.add('dark');
      setIsDark(true);
    }
  }, []);

  const navLinks = [
    { to: '/courses', label: 'Courses' },
    { to: '/explore', label: 'Explore' },
    { to: '/roadmaps', label: 'Paths' },
    { to: '/ebooks', label: 'eBooks', icon: Library },
    ...(user ? [{ to: '/studio', label: 'Studio' }] : []),
  ];

  const communityLinks = [
    { to: '/forum', label: 'Forum' },
    { to: '/sheets', label: 'Sheet Reviews' },
    { to: '/competitions', label: 'Competitions' },
    { to: '/challenges', label: 'Daily Challenges' },
    { to: '/internships', label: 'Internships' },
    { to: '/resources', label: 'Resources' },
    { to: '/leaderboard', label: 'Leaderboard' },
    { to: '/learning-map', label: 'Learning Map' },
    { to: '/portfolios', label: 'Portfolios' },
    { to: '/case-studies', label: 'Case Studies' },
    ...(user ? [{ to: '/portfolio/build', label: 'My Portfolio' }] : []),
    { to: '/blog', label: 'Blog' },
  ];

  const mobileLinks = [
    { to: '/courses', label: 'Courses' },
    { to: '/explore', label: 'Explore' },
    { to: '/roadmaps', label: 'Learning Paths' },
    { to: '/learning-map', label: 'Learning Map' },
    { to: '/ebooks', label: 'eBooks' },
    { to: '/forum', label: 'Forum' },
    { to: '/sheets', label: 'Sheet Reviews' },
    { to: '/competitions', label: 'Challenges' },
    { to: '/internships', label: 'Internships' },
    { to: '/portfolios', label: 'Portfolios' },
    { to: '/case-studies', label: 'Case Studies' },
    ...(user ? [{ to: '/portfolio/build', label: 'My Portfolio' }, { to: '/studio', label: 'Studio' }] : []),
    { to: '/resources', label: 'Resources' },
    { to: '/leaderboard', label: 'Leaderboard' },
    { to: '/blog', label: 'Blog' },
  ];

  return (
    <header 
      className={`sticky z-50 transition-all duration-300 ${
        scrolled 
          ? 'glass shadow-soft' 
          : 'border-b border-transparent bg-transparent'
      }`}
      style={{ top: 'var(--sale-banner-height, 0px)' }}
    >
      <nav className="container-wide py-3 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="group flex items-center gap-2.5 shrink-0 mr-4">
          <img src={logoMark} alt="Archistudio" className="h-8 w-8 rounded-lg object-cover" />
          <span className="font-display font-bold text-base tracking-tight text-foreground whitespace-nowrap">
            Archistudio
          </span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-1">
          <div className="flex items-center gap-0.5">
            {navLinks.map((link) => (
              <Link 
                key={link.to}
                to={link.to} 
                className="px-3.5 py-2 rounded-lg text-body-sm text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-all duration-300 flex items-center gap-1.5"
              >
                {link.icon && <link.icon className="h-3.5 w-3.5" />}
                {link.label}
              </Link>
            ))}

            {/* Community dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger className="px-3.5 py-2 rounded-lg text-body-sm text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-all duration-300 flex items-center gap-1 outline-none">
                Community <ChevronDown className="h-3 w-3" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-44">
                {communityLinks.map(link => (
                  <DropdownMenuItem key={link.to} asChild>
                    <Link to={link.to} className="cursor-pointer text-body-sm">{link.label}</Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="w-px h-5 bg-border/40 mx-1" />

          <GlobalSearch />

          <div className="w-px h-5 bg-border/40 mx-1" />

          <CartSheet />

          {/* Notification Center */}
          {user && <NotificationCenter />}

          <Button variant="ghost" size="icon" onClick={toggleDarkMode} className="rounded-lg">
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>

          {loading ? (
            <div className="h-9 w-20 animate-pulse rounded-lg bg-muted" />
          ) : user ? (
            <div className="flex items-center gap-2 ml-1">
              {isAdmin && (
                <Link to="/admin">
                  <Button variant="ghost" size="sm" className="gap-1.5 text-accent text-body-sm">
                    <ShieldCheck className="h-4 w-4" />
                    Admin
                  </Button>
                </Link>
              )}
              <Link to="/dashboard">
                <Button variant="ghost" size="sm" className="gap-1.5 text-body-sm">
                  <User className="h-4 w-4" />
                  {profile?.full_name || 'Dashboard'}
                </Button>
              </Link>
              <Button variant="outline" size="sm" onClick={signOut} className="gap-1.5">
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2 ml-1">
              <Link to="/auth">
                <Button variant="ghost" size="sm" className="text-body-sm">Sign In</Button>
              </Link>
              <Link to="/auth?mode=signup">
                <Button size="sm" className="gap-1.5 group bg-accent text-accent-foreground hover:bg-accent/90 shadow-[0_0_16px_hsl(var(--accent)/0.15)] text-body-sm">
                  Get Started
                  <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5" />
                </Button>
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Right Actions */}
        <div className="md:hidden flex items-center gap-1.5">
          {!loading && !user && (
            <Link to="/auth?mode=signup">
              <Button size="sm" className="gap-1 bg-accent text-accent-foreground hover:bg-accent/90 text-xs px-3 h-8">
                Get Started
                <ArrowRight className="h-3 w-3" />
              </Button>
            </Link>
          )}
          {!loading && user && (
            <Link to="/dashboard">
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg">
                <User className="h-4 w-4" />
              </Button>
            </Link>
          )}
          <button
            className="p-2.5 rounded-lg hover:bg-muted transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-border/30 bg-card safe-area-inset">
          <div className="p-5 space-y-1.5">
            {mobileLinks.map((link) => (
              <Link 
                key={link.to}
                to={link.to} 
                className="block text-foreground py-3 px-4 rounded-lg hover:bg-secondary transition-colors text-body font-medium touch-target"
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            
            <button 
              onClick={() => { toggleDarkMode(); setMobileMenuOpen(false); }}
              className="w-full text-left text-foreground py-3 px-4 rounded-lg hover:bg-secondary transition-colors flex items-center gap-2.5 text-body font-medium touch-target"
            >
              {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              {isDark ? 'Light Mode' : 'Dark Mode'}
            </button>
            
            <div className="pt-4 border-t border-border space-y-2">
              {!loading && user ? (
                <>
                  {isAdmin && (
                    <Link to="/admin" onClick={() => setMobileMenuOpen(false)}>
                      <Button variant="outline" className="w-full gap-2 min-h-[48px] text-body text-accent">
                        <ShieldCheck className="h-5 w-5" />
                        Admin Panel
                      </Button>
                    </Link>
                  )}
                  <Link to="/dashboard" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="ghost" className="w-full gap-2 justify-start min-h-[48px] text-body">
                      <User className="h-5 w-5" />
                      {profile?.full_name || 'Dashboard'}
                    </Button>
                  </Link>
                  <Button variant="outline" className="w-full gap-2 min-h-[48px] text-body" onClick={() => { signOut(); setMobileMenuOpen(false); }}>
                    <LogOut className="h-5 w-5" />
                    Sign Out
                  </Button>
                </>
              ) : !loading ? (
                <>
                  <Link to="/auth" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="outline" className="w-full min-h-[48px] text-body">Sign In</Button>
                  </Link>
                  <Link to="/auth?mode=signup" onClick={() => setMobileMenuOpen(false)}>
                    <Button className="w-full gap-2 min-h-[48px] text-body bg-accent text-accent-foreground hover:bg-accent/90">
                      Get Started
                      <ArrowRight className="h-5 w-5" />
                    </Button>
                  </Link>
                </>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
