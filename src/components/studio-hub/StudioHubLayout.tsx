import { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Compass, Briefcase, PlusCircle, UserCog, LayoutGrid } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const subnav = [
  { to: '/studio-hub', label: 'Overview', icon: Compass, exact: true },
  { to: '/studio-hub/projects', label: 'Browse projects', icon: Briefcase },
  { to: '/studio-hub/members', label: 'Members', icon: LayoutGrid },
  { to: '/studio-hub/post', label: 'Post a project', icon: PlusCircle, auth: true },
  { to: '/studio-hub/me', label: 'My Studio', icon: UserCog, auth: true },
];

export function StudioHubLayout({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const { user } = useAuth();
  const isActive = (to: string, exact?: boolean) =>
    exact ? pathname === to : pathname === to || pathname.startsWith(to + '/');

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
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
