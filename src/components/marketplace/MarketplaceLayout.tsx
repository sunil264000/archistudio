import { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Briefcase, LayoutGrid, PlusCircle, UserCog } from 'lucide-react';

const subnav = [
  { to: '/marketplace', label: 'Overview', icon: LayoutGrid, exact: true },
  { to: '/marketplace/jobs', label: 'Browse Jobs', icon: Briefcase },
  { to: '/marketplace/post-job', label: 'Post a Job', icon: PlusCircle },
  { to: '/marketplace/become-worker', label: 'Become a Worker', icon: UserCog },
];

export function MarketplaceLayout({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const isActive = (to: string, exact?: boolean) =>
    exact ? pathname === to : pathname === to || pathname.startsWith(to + '/');

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      {/* Sub-nav */}
      <div className="sticky top-[60px] z-30 border-b border-border/40 bg-background/80 backdrop-blur-md">
        <div className="container-wide py-2 flex items-center gap-1 overflow-x-auto scrollbar-thin">
          {subnav.map((item) => {
            const active = isActive(item.to, item.exact);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm whitespace-nowrap transition-colors ${
                  active
                    ? 'bg-accent text-accent-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary/60'
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
