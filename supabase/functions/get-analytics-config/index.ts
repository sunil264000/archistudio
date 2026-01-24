import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const ga4Id = Deno.env.get('GA4_MEASUREMENT_ID') || '';
    
    return new Response(
      JSON.stringify({ 
        ga4_measurement_id: ga4Id,
        enabled: !!ga4Id && ga4Id !== 'G-XXXXXXXXXX'
      }),
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error('Error fetching analytics config:', error);
    return new Response(
      JSON.stringify({ ga4_measurement_id: '', enabled: false }),
      { headers: corsHeaders }
    );
  }
});
