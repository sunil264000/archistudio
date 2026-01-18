import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// All courses from the static data file
const staticCourses = [
  // Corona & V-Ray Rendering
  { title: 'Corona Renderer Architecture Rendering from Scratch', slug: 'corona-architecture-rendering-scratch', short_description: 'Master Corona Renderer for stunning architectural visualizations from the ground up.', description: 'Dive deep into Corona Renderer and learn to create breathtaking architectural visualizations.', level: 'beginner', duration_hours: 18, total_lessons: 45, price_usd: 89, price_inr: 7499, is_featured: true, is_published: true },
  { title: 'Animation with Corona & V-Ray in 3ds Max', slug: 'animation-corona-vray-3ds-max', short_description: 'Create stunning animated architectural walkthroughs and presentations.', description: 'Learn the art of architectural animation using Corona and V-Ray in 3ds Max.', level: 'intermediate', duration_hours: 14, total_lessons: 32, price_usd: 79, price_inr: 6499, is_featured: false, is_published: true },
  { title: 'Corona 9 + 3ds Max Architectural Lighting Workshop', slug: 'corona-9-architectural-lighting-workshop', short_description: 'Master architectural lighting techniques with Corona 9 and 3ds Max.', description: 'Unlock the secrets of professional architectural lighting.', level: 'intermediate', duration_hours: 12, total_lessons: 28, price_usd: 69, price_inr: 5999, is_featured: true, is_published: true },
  { title: 'Interior Lighting - Corona and V-Ray from Zero to Advanced', slug: 'interior-lighting-corona-vray-zero-advanced', short_description: 'Complete guide to interior lighting with Corona and V-Ray renderers.', description: 'Transform your interior renders with professional lighting techniques.', level: 'beginner', duration_hours: 16, total_lessons: 40, price_usd: 79, price_inr: 6499, is_featured: false, is_published: true },
  { title: 'Lighting Mastery in V-Ray 6', slug: 'lighting-mastery-vray-6', short_description: 'Become a V-Ray 6 lighting expert with advanced techniques.', description: 'Take your V-Ray skills to the next level.', level: 'advanced', duration_hours: 10, total_lessons: 24, price_usd: 89, price_inr: 7499, is_featured: false, is_published: true },
  
  // 3ds Max
  { title: '3D Modeling with 3ds Max - The Quickest Way', slug: '3d-modeling-3ds-max-quickest-way', short_description: 'Fast-track your 3ds Max modeling skills with efficient techniques.', description: 'Learn 3ds Max modeling the smart way.', level: 'beginner', duration_hours: 12, total_lessons: 30, price_usd: 59, price_inr: 4999, is_featured: false, is_published: true },
  { title: '3ds Max + V-Ray: From Zero to Architectural Masterpiece', slug: '3ds-max-vray-zero-architectural-masterpiece', short_description: 'Complete journey from beginner to creating stunning architectural visualizations.', description: 'The ultimate 3ds Max and V-Ray course.', level: 'beginner', duration_hours: 35, total_lessons: 85, price_usd: 149, price_inr: 12499, is_featured: true, is_published: true },
  { title: 'Complete 3ds Max Course for Interior Design with Animation', slug: '3ds-max-interior-design-animation', short_description: 'Master interior design visualization and animation in 3ds Max.', description: 'A comprehensive course designed for interior designers.', level: 'intermediate', duration_hours: 28, total_lessons: 65, price_usd: 129, price_inr: 10999, is_featured: false, is_published: true },
  { title: 'Modern Exterior Arch Viz with 3ds Max, V-Ray & Vantage', slug: 'modern-exterior-archviz-3ds-max-vray-vantage', short_description: 'Create stunning modern exterior visualizations with real-time preview.', description: 'Learn cutting-edge exterior visualization techniques.', level: 'advanced', duration_hours: 20, total_lessons: 48, price_usd: 99, price_inr: 8499, is_featured: true, is_published: true },
  { title: 'Professional Interior Visualization - 3ds Max + Corona', slug: 'professional-interior-visualization-3ds-max-corona', short_description: 'Industry-standard interior visualization workflow with Corona.', description: 'Learn the professional workflow for creating stunning interior visualizations.', level: 'intermediate', duration_hours: 22, total_lessons: 52, price_usd: 109, price_inr: 9499, is_featured: false, is_published: true },
  { title: '3ds Max + V-Ray: Interior Daylight Visualization Handbook', slug: '3ds-max-vray-interior-daylight-handbook', short_description: 'Master natural daylight in interior renders for realistic results.', description: 'Daylight is the foundation of beautiful interior renders.', level: 'intermediate', duration_hours: 10, total_lessons: 25, price_usd: 69, price_inr: 5999, is_featured: false, is_published: true },
  
  // Revit & BIM
  { title: 'Master Autodesk Revit - Beginner to Intermediate with BIM Introduction', slug: 'master-revit-beginner-intermediate-bim', short_description: 'Complete Revit foundation with BIM methodology introduction.', description: 'Start your BIM journey with this comprehensive Revit course.', level: 'beginner', duration_hours: 25, total_lessons: 60, price_usd: 99, price_inr: 8499, is_featured: true, is_published: true },
  { title: 'Revit Architectural Work with Live Villa Project', slug: 'revit-architectural-work-villa-project', short_description: 'Learn Revit through a complete villa design project.', description: 'The best way to learn is by doing.', level: 'intermediate', duration_hours: 20, total_lessons: 48, price_usd: 89, price_inr: 7499, is_featured: false, is_published: true },
  { title: 'Revit Landscape Architecture BIM Techniques', slug: 'revit-landscape-architecture-bim', short_description: 'Specialized Revit workflows for landscape architects.', description: 'Discover how to leverage Revit for landscape architecture projects.', level: 'intermediate', duration_hours: 14, total_lessons: 35, price_usd: 79, price_inr: 6499, is_featured: false, is_published: true },
  { title: 'Revit 2023 Complete Course - Beginner to Advanced', slug: 'revit-2023-complete-beginner-advanced', short_description: 'The most comprehensive Revit course from basics to advanced techniques.', description: 'Everything you need to master Revit in one course.', level: 'beginner', duration_hours: 40, total_lessons: 95, price_usd: 149, price_inr: 12499, is_featured: true, is_published: true },
  { title: 'BIM Revit Masterclass: Complete Project Modeling + Rendering', slug: 'bim-revit-masterclass-project-modeling-rendering', short_description: 'Master BIM workflow from modeling to photorealistic visualization.', description: 'A masterclass that combines BIM modeling expertise with stunning visualization.', level: 'advanced', duration_hours: 32, total_lessons: 75, price_usd: 139, price_inr: 11999, is_featured: false, is_published: true },
  { title: 'Mastering Kitchen Interior Design with Revit', slug: 'mastering-kitchen-interior-design-revit', short_description: 'Specialize in kitchen design using Revit tools.', description: 'Kitchen design requires precision and creativity.', level: 'intermediate', duration_hours: 12, total_lessons: 28, price_usd: 69, price_inr: 5999, is_featured: false, is_published: true },
  { title: 'Revit 2025: Detailing, Sheets & Documentation - Project-Based', slug: 'revit-2025-detailing-sheets-documentation', short_description: 'Master construction documentation with Revit 2025.', description: 'Transform your Revit models into professional construction documents.', level: 'intermediate', duration_hours: 16, total_lessons: 40, price_usd: 79, price_inr: 6499, is_featured: false, is_published: true },
  { title: 'Revit Site and Context Modeling', slug: 'revit-site-context-modeling', short_description: 'Create compelling site plans and context models.', description: 'Learn to model sites, topography, and context in Revit.', level: 'intermediate', duration_hours: 10, total_lessons: 24, price_usd: 59, price_inr: 4999, is_featured: false, is_published: true },
  { title: 'Revit & Civil 3D for Landscape BIM Workflow', slug: 'revit-civil-3d-landscape-bim-workflow', short_description: 'Integrate Revit and Civil 3D for powerful landscape BIM.', description: 'Combine the power of Revit and Civil 3D for landscape architecture.', level: 'advanced', duration_hours: 18, total_lessons: 42, price_usd: 99, price_inr: 8499, is_featured: false, is_published: true },
  { title: 'Revit Industrial Office Interior Design, Structural and MEP', slug: 'revit-industrial-office-interior-structural-mep', short_description: 'Complete industrial office project with all disciplines.', description: 'Learn multi-discipline Revit workflows for industrial projects.', level: 'advanced', duration_hours: 28, total_lessons: 65, price_usd: 139, price_inr: 11999, is_featured: false, is_published: true },
  { title: 'Revit 2026: Interior Design, Modelling & Rendering from Zero', slug: 'revit-2026-interior-design-modelling-rendering', short_description: 'Latest Revit for complete interior design workflow.', description: 'Start from zero and master interior design in Revit 2026.', level: 'beginner', duration_hours: 22, total_lessons: 50, price_usd: 99, price_inr: 8499, is_featured: false, is_published: true },
  { title: 'Revit Architecture Mastery for Architects and BIM Modelers', slug: 'revit-architecture-mastery-architects-bim-modelers', short_description: 'Professional Revit skills for practicing architects.', description: 'Master Revit as used by professional architects.', level: 'advanced', duration_hours: 35, total_lessons: 80, price_usd: 159, price_inr: 13499, is_featured: false, is_published: true },
  { title: 'BIM Documentation & Annotation in Revit: From Zero to Pro', slug: 'bim-documentation-annotation-revit-zero-pro', short_description: 'Master the art of BIM documentation and annotation.', description: 'Learn professional documentation standards in Revit.', level: 'intermediate', duration_hours: 14, total_lessons: 35, price_usd: 69, price_inr: 5999, is_featured: false, is_published: true },
  
  // SketchUp
  { title: 'SketchUp Pro 2024: Complete Architecture Course', slug: 'sketchup-pro-2024-complete-architecture', short_description: 'Master SketchUp Pro for architectural design and visualization.', description: 'Complete SketchUp course for architects.', level: 'beginner', duration_hours: 20, total_lessons: 50, price_usd: 79, price_inr: 6499, is_featured: true, is_published: true },
  { title: 'V-Ray for SketchUp: Photorealistic Rendering Mastery', slug: 'vray-sketchup-photorealistic-rendering-mastery', short_description: 'Create stunning photorealistic renders with V-Ray for SketchUp.', description: 'Master V-Ray rendering in SketchUp.', level: 'intermediate', duration_hours: 14, total_lessons: 35, price_usd: 89, price_inr: 7499, is_featured: false, is_published: true },
  { title: 'SketchUp for Interior Design: Complete Workflow', slug: 'sketchup-interior-design-complete-workflow', short_description: 'Interior design workflow from concept to visualization.', description: 'Learn the complete interior design workflow in SketchUp.', level: 'intermediate', duration_hours: 16, total_lessons: 40, price_usd: 79, price_inr: 6499, is_featured: false, is_published: true },
  { title: 'SketchUp + Enscape: Real-time Visualization', slug: 'sketchup-enscape-real-time-visualization', short_description: 'Create stunning real-time renders with SketchUp and Enscape.', description: 'Master real-time visualization with Enscape.', level: 'intermediate', duration_hours: 10, total_lessons: 25, price_usd: 69, price_inr: 5999, is_featured: false, is_published: true },
  
  // AutoCAD
  { title: 'AutoCAD 2024: Complete 2D & 3D Drafting Course', slug: 'autocad-2024-complete-2d-3d-drafting', short_description: 'Master AutoCAD for professional drafting and design.', description: 'Complete AutoCAD training from basics to advanced.', level: 'beginner', duration_hours: 25, total_lessons: 60, price_usd: 89, price_inr: 7499, is_featured: true, is_published: true },
  { title: 'AutoCAD Architecture: Professional Building Documentation', slug: 'autocad-architecture-professional-building-documentation', short_description: 'Specialized AutoCAD skills for architectural documentation.', description: 'Learn architectural drafting standards in AutoCAD.', level: 'intermediate', duration_hours: 18, total_lessons: 45, price_usd: 79, price_inr: 6499, is_featured: false, is_published: true },
  { title: '7 Days Mastery Course to Read Architectural Drawings', slug: '7-days-mastery-read-architectural-drawings', short_description: 'Learn to read and understand architectural drawings quickly.', description: 'Fast-track your drawing reading skills.', level: 'beginner', duration_hours: 7, total_lessons: 21, price_usd: 49, price_inr: 3999, is_featured: false, is_published: true },
  
  // Visualization Tools
  { title: 'Lumion 12: Complete Architectural Visualization', slug: 'lumion-12-complete-architectural-visualization', short_description: 'Create stunning animations and renders with Lumion 12.', description: 'Master Lumion for architectural visualization.', level: 'beginner', duration_hours: 16, total_lessons: 40, price_usd: 89, price_inr: 7499, is_featured: true, is_published: true },
  { title: 'Twinmotion 2024: Real-time Visualization from Revit', slug: 'twinmotion-2024-real-time-visualization-revit', short_description: 'Create immersive experiences with Twinmotion and Revit.', description: 'Learn Twinmotion for architectural visualization.', level: 'intermediate', duration_hours: 12, total_lessons: 30, price_usd: 79, price_inr: 6499, is_featured: false, is_published: true },
  { title: 'D5 Render: Next-Gen Real-time Rendering', slug: 'd5-render-next-gen-real-time-rendering', short_description: 'Master D5 Render for stunning real-time visualizations.', description: 'Learn D5 Render from basics to advanced.', level: 'intermediate', duration_hours: 10, total_lessons: 25, price_usd: 69, price_inr: 5999, is_featured: false, is_published: true },
  { title: 'Enscape Complete Course: Real-time for Revit & SketchUp', slug: 'enscape-complete-course-real-time-revit-sketchup', short_description: 'Master Enscape for Revit and SketchUp visualization.', description: 'Complete Enscape training for real-time rendering.', level: 'intermediate', duration_hours: 12, total_lessons: 28, price_usd: 79, price_inr: 6499, is_featured: false, is_published: true },
  
  // Rhino 3D
  { title: 'Rhino 7: Complete 3D Modeling for Architecture', slug: 'rhino-7-complete-3d-modeling-architecture', short_description: 'Master Rhino for architectural modeling and design.', description: 'Learn Rhino 3D for architecture.', level: 'beginner', duration_hours: 22, total_lessons: 55, price_usd: 99, price_inr: 8499, is_featured: true, is_published: true },
  { title: 'Grasshopper Parametric Design: From Zero to Hero', slug: 'grasshopper-parametric-design-zero-hero', short_description: 'Master parametric design with Grasshopper in Rhino.', description: 'Learn algorithmic design with Grasshopper.', level: 'intermediate', duration_hours: 18, total_lessons: 45, price_usd: 109, price_inr: 9499, is_featured: false, is_published: true },
  { title: 'V-Ray for Rhino: Advanced Rendering Techniques', slug: 'vray-rhino-advanced-rendering-techniques', short_description: 'Create stunning renders with V-Ray for Rhino.', description: 'Master V-Ray rendering in Rhino.', level: 'advanced', duration_hours: 12, total_lessons: 30, price_usd: 89, price_inr: 7499, is_featured: false, is_published: true },
  
  // Design Fundamentals
  { title: 'Architectural Sketching: Hand Drawing Fundamentals', slug: 'architectural-sketching-hand-drawing-fundamentals', short_description: 'Master hand sketching for architectural communication.', description: 'Learn essential hand drawing skills.', level: 'beginner', duration_hours: 14, total_lessons: 35, price_usd: 59, price_inr: 4999, is_featured: false, is_published: true },
  { title: 'Design Portfolio Masterclass: Stand Out & Get Hired', slug: 'design-portfolio-masterclass-stand-out-get-hired', short_description: 'Create a portfolio that gets you noticed.', description: 'Build an impressive design portfolio.', level: 'intermediate', duration_hours: 8, total_lessons: 20, price_usd: 49, price_inr: 3999, is_featured: false, is_published: true },
  { title: 'Color Theory & Application in Architecture', slug: 'color-theory-application-architecture', short_description: 'Master color for architectural design and visualization.', description: 'Learn color theory for architects.', level: 'beginner', duration_hours: 6, total_lessons: 15, price_usd: 39, price_inr: 2999, is_featured: false, is_published: true },
  
  // Interior Design
  { title: 'Complete Interior Design Course: Concept to Completion', slug: 'complete-interior-design-concept-completion', short_description: 'Full interior design workflow from concept to final presentation.', description: 'Master the complete interior design process.', level: 'beginner', duration_hours: 30, total_lessons: 75, price_usd: 129, price_inr: 10999, is_featured: true, is_published: true },
  { title: 'Space Planning & Furniture Layout Principles', slug: 'space-planning-furniture-layout-principles', short_description: 'Master the art of space planning and furniture arrangement.', description: 'Learn professional space planning techniques.', level: 'intermediate', duration_hours: 10, total_lessons: 25, price_usd: 59, price_inr: 4999, is_featured: false, is_published: true },
  { title: 'Residential Interior Design: Modern Living Spaces', slug: 'residential-interior-design-modern-living-spaces', short_description: 'Design stunning modern residential interiors.', description: 'Learn to design beautiful modern homes.', level: 'intermediate', duration_hours: 18, total_lessons: 45, price_usd: 89, price_inr: 7499, is_featured: false, is_published: true },
  { title: 'Commercial Interior Design: Offices & Retail Spaces', slug: 'commercial-interior-design-offices-retail-spaces', short_description: 'Master commercial interior design for offices and retail.', description: 'Learn commercial interior design.', level: 'advanced', duration_hours: 20, total_lessons: 50, price_usd: 99, price_inr: 8499, is_featured: false, is_published: true },
  
  // Post-Production
  { title: 'Photoshop for Architects: Post-Production Mastery', slug: 'photoshop-architects-post-production-mastery', short_description: 'Master Photoshop for architectural visualization post-production.', description: 'Learn Photoshop techniques for architects.', level: 'intermediate', duration_hours: 14, total_lessons: 35, price_usd: 69, price_inr: 5999, is_featured: true, is_published: true },
  { title: 'After Effects for Arch Viz: Animation & Motion Graphics', slug: 'after-effects-arch-viz-animation-motion-graphics', short_description: 'Create stunning motion graphics for architectural presentations.', description: 'Master After Effects for architecture.', level: 'intermediate', duration_hours: 16, total_lessons: 40, price_usd: 79, price_inr: 6499, is_featured: false, is_published: true },
  { title: 'Presentation Skills for Architects and Designers', slug: 'presentation-skills-architects-designers', short_description: 'Present your designs with confidence and impact.', description: 'Master presentation techniques.', level: 'beginner', duration_hours: 6, total_lessons: 15, price_usd: 39, price_inr: 2999, is_featured: false, is_published: true },
];

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    let synced = 0;
    let skipped = 0;

    for (const course of staticCourses) {
      // Check if course already exists
      const { data: existing } = await supabase
        .from("courses")
        .select("id")
        .eq("slug", course.slug)
        .single();

      if (existing) {
        skipped++;
        continue;
      }

      // Insert new course
      const { error } = await supabase.from("courses").insert({
        title: course.title,
        slug: course.slug,
        short_description: course.short_description,
        description: course.description,
        level: course.level,
        duration_hours: course.duration_hours,
        total_lessons: course.total_lessons,
        price_usd: course.price_usd,
        price_inr: course.price_inr,
        is_featured: course.is_featured,
        is_published: course.is_published,
      });

      if (!error) {
        synced++;
      } else {
        console.error("Error inserting course:", course.slug, error);
      }
    }

    return new Response(
      JSON.stringify({ success: true, synced, skipped, total: staticCourses.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
