import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { ArrowRight, LogOut, User, Menu, X, Moon, Sun, ShieldCheck, Library } from 'lucide-react';
import { useState, useEffect } from 'react';
import { CartSheet } from '@/components/cart/CartSheet';
import { motion, AnimatePresence } from 'framer-motion';

const spring = { type: "spring", stiffness: 300, damping: 30 } as const;
const springBouncy = { type: "spring", stiffness: 400, damping: 25 } as const;

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

  return (
    <motion.header 
      className={`sticky top-0 z-50 transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
        scrolled 
          ? 'glass shadow-soft' 
          : 'border-b border-transparent bg-transparent'
      }`}
      initial={{ y: -60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ ...spring, delay: 0.1 }}
    >
      <nav className="container-wide py-3 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="group flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-accent flex items-center justify-center shadow-[0_0_16px_hsl(var(--accent)/0.2)]">
            <span className="text-accent-foreground font-bold text-sm">A</span>
          </div>
          <span className="font-display font-bold text-lg tracking-tight text-foreground">
            Archistudio
          </span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-1">
          <div className="flex items-center gap-0.5 text-sm">
            {[
              { to: '/courses', label: 'Studios' },
              { to: '/ebooks', label: 'eBooks', icon: Library },
              { to: '/blog', label: 'Blog' },
            ].map((link) => (
              <Link 
                key={link.to}
                to={link.to} 
                className="px-4 py-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-all duration-300 flex items-center gap-1.5"
              >
                {link.icon && <link.icon className="h-3.5 w-3.5" />}
                {link.label}
              </Link>
            ))}
          </div>

          <div className="w-px h-5 bg-border/50 mx-2" />

          <CartSheet />

          <Button variant="ghost" size="icon" onClick={toggleDarkMode} className="rounded-xl">
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>

          {loading ? (
            <div className="h-9 w-20 animate-pulse rounded-xl bg-muted" />
          ) : user ? (
            <div className="flex items-center gap-2 ml-1">
              {isAdmin && (
                <Link to="/admin">
                  <Button variant="ghost" size="sm" className="gap-1.5 text-accent">
                    <ShieldCheck className="h-4 w-4" />
                    Admin
                  </Button>
                </Link>
              )}
              <Link to="/dashboard">
                <Button variant="ghost" size="sm" className="gap-1.5">
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
                <Button variant="ghost" size="sm">Sign In</Button>
              </Link>
              <Link to="/auth?mode=signup">
                  <Button size="sm" className="gap-1.5 group bg-accent text-accent-foreground hover:bg-accent/90 shadow-[0_0_16px_hsl(var(--accent)/0.2)]">
                    Get Started
                    <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5" />
                  </Button>
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Menu Button */}
        <motion.button
          className="md:hidden p-3 -mr-2 rounded-xl hover:bg-muted transition-colors touch-target min-w-[48px] min-h-[48px] flex items-center justify-center"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
          whileTap={{ scale: 0.9 }}
          transition={springBouncy}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={mobileMenuOpen ? 'close' : 'open'}
              initial={{ scale: 0, opacity: 0, rotate: -90 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              exit={{ scale: 0, opacity: 0, rotate: 90 }}
              transition={spring}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </motion.div>
          </AnimatePresence>
        </motion.button>
      </nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div 
            className="md:hidden border-t border-border/30 glass-strong overflow-hidden safe-area-inset"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="p-5 space-y-2">
              {[
                { to: '/courses', label: 'Studios' },
                { to: '/ebooks', label: 'eBooks' },
                { to: '/#pricing', label: 'Pricing' },
              ].map((link, i) => (
                <motion.div
                  key={link.to}
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ ...spring, delay: i * 0.05 }}
                >
                  <Link 
                    to={link.to} 
                    className="block text-foreground py-3.5 px-4 rounded-xl hover:bg-secondary transition-colors text-base font-medium touch-target"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {link.label}
                  </Link>
                </motion.div>
              ))}
              
              <motion.button 
                onClick={() => { toggleDarkMode(); setMobileMenuOpen(false); }}
                className="w-full text-left text-foreground py-3.5 px-4 rounded-xl hover:bg-secondary transition-colors flex items-center gap-2.5 text-base font-medium touch-target"
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ ...spring, delay: 0.15 }}
              >
                {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                {isDark ? 'Light Mode' : 'Dark Mode'}
              </motion.button>
              
              <div className="pt-4 border-t border-border space-y-2">
                {!loading && user ? (
                  <>
                    {isAdmin && (
                      <Link to="/admin" onClick={() => setMobileMenuOpen(false)}>
                        <Button variant="outline" className="w-full gap-2 min-h-[48px] text-base text-accent">
                          <ShieldCheck className="h-5 w-5" />
                          Admin Panel
                        </Button>
                      </Link>
                    )}
                    <Link to="/dashboard" onClick={() => setMobileMenuOpen(false)}>
                      <Button variant="ghost" className="w-full gap-2 justify-start min-h-[48px] text-base">
                        <User className="h-5 w-5" />
                        {profile?.full_name || 'Dashboard'}
                      </Button>
                    </Link>
                    <Button variant="outline" className="w-full gap-2 min-h-[48px] text-base" onClick={() => { signOut(); setMobileMenuOpen(false); }}>
                      <LogOut className="h-5 w-5" />
                      Sign Out
                    </Button>
                  </>
                ) : !loading ? (
                  <>
                    <Link to="/auth" onClick={() => setMobileMenuOpen(false)}>
                      <Button variant="outline" className="w-full min-h-[48px] text-base">Sign In</Button>
                    </Link>
                    <Link to="/auth?mode=signup" onClick={() => setMobileMenuOpen(false)}>
                      <Button className="w-full gap-2 min-h-[48px] text-base bg-accent text-accent-foreground hover:bg-accent/90">
                        Get Started
                        <ArrowRight className="h-5 w-5" />
                      </Button>
                    </Link>
                  </>
                ) : null}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
