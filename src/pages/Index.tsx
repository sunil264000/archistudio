import { lazy, Suspense } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { HeroSection } from '@/components/home/HeroSection';
import { SEOHead, generateOrganizationSchema } from '@/components/seo/SEOHead';

// Lazy load below-the-fold sections for faster initial load
const ProblemSection = lazy(() => import('@/components/home/ProblemSection').then(m => ({ default: m.ProblemSection })));
const WhatYouLearnSection = lazy(() => import('@/components/home/WhatYouLearnSection').then(m => ({ default: m.WhatYouLearnSection })));
const CourseStructureSection = lazy(() => import('@/components/home/CourseStructureSection').then(m => ({ default: m.CourseStructureSection })));
const ComparisonSection = lazy(() => import('@/components/home/ComparisonSection').then(m => ({ default: m.ComparisonSection })));
const TestimonialsSection = lazy(() => import('@/components/home/TestimonialsSection').then(m => ({ default: m.TestimonialsSection })));
const FinalCTASection = lazy(() => import('@/components/home/FinalCTASection').then(m => ({ default: m.FinalCTASection })));
const LiveViewerCounter = lazy(() => import('@/components/social-proof/LiveViewerCounter').then(m => ({ default: m.LiveViewerCounter })));

// Minimal loading fallback
const SectionLoader = () => (
  <div className="w-full py-12 flex items-center justify-center">
    <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
  </div>
);

export default function Index() {
  return (
    <div className="min-h-screen bg-background">
      <SEOHead 
        title="Concrete Logic - Master Architectural Visualization"
        description="Learn 3ds Max, AutoCAD, Revit, SketchUp and more. Transform your architectural design skills with industry-leading courses."
        url="https://concrete-logic.lovable.app"
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(generateOrganizationSchema()) }}
      />
      
      <Navbar />
      
      {/* Live users indicator - lazy loaded */}
      <Suspense fallback={null}>
        <div className="fixed top-20 right-4 z-40 bg-card/95 backdrop-blur-sm border border-border rounded-lg px-3 py-2 shadow-lg">
          <LiveViewerCounter variant="site" />
        </div>
      </Suspense>
      
      {/* Section 1: Hero - loaded immediately for fast LCP */}
      <HeroSection />
      
      {/* Below-the-fold sections - lazy loaded */}
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
