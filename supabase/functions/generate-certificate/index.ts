import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CertificateSettings {
  logo_url: string | null;
  background_color: string;
  primary_color: string;
  accent_color: string;
  font_family: string;
  institution_name: string;
  institution_tagline: string;
  signature_name: string;
  signature_title: string;
  show_border: boolean;
  border_style: string;
}

const defaultSettings: CertificateSettings = {
  logo_url: null,
  background_color: '#ffffff',
  primary_color: '#1a1a1a',
  accent_color: '#c45a32',
  font_family: 'Playfair Display',
  institution_name: 'Concrete Logic',
  institution_tagline: 'Architecture Learning Platform',
  signature_name: 'Course Director',
  signature_title: 'Concrete Logic',
  show_border: true,
  border_style: 'classic',
};

function getBorderStyles(settings: CertificateSettings): string {
  if (!settings.show_border) return '';
  
  switch (settings.border_style) {
    case 'classic':
      return `
        border: 3px solid ${settings.primary_color};
        .inner-border {
          position: absolute;
          top: 10px;
          left: 10px;
          right: 10px;
          bottom: 10px;
          border: 1px solid ${settings.primary_color}40;
        }
      `;
    case 'modern':
      return `border: 2px solid ${settings.primary_color};`;
    case 'elegant':
      return `
        border: 1px solid ${settings.primary_color}30;
        .corner {
          position: absolute;
          width: 40px;
          height: 40px;
          border-color: ${settings.accent_color};
        }
        .corner-tl { top: 10px; left: 10px; border-top: 3px solid; border-left: 3px solid; }
        .corner-tr { top: 10px; right: 10px; border-top: 3px solid; border-right: 3px solid; }
        .corner-bl { bottom: 10px; left: 10px; border-bottom: 3px solid; border-left: 3px solid; }
        .corner-br { bottom: 10px; right: 10px; border-bottom: 3px solid; border-right: 3px solid; }
      `;
    case 'minimal':
      return `border: 1px solid ${settings.primary_color}20;`;
    default:
      return `border: 3px solid ${settings.primary_color};`;
  }
}

