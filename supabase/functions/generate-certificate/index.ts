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
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { certificateId, userId, courseId } = await req.json();

    let certificate;

    if (certificateId) {
      // Fetch existing certificate
      const { data, error } = await supabase
        .from("certificates")
        .select(`
          *,
          courses:course_id (title),
          profiles:user_id (full_name)
        `)
        .eq("id", certificateId)
        .single();

      if (error || !data) {
        return new Response(
          JSON.stringify({ error: "Certificate not found" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      certificate = data;
    } else if (userId && courseId) {
      // Check if certificate already exists
      const { data: existing } = await supabase
        .from("certificates")
        .select("*")
        .eq("user_id", userId)
        .eq("course_id", courseId)
        .single();

      if (existing) {
        certificate = existing;
      } else {
        // Create new certificate
        const certificateNumber = `CL${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
        
        const { data: newCert, error: insertError } = await supabase
          .from("certificates")
          .insert({
            user_id: userId,
            course_id: courseId,
            certificate_number: certificateNumber,
          })
          .select(`
            *,
            courses:course_id (title),
            profiles:user_id (full_name)
          `)
          .single();

        if (insertError) {
          console.error("Error creating certificate:", insertError);
          return new Response(
            JSON.stringify({ error: "Failed to create certificate" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        certificate = newCert;
      }
    } else {
      return new Response(
        JSON.stringify({ error: "Missing certificateId or userId+courseId" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate simple HTML certificate that can be printed as PDF
    const courseName = certificate.courses?.title || "Course";
    const studentName = certificate.profiles?.full_name || "Student";
    const issueDate = new Date(certificate.issued_at).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const certificateHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Certificate - ${certificate.certificate_number}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=Open+Sans:wght@400;600&display=swap');
    
    * { margin: 0; padding: 0; box-sizing: border-box; }
    
    body {
      font-family: 'Open Sans', sans-serif;
      background: #f5f5f5;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    
    .certificate {
      width: 900px;
      background: white;
      padding: 60px;
      border: 3px solid #1a1a1a;
      position: relative;
    }
    
    .certificate::before {
      content: '';
      position: absolute;
      top: 10px;
      left: 10px;
      right: 10px;
      bottom: 10px;
      border: 1px solid #ddd;
    }
    
    .header {
      text-align: center;
      margin-bottom: 40px;
    }
    
    .logo {
      font-family: 'Playfair Display', serif;
      font-size: 32px;
      font-weight: 700;
      letter-spacing: 3px;
      margin-bottom: 10px;
    }
    
    .subtitle {
      font-size: 14px;
      color: #666;
      letter-spacing: 2px;
      text-transform: uppercase;
    }
    
    .title {
      font-family: 'Playfair Display', serif;
      font-size: 48px;
      text-align: center;
      margin: 30px 0;
      font-weight: 400;
    }
    
    .content {
      text-align: center;
      margin: 40px 0;
    }
    
    .label {
      font-size: 14px;
      color: #666;
      margin-bottom: 10px;
    }
    
    .name {
      font-family: 'Playfair Display', serif;
      font-size: 36px;
      font-weight: 700;
      color: #1a1a1a;
      margin-bottom: 30px;
    }
    
    .course {
      font-size: 18px;
      color: #333;
      margin-bottom: 10px;
    }
    
    .course-name {
      font-family: 'Playfair Display', serif;
      font-size: 24px;
      font-weight: 600;
      color: #1a1a1a;
    }
    
    .footer {
      display: flex;
      justify-content: space-between;
      margin-top: 60px;
      padding-top: 30px;
      border-top: 1px solid #eee;
    }
    
    .footer-item {
      text-align: center;
    }
    
    .footer-label {
      font-size: 12px;
      color: #999;
      margin-bottom: 5px;
    }
    
    .footer-value {
      font-size: 14px;
      font-weight: 600;
    }
    
    .cert-number {
      font-family: monospace;
      font-size: 12px;
      color: #999;
      text-align: center;
      margin-top: 30px;
    }
    
    @media print {
      body { background: white; padding: 0; }
      .certificate { border: none; padding: 40px; }
      .certificate::before { border: none; }
    }
  </style>
</head>
<body>
  <div class="certificate">
    <div class="header">
      <div class="logo">CONCRETE LOGIC</div>
      <div class="subtitle">Architecture Learning Platform</div>
    </div>
    
    <h1 class="title">Certificate of Completion</h1>
    
    <div class="content">
      <p class="label">This is to certify that</p>
      <p class="name">${studentName}</p>
      <p class="course">has successfully completed the course</p>
      <p class="course-name">${courseName}</p>
    </div>
    
    <div class="footer">
      <div class="footer-item">
        <p class="footer-label">Date of Completion</p>
        <p class="footer-value">${issueDate}</p>
      </div>
      <div class="footer-item">
        <p class="footer-label">Certificate Number</p>
        <p class="footer-value">${certificate.certificate_number}</p>
      </div>
    </div>
    
    <p class="cert-number">Verify at: https://concrete-logic.lovable.app/verify/${certificate.certificate_number}</p>
  </div>
  
  <script>
    // Auto-print when opened
    window.onload = function() {
      window.print();
    }
  </script>
</body>
</html>
    `;

    return new Response(certificateHtml, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/html",
      },
    });
  } catch (error) {
    console.error("Certificate generation error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to generate certificate" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
