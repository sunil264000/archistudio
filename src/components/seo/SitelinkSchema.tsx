import { useEffect } from 'react';

/**
 * Generates JSON-LD SiteNavigationElement schema for Google Ads sitelinks.
 * This helps Google understand navigation structure for sitelink extensions.
 */
export function SitelinkSchema() {
  useEffect(() => {
    const schema = {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      '@id': 'https://archistudio.shop/#sitelinks',
      name: 'Archistudio Navigation',
      itemListElement: [
        {
          '@type': 'SiteNavigationElement',
          position: 1,
          name: 'Browse All Courses',
          description: 'Explore professional architecture courses — 3ds Max, AutoCAD, Revit, SketchUp & more',
          url: 'https://archistudio.shop/courses',
        },
        {
          '@type': 'SiteNavigationElement',
          position: 2,
          name: 'Architecture eBooks',
          description: 'Download premium architecture reference eBooks and study materials',
          url: 'https://archistudio.shop/ebooks',
        },
        {
          '@type': 'SiteNavigationElement',
          position: 3,
          name: 'Student Dashboard',
          description: 'Track your progress, certificates, and enrolled courses',
          url: 'https://archistudio.shop/dashboard',
        },
        {
          '@type': 'SiteNavigationElement',
          position: 4,
          name: 'Architecture Blog',
          description: 'Read tips, tutorials, and industry insights from professional architects',
          url: 'https://archistudio.shop/blog',
        },
        {
          '@type': 'SiteNavigationElement',
          position: 5,
          name: 'Contact & Support',
          description: 'Get help from our team or ask questions about courses',
          url: 'https://archistudio.shop/contact',
        },
        {
          '@type': 'SiteNavigationElement',
          position: 6,
          name: 'Sign Up / Login',
          description: 'Create your free account and start learning architecture today',
          url: 'https://archistudio.shop/auth',
        },
      ],
    };

    const scriptId = 'sitelink-schema';
    let script = document.getElementById(scriptId) as HTMLScriptElement | null;
    if (!script) {
      script = document.createElement('script');
      script.id = scriptId;
      script.type = 'application/ld+json';
      document.head.appendChild(script);
    }
    script.textContent = JSON.stringify(schema);

    return () => {
      script?.remove();
    };
  }, []);

  return null;
}
