import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Fetch all projects
    const { data: projects, error: fetchError } = await supabase
      .from("studio_projects")
      .select("id");

    if (fetchError) throw fetchError;

    console.log(`Randomizing dates for ${projects.length} projects...`);

    for (const project of projects) {
      // Random date within the last 15 days
      const daysAgo = Math.floor(Math.random() * 15);
      const hoursAgo = Math.floor(Math.random() * 24);
      const minutesAgo = Math.floor(Math.random() * 60);
      
      const randomDate = new Date();
      randomDate.setDate(randomDate.getDate() - daysAgo);
      randomDate.setHours(randomDate.getHours() - hoursAgo);
      randomDate.setMinutes(randomDate.getMinutes() - minutesAgo);

      await supabase
        .from("studio_projects")
        .update({ created_at: randomDate.toISOString() })
        .eq("id", project.id);
    }

    return new Response(JSON.stringify({ success: true, message: "Dates randomized" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});
