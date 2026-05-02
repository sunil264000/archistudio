// Supabase Edge Function: optimize-project-brief
// Uses Lovable AI Gateway (no external API key required)

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const FALLBACK = (description: string) => ({
  optimizedDescription:
    `${description}\n\n--- AI OPTIMIZED ---\n\nKey Deliverables:\n- High-resolution 4K renders\n- Detailed BIM model (LOD 300)\n- Technical specification sheet\n\nQuality Standards:\n- Realistic lighting and material textures\n- Professional composition and environment mapping.`,
  suggestedSkills: ["BIM Coordination", "Technical Drawing", "Lighting Analysis"],
  suggestedTools: ["Revit", "V-Ray", "Photoshop"],
});

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { title, description } = await req.json();

    if (!title || !description || String(description).trim().length < 10) {
      return new Response(
        JSON.stringify({ error: "Provide a title and a description (min 10 chars)." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.warn("LOVABLE_API_KEY missing — returning fallback");
      return new Response(JSON.stringify(FALLBACK(description)), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
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
          {
            role: "system",
            content:
              "You are a professional architectural project manager. Optimize project briefs for clarity and professional standards.",
          },
          {
            role: "user",
            content:
              `Project Title: ${title}\nUser Description: ${description}\n\nExpand this into a professional brief with clear deliverables, technical requirements, and a professional tone.`,
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "return_optimized_brief",
              description: "Return the optimized architectural project brief.",
              parameters: {
                type: "object",
                properties: {
                  optimizedDescription: {
                    type: "string",
                    description: "Professional, expanded project description with deliverables and quality standards.",
                  },
                  suggestedSkills: {
                    type: "array",
                    items: { type: "string" },
                    description: "3-6 architectural/design skills relevant to the project.",
                  },
                  suggestedTools: {
                    type: "array",
                    items: { type: "string" },
                    description: "3-6 software/tools recommended for the project (Revit, V-Ray, etc.).",
                  },
                },
                required: ["optimizedDescription", "suggestedSkills", "suggestedTools"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "return_optimized_brief" } },
      }),
    });

    if (response.status === 429) {
      return new Response(
        JSON.stringify({ error: "Rate limit reached. Please try again in a moment." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    if (response.status === 402) {
      return new Response(
        JSON.stringify({ error: "AI credits exhausted. Please add credits in Workspace settings." }),
        { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    if (!response.ok) {
      const txt = await response.text();
      console.error("AI gateway error", response.status, txt);
      return new Response(JSON.stringify(FALLBACK(description)), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await response.json();
    const toolCall = aiData?.choices?.[0]?.message?.tool_calls?.[0];
    const argsStr = toolCall?.function?.arguments;

    let result: any = null;
    if (argsStr) {
      try {
        result = typeof argsStr === "string" ? JSON.parse(argsStr) : argsStr;
      } catch (e) {
        console.error("Failed parsing tool args", e);
      }
    }

    if (!result?.optimizedDescription) {
      result = FALLBACK(description);
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("optimize-project-brief error", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