function generateBorderHTML(settings: CertificateSettings): string {
  if (!settings.show_border) return '';
  
  if (settings.border_style === 'classic') {
    return '<div class="inner-border"></div>';
  }
  
  if (settings.border_style === 'elegant') {
    return `
      <div class="corner corner-tl"></div>
      <div class="corner corner-tr"></div>
      <div class="corner corner-bl"></div>
      <div class="corner corner-br"></div>
    `;
  }
  
  return '';
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch certificate settings
    const { data: settingsData } = await supabase
      .from("certificate_settings")
      .select("*")
      .limit(1)
      .single();

    const settings: CertificateSettings = settingsData ? {
      logo_url: settingsData.logo_url,
      background_color: settingsData.background_color || defaultSettings.background_color,
      primary_color: settingsData.primary_color || defaultSettings.primary_color,
      accent_color: settingsData.accent_color || defaultSettings.accent_color,
      font_family: settingsData.font_family || defaultSettings.font_family,
      institution_name: settingsData.institution_name || defaultSettings.institution_name,
      institution_tagline: settingsData.institution_tagline || defaultSettings.institution_tagline,
      signature_name: settingsData.signature_name || defaultSettings.signature_name,
      signature_title: settingsData.signature_title || defaultSettings.signature_title,
      show_border: settingsData.show_border ?? defaultSettings.show_border,
      border_style: settingsData.border_style || defaultSettings.border_style,
    } : defaultSettings;

    // Check if this is a preview request
    const url = new URL(req.url);
    if (url.searchParams.get("preview") === "true") {
      const previewHtml = generateCertificateHtml(
        settings,
        "Student Name",
        "Course Title",
        new Date().toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        }),
        "PREVIEW-001"
      );
      return new Response(previewHtml, {
        headers: { ...corsHeaders, "Content-Type": "text/html" },
      });
    }

    const { certificateId, userId, courseId } = await req.json();

    let certificate;

    if (certificateId) {
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
      const { data: existing } = await supabase
        .from("certificates")
        .select("*")
        .eq("user_id", userId)
        .eq("course_id", courseId)
        .single();

      if (existing) {
        certificate = existing;
      } else {
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

    const courseName = certificate.courses?.title || "Course";
    const studentName = certificate.profiles?.full_name || "Student";
    const issueDate = new Date(certificate.issued_at).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const certificateHtml = generateCertificateHtml(
      settings,
      studentName,
      courseName,
      issueDate,
      certificate.certificate_number
    );

    return new Response(certificateHtml, {
      headers: { ...corsHeaders, "Content-Type": "text/html" },
    });
  } catch (error) {
    console.error("Certificate generation error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to generate certificate" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function generateCertificateHtml(
  settings: CertificateSettings,
  studentName: string,
  courseName: string,
  issueDate: string,
  certificateNumber: string
): string {
  const borderStyles = getBorderStyles(settings);
  const borderHTML = generateBorderHTML(settings);

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Certificate - ${certificateNumber}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=${settings.font_family.replace(/ /g, '+')}:wght@400;600;700&family=Open+Sans:wght@400;600&display=swap');
    
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
      min-height: 636px;
      background: ${settings.background_color};
      padding: 60px;
      position: relative;
      ${borderStyles}
    }
    
    .inner-border {
      position: absolute;
      top: 10px;
      left: 10px;
      right: 10px;
      bottom: 10px;
      border: 1px solid ${settings.primary_color}40;
      pointer-events: none;
    }
    
    .corner {
      position: absolute;
      width: 40px;
      height: 40px;
      border-color: ${settings.accent_color};
    }
    .corner-tl { top: 10px; left: 10px; border-top: 3px solid ${settings.accent_color}; border-left: 3px solid ${settings.accent_color}; }
    .corner-tr { top: 10px; right: 10px; border-top: 3px solid ${settings.accent_color}; border-right: 3px solid ${settings.accent_color}; }
    .corner-bl { bottom: 10px; left: 10px; border-bottom: 3px solid ${settings.accent_color}; border-left: 3px solid ${settings.accent_color}; }
    .corner-br { bottom: 10px; right: 10px; border-bottom: 3px solid ${settings.accent_color}; border-right: 3px solid ${settings.accent_color}; }
    
    .header {
      text-align: center;
      margin-bottom: 40px;
    }
    
    .logo {
      max-height: 60px;
      margin-bottom: 15px;
    }
    
    .institution-name {
      font-family: '${settings.font_family}', serif;
      font-size: 28px;
      font-weight: 700;
      letter-spacing: 4px;
      color: ${settings.primary_color};
      text-transform: uppercase;
      margin-bottom: 8px;
    }
    
    .institution-tagline {
      font-size: 12px;
      color: ${settings.primary_color}80;
      letter-spacing: 2px;
      text-transform: uppercase;
    }
    
    .title {
      font-family: '${settings.font_family}', serif;
      font-size: 42px;
      text-align: center;
      margin: 30px 0;
      font-weight: 400;
      color: ${settings.primary_color};
    }
    
    .content {
      text-align: center;
      margin: 40px 0;
    }
    
    .label {
      font-size: 14px;
      color: ${settings.primary_color}80;
      margin-bottom: 10px;
    }
    
    .name {
      font-family: '${settings.font_family}', serif;
      font-size: 36px;
      font-weight: 700;
      color: ${settings.primary_color};
      margin-bottom: 30px;
    }
    
    .course {
      font-size: 16px;
      color: ${settings.primary_color}90;
      margin-bottom: 8px;
    }
    
    .course-name {
      font-family: '${settings.font_family}', serif;
      font-size: 24px;
      font-weight: 600;
      color: ${settings.accent_color};
    }
    
    .footer {
      display: flex;
      justify-content: space-between;
      margin-top: 60px;
      padding-top: 30px;
      border-top: 1px solid ${settings.primary_color}20;
    }
    
    .footer-item {
      text-align: center;
    }
    
    .footer-label {
      font-size: 11px;
      color: ${settings.primary_color}60;
      margin-bottom: 5px;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    
    .footer-value {
      font-size: 14px;
      font-weight: 600;
      color: ${settings.primary_color};
    }
    
    .signature-section {
      text-align: right;
    }
    
    .signature-line {
      width: 150px;
      height: 1px;
      background: ${settings.primary_color};
      margin-left: auto;
      margin-bottom: 8px;
    }
    
    .signature-name {
      font-size: 14px;
      font-weight: 600;
      color: ${settings.primary_color};
    }
    
    .signature-title {
      font-size: 12px;
      color: ${settings.primary_color}70;
    }
    
    .cert-number {
      font-family: monospace;
      font-size: 11px;
      color: ${settings.primary_color}50;
      text-align: center;
      margin-top: 30px;
    }
    
    @media print {
      body { background: white; padding: 0; }
      .certificate { box-shadow: none; }
    }
  </style>
</head>
<body>
  <div class="certificate">
    ${borderHTML}
    
    <div class="header">
      ${settings.logo_url ? `<img src="${settings.logo_url}" alt="Logo" class="logo" />` : ''}
      <div class="institution-name">${settings.institution_name}</div>
      <div class="institution-tagline">${settings.institution_tagline}</div>
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
        <p class="footer-value">${certificateNumber}</p>
      </div>
      <div class="footer-item signature-section">
        <div class="signature-line"></div>
        <p class="signature-name">${settings.signature_name}</p>
        <p class="signature-title">${settings.signature_title}</p>
      </div>
    </div>
    
    <p class="cert-number">Verify at: https://concrete-logic.lovable.app/verify/${certificateNumber}</p>
  </div>
  
  <script>
    window.onload = function() {
      window.print();
    }
  </script>
</body>
</html>
  `;
}