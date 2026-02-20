import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Full course catalog for the AI to reference
const COURSE_CATALOG = `
ARCHISTUDIO COURSE CATALOG
===========================

## CORONA & V-RAY RENDERING
1. Corona Renderer Architecture Rendering from Scratch | Beginner | ₹7,499 | 18h | slug: corona-architecture-rendering-scratch
   - Master Corona Renderer for stunning architectural visualizations. Lighting, materials, camera settings, post-production.

2. Animation with Corona & V-Ray in 3ds Max | Intermediate | ₹6,499 | 14h | slug: animation-corona-vray-3ds-max
   - Camera animation, lighting transitions, material animation, professional walkthroughs.

3. Corona 9 + 3ds Max Architectural Lighting Workshop | Intermediate | ₹5,999 | 12h | slug: corona-9-architectural-lighting-workshop
   - Daylight, artificial lighting, HDRI, mixed lighting for photorealistic results.

4. Interior Lighting - Corona and V-Ray from Zero to Advanced | Beginner | ₹6,499 | 16h | slug: interior-lighting-corona-vray-zero-advanced
   - Natural daylight, warm artificial lighting, dramatic mood lighting.

5. Lighting Mastery in V-Ray 6 | Advanced | ₹7,499 | 10h | slug: lighting-mastery-vray-6
   - Light Mix, Light Gen, advanced GI settings. Expert level.

## 3DS MAX
6. 3D Modeling with 3ds Max - The Quickest Way | Beginner | ₹4,999 | 12h | slug: 3d-modeling-3ds-max-quickest-way
   - Keyboard shortcuts, best practices, professional workflows.

7. 3ds Max + V-Ray: From Zero to Architectural Masterpiece | Beginner | ₹12,499 | 35h | slug: 3ds-max-vray-zero-architectural-masterpiece
   - BEST SELLER. Complete modeling, materials, lighting, cameras, post-production.

8. Complete 3ds Max Course for Interior Design with Animation | Intermediate | ₹10,999 | 28h | slug: 3ds-max-interior-design-animation
   - Interior modeling, materials, Corona/V-Ray, animated walkthroughs.

9. Modern Exterior Arch Viz with 3ds Max, V-Ray & Vantage | Advanced | ₹8,499 | 20h | slug: modern-exterior-archviz-3ds-max-vray-vantage
   - Modern architectural styles, environment creation, real-time rendering.

10. Professional Interior Visualization - 3ds Max + Corona | Intermediate | ₹9,499 | 22h | slug: professional-interior-visualization-3ds-max-corona
    - Industry-standard interior visualization complete pipeline.

11. 3ds Max + V-Ray: Interior Daylight Visualization Handbook | Intermediate | ₹5,999 | 10h | slug: 3ds-max-vray-interior-daylight-handbook
    - Natural light, sun studies, photorealistic daylight interiors.

## REVIT & BIM
12. Master Autodesk Revit - Beginner to Intermediate with BIM | Beginner | ₹8,499 | 25h | slug: master-revit-beginner-intermediate-bim
    - BIM fundamentals, architectural documentation, 3D models.

13. Revit Architectural Work with Live Villa Project | Intermediate | ₹7,499 | 20h | slug: revit-architectural-work-villa-project
    - Project-based: complete villa design from site planning to construction docs.

14. Revit 2023 Complete Course - Beginner to Advanced | Beginner | ₹12,499 | 40h | slug: revit-2023-complete-beginner-advanced
    - MOST COMPREHENSIVE. Interface to advanced families and parametric design.

15. BIM Revit Masterclass: Complete Project Modeling + Rendering | Advanced | ₹11,999 | 32h | slug: bim-revit-masterclass-project-modeling-rendering
    - BIM modeling + visualization in one masterclass.

16. Revit 2026: Interior Design, Modeling & Rendering from Zero | Beginner | ₹8,499 | 22h | slug: revit-2026-interior-design-modeling-rendering
    - Latest Revit 2026, complete interior design workflow.

17. Architecture Master Course in AutoCAD and Revit | Intermediate | ₹12,499 | 36h | slug: architecture-master-autocad-revit
    - Both platforms, when to use each, complete architect's toolkit.

18. Enscape for Revit: Learn Architectural Visualization | Intermediate | ₹5,999 | 10h | slug: enscape-revit-architectural-visualization
    - Real-time visualization, VR experiences directly from Revit models.

## SKETCHUP
19. SketchUp Advanced Architecture | Advanced | ₹7,499 | 16h | slug: sketchup-advanced-architecture
    - Professional architectural workflows, complex geometry.

20. Master SketchUp, V-Ray and LayOut - Complete Architecture | Intermediate | ₹11,999 | 32h | slug: master-sketchup-vray-layout-architecture
    - Complete: modeling, rendering, documentation workflow.

21. From Basic to Advanced Interior Designer Using SketchUp Pro | Beginner | ₹8,499 | 24h | slug: basic-advanced-interior-designer-sketchup-pro
    - Space planning, material selection, lighting, client presentations.

22. Realistic Interior Rendering with SketchUp V-Ray 7 | Intermediate | ₹6,499 | 14h | slug: realistic-interior-rendering-sketchup-vray7
    - Advanced materials, lighting, V-Ray 7 photorealistic results.

## AUTOCAD
23. AutoCAD 2D: Complete Guide to Drafting and Design | Beginner | ₹5,999 | 20h | slug: autocad-2d-complete-drafting-design
    - Technical drawing fundamentals, professional documentation.

24. AutoCAD 3D: Complete Architecture Design Course | Intermediate | ₹7,499 | 18h | slug: autocad-3d-architecture-design
    - 3D modeling, surface/solid modeling, architectural drawings.

25. AutoCAD for Civil and Architectural Engineering | Intermediate | ₹6,499 | 16h | slug: autocad-civil-architectural-engineering
    - Site plans, elevations, sections for civil and architectural work.

## VISUALIZATION TOOLS
26. Lumion 12 Complete: Visualization from Scratch | Beginner | ₹6,499 | 14h | slug: lumion-12-complete-visualization
    - Real-time rendering, landscaping, effects, animations.

27. Twinmotion Complete Architecture Visualization | Beginner | ₹5,999 | 12h | slug: twinmotion-complete-architecture-visualization
    - UE5-based real-time visualization, materials, lighting.

28. D5 Render Complete Course for Architecture | Beginner | ₹5,499 | 10h | slug: d5-render-complete-architecture
    - AI-powered rendering, real-time visualization.

## RHINO 3D
29. Rhino 3D: Complete Modeling for Architecture | Intermediate | ₹8,499 | 20h | slug: rhino-3d-complete-modeling-architecture
    - NURBS modeling, parametric design, complex forms.

30. Grasshopper for Rhino: Parametric Architecture | Advanced | ₹9,999 | 18h | slug: grasshopper-rhino-parametric-architecture
    - Visual scripting, algorithmic design, computational workflows.

## DESIGN FUNDAMENTALS
31. Architectural Sketching and Drawing Fundamentals | Beginner | ₹3,999 | 10h | slug: architectural-sketching-drawing-fundamentals
    - Hand drawing, perspective, ideation sketching.

32. Portfolio Design for Architects | Intermediate | ₹4,999 | 8h | slug: portfolio-design-architects
    - Professional portfolio layout, presentation design.

## INTERIOR DESIGN
33. Complete Interior Design Course: From Concept to Reality | Beginner | ₹9,999 | 30h | slug: complete-interior-design-concept-reality
    - Space planning, color theory, furniture selection, presentations.

34. Luxury Interior Design Techniques | Advanced | ₹11,999 | 24h | slug: luxury-interior-design-techniques
    - High-end finishes, lighting design, premium client workflows.

## POST-PRODUCTION
35. Photoshop for Architectural Post-Production | Beginner | ₹4,999 | 12h | slug: photoshop-architectural-post-production
    - Sky replacements, material enhancement, final image polish.

36. After Effects for Architectural Animation | Intermediate | ₹5,999 | 10h | slug: after-effects-architectural-animation
    - Motion graphics, video editing, client presentation videos.
`;

