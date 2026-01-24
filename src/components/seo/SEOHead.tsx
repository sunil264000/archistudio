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
  title = 'Archistudio - Professional Architecture Training',
  description = 'This platform teaches what architecture colleges and CAD institutes don\'t: how real buildings are designed, detailed, and executed in offices. Master 3ds Max, AutoCAD, Revit, SketchUp and more.',
  keywords = 'architectural visualization, 3ds max tutorial, autocad training, revit course, sketchup lessons, corona rendering, interior design, architecture education, BIM training, 3D modeling, architectural design, office practice, real-world architecture',
  image = 'https://storage.googleapis.com/gpt-engineer-file-uploads/TjOBPP7jLzOzXbTwAJ9UMeDRW8y1/social-images/social-1769269755328-square-image.jpg',
  url,
  type = 'website',
  price,
  currency = 'INR',
  author = 'Archistudio',
  publishedTime,
  noIndex = false,
}: SEOHeadProps) {
  useEffect(() => {
    // Update document title
    document.title = title.includes('Archistudio') ? title : `${title} | Archistudio`;
    
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
    setMeta('robots', noIndex ? 'noindex, nofollow' : 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1');
    
    // Open Graph
    setMeta('og:title', title, true);
    setMeta('og:description', description, true);
    setMeta('og:type', type, true);
    setMeta('og:image', image, true);
    setMeta('og:image:width', '1200', true);
    setMeta('og:image:height', '630', true);
    if (url) setMeta('og:url', url, true);
    setMeta('og:site_name', 'Archistudio', true);
    setMeta('og:locale', 'en_IN', true);
    
    // Twitter Card
    setMeta('twitter:card', 'summary_large_image');
    setMeta('twitter:site', '@Archistudio');
    setMeta('twitter:creator', '@Archistudio');
    setMeta('twitter:title', title);
    setMeta('twitter:description', description);
    setMeta('twitter:image', image);
    
    // Additional SEO meta
    setMeta('geo.region', 'IN');
    setMeta('geo.placename', 'India');
    setMeta('language', 'English');
    setMeta('revisit-after', '7 days');
    setMeta('distribution', 'global');
    setMeta('rating', 'general');
    
    // Product schema for courses
    if (type === 'product' && price) {
      setMeta('product:price:amount', price.toString(), true);
      setMeta('product:price:currency', currency, true);
    }
    
    // Article schema for blog posts
    if (type === 'article' && publishedTime) {
      setMeta('article:published_time', publishedTime, true);
      setMeta('article:author', author, true);
      setMeta('article:publisher', 'Archistudio', true);
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

// JSON-LD Schema generator for Studio Programs (formerly courses)
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
  totalLessons?: number;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Course',
    name: course.title,
    description: course.description,
    provider: {
      '@type': 'Organization',
      name: 'Archistudio',
      sameAs: 'https://archistudio.shop',
      logo: 'https://archistudio.shop/logo.png',
    },
    offers: {
      '@type': 'Offer',
      price: course.price,
      priceCurrency: course.currency,
      availability: 'https://schema.org/InStock',
      url: course.url,
      validFrom: new Date().toISOString(),
    },
    image: course.image,
    url: course.url,
    instructor: course.instructor ? {
      '@type': 'Person',
      name: course.instructor,
    } : undefined,
    timeRequired: course.duration ? `PT${course.duration}H` : undefined,
    educationalLevel: course.level,
    numberOfLessons: course.totalLessons,
    inLanguage: 'en',
    coursePrerequisites: 'Basic computer skills',
    hasCourseInstance: {
      '@type': 'CourseInstance',
      courseMode: 'online',
      courseWorkload: course.duration ? `PT${course.duration}H` : undefined,
    },
  };
}

export function generateOrganizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'EducationalOrganization',
    '@id': 'https://archistudio.shop/#organization',
    name: 'Archistudio',
    alternateName: 'Archistudio Learning Platform',
    url: 'https://archistudio.shop',
    logo: {
      '@type': 'ImageObject',
      url: 'https://archistudio.shop/logo.png',
      width: 512,
      height: 512,
    },
    description: 'This platform teaches what architecture colleges and CAD institutes don\'t: how real buildings are designed, detailed, and executed in offices.',
    foundingDate: '2024',
    founder: {
      '@type': 'Person',
      name: 'Archistudio Team',
    },
    sameAs: [
      'https://twitter.com/Archistudio',
      'https://instagram.com/Archistudio',
      'https://linkedin.com/company/archistudio',
      'https://youtube.com/@Archistudio',
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer service',
      email: 'hello@archistudio.shop',
      availableLanguage: ['English', 'Hindi'],
    },
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'IN',
    },
    areaServed: 'Worldwide',
    knowsAbout: [
      'Architectural Visualization',
      '3D Modeling',
      'Interior Design',
      'Building Information Modeling',
      'AutoCAD',
      '3ds Max',
      'SketchUp',
      'Revit',
      'Corona Rendering',
      'V-Ray',
    ],
  };
}

// Website schema for homepage
export function generateWebsiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': 'https://archistudio.shop/#website',
    url: 'https://archistudio.shop',
    name: 'Archistudio',
    description: 'Professional architecture training platform',
    publisher: {
      '@id': 'https://archistudio.shop/#organization',
    },
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: 'https://archistudio.shop/courses?search={search_term_string}',
      },
      'query-input': 'required name=search_term_string',
    },
    inLanguage: 'en-IN',
  };
}

// Breadcrumb schema
export function generateBreadcrumbSchema(items: Array<{ name: string; url: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

// FAQ schema for course pages
export function generateFAQSchema(faqs: Array<{ question: string; answer: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(faq => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };
}

// Blog post schema
export function generateBlogPostSchema(post: {
  title: string;
  description: string;
  url: string;
  image?: string;
  publishedTime: string;
  modifiedTime?: string;
  author?: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.description,
    url: post.url,
    image: post.image,
    datePublished: post.publishedTime,
    dateModified: post.modifiedTime || post.publishedTime,
    author: {
      '@type': 'Person',
      name: post.author || 'Archistudio Team',
    },
    publisher: {
      '@type': 'Organization',
      name: 'Archistudio',
      logo: {
        '@type': 'ImageObject',
        url: 'https://archistudio.shop/logo.png',
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': post.url,
    },
  };
}
