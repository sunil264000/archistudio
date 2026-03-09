import { ReactNode } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';

interface PageLayoutProps {
  children: ReactNode;
  /** Show navbar (default true) */
  navbar?: boolean;
  /** Show footer (default true) */
  footer?: boolean;
  /** Additional class on main content wrapper */
  className?: string;
  /** Full-bleed mode — no max-width constraint */
  fullBleed?: boolean;
}

export function PageLayout({
  children,
  navbar = true,
  footer = true,
  className = '',
  fullBleed = false,
}: PageLayoutProps) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {navbar && <Navbar />}
      <main className={`flex-1 ${fullBleed ? '' : 'container-wide py-10 sm:py-14'} ${className}`}>
        {children}
      </main>
      {footer && <Footer />}
    </div>
  );
}

interface SectionProps {
  children: ReactNode;
  className?: string;
  id?: string;
  /** Use tight container (max-w-3xl) instead of wide */
  tight?: boolean;
  /** Remove default section padding */
  noPadding?: boolean;
}

export function Section({ children, className = '', id, tight = false, noPadding = false }: SectionProps) {
  return (
    <section id={id} className={`${noPadding ? '' : 'section-padding'} relative overflow-hidden ${className}`}>
      <div className={tight ? 'container-tight' : 'container-wide'}>
        {children}
      </div>
    </section>
  );
}

interface SectionHeaderProps {
  label?: string;
  title: string;
  description?: string;
  className?: string;
  /** Center align (default true) */
  center?: boolean;
}

export function SectionHeader({ label, title, description, className = '', center = true }: SectionHeaderProps) {
  return (
    <div className={`max-w-2xl ${center ? 'mx-auto text-center' : ''} mb-14 sm:mb-16 ${className}`}>
      {label && <div className="section-label mb-4">{label}</div>}
      <h2 className="font-display mb-4" dangerouslySetInnerHTML={{ __html: title }} />
      {description && (
        <p className="text-body text-muted-foreground max-w-lg mx-auto">{description}</p>
      )}
    </div>
  );
}
