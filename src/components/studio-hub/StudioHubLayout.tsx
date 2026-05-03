import { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Compass, Briefcase, PlusCircle, UserCog, LayoutGrid } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useMyMemberProfile } from '@/hooks/useStudioHub';
import { ProTrialPopup } from './ProTrialPopup';
import { Sparkles, ArrowRight, AlertCircle, X } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

const subnav = [
  { to: '/studio-hub', label: 'Overview', icon: Compass, exact: true },
  { to: '/studio-hub/projects', label: 'Browse projects', icon: Briefcase },
  { to: '/studio-hub/members', label: 'Members', icon: LayoutGrid },
  { to: '/studio-hub/post', label: 'Post a project', icon: PlusCircle, auth: true },
  { to: '/studio-hub/me', label: 'My Studio', icon: UserCog, auth: true },
];

export function StudioHubLayout({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { profile } = useMyMemberProfile();
  const [hideAlert, setHideAlert] = useState(false);
  const { pathname } = useLocation();
  
  const isActive = (to: string, exact?: boolean) =>
    exact ? pathname === to : pathname === to || pathname.startsWith(to + '/');

  const isIncomplete = user && profile && (!profile.headline || !profile.bio || !profile.hourly_rate);

  return (
    <div className="min-h-screen bg-[hsl(var(--background))] flex flex-col">
      <Navbar />
      {/* Sub-nav: minimal calm strip */}
      <div className="sticky top-[60px] z-30 border-b border-border/30 bg-background/70 backdrop-blur-xl">
        <div className="container-wide py-2.5 flex items-center gap-1 overflow-x-auto scrollbar-thin">
          {subnav.filter((i) => !i.auth || user).map((item) => {
            const active = isActive(item.to, item.exact);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[13px] whitespace-nowrap transition-all ${
                  active
                    ? 'bg-foreground text-background'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                }`}
              >
                <item.icon className="h-3.5 w-3.5" />
                {item.label}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Profile Completion Alert */}
      {isIncomplete && !hideAlert && pathname !== '/studio-hub/become-member' && (
        <div className="bg-accent/10 border-b border-accent/20 py-2">
          <div className="container-wide flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 overflow-hidden">
              <div className="h-5 w-5 rounded-full bg-accent/20 flex items-center justify-center shrink-0">
                <Sparkles className="h-3 w-3 text-accent animate-pulse" />
              </div>
              <p className="text-[11px] font-black uppercase tracking-tight text-accent truncate">
                Setup incomplete — finish your profile to start getting hired.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Link to="/studio-hub/become-member">
                <Button size="sm" variant="ghost" className="h-7 px-3 text-[10px] font-black uppercase tracking-widest text-accent hover:bg-accent/20 rounded-full gap-1">
                  Setup Now <ArrowRight className="h-3 w-3" />
                </Button>
              </Link>
              <button onClick={() => setHideAlert(true)} className="p-1 hover:bg-accent/10 rounded-full text-accent/60">
                <X className="h-3 w-3" />
              </button>
            </div>
          </div>
        </div>
      )}
      <main className="flex-1">{children}</main>
      <Footer />
      <ProTrialPopup />
    </div>
  );
}
