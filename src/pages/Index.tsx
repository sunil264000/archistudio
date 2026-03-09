import { lazy, Suspense, useEffect } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { HeroSection } from '@/components/home/HeroSection';
import { HighlightedCourseSection } from '@/components/home/HighlightedCourseSection';
import { SEOHead, generateOrganizationSchema, generateWebsiteSchema } from '@/components/seo/SEOHead';
import { SitelinkSchema } from '@/components/seo/SitelinkSchema';
import { useGoogleAnalytics, analytics, initializeGA4 } from '@/hooks/useGoogleAnalytics';
import { AnimatedBackground } from '@/components/layout/AnimatedBackground';

// Lazy load below-the-fold sections for faster initial load
const ProblemSection = lazy(() => import('@/components/home/ProblemSection').then(m => ({ default: m.ProblemSection })));
const WhatYouLearnSection = lazy(() => import('@/components/home/WhatYouLearnSection').then(m => ({ default: m.WhatYouLearnSection })));
const CourseStructureSection = lazy(() => import('@/components/home/CourseStructureSection').then(m => ({ default: m.CourseStructureSection })));
const ComparisonSection = lazy(() => import('@/components/home/ComparisonSection').then(m => ({ default: m.ComparisonSection })));
const TestimonialsSection = lazy(() => import('@/components/home/TestimonialsSection').then(m => ({ default: m.TestimonialsSection })));
const FinalCTASection = lazy(() => import('@/components/home/FinalCTASection').then(m => ({ default: m.FinalCTASection })));

const SectionLoader = () => (
  <div className="w-full py-12 flex items-center justify-center">
    <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
  </div>
);

export default function Index() {
  useGoogleAnalytics();

  useEffect(() => {
    analytics.ctaClick('homepage_view', 'landing');
  }, []);

  const combinedSchema = [
    generateOrganizationSchema(),
    generateWebsiteSchema(),
  ];

  return (
    <div className="min-h-screen bg-background">
      <a href="#main-content" className="skip-to-content">Skip to content</a>
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
      
      <AnimatedBackground intensity="light" />
      <Navbar />
      
      <main id="main-content">
      <HeroSection />
      
      <HighlightedCourseSection />
      
      <Suspense fallback={<SectionLoader />}>
        <ProblemSection />
      </Suspense>
      
      <Suspense fallback={<SectionLoader />}>
        <WhatYouLearnSection />
      </Suspense>
      
      <Suspense fallback={<SectionLoader />}>
        <CourseStructureSection />
      </Suspense>
      
      <Suspense fallback={<SectionLoader />}>
        <ComparisonSection />
      </Suspense>
      
      <Suspense fallback={<SectionLoader />}>
        <TestimonialsSection />
      </Suspense>
      
      <Suspense fallback={<SectionLoader />}>
        <FinalCTASection />
      </Suspense>
      
      <Footer />
    </div>
  );
}
