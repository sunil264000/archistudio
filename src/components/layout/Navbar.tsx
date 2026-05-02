import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { ArrowRight, LogOut, User, Menu, X, Moon, Sun, ShieldCheck, Library, ChevronDown, Briefcase, BookOpen, MessageSquare, Trophy, Map, Layers, Palette, Star, Compass, FileText, Users, Award } from 'lucide-react';
import logoMark from '@/assets/logo-mark.png';
import { useState, useEffect, useRef } from 'react';
import { CartSheet } from '@/components/cart/CartSheet';
import { GlobalSearch } from '@/components/search/GlobalSearch';
import { NotificationCenter } from '@/components/notifications/NotificationCenter';
import { AnimatePresence, motion } from 'framer-motion';

export function Navbar() {
  const { user, profile, signOut, loading, isAdmin } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [communityOpen, setCommunityOpen] = useState(false);
  const communityRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
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

  // Close community menu on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (communityRef.current && !communityRef.current.contains(e.target as Node)) {
        setCommunityOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close mobile menu on route change
  useEffect(() => { setMobileMenuOpen(false); setCommunityOpen(false); }, [location.pathname]);

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
    { to: '/learn', label: 'Learn' },
    { to: '/courses', label: 'Courses' },
    { to: '/studio-hub', label: 'Studio Hub', icon: Briefcase },
    { to: '/explore', label: 'Explore' },
    { to: '/roadmaps', label: 'Paths' },
    { to: '/ebooks', label: 'eBooks', icon: Library },
    ...(user ? [{ to: '/studio', label: 'Studio' }] : []),
  ];

  const communityLinks = [
    { to: '/forum', label: 'Forum', icon: MessageSquare, desc: 'Discuss with architects' },
    { to: '/sheets', label: 'Sheet Reviews', icon: FileText, desc: 'Get drawing feedback' },
    { to: '/competitions', label: 'Competitions', icon: Trophy, desc: 'Test your skills' },
    { to: '/challenges', label: 'Daily Challenges', icon: Star, desc: 'Daily design prompts' },
    { to: '/internships', label: 'Internships', icon: Briefcase, desc: 'Find opportunities' },
    { to: '/resources', label: 'Resources', icon: Layers, desc: 'Templates & tools' },
    { to: '/leaderboard', label: 'Leaderboard', icon: Award, desc: 'Top contributors' },
    { to: '/learning-map', label: 'Learning Map', icon: Map, desc: 'Your progress path' },
    { to: '/portfolios', label: 'Portfolios', icon: Palette, desc: 'Student showcases' },
    { to: '/case-studies', label: 'Case Studies', icon: Compass, desc: 'Real-world projects' },
    ...(user ? [{ to: '/portfolio/build', label: 'My Portfolio', icon: Users, desc: 'Build yours' }] : []),
    { to: '/mentorship', label: '1:1 Mentorship', icon: GraduationCap, desc: 'Personalized guide' },
    { to: '/blog', label: 'Blog', icon: BookOpen, desc: 'Architecture insights' },
  ];

  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path + '/');

  return (
    <header 
      className={`sticky z-50 transition-all duration-500 ${
        scrolled 
          ? 'bg-background/80 backdrop-blur-xl border-b border-border/40 shadow-[0_1px_3px_hsl(var(--foreground)/0.04)]' 
          : 'border-b border-transparent bg-transparent'
      }`}
      style={{ top: 'var(--sale-banner-height, 0px)' }}
    >
      <nav className="container-wide py-2.5 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="group flex items-center gap-2.5 shrink-0 mr-4">
          <div className="relative">
            <img 
              src={logoMark} 
              alt="Archistudio Academy Logo" 
              className="h-8 w-8 rounded-lg object-cover transition-transform duration-300 group-hover:scale-110" 
              fetchPriority="high"
              decoding="async"
            />
            <div className="absolute inset-0 rounded-lg bg-accent/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </div>
          <div className="flex flex-col">
            <span className="font-display font-bold text-sm tracking-tight text-foreground leading-tight">
              Archistudio
            </span>
            <span className="text-[9px] uppercase tracking-widest text-muted-foreground font-bold">
              {location.pathname.startsWith('/studio-hub') ? 'Studio Hub' : 'Academy'}
            </span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden lg:flex items-center gap-0.5">
          <div className="flex items-center gap-0">
            {navLinks.map((link) => (
              <Link 
                key={link.to}
                to={link.to} 
                className={`relative px-3 py-2 rounded-lg text-[13px] transition-all duration-300 flex items-center gap-1.5 ${
                  isActive(link.to) 
                    ? 'text-foreground font-medium nav-active-indicator' 
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary/60'
                }`}
              >
                {link.icon && <link.icon className="h-3.5 w-3.5" />}
                {link.label}
              </Link>
            ))}

            {/* Community mega-menu */}
            <div ref={communityRef} className="relative">
              <button 
                onClick={() => setCommunityOpen(!communityOpen)}
                className={`px-3 py-2 rounded-lg text-[13px] transition-all duration-300 flex items-center gap-1 outline-none ${
                  communityOpen ? 'text-foreground bg-secondary/60' : 'text-muted-foreground hover:text-foreground hover:bg-secondary/60'
                }`}
              >
                Community 
                <ChevronDown className={`h-3 w-3 transition-transform duration-200 ${communityOpen ? 'rotate-180' : ''}`} />
              </button>
              
              <AnimatePresence>
                {communityOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -6, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -4, scale: 0.98 }}
                    transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                    className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-[520px] mega-menu-panel rounded-2xl p-4 z-50"
                  >
                    <div className="grid grid-cols-2 gap-1">
                      {communityLinks.map(link => (
                        <Link
                          key={link.to}
                          to={link.to}
                          className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-muted/60 transition-colors group"
                          onClick={() => setCommunityOpen(false)}
                        >
                          <div className="mt-0.5 p-1.5 rounded-lg bg-accent/8 text-accent group-hover:bg-accent/15 transition-colors shrink-0">
                            <link.icon className="h-3.5 w-3.5" />
                          </div>
                          <div>
                            <div className="text-[13px] font-medium text-foreground">{link.label}</div>
                            <div className="text-[11px] text-muted-foreground">{link.desc}</div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <div className="w-px h-5 bg-border/40 mx-2" />

          <GlobalSearch />
          <CartSheet />
          {user && <NotificationCenter />}

          <Button variant="ghost" size="icon" onClick={toggleDarkMode} className="rounded-lg h-8 w-8">
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>

          <Link to="/">
            <Button variant="outline" size="sm" className="hidden xl:flex gap-2 text-[11px] h-8 rounded-full border-accent/20 hover:border-accent/40 bg-accent/5">
              <Compass className="h-3 w-3 text-accent" />
              Switch Path
            </Button>
          </Link>

          {loading ? (
            <div className="h-8 w-20 animate-pulse rounded-lg bg-muted" />
          ) : user ? (
            <div className="flex items-center gap-1.5 ml-1">
              {isAdmin && (
                <Link to="/admin">
                  <Button variant="ghost" size="sm" className="gap-1.5 text-accent text-[13px] h-8">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    Admin
                  </Button>
                </Link>
              )}
              <Link to="/dashboard">
                <Button variant="ghost" size="sm" className="gap-2 text-[13px] h-8">
                  <div className="relative">
                    <div className="h-6 w-6 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center">
                      <span className="text-[10px] font-bold text-accent">
                        {(profile?.full_name || user.email || 'U').charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-green-500 border-2 border-background" />
                  </div>
                  <span className="max-w-[100px] truncate">{profile?.full_name || 'Dashboard'}</span>
                </Button>
              </Link>
              <Button variant="ghost" size="icon" onClick={signOut} className="h-8 w-8 rounded-lg text-muted-foreground hover:text-destructive">
                <LogOut className="h-3.5 w-3.5" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2 ml-1">
              <Link to="/auth">
                <Button variant="ghost" size="sm" className="text-[13px] h-8">Sign In</Button>
              </Link>
              <Link to="/auth?mode=signup">
                <Button size="sm" className="gap-1.5 group bg-accent text-accent-foreground hover:bg-accent/90 shadow-[0_0_20px_hsl(var(--accent)/0.2)] text-[13px] h-8 rounded-full px-5">
                  Get Started
                  <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5" />
                </Button>
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Right Actions */}
        <div className="lg:hidden flex items-center gap-1.5">
          {!loading && !user && (
            <Link to="/auth?mode=signup">
              <Button size="sm" className="gap-1 bg-accent text-accent-foreground hover:bg-accent/90 text-xs px-3 h-8 rounded-full">
                Get Started
                <ArrowRight className="h-3 w-3" />
              </Button>
            </Link>
          )}
          {!loading && user && (
            <Link to="/dashboard">
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg">
                <div className="relative">
                  <User className="h-4 w-4" />
                  <div className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-green-500" />
                </div>
              </Button>
            </Link>
          )}
          <button
            className="p-2 rounded-lg hover:bg-muted transition-colors min-w-[40px] min-h-[40px] flex items-center justify-center"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
          >
            <AnimatePresence mode="wait">
              {mobileMenuOpen ? (
                <motion.div key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }}>
                  <X className="h-5 w-5" />
                </motion.div>
              ) : (
                <motion.div key="menu" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.15 }}>
                  <Menu className="h-5 w-5" />
                </motion.div>
              )}
            </AnimatePresence>
          </button>
        </div>
      </nav>

      {/* Mobile Menu — animated slide-in */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="lg:hidden fixed inset-0 bg-background/60 backdrop-blur-sm z-40"
              onClick={() => setMobileMenuOpen(false)}
              style={{ top: 'var(--sale-banner-height, 0px)' }}
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="lg:hidden fixed top-0 right-0 bottom-0 w-[85%] max-w-sm bg-card border-l border-border z-50 overflow-y-auto safe-area-inset"
              style={{ top: 'var(--sale-banner-height, 0px)' }}
            >
              <div className="p-5 pt-16 space-y-1">
                {/* Navigation Links */}
                {[
                  { to: '/learn', label: 'Learn' },
                  { to: '/courses', label: 'Courses' },
                  { to: '/studio-hub', label: 'Studio Hub' },
                  { to: '/explore', label: 'Explore' },
                  { to: '/roadmaps', label: 'Learning Paths' },
                  { to: '/ebooks', label: 'eBooks' },
                  { to: '/forum', label: 'Forum' },
                  { to: '/sheets', label: 'Sheet Reviews' },
                  { to: '/competitions', label: 'Competitions' },
                  { to: '/internships', label: 'Internships' },
                  { to: '/portfolios', label: 'Portfolios' },
                  { to: '/case-studies', label: 'Case Studies' },
                  { to: '/leaderboard', label: 'Leaderboard' },
                  { to: '/resources', label: 'Resources' },
                  { to: '/mentorship', label: '1:1 Mentorship' },
                  { to: '/blog', label: 'Blog' },
                  ...(user ? [
                    { to: '/studio', label: 'Studio' },
                    { to: '/portfolio/build', label: 'My Portfolio' },
                    { to: '/studio-hub/me', label: 'My Studio Hub' },
                  ] : []),
                ].map((link, i) => (
                  <motion.div
                    key={link.to}
                    initial={{ x: 20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: i * 0.02, duration: 0.3 }}
                  >
                    <Link 
                      to={link.to} 
                      className={`block py-2.5 px-4 rounded-xl text-[15px] font-medium transition-colors touch-target ${
                        isActive(link.to) 
                          ? 'bg-accent/10 text-accent' 
                          : 'text-foreground hover:bg-secondary'
                      }`}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {link.label}
                    </Link>
                  </motion.div>
                ))}
                
                <div className="my-4 section-divider" />

                <button 
                  onClick={() => { toggleDarkMode(); setMobileMenuOpen(false); }}
                  className="w-full text-left py-2.5 px-4 rounded-xl hover:bg-secondary transition-colors flex items-center gap-2.5 text-[15px] font-medium touch-target"
                >
                  {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                  {isDark ? 'Light Mode' : 'Dark Mode'}
                </button>
                
                <div className="pt-4 space-y-2">
                  {!loading && user ? (
                    <>
                      {isAdmin && (
                        <Link to="/admin" onClick={() => setMobileMenuOpen(false)}>
                          <Button variant="outline" className="w-full gap-2 min-h-[48px] text-accent rounded-xl">
                            <ShieldCheck className="h-5 w-5" /> Admin Panel
                          </Button>
                        </Link>
                      )}
                      <Link to="/dashboard" onClick={() => setMobileMenuOpen(false)}>
                        <Button variant="ghost" className="w-full gap-2 justify-start min-h-[48px] rounded-xl">
                          <User className="h-5 w-5" /> {profile?.full_name || 'Dashboard'}
                        </Button>
                      </Link>
                      <Button variant="outline" className="w-full gap-2 min-h-[48px] rounded-xl" onClick={() => { signOut(); setMobileMenuOpen(false); }}>
                        <LogOut className="h-5 w-5" /> Sign Out
                      </Button>
                    </>
                  ) : !loading ? (
                    <>
                      <Link to="/auth" onClick={() => setMobileMenuOpen(false)}>
                        <Button variant="outline" className="w-full min-h-[48px] rounded-xl">Sign In</Button>
                      </Link>
                      <Link to="/auth?mode=signup" onClick={() => setMobileMenuOpen(false)}>
                        <Button className="w-full gap-2 min-h-[48px] bg-accent text-accent-foreground hover:bg-accent/90 rounded-xl">
                          Get Started <ArrowRight className="h-5 w-5" />
                        </Button>
                      </Link>
                    </>
                  ) : null}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </header>
  );
}