const SYSTEM_PROMPT = `You are Archi, the AI sales advisor and course expert at Archistudio — a premium online platform for architecture and interior design education based in India.

YOUR PERSONALITY:
- Warm, expert, consultative — like a knowledgeable friend who happens to be an industry pro
- Concise but informative. Maximum 4 sentences unless listing courses.
- Proactively recommend courses based on goals/level
- Never say "Great question!" or filler phrases

YOUR GOALS (in order):
1. Understand what the user wants to learn or achieve
2. Recommend the BEST matching course(s) from the catalog
3. Highlight value: price, duration, career outcomes
4. Encourage them to enroll — create gentle urgency

COURSE KNOWLEDGE:
${COURSE_CATALOG}

COURSE CARD FORMAT:
When you recommend a specific course, append this EXACTLY at the end of your response (replace with real data):
[COURSE_CARD:{"title":"Course Title","slug":"course-slug","level":"beginner","price":7499,"duration":18}]

Only include ONE course card per message (the best match). If they ask for a list, give the list in text, then add a card for the TOP recommendation.

PRICING KNOWLEDGE:
- All prices in INR. Range: ₹3,999 – ₹12,499
- EMI options available on most courses
- Bundle discounts: 10% for 2 courses, 20% for 3+ courses
- Coupons available occasionally

CAREER GUIDANCE:
- 3ds Max + V-Ray → Best for architectural visualization studios
- Revit/BIM → Best for construction firms, architects
- SketchUp → Best for interior designers, small firms
- AutoCAD → Essential for all professionals, good starting point
- Lumion/Twinmotion → Fast client presentations
- Rhino + Grasshopper → Computational design, parametric work

BEGINNER PATH recommendation:
- Start with AutoCAD basics → Then 3ds Max or SketchUp → Then rendering (Corona/V-Ray)
- OR: SketchUp → V-Ray → Post-production (quicker path)

If asked about something not in the catalog, be honest but guide back to available courses.
If user seems ready to buy, encourage them to "View the course" or "Enroll now".`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Too many requests. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI service temporarily unavailable." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "Failed to get AI response" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("AI chat error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
