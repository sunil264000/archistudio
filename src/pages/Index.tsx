import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { HeroSection } from '@/components/home/HeroSection';
import { ProblemSection } from '@/components/home/ProblemSection';
import { WhatYouLearnSection } from '@/components/home/WhatYouLearnSection';
import { CourseStructureSection } from '@/components/home/CourseStructureSection';
import { ComparisonSection } from '@/components/home/ComparisonSection';
import { InstructorSection } from '@/components/home/InstructorSection';
import { TestimonialsSection } from '@/components/home/TestimonialsSection';
import { PricingSection } from '@/components/home/PricingSection';
import { FinalCTASection } from '@/components/home/FinalCTASection';

export default function Index() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
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
      
      {/* Section 6: Instructor Bio */}
      <InstructorSection />
      
      {/* Section 7: Testimonials */}
      <TestimonialsSection />
      
      {/* Section 8: Pricing */}
      <PricingSection />
      
      {/* Section 9: Final CTA */}
      <FinalCTASection />
      
      <Footer />
    </div>
  );
}
