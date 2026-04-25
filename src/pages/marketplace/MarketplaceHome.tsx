import { Link } from 'react-router-dom';
import { MarketplaceLayout } from '@/components/marketplace/MarketplaceLayout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowRight, Briefcase, Layers, Pencil, Sparkles, ShieldCheck, MessagesSquare, Wallet } from 'lucide-react';
import { SEOHead } from '@/components/seo/SEOHead';
import { MARKETPLACE_CATEGORIES } from '@/hooks/useMarketplace';

const services = [
  { icon: Pencil, title: 'AutoCAD Drafting', desc: 'Plans, sections, elevations, working drawings.' },
  { icon: Layers, title: '3D Modelling', desc: 'SketchUp, Revit, 3ds Max, Rhino models.' },
  { icon: Sparkles, title: 'Renderings', desc: 'Photoreal interiors, exteriors, walk-throughs.' },
  { icon: Briefcase, title: 'Thesis & Concept Help', desc: 'Research, sheets, presentations, mentorship.' },
];

const steps = [
  { n: '01', title: 'Post your brief', desc: 'Describe what you need — budget, deadline, references.' },
  { n: '02', title: 'Get proposals', desc: 'Architecture students bid with timeline & price.' },
  { n: '03', title: 'Pay safely', desc: 'Funds are held in escrow until you approve the work.' },
  { n: '04', title: 'Receive & review', desc: 'Approve delivery, release payment, leave a review.' },
];

const trust = [
  { icon: ShieldCheck, title: 'Escrow protection', desc: 'Money is held safely until you approve delivery.' },
  { icon: MessagesSquare, title: 'In-app chat', desc: 'Share files, references, and revisions in one place.' },
  { icon: Wallet, title: 'Fair fees', desc: 'Transparent 15% platform fee. No hidden charges.' },
];

export default function MarketplaceHome() {
  return (
    <MarketplaceLayout>
      <SEOHead
        title="Archi Studio Marketplace — Hire Architecture Students"
        description="Connect with architecture students for AutoCAD, 3D modelling, renderings and thesis help. Safe escrow payments. By students, for students."
        url="https://archistudio.shop/marketplace"
      />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-accent/10 via-transparent to-primary/5 pointer-events-none" />
        <div className="container-wide relative py-16 md:py-24">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 text-accent text-xs font-medium mb-5">
              <Sparkles className="h-3 w-3" />
              New · Archi Studio Marketplace
            </div>
            <h1 className="font-display text-4xl md:text-6xl font-bold tracking-tight mb-5 leading-[1.05]">
              For Architecture Students,<br />
              <span className="text-accent">By Architecture Students</span>
            </h1>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl">
              Hire talented architecture students for AutoCAD drafting, 3D modelling, renderings, and thesis work — or start earning by offering your own services.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link to="/marketplace/post-job">
                <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90 gap-2 w-full sm:w-auto">
                  Hire Talent
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link to="/marketplace/become-worker">
                <Button size="lg" variant="outline" className="gap-2 w-full sm:w-auto">
                  Start Earning
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
            <p className="text-xs text-muted-foreground mt-4">
              No setup fees · Free to join · Escrow-protected payments
            </p>
          </div>
        </div>
      </section>

      {/* Services */}
      <section className="container-wide py-12 md:py-16">
        <div className="text-center mb-10">
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-3">Popular services</h2>
          <p className="text-muted-foreground">From quick CAD jobs to full thesis support</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {services.map((s) => (
            <Card key={s.title} className="p-6 hover:border-accent/50 transition-colors group">
              <div className="h-10 w-10 rounded-lg bg-accent/10 flex items-center justify-center mb-4 group-hover:bg-accent/20 transition-colors">
                <s.icon className="h-5 w-5 text-accent" />
              </div>
              <h3 className="font-semibold mb-1.5">{s.title}</h3>
              <p className="text-sm text-muted-foreground">{s.desc}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="bg-secondary/30 py-12 md:py-16">
        <div className="container-wide">
          <div className="text-center mb-10">
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-3">How it works</h2>
            <p className="text-muted-foreground">Simple, safe, and built for students</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {steps.map((s) => (
              <Card key={s.n} className="p-6 relative">
                <div className="text-3xl font-display font-bold text-accent/30 mb-2">{s.n}</div>
                <h3 className="font-semibold mb-1.5">{s.title}</h3>
                <p className="text-sm text-muted-foreground">{s.desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Trust */}
      <section className="container-wide py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {trust.map((t) => (
            <div key={t.title} className="flex gap-4">
              <div className="h-10 w-10 shrink-0 rounded-lg bg-accent/10 flex items-center justify-center">
                <t.icon className="h-5 w-5 text-accent" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">{t.title}</h3>
                <p className="text-sm text-muted-foreground">{t.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Categories */}
      <section className="container-wide pb-16">
        <div className="text-center mb-8">
          <h2 className="font-display text-2xl md:text-3xl font-bold mb-2">Browse by category</h2>
          <p className="text-muted-foreground text-sm">Find the right talent for your project</p>
        </div>
        <div className="flex flex-wrap justify-center gap-2">
          {MARKETPLACE_CATEGORIES.map((cat) => (
            <Link key={cat} to={`/marketplace/jobs?category=${encodeURIComponent(cat)}`}>
              <span className="inline-flex items-center px-4 py-2 rounded-full border border-border hover:border-accent hover:bg-accent/5 transition-colors text-sm cursor-pointer">
                {cat}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="container-wide pb-20">
        <Card className="p-8 md:p-12 bg-gradient-to-br from-accent/10 to-primary/5 border-accent/20 text-center">
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-3">Ready to get started?</h2>
          <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
            Whether you need work done or want to earn, the Archi Studio Marketplace is built for you.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/marketplace/post-job">
              <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90 w-full sm:w-auto">
                Post your first job
              </Button>
            </Link>
            <Link to="/marketplace/jobs">
              <Button size="lg" variant="outline" className="w-full sm:w-auto">
                Browse open jobs
              </Button>
            </Link>
          </div>
        </Card>
      </section>
    </MarketplaceLayout>
  );
}
