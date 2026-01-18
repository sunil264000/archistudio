import { useEffect } from 'react';

interface SEOHeadProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: 'website' | 'article' | 'product';
  price?: number;
  currency?: string;
  author?: string;
  publishedTime?: string;
  noIndex?: boolean;
}

export function SEOHead({
  title = 'Concrete Logic - Master Architectural Visualization',
  description = 'Learn 3ds Max, AutoCAD, Revit, SketchUp and more with industry-leading courses. Transform your architectural design skills with hands-on training.',
  keywords = 'architectural visualization, 3ds max, autocad, revit, sketchup, corona rendering, interior design, architecture courses, BIM, 3D modeling',
  image = '/og-image.jpg',
  url,
  type = 'website',
  price,
  currency = 'INR',
  author = 'Concrete Logic',
  publishedTime,
  noIndex = false,
}: SEOHeadProps) {
  useEffect(() => {
    // Update document title
    document.title = title.includes('Concrete Logic') ? title : `${title} | Concrete Logic`;
    
    // Helper to update or create meta tag
    const setMeta = (name: string, content: string, isProperty = false) => {
      const attr = isProperty ? 'property' : 'name';
      let meta = document.querySelector(`meta[${attr}="${name}"]`);
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute(attr, name);
        document.head.appendChild(meta);
      }
      meta.setAttribute('content', content);
    };

    // Basic meta tags
    setMeta('description', description);
    setMeta('keywords', keywords);
    setMeta('author', author);
    
    // Robots
    setMeta('robots', noIndex ? 'noindex, nofollow' : 'index, follow');
    
    // Open Graph
    setMeta('og:title', title, true);
    setMeta('og:description', description, true);
    setMeta('og:type', type, true);
    setMeta('og:image', image, true);
    if (url) setMeta('og:url', url, true);
    setMeta('og:site_name', 'Concrete Logic', true);
    setMeta('og:locale', 'en_IN', true);
    
    // Twitter Card
    setMeta('twitter:card', 'summary_large_image');
    setMeta('twitter:title', title);
    setMeta('twitter:description', description);
    setMeta('twitter:image', image);
    
    // Product schema for courses
    if (type === 'product' && price) {
      setMeta('product:price:amount', price.toString(), true);
      setMeta('product:price:currency', currency, true);
    }
    
    // Article schema for blog posts
    if (type === 'article' && publishedTime) {
      setMeta('article:published_time', publishedTime, true);
      setMeta('article:author', author, true);
    }

    // Canonical URL
    if (url) {
      let canonical = document.querySelector('link[rel="canonical"]');
      if (!canonical) {
        canonical = document.createElement('link');
        canonical.setAttribute('rel', 'canonical');
        document.head.appendChild(canonical);
      }
      canonical.setAttribute('href', url);
    }

  }, [title, description, keywords, image, url, type, price, currency, author, publishedTime, noIndex]);

  return null;
}

// JSON-LD Schema generator
export function generateCourseSchema(course: {
  title: string;
  description: string;
  price: number;
  currency: string;
  image?: string;
  url: string;
  instructor?: string;
  duration?: string;
  level?: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Course',
    name: course.title,
    description: course.description,
    provider: {
      '@type': 'Organization',
      name: 'Concrete Logic',
      sameAs: 'https://concrete-logic.lovable.app',
    },
    offers: {
      '@type': 'Offer',
      price: course.price,
      priceCurrency: course.currency,
      availability: 'https://schema.org/InStock',
    },
    image: course.image,
    url: course.url,
    instructor: course.instructor ? {
      '@type': 'Person',
      name: course.instructor,
    } : undefined,
    timeRequired: course.duration,
    educationalLevel: course.level,
  };
}

export function generateOrganizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'EducationalOrganization',
    name: 'Concrete Logic',
    url: 'https://concrete-logic.lovable.app',
    logo: 'https://concrete-logic.lovable.app/logo.png',
    description: 'Premier architectural visualization and design education platform',
    sameAs: [],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer service',
      availableLanguage: ['English', 'Hindi'],
    },
  };
}
