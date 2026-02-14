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
  primary_color: '#1a1a2e',
  accent_color: '#c45a32',
  font_family: 'Playfair Display',
  institution_name: 'Archistudio',
  institution_tagline: 'Architecture & Design Learning Platform',
  signature_name: 'Sunil Kumar',
  signature_title: 'Founder & Lead Instructor',
  show_border: true,
  border_style: 'elegant',
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch certificate settings from DB (admin-customizable)
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

    // Preview mode
    const url = new URL(req.url);
    if (url.searchParams.get("preview") === "true") {
      const previewHtml = generateCertificateHtml(
        settings, "John Doe", "3ds Max Architectural Visualization",
        new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }),
        "AS-PREVIEW-001"
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
        .select(`*, courses:course_id (title)`)
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
        const certificateNumber = `AS${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

        const { data: newCert, error: insertError } = await supabase
          .from("certificates")
          .insert({
            user_id: userId,
            course_id: courseId,
            certificate_number: certificateNumber,
          })
          .select(`*, courses:course_id (title)`)
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

    // Always fetch the student name from profiles using the certificate's user_id
    const certUserId = certificate.user_id;
    const { data: profileData } = await supabase
      .from("profiles")
      .select("full_name, email")
      .eq("user_id", certUserId)
      .single();

    const studentName = profileData?.full_name || profileData?.email || "Student";
    const courseName = certificate.courses?.title || "Studio Program";
    const issueDate = new Date(certificate.issued_at).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const certificateHtml = generateCertificateHtml(
      settings, studentName, courseName, issueDate, certificate.certificate_number
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
  const ac = settings.accent_color;
  const pc = settings.primary_color;

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Proof of Completion – ${studentName} – ${courseName}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400&family=Great+Vibes&family=Inter:wght@300;400;500;600&display=swap');

    *{margin:0;padding:0;box-sizing:border-box}
    @page{size:landscape;margin:0}

    body{
      font-family:'Inter',sans-serif;
      background:#e8e2d8;
      min-height:100vh;
      display:flex;align-items:center;justify-content:center;
      padding:24px;
      -webkit-print-color-adjust:exact;print-color-adjust:exact;
    }

    .cert{
      width:1120px;min-height:790px;background:#fff;
      position:relative;overflow:hidden;
      box-shadow:0 30px 80px rgba(0,0,0,.12);
    }

    /* Top gold-terracotta bar */
    .top-bar{height:6px;background:linear-gradient(90deg,#d4a853,${ac},#d4a853)}

    /* Corner accents */
    .corner{position:absolute;width:60px;height:60px}
    .corner svg{width:100%;height:100%}
    .c-tl{top:16px;left:16px}.c-tr{top:16px;right:16px;transform:rotate(90deg)}
    .c-bl{bottom:16px;left:16px;transform:rotate(-90deg)}.c-br{bottom:16px;right:16px;transform:rotate(180deg)}

    /* Subtle inner border */
    .inner-border{
      position:absolute;top:28px;left:28px;right:28px;bottom:28px;
      border:1px solid ${pc}0d;pointer-events:none;
    }

    /* Watermark */
    .watermark{
      position:absolute;top:50%;left:50%;
      transform:translate(-50%,-50%) rotate(-25deg);
      font-family:'Playfair Display',serif;font-size:130px;font-weight:700;
      color:${pc}04;letter-spacing:18px;white-space:nowrap;pointer-events:none;
      text-transform:uppercase;
    }

    /* Decorative side ribbons */
    .ribbon-left,.ribbon-right{
      position:absolute;top:0;bottom:0;width:45px;
      background:linear-gradient(180deg,${ac}08,${ac}03,${ac}08);
    }
    .ribbon-left{left:0}.ribbon-right{right:0}

    .cert-body{
      position:relative;padding:55px 85px 45px;
    }

    /* Header */
    .header{text-align:center;margin-bottom:8px}
    .brand{
      font-family:'Playfair Display',serif;font-size:30px;font-weight:700;
      letter-spacing:8px;color:${pc};text-transform:uppercase;margin-bottom:5px;
    }
    .tagline{
      font-size:10px;color:${pc}65;letter-spacing:4px;text-transform:uppercase;
    }

    /* Divider ornament */
    .ornament{text-align:center;margin:22px 0 18px;position:relative}
    .ornament::before,.ornament::after{
      content:'';position:absolute;top:50%;height:1px;width:120px;
      background:linear-gradient(90deg,transparent,${ac}50);
    }
    .ornament::before{right:calc(50% + 25px)}
    .ornament::after{left:calc(50% + 25px);background:linear-gradient(90deg,${ac}50,transparent)}
    .ornament-diamond{
      display:inline-block;width:10px;height:10px;
      background:${ac};transform:rotate(45deg);
    }

    /* Title */
    .title{
      font-family:'Cormorant Garamond',serif;font-size:48px;font-weight:400;
      text-align:center;color:${pc};margin:12px 0 6px;letter-spacing:3px;
      font-style:italic;
    }
    .presented{
      text-align:center;font-size:12px;color:${pc}70;
      letter-spacing:5px;text-transform:uppercase;margin-bottom:28px;
    }

    /* Student name */
    .student-name{
      font-family:'Great Vibes',cursive;font-size:56px;color:${pc};
      text-align:center;line-height:1.15;margin-bottom:8px;
    }
    .name-line{
      width:340px;height:2px;margin:0 auto 28px;
      background:linear-gradient(90deg,transparent,${ac},transparent);
    }

    /* Course info */
    .for-text{
      text-align:center;font-size:13px;color:${pc}80;margin-bottom:10px;
      letter-spacing:1px;
    }
    .course-name{
      font-family:'Playfair Display',serif;font-size:24px;font-weight:600;
      text-align:center;color:${ac};margin-bottom:10px;
    }
    .course-desc{
      text-align:center;font-size:11.5px;color:${pc}55;
      max-width:520px;margin:0 auto;line-height:1.7;
    }

    /* Footer */
    .footer{
      display:flex;justify-content:space-between;align-items:flex-end;
      margin-top:48px;padding-top:22px;
      border-top:1px solid ${pc}0a;
    }
    .footer-col{text-align:center;min-width:170px}
    .footer-label{
      font-size:8px;color:${pc}45;letter-spacing:2.5px;
      text-transform:uppercase;margin-bottom:6px;
    }
    .footer-val{font-size:13px;font-weight:600;color:${pc}}

    /* Signature */
    .sig-cursive{
      font-family:'Great Vibes',cursive;font-size:34px;color:${pc};margin-bottom:2px;
    }
    .sig-line{
      width:190px;height:1px;background:${pc}35;margin:0 auto 8px;
    }
    .sig-name{font-size:13px;font-weight:600;color:${pc}}
    .sig-title{font-size:9.5px;color:${pc}55;letter-spacing:1px}

    /* Seal */
    .seal{
      position:absolute;bottom:75px;right:85px;
      width:92px;height:92px;border-radius:50%;
      border:2.5px solid ${ac}35;
      display:flex;align-items:center;justify-content:center;
    }
    .seal-inner{
      width:72px;height:72px;border-radius:50%;
      border:1.5px solid ${ac}25;
      display:flex;flex-direction:column;align-items:center;justify-content:center;
      text-align:center;
    }
    .seal-big{font-size:10px;font-weight:700;color:${ac};letter-spacing:1.5px;text-transform:uppercase}
    .seal-small{font-size:7.5px;color:${ac}90;letter-spacing:1px;text-transform:uppercase;margin-top:1px}

    /* Verify */
    .verify{
      font-family:monospace;font-size:8.5px;color:${pc}28;
      text-align:center;margin-top:22px;letter-spacing:.8px;
    }

    /* Gold badge ribbon */
    .badge{
      position:absolute;top:28px;right:95px;width:56px;text-align:center;
    }
    .badge-ribbon{
      width:56px;height:70px;background:linear-gradient(135deg,#d4a853,#c9973b);
      clip-path:polygon(0 0,100% 0,100% 100%,50% 82%,0 100%);
      display:flex;align-items:center;justify-content:center;
      padding-bottom:12px;
    }
    .badge-star{color:#fff;font-size:22px}

    @media print{
      body{background:#fff;padding:0}
      .cert{box-shadow:none;width:100%;min-height:100vh}
      .no-print{display:none}
    }
  </style>
</head>
<body>
  <div class="cert">
    <div class="top-bar"></div>
    <div class="ribbon-left"></div>
    <div class="ribbon-right"></div>
    <div class="inner-border"></div>
    <div class="watermark">${settings.institution_name}</div>

    <!-- Corner ornaments -->
    <div class="corner c-tl"><svg viewBox="0 0 60 60"><path d="M0,0 L60,0 L60,8 L8,8 L8,60 L0,60 Z" fill="${ac}" opacity="0.25"/></svg></div>
    <div class="corner c-tr"><svg viewBox="0 0 60 60"><path d="M0,0 L60,0 L60,8 L8,8 L8,60 L0,60 Z" fill="${ac}" opacity="0.25"/></svg></div>
    <div class="corner c-bl"><svg viewBox="0 0 60 60"><path d="M0,0 L60,0 L60,8 L8,8 L8,60 L0,60 Z" fill="${ac}" opacity="0.25"/></svg></div>
    <div class="corner c-br"><svg viewBox="0 0 60 60"><path d="M0,0 L60,0 L60,8 L8,8 L8,60 L0,60 Z" fill="${ac}" opacity="0.25"/></svg></div>

    <!-- Gold badge -->
    <div class="badge">
      <div class="badge-ribbon"><span class="badge-star">★</span></div>
    </div>

    <div class="cert-body">
      <div class="header">
        ${settings.logo_url ? `<img src="${settings.logo_url}" alt="Logo" style="max-height:50px;margin-bottom:10px" />` : ''}
        <div class="brand">${settings.institution_name}</div>
        <div class="tagline">${settings.institution_tagline}</div>
      </div>

      <div class="ornament"><span class="ornament-diamond"></span></div>

      <h1 class="title">Proof of Completion</h1>
      <p class="presented">This is proudly presented to</p>

      <div class="student-name">${studentName}</div>
      <div class="name-line"></div>

      <p class="for-text">for successfully completing the studio program</p>
      <p class="course-name">${courseName}</p>
      <p class="course-desc">
        Having demonstrated dedication, discipline, and commitment to professional growth
        in architecture and design practice at ${settings.institution_name}.
      </p>

      <div class="footer">
        <div class="footer-col">
          <p class="footer-label">Date of Completion</p>
          <p class="footer-val">${issueDate}</p>
        </div>

        <div class="footer-col">
          <div class="sig-cursive">${settings.signature_name}</div>
          <div class="sig-line"></div>
          <p class="sig-name">${settings.signature_name}</p>
          <p class="sig-title">${settings.signature_title}</p>
        </div>

        <div class="footer-col">
          <p class="footer-label">Certificate No.</p>
          <p class="footer-val">${certificateNumber}</p>
        </div>
      </div>

      <!-- Seal -->
      <div class="seal">
        <div class="seal-inner">
          <span class="seal-big">Verified</span>
          <span class="seal-small">Authentic</span>
        </div>
      </div>

      <p class="verify">Verify at: https://archistudio.lovable.app/verify/${certificateNumber}</p>
    </div>
  </div>

  <script>
    window.onload = function() { setTimeout(function() { window.print(); }, 600); }
  </script>
</body>
</html>`;
}
