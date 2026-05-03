import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const jobs = [
      {
        title: "Thesis Support — Urban Revitalization of Old Delhi",
        description: "Need a mentor to help with concept development and large-scale master planning sheets. Must have experience with urban design competitions. Deliverables: Concept diagrams, site analysis sheets, and 3D massing.",
        category: "Thesis Help",
        budget_min: 5000,
        budget_max: 12000,
        skills_required: ["Urban Design", "Site Planning & Analysis", "Illustrator"],
      },
      {
        title: "Third Year Hill Housing — Revit Modelling & Sections",
        description: "Looking for someone to help with a complex topography model for my hill housing project. Need accurate site sections and a detailed Revit model showing split levels.",
        category: "BIM / Revit",
        budget_min: 3500,
        budget_max: 7000,
        skills_required: ["Revit", "Architectural Drawings", "3D Modelling"],
      },
      {
        title: "High-End Residential — Working Drawing Set (G+2)",
        description: "Need a complete set of municipal and execution drawings for a residential bungalow in Mumbai. Standard office quality required. Must include plumbing and electrical layouts.",
        category: "Architectural Drawings",
        budget_min: 15000,
        budget_max: 25000,
        skills_required: ["AutoCAD Drafting", "Architectural Drawings", "Structural Detailing"],
      },
      {
        title: "Interior Rendering — 3ds Max + Corona",
        description: "Hyper-realistic renders for a luxury apartment lobby. Reference images provided. Looking for top-tier lighting and material quality. Deliverables: 4 high-res renders.",
        category: "Rendering & Visualization",
        budget_min: 8000,
        budget_max: 15000,
        skills_required: ["3ds Max", "Corona Renderer", "Photorealistic Rendering"],
      },
      {
        title: "Parametric Facade Study — Grasshopper",
        description: "Generate a kinetic facade script for a commercial building. Need a script that can be exported to Revit via Rhino.Inside. Experimental concept.",
        category: "Concept Design",
        budget_min: 6000,
        budget_max: 10000,
        skills_required: ["Rhino", "Grasshopper", "Concept Design"],
      },
      {
        title: "Landscape Design — Sustainable Park Masterplan",
        description: "Developing a 2-acre sustainable community park. Need help with planting schedules and 3D visualization in Lumion.",
        category: "Landscape Design",
        budget_min: 12000,
        budget_max: 20000,
        skills_required: ["Landscape Design", "Lumion", "Site Planning & Analysis"],
      },
      {
        title: "D5 Render Walkthrough — Modern Villa",
        description: "Need a 30s cinematic walkthrough using D5 Render. SketchUp model is ready. Looking for someone who can handle realistic lighting and vegetation.",
        category: "Rendering & Visualization",
        budget_min: 5000,
        budget_max: 9000,
        skills_required: ["D5 Render", "SketchUp", "3D Animation"],
      },
      {
        title: "Thesis Mentorship — Healthcare Architecture",
        description: "Looking for a specialized mentor for a hospital project. Need guidance on functional zoning and technical requirements for OT/Labs.",
        category: "Thesis Help",
        budget_min: 4000,
        budget_max: 8000,
        skills_required: ["Thesis & Academic Support", "Concept Design"],
      },
      {
        title: "BIM Coordination — LOD 350 Retail Mall",
        description: "Need help with clash detection and coordination in Navisworks for a mid-size retail project. Revit models from MEP and Structural need to be aligned.",
        category: "BIM / Revit",
        budget_min: 20000,
        budget_max: 45000,
        skills_required: ["Revit", "BIM Coordination"],
      },
      {
        title: "AutoCAD Drafting — Interior Furniture Details",
        description: "Series of custom furniture details (joinery, sections) for a boutique hotel. 15 details in total. Standard CAD blocks provided.",
        category: "AutoCAD Drafting",
        budget_min: 3000,
        budget_max: 6000,
        skills_required: ["AutoCAD Drafting", "Furniture Design"],
      }
    ];

    console.log(`Seeding ${jobs.length} jobs...`);

    for (const job of jobs) {
      // Pick a random date in last 5 days
      const daysAgo = Math.floor(Math.random() * 5);
      const date = new Date();
      date.setDate(date.getDate() - daysAgo);

      await supabase.from("marketplace_jobs").insert({
        title: job.title,
        description: job.description,
        category: job.category,
        budget_min: job.budget_min,
        budget_max: job.budget_max,
        skills_required: job.skills_required,
        status: "open",
        visibility: "public",
        budget_type: "range",
        currency: "INR",
        created_at: date.toISOString(),
      });
    }

    return new Response(JSON.stringify({ success: true, seeded: jobs.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});
