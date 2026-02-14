import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Only allow POST requests
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { 
          status: 405, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const { certificateNumber } = await req.json();

    // Validate input
    if (!certificateNumber || typeof certificateNumber !== 'string') {
      return new Response(
        JSON.stringify({ 
          valid: false, 
          error: 'Certificate number is required' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Sanitize input - only allow alphanumeric and hyphens
    const sanitizedCertNumber = certificateNumber.trim().slice(0, 100);
    if (!/^[a-zA-Z0-9\-]+$/.test(sanitizedCertNumber)) {
      return new Response(
        JSON.stringify({ 
          valid: false, 
          error: 'Invalid certificate number format' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Create Supabase client with service role for database access
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Query the certificate with course and profile info
    const { data, error } = await supabase
      .from('certificates')
      .select('certificate_number, issued_at, course_id, user_id')
      .eq('certificate_number', sanitizedCertNumber)
      .single();
    
    if (error && error.code !== 'PGRST116') {
      console.error('Database error:', error);
      return new Response(
        JSON.stringify({ valid: false, error: 'Verification failed' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!data) {
      return new Response(
        JSON.stringify({ valid: false, message: 'Certificate not found' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get course title
    let courseTitle = null;
    if (data.course_id) {
      const { data: courseData } = await supabase
        .from('courses')
        .select('title')
        .eq('id', data.course_id)
        .single();
      courseTitle = courseData?.title || null;
    }

    // Get student name
    let studentName = null;
    if (data.user_id) {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('full_name, email')
        .eq('user_id', data.user_id)
        .single();
      studentName = profileData?.full_name || profileData?.email || null;
    }

    // Return verification data
    return new Response(
      JSON.stringify({
        valid: true,
        certificate_number: data.certificate_number,
        issued_at: data.issued_at,
        course_title: courseTitle,
        student_name: studentName,
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error verifying certificate:', error);
    return new Response(
      JSON.stringify({ 
        valid: false, 
        error: 'An error occurred during verification' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
