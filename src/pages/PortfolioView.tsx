import { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { usePublicPortfolio } from '@/hooks/usePortfolio';
import { Navbar } from '@/components/layout/Navbar';
import { SEOHead } from '@/components/seo/SEOHead';
import { Loader2, Mail, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function PortfolioView() {
  const { slug } = useParams<{ slug: string }>();
  const { portfolio, pages, loading } = usePublicPortfolio(slug);

  // Auto-trigger print if ?print=1
  useEffect(() => {
    if (!loading && portfolio && new URLSearchParams(window.location.search).get('print') === '1') {
      setTimeout(() => window.print(), 800);
    }
  }, [loading, portfolio]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!portfolio) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex flex-col items-center justify-center gap-4 pt-24">
          <p className="text-muted-foreground text-lg">Portfolio not found</p>
          <Link to="/"><Button variant="outline"><ArrowLeft className="h-4 w-4 mr-1.5" /> Home</Button></Link>
        </div>
      </>
    );
  }

  return (
    <>
      <SEOHead
        title={`${portfolio.title} — Architecture Portfolio`}
        description={portfolio.subtitle || `Portfolio by ${portfolio.title}`}
      />
      {/* Hide navbar in print mode */}
      <div className="print:hidden"><Navbar /></div>

      <main className="min-h-screen bg-background">
        {/* Hero */}
        <section className="pt-28 pb-16 px-4 print:pt-8 print:pb-8">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl sm:text-5xl font-display font-bold text-foreground tracking-tight print:text-3xl">
              {portfolio.title}
            </h1>
            {portfolio.subtitle && (
              <p className="text-lg text-muted-foreground mt-3">{portfolio.subtitle}</p>
            )}
            {portfolio.bio && (
              <p className="text-sm text-muted-foreground/80 mt-4 max-w-lg mx-auto leading-relaxed">{portfolio.bio}</p>
            )}
            {portfolio.contact_email && (
              <a
                href={`mailto:${portfolio.contact_email}`}
                className="inline-flex items-center gap-1.5 mt-4 text-sm text-accent hover:underline"
              >
                <Mail className="h-3.5 w-3.5" /> {portfolio.contact_email}
              </a>
            )}
          </div>
        </section>

        {/* Pages / Projects */}
        {pages.map((page, pageIdx) => (
          <section
            key={page.id}
            className="py-12 px-4 print:py-6 print:break-before-page"
          >
            <div className="max-w-4xl mx-auto">
              <div className="mb-8 print:mb-4">
                <span className="text-xs font-medium text-accent tracking-widest uppercase">
                  Project {String(pageIdx + 1).padStart(2, '0')}
                </span>
                <h2 className="text-2xl sm:text-3xl font-display font-bold text-foreground mt-1 print:text-xl">{page.title}</h2>
                {page.description && (
                  <p className="text-muted-foreground mt-2 max-w-2xl leading-relaxed">{page.description}</p>
                )}
              </div>

              <div className="space-y-6 print:space-y-3">
                {page.sections.map(section => (
                  <div key={section.id}>
                    {section.section_type === 'image' && section.image_url && (
                      <figure>
                        <img
                          src={section.image_url}
                          alt={section.caption || ''}
                          className="w-full rounded-xl object-cover print:rounded-none print:max-h-[400px]"
                        />
                        {section.caption && (
                          <figcaption className="text-xs text-muted-foreground mt-2 text-center italic">{section.caption}</figcaption>
                        )}
                      </figure>
                    )}

                    {section.section_type === 'text' && section.content && (
                      <p className="text-foreground/85 leading-relaxed whitespace-pre-wrap max-w-2xl">{section.content}</p>
                    )}

                    {section.section_type === 'heading' && section.content && (
                      <h3 className="text-xl font-display font-semibold text-foreground">{section.content}</h3>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </section>
        ))}

        {pages.length === 0 && (
          <div className="text-center py-20 text-muted-foreground">
            <p>This portfolio has no projects yet.</p>
          </div>
        )}

        {/* Footer */}
        <footer className="py-8 text-center text-xs text-muted-foreground border-t border-border print:border-none">
          <p>Built with Archistudio</p>
        </footer>
      </main>
    </>
  );
}
