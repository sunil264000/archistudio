import { lazy, Suspense, useEffect } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { HeroSection } from '@/components/home/HeroSection';
import { SEOHead, generateOrganizationSchema, generateWebsiteSchema } from '@/components/seo/SEOHead';
import { SitelinkSchema } from '@/components/seo/SitelinkSchema';
import { AnimatedBackground } from '@/components/layout/AnimatedBackground';
import { useGoogleAnalytics, analytics, initializeGA4 } from '@/hooks/useGoogleAnalytics';

// Lazy load below-the-fold sections for faster initial load

// Lazy load below-the-fold sections for faster initial load
const ProblemSection = lazy(() => import('@/components/home/ProblemSection').then(m => ({ default: m.ProblemSection })));
const WhatYouLearnSection = lazy(() => import('@/components/home/WhatYouLearnSection').then(m => ({ default: m.WhatYouLearnSection })));
const CourseStructureSection = lazy(() => import('@/components/home/CourseStructureSection').then(m => ({ default: m.CourseStructureSection })));
const ComparisonSection = lazy(() => import('@/components/home/ComparisonSection').then(m => ({ default: m.ComparisonSection })));
const TestimonialsSection = lazy(() => import('@/components/home/TestimonialsSection').then(m => ({ default: m.TestimonialsSection })));
const FinalCTASection = lazy(() => import('@/components/home/FinalCTASection').then(m => ({ default: m.FinalCTASection })));


// Minimal loading fallback
const SectionLoader = () => (
  <div className="w-full py-12 flex items-center justify-center">
    <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
  </div>
);

export default function Index() {
  // Initialize Google Analytics (GA4 ID will be initialized via index.html or dynamically)
  useGoogleAnalytics();

  // Track homepage view
  useEffect(() => {
    analytics.ctaClick('homepage_view', 'landing');
  }, []);

  // Combined JSON-LD schemas
  const combinedSchema = [
    generateOrganizationSchema(),
    generateWebsiteSchema(),
  ];

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      <SEOHead 
        title="Archistudio - Professional Architecture Training"
        description="This platform teaches what architecture colleges and CAD institutes don't: how real buildings are designed, detailed, and executed in offices. Master 3ds Max, AutoCAD, Revit, SketchUp and more."
        keywords="archistudio, architectural visualization course, 3ds max tutorial, autocad training india, revit course online, sketchup lessons, corona rendering tutorial, interior design course, architecture education, BIM training, 3D modeling course, learn architecture online"
        url="https://archistudio.shop"
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(combinedSchema) }}
      />
      <SitelinkSchema />
      
      <Navbar />
      
      {/* Animated Background - desktop only */}
      <AnimatedBackground intensity="light" />
      
      {/* Hero */}
      <HeroSection />
      
      {/* Below-the-fold sections with motion classes */}
      <Suspense fallback={<SectionLoader />}>
        <div className="motion-section">
          <ProblemSection />
        </div>
      </Suspense>
      
      <Suspense fallback={<SectionLoader />}>
        <div className="motion-from-left">
          <WhatYouLearnSection />
        </div>
      </Suspense>
      
      <Suspense fallback={<SectionLoader />}>
        <div className="motion-section">
          <CourseStructureSection />
        </div>
      </Suspense>
      
      <Suspense fallback={<SectionLoader />}>
        <div className="motion-from-right">
          <ComparisonSection />
        </div>
      </Suspense>
      
      <Suspense fallback={<SectionLoader />}>
        <div className="motion-scale">
          <TestimonialsSection />
        </div>
      </Suspense>
      
      <Suspense fallback={<SectionLoader />}>
        <div className="motion-section">
          <FinalCTASection />
        </div>
      </Suspense>
      
      <div className="motion-section">
        <Footer />
      </div>
    </div>
  );
}
