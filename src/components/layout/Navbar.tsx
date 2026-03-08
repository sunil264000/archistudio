import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { ArrowRight, LogOut, User, Menu, X, Moon, Sun, ShieldCheck, Library, Bell, ChevronDown } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import logoMark from '@/assets/logo-mark.png';
import { useState, useEffect } from 'react';
import { CartSheet } from '@/components/cart/CartSheet';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

export function Navbar() {
  const { user, profile, signOut, loading, isAdmin } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<any[]>([]);
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

  // Fetch unread notifications
  useEffect(() => {
    if (!user) { setUnreadCount(0); setNotifications([]); return; }
    const fetchNotifs = async () => {
      const { data, count } = await supabase
        .from('notifications')
        .select('*', { count: 'exact' })
        .eq('user_id', user.id)
        .eq('read', false)
        .order('created_at', { ascending: false })
        .limit(10);
      setUnreadCount(count || 0);
      setNotifications(data || []);
    };
    fetchNotifs();
    const interval = setInterval(fetchNotifs, 30000);
    return () => clearInterval(interval);
  }, [user]);

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
        <Link to="/" className="group flex items-center gap-2.5">
          <img src={logoMark} alt="Archistudio" className="h-9 w-9 rounded-xl object-cover shadow-[0_0_16px_hsl(var(--accent)/0.2)]" />
          <span className="font-display font-bold text-lg tracking-tight text-foreground">
            Archistudio
          </span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-1">
          <div className="flex items-center gap-0.5 text-sm">
            {[
              { to: '/courses', label: 'Courses' },
              { to: '/ebooks', label: 'eBooks', icon: Library },
              { to: '/sheets', label: 'Sheets' },
              { to: '/forum', label: 'Forum' },
              ...(user ? [{ to: '/portfolio/build', label: 'Portfolio' }, { to: '/studio', label: 'Studio' }] : []),
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

          {/* Notification Bell */}
          {user && (
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-xl relative">
                  <Bell className="h-4 w-4" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-destructive text-[10px] text-destructive-foreground flex items-center justify-center font-bold">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-0" align="end">
                <div className="p-3 border-b">
                  <h4 className="font-semibold text-sm">Notifications</h4>
                </div>
                <div className="max-h-64 overflow-auto">
                  {notifications.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-6">No new notifications</p>
                  ) : (
                    notifications.map(n => (
                      <div key={n.id} className="p-3 border-b last:border-0 hover:bg-muted/50 transition-colors cursor-pointer"
                        onClick={async () => {
                          await supabase.from('notifications').update({ read: true }).eq('id', n.id);
                          setNotifications(prev => prev.filter(x => x.id !== n.id));
                          setUnreadCount(prev => Math.max(0, prev - 1));
                        }}
                      >
                        <p className="text-sm font-medium">{n.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.message}</p>
                        <p className="text-[10px] text-muted-foreground mt-1">
                          {new Date(n.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </PopoverContent>
            </Popover>
          )}

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
        <button
          className="md:hidden p-3 -mr-2 rounded-xl hover:bg-muted transition-colors touch-target min-w-[48px] min-h-[48px] flex items-center justify-center"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </nav>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-border/30 bg-card safe-area-inset">
          <div className="p-5 space-y-2">
            {[
              { to: '/courses', label: 'Courses' },
              { to: '/ebooks', label: 'eBooks' },
              { to: '/sheets', label: 'Sheets' },
              { to: '/forum', label: 'Forum' },
              ...(user ? [{ to: '/portfolio/build', label: 'Portfolio' }, { to: '/studio', label: 'Studio' }] : []),
              { to: '/blog', label: 'Blog' },
            ].map((link) => (
              <Link 
                key={link.to}
                to={link.to} 
                className="block text-foreground py-3.5 px-4 rounded-xl hover:bg-secondary transition-colors text-base font-medium touch-target"
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            
            <button 
              onClick={() => { toggleDarkMode(); setMobileMenuOpen(false); }}
              className="w-full text-left text-foreground py-3.5 px-4 rounded-xl hover:bg-secondary transition-colors flex items-center gap-2.5 text-base font-medium touch-target"
            >
              {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              {isDark ? 'Light Mode' : 'Dark Mode'}
            </button>
            
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
        </div>
      )}
    </header>
  );
}
