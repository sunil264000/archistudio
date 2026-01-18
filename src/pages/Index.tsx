import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { HeroSection } from '@/components/home/HeroSection';
import { ProblemSection } from '@/components/home/ProblemSection';
import { WhatYouLearnSection } from '@/components/home/WhatYouLearnSection';
import { CourseStructureSection } from '@/components/home/CourseStructureSection';
import { ComparisonSection } from '@/components/home/ComparisonSection';
import { TestimonialsSection } from '@/components/home/TestimonialsSection';
import { FinalCTASection } from '@/components/home/FinalCTASection';
import { SEOHead, generateOrganizationSchema } from '@/components/seo/SEOHead';
import { LiveViewerCounter } from '@/components/social-proof/LiveViewerCounter';

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
      
      {/* Live users indicator */}
      <div className="fixed top-20 right-4 z-40 bg-card/95 backdrop-blur-sm border border-border rounded-lg px-3 py-2 shadow-lg">
        <LiveViewerCounter variant="site" />
      </div>
      
      {/* Section 1: Hero */}
      <HeroSection />
      
      {/* Section 2: Problem Statement */}
      <ProblemSection />
      
      {/* Section 3: What You'll Learn (8 modules) */}
      <WhatYouLearnSection />
      
      {/* Section 4: Course Structure (Beginner → Advanced) */}
      <CourseStructureSection />
      
      {/* Section 5: Why Different (Comparison Table) */}
      <ComparisonSection />
      
      {/* Section 6: Testimonials */}
      <TestimonialsSection />
      
      {/* Section 7: Final CTA */}
      <FinalCTASection />
      
      <Footer />
    </div>
  );
}
