import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // 1. Initialize Supabase client with Service Role (to bypass RLS for admin tasks)
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const openAiKey = Deno.env.get('OPENAI_API_KEY') || '';

    if (!supabaseUrl || !supabaseServiceKey || !openAiKey) {
      throw new Error("Missing environment variables.");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 2. Fetch pending internships older than 2 days
    // "created_at < NOW() - INTERVAL '2 days'"
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

    const { data: pendingInternships, error: fetchError } = await supabase
      .from('internships')
      .select('id, title, company_name, description, requirements, city')
      .eq('is_approved', false)
      .lte('created_at', twoDaysAgo.toISOString())
      .limit(10); // Process in batches to avoid OpenAI rate limits/timeouts

    if (fetchError) {
      throw new Error(`Failed to fetch pending internships: ${fetchError.message}`);
    }

    if (!pendingInternships || pendingInternships.length === 0) {
      return new Response(JSON.stringify({ message: "No pending internships to process." }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const results = [];

    // 3. Process each internship with OpenAI
    for (const internship of pendingInternships) {
      const prompt = `
      You are an expert moderator for "Archistudio", a premium architecture platform. 
      Your task is to review the following submitted internship and determine if it is a legitimate architecture, interior design, or urban planning opportunity. 
      If it is legitimate and professional, reply with exactly one word: APPROVE
      If it is spam, completely unrelated to architecture (e.g., data entry, crypto scam, irrelevant marketing), or highly unprofessional, reply with exactly one word: REJECT

      Internship Details:
      Title: ${internship.title}
      Company: ${internship.company_name}
      Location: ${internship.city}
      Description: ${internship.description}
      Requirements: ${internship.requirements || 'N/A'}
      `;

      try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openAiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.1,
            max_tokens: 10,
          }),
        });

        if (!response.ok) {
          throw new Error(`OpenAI API error: ${response.statusText}`);
        }

        const aiData = await response.json();
        const decision = aiData.choices[0].message.content.trim().toUpperCase();

        if (decision.includes('APPROVE')) {
          // Approve
          await supabase.from('internships').update({ is_approved: true }).eq('id', internship.id);
          results.push({ id: internship.id, status: 'APPROVED' });
        } else {
          // Reject (Delete)
          await supabase.from('internships').delete().eq('id', internship.id);
          results.push({ id: internship.id, status: 'REJECTED' });
        }
      } catch (err) {
        console.error(`Failed to process internship ${internship.id}:`, err);
        results.push({ id: internship.id, status: 'ERROR', error: err instanceof Error ? err.message : String(err) });
      }
    }

    return new Response(JSON.stringify({ message: "Processed batch.", results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Cron Error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : String(error) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
