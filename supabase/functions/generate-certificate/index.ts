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
  institution_tagline: 'Architecture & Design Learning Platform',
  signature_name: 'Sunil Kumar',
  signature_title: 'Founder & Lead Instructor, Concrete Logic',
  show_border: true,
  border_style: 'elegant',
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
    @import url('https://fonts.googleapis.com/css2?family=${settings.font_family.replace(/ /g, '+')}:wght@400;600;700&family=Open+Sans:wght@400;600&family=Great+Vibes&display=swap');
    
    * { margin: 0; padding: 0; box-sizing: border-box; }
    
    @page {
      size: landscape;
      margin: 0;
    }
    
    body {
      font-family: 'Open Sans', sans-serif;
      background: #f0ebe3;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    
    .certificate {
      width: 1100px;
      min-height: 780px;
      background: ${settings.background_color};
      padding: 0;
      position: relative;
      box-shadow: 0 25px 60px rgba(0,0,0,0.15);
      overflow: hidden;
    }
    
    /* Decorative top accent bar */
    .top-accent {
      height: 8px;
      background: linear-gradient(90deg, ${settings.accent_color}, ${settings.primary_color}, ${settings.accent_color});
    }
    
    .certificate-inner {
      padding: 50px 70px 40px;
      position: relative;
    }
    
    /* Watermark */
    .watermark {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) rotate(-30deg);
      font-family: '${settings.font_family}', serif;
      font-size: 120px;
      font-weight: 700;
      color: ${settings.primary_color}06;
      letter-spacing: 20px;
      white-space: nowrap;
      pointer-events: none;
      text-transform: uppercase;
    }
    
    ${borderStyles}
    
    .inner-border {
      position: absolute;
      top: 10px;
      left: 10px;
      right: 10px;
      bottom: 10px;
      border: 1px solid ${settings.primary_color}15;
      pointer-events: none;
    }
    
    .corner {
      position: absolute;
      width: 50px;
      height: 50px;
      border-color: ${settings.accent_color};
    }
    .corner-tl { top: 15px; left: 15px; border-top: 3px solid ${settings.accent_color}; border-left: 3px solid ${settings.accent_color}; }
    .corner-tr { top: 15px; right: 15px; border-top: 3px solid ${settings.accent_color}; border-right: 3px solid ${settings.accent_color}; }
    .corner-bl { bottom: 15px; left: 15px; border-bottom: 3px solid ${settings.accent_color}; border-left: 3px solid ${settings.accent_color}; }
    .corner-br { bottom: 15px; right: 15px; border-bottom: 3px solid ${settings.accent_color}; border-right: 3px solid ${settings.accent_color}; }
    
    .header {
      text-align: center;
      margin-bottom: 10px;
    }
    
    .logo {
      max-height: 55px;
      margin-bottom: 12px;
    }
    
    .institution-name {
      font-family: '${settings.font_family}', serif;
      font-size: 26px;
      font-weight: 700;
      letter-spacing: 6px;
      color: ${settings.primary_color};
      text-transform: uppercase;
      margin-bottom: 6px;
    }
    
    .institution-tagline {
      font-size: 11px;
      color: ${settings.primary_color}70;
      letter-spacing: 3px;
      text-transform: uppercase;
    }
    
    .divider {
      width: 80px;
      height: 2px;
      background: linear-gradient(90deg, transparent, ${settings.accent_color}, transparent);
      margin: 20px auto;
    }
    
    .title {
      font-family: '${settings.font_family}', serif;
      font-size: 46px;
      text-align: center;
      margin: 15px 0;
      font-weight: 400;
      color: ${settings.primary_color};
      letter-spacing: 2px;
    }
    
    .subtitle {
      text-align: center;
      font-size: 13px;
      color: ${settings.primary_color}80;
      letter-spacing: 4px;
      text-transform: uppercase;
      margin-bottom: 30px;
    }
    
    .content {
      text-align: center;
      margin: 25px 0;
    }
    
    .label {
      font-size: 13px;
      color: ${settings.primary_color}70;
      margin-bottom: 12px;
      letter-spacing: 1px;
    }
    
    .name {
      font-family: 'Great Vibes', cursive;
      font-size: 52px;
      color: ${settings.primary_color};
      margin-bottom: 25px;
      line-height: 1.2;
    }
    
    .name-underline {
      width: 300px;
      height: 1px;
      background: linear-gradient(90deg, transparent, ${settings.accent_color}60, transparent);
      margin: -10px auto 25px;
    }
    
    .course {
      font-size: 14px;
      color: ${settings.primary_color}80;
      margin-bottom: 8px;
    }
    
    .course-name {
      font-family: '${settings.font_family}', serif;
      font-size: 26px;
      font-weight: 600;
      color: ${settings.accent_color};
      margin-bottom: 8px;
    }
    
    .course-description {
      font-size: 12px;
      color: ${settings.primary_color}60;
      max-width: 500px;
      margin: 0 auto;
      line-height: 1.6;
    }
    
    .footer {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      margin-top: 50px;
      padding-top: 25px;
      border-top: 1px solid ${settings.primary_color}10;
    }
    
    .footer-item {
      text-align: center;
      min-width: 160px;
    }
    
    .footer-label {
      font-size: 9px;
      color: ${settings.primary_color}50;
      margin-bottom: 6px;
      text-transform: uppercase;
      letter-spacing: 2px;
    }
    
    .footer-value {
      font-size: 13px;
      font-weight: 600;
      color: ${settings.primary_color};
    }
    
    .signature-section {
      text-align: center;
    }
    
    .signature-cursive {
      font-family: 'Great Vibes', cursive;
      font-size: 32px;
      color: ${settings.primary_color};
      margin-bottom: 4px;
    }
    
    .signature-line {
      width: 180px;
      height: 1px;
      background: ${settings.primary_color}40;
      margin: 0 auto 8px;
    }
    
    .signature-name {
      font-size: 13px;
      font-weight: 600;
      color: ${settings.primary_color};
    }
    
    .signature-title {
      font-size: 10px;
      color: ${settings.primary_color}60;
      letter-spacing: 1px;
    }
    
    .cert-number {
      font-family: monospace;
      font-size: 9px;
      color: ${settings.primary_color}35;
      text-align: center;
      margin-top: 25px;
      letter-spacing: 1px;
    }

    .seal {
      position: absolute;
      bottom: 80px;
      right: 80px;
      width: 90px;
      height: 90px;
      border-radius: 50%;
      border: 2px solid ${settings.accent_color}40;
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0.6;
    }

    .seal-inner {
      width: 70px;
      height: 70px;
      border-radius: 50%;
      border: 1px solid ${settings.accent_color}30;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      font-size: 8px;
      color: ${settings.accent_color};
      text-transform: uppercase;
      letter-spacing: 1px;
      text-align: center;
      line-height: 1.3;
    }

    .seal-text {
      font-weight: 700;
      font-size: 10px;
    }
    
    @media print {
      body { background: white; padding: 0; }
      .certificate { box-shadow: none; width: 100%; min-height: 100vh; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="certificate">
    <div class="top-accent"></div>
    ${borderHTML}
    <div class="watermark">${settings.institution_name}</div>
    
    <div class="certificate-inner">
      <div class="header">
        ${settings.logo_url ? `<img src="${settings.logo_url}" alt="Logo" class="logo" />` : ''}
        <div class="institution-name">${settings.institution_name}</div>
        <div class="institution-tagline">${settings.institution_tagline}</div>
      </div>
      
      <div class="divider"></div>
      
      <h1 class="title">Certificate of Completion</h1>
      <p class="subtitle">This certificate is proudly presented to</p>
      
      <div class="content">
        <p class="name">${studentName}</p>
        <div class="name-underline"></div>
        <p class="course">for successfully completing the program</p>
        <p class="course-name">${courseName}</p>
        <p class="course-description">
          Having demonstrated dedication and commitment to professional growth in architecture and design education.
        </p>
      </div>
      
      <div class="footer">
        <div class="footer-item">
          <p class="footer-label">Date of Completion</p>
          <p class="footer-value">${issueDate}</p>
        </div>
        
        <div class="footer-item signature-section">
          <div class="signature-cursive">${settings.signature_name}</div>
          <div class="signature-line"></div>
          <p class="signature-name">${settings.signature_name}</p>
          <p class="signature-title">${settings.signature_title}</p>
        </div>
        
        <div class="footer-item">
          <p class="footer-label">Certificate No.</p>
          <p class="footer-value">${certificateNumber}</p>
        </div>
      </div>

      <!-- Verification seal -->
      <div class="seal">
        <div class="seal-inner">
          <span class="seal-text">Verified</span>
          <span>Authentic</span>
        </div>
      </div>
      
      <p class="cert-number">Verify at: https://archistudio.lovable.app/verify/${certificateNumber}</p>
    </div>
  </div>
  
  <script>
    // Auto-trigger print dialog for easy PDF saving
    window.onload = function() {
      setTimeout(function() { window.print(); }, 500);
    }
  </script>
</body>
</html>
  `;
}