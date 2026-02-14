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
      const html = generateCertificateHtml(
        settings, "John Doe", "3ds Max Architectural Visualization",
        new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }),
        "AS-PREVIEW-001"
      );
      return new Response(html, {
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
        return new Response(JSON.stringify({ error: "Certificate not found" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      certificate = data;
    } else if (userId && courseId) {
      const { data: existing } = await supabase
        .from("certificates").select("*, courses:course_id (title)")
        .eq("user_id", userId).eq("course_id", courseId).single();

      if (existing) {
        certificate = existing;
      } else {
        const certificateNumber = `AS${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
        const { data: newCert, error: insertError } = await supabase
          .from("certificates")
          .insert({ user_id: userId, course_id: courseId, certificate_number: certificateNumber })
          .select(`*, courses:course_id (title)`)
          .single();
        if (insertError) {
          return new Response(JSON.stringify({ error: "Failed to create certificate" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }
        certificate = newCert;
      }
    } else {
      return new Response(JSON.stringify({ error: "Missing certificateId or userId+courseId" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { data: profileData } = await supabase
      .from("profiles").select("full_name, email")
      .eq("user_id", certificate.user_id).single();

    const studentName = profileData?.full_name || profileData?.email || "Student";
    const courseName = certificate.courses?.title || "Studio Program";
    const issueDate = new Date(certificate.issued_at).toLocaleDateString("en-US", {
      year: "numeric", month: "long", day: "numeric",
    });

    const html = generateCertificateHtml(settings, studentName, courseName, issueDate, certificate.certificate_number);
    return new Response(html, { headers: { ...corsHeaders, "Content-Type": "text/html" } });
  } catch (error) {
    console.error("Certificate generation error:", error);
    return new Response(JSON.stringify({ error: "Failed to generate certificate" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});

function generateCertificateHtml(
  s: CertificateSettings, studentName: string, courseName: string,
  issueDate: string, certNumber: string
): string {
  return `<!DOCTYPE html><html><head>
<meta charset="UTF-8">
<title>Proof of Completion – ${studentName} – ${courseName}</title>
<style>
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;0,800;0,900;1,400;1,500&family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400&family=Great+Vibes&family=Inter:wght@300;400;500;600&display=swap');
*{margin:0;padding:0;box-sizing:border-box}
@page{size:landscape;margin:0}
body{font-family:'Inter',sans-serif;background:#3d1c2e;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:40px;-webkit-print-color-adjust:exact;print-color-adjust:exact}

.cert-wrapper{width:1120px;min-height:790px;position:relative;background:#3d1c2e;padding:16px;box-shadow:0 40px 120px rgba(0,0,0,.4)}
.cert{width:100%;min-height:758px;position:relative;overflow:hidden;background:#fffdf9}

/* Gold double border */
.gold-border-outer{position:absolute;top:8px;left:8px;right:8px;bottom:8px;border:3px solid #c9a84c;pointer-events:none}
.gold-border-inner{position:absolute;top:14px;left:14px;right:14px;bottom:14px;border:1.5px solid #c9a84c;pointer-events:none}

/* Left maroon decorative wave panel */
.wave-panel{position:absolute;left:0;top:0;bottom:0;width:180px;overflow:hidden;z-index:2}
.wave-bg{position:absolute;inset:0;background:linear-gradient(180deg,#6b1d3a,#4a1228,#7a2244)}
.wave-shape1{position:absolute;right:-40px;top:0;bottom:0;width:120px;background:#fffdf9;border-radius:60% 0 0 50%/50% 0 0 50%}
.wave-shape2{position:absolute;right:-20px;top:0;bottom:0;width:100px;background:rgba(255,253,249,0.15);border-radius:50% 0 0 60%/40% 0 0 50%}
.wave-shape3{position:absolute;right:10px;top:0;bottom:0;width:80px;background:rgba(255,253,249,0.08);border-radius:60% 0 0 40%/50% 0 0 50%}

/* Gold dotted wave accents */
.dot-wave{position:absolute;z-index:3}
.dot-wave1{right:30px;top:80px;bottom:80px;width:60px}
.dot-wave2{right:55px;top:120px;bottom:120px;width:40px}
.dot-wave1 .dw,.dot-wave2 .dw{width:3px;height:3px;border-radius:50%;background:#c9a84c;position:absolute}

/* Certificate content */
.cert-content{position:relative;z-index:4;padding:50px 60px 40px 200px;min-height:658px;display:flex;flex-direction:column}

/* Header */
.cert-header{margin-bottom:8px}
.cert-main-title{font-family:'Playfair Display',serif;font-size:52px;font-weight:900;color:#2c1810;letter-spacing:4px;line-height:1}
.cert-sub-title{font-family:'Playfair Display',serif;font-size:22px;font-weight:400;color:#6b1d3a;letter-spacing:8px;text-transform:uppercase;margin-top:2px}

/* Divider line */
.gold-divider{width:100%;height:2px;background:linear-gradient(90deg,#c9a84c,#e8d48b,#c9a84c);margin:20px 0;opacity:0.6}
.gold-divider-thin{width:100%;height:1px;background:linear-gradient(90deg,transparent,#c9a84c60,transparent);margin:12px 0}

/* Presented to text */
.presented-text{font-family:'Inter',sans-serif;font-size:11px;color:#8b7355;letter-spacing:6px;text-transform:uppercase;font-weight:400;margin-bottom:6px}

/* Student name */
.student-name{font-family:'Great Vibes',cursive;font-size:58px;color:#2c1810;line-height:1.15;margin-bottom:4px}
.name-underline{width:400px;height:2px;background:linear-gradient(90deg,#c9a84c,#e8d48b,#c9a84c);margin-bottom:18px}

/* Description */
.cert-description{font-family:'Cormorant Garamond',serif;font-size:14px;color:#5a4a3a;line-height:1.9;max-width:560px;margin-bottom:8px;font-style:italic}

/* Course name */
.for-completing{font-family:'Inter',sans-serif;font-size:10px;color:#8b7355;letter-spacing:4px;text-transform:uppercase;margin-bottom:6px}
.course-title{font-family:'Playfair Display',serif;font-size:22px;font-weight:700;color:#6b1d3a;letter-spacing:2px;margin-bottom:20px}

/* Award badge */
.award-badge{position:absolute;top:50px;right:60px;width:110px;height:110px;z-index:5}
.badge-outer{width:110px;height:110px;border-radius:50%;background:linear-gradient(135deg,#c9a84c,#e8d48b,#c9a84c,#a67c30);display:flex;align-items:center;justify-content:center;box-shadow:0 4px 20px rgba(201,168,76,0.3)}
.badge-ring{width:96px;height:96px;border-radius:50%;border:2px solid rgba(255,255,255,0.4);display:flex;align-items:center;justify-content:center}
.badge-inner{width:82px;height:82px;border-radius:50%;background:linear-gradient(135deg,#6b1d3a,#4a1228);display:flex;flex-direction:column;align-items:center;justify-content:center;border:1.5px solid #c9a84c60}
.badge-year{font-family:'Playfair Display',serif;font-size:18px;font-weight:800;color:#e8d48b;letter-spacing:2px}
.badge-award{font-family:'Inter',sans-serif;font-size:7px;font-weight:700;color:#c9a84c;letter-spacing:3px;text-transform:uppercase;margin-top:2px}

/* Ribbon tails */
.badge-ribbon{position:absolute;bottom:-22px;left:50%;transform:translateX(-50%);width:70px;height:30px;overflow:hidden}
.ribbon-left,.ribbon-right{position:absolute;bottom:0;width:28px;height:30px}
.ribbon-left{left:5px;background:linear-gradient(135deg,#c9a84c,#a67c30);clip-path:polygon(0 0,100% 0,60% 100%,0 70%)}
.ribbon-right{right:5px;background:linear-gradient(135deg,#c9a84c,#a67c30);clip-path:polygon(0 0,100% 0,100% 70%,40% 100%)}

/* Laurel wreath around badge */
.laurel{position:absolute;inset:-10px;pointer-events:none}
.laurel svg{width:100%;height:100%}

/* Footer */
.cert-footer{margin-top:auto;display:flex;justify-content:space-between;align-items:flex-end;padding-top:20px}
.footer-block{text-align:center;min-width:180px}
.footer-line{width:180px;height:1px;background:#2c1810;margin:0 auto 8px}
.footer-label{font-family:'Inter',sans-serif;font-size:10px;font-weight:600;color:#2c1810;letter-spacing:4px;text-transform:uppercase}
.footer-value{font-family:'Inter',sans-serif;font-size:12px;color:#5a4a3a;margin-top:2px}

/* Signature */
.sig-block{text-align:center}
.sig-cursive{font-family:'Great Vibes',cursive;font-size:34px;color:#2c1810;margin-bottom:2px}
.sig-line2{width:200px;height:1px;background:#2c1810;margin:0 auto 6px}
.sig-name2{font-family:'Inter',sans-serif;font-size:11px;font-weight:600;color:#2c1810;letter-spacing:1px}
.sig-title2{font-family:'Inter',sans-serif;font-size:9px;color:#8b7355;letter-spacing:2px;margin-top:2px}

/* Verify */
.verify{font-family:'Inter',sans-serif;font-size:7.5px;color:#8b735540;text-align:center;margin-top:14px;letter-spacing:1.5px}

/* Seal */
.seal-stamp{position:absolute;bottom:30px;right:40px;width:80px;height:80px;z-index:5}
.seal-circle{width:80px;height:80px;border-radius:50%;border:2px solid #c9a84c40;display:flex;align-items:center;justify-content:center;transform:rotate(-12deg)}
.seal-inner-circle{width:64px;height:64px;border-radius:50%;border:1px dashed #c9a84c30;display:flex;flex-direction:column;align-items:center;justify-content:center}
.seal-icon{font-size:16px;color:#c9a84c;margin-bottom:2px}
.seal-txt{font-size:6px;font-weight:700;color:#c9a84c;letter-spacing:2px;text-transform:uppercase}

/* Cert number at bottom */
.cert-number{position:absolute;bottom:18px;left:200px;font-family:'Inter',sans-serif;font-size:8px;color:#8b735540;letter-spacing:2px}

@media print{body{background:#fff;padding:0}.cert-wrapper{box-shadow:none;padding:0;width:100%}.cert{min-height:100vh}}
</style></head>
<body>
<div class="cert-wrapper">
  <div class="cert">
    <!-- Gold double border -->
    <div class="gold-border-outer"></div>
    <div class="gold-border-inner"></div>

    <!-- Left maroon wave panel -->
    <div class="wave-panel">
      <div class="wave-bg"></div>
      <div class="wave-shape3"></div>
      <div class="wave-shape2"></div>
      <div class="wave-shape1"></div>
      <!-- Gold dot accents -->
      <div class="dot-wave dot-wave1">
        ${Array.from({length:30}, (_,i) => {
          const y = 10 + (i * 2.8);
          const x = 20 + Math.sin(i * 0.3) * 18;
          return `<div class="dw" style="top:${y}%;left:${x}px"></div>`;
        }).join('')}
      </div>
      <div class="dot-wave dot-wave2">
        ${Array.from({length:20}, (_,i) => {
          const y = 15 + (i * 3.5);
          const x = 10 + Math.sin(i * 0.4 + 1) * 12;
          return `<div class="dw" style="top:${y}%;left:${x}px"></div>`;
        }).join('')}
      </div>
    </div>

    <!-- Award badge with ribbons -->
    <div class="award-badge">
      <div class="badge-outer">
        <div class="badge-ring">
          <div class="badge-inner">
            <span class="badge-year">${new Date().getFullYear()}</span>
            <span class="badge-award">Award</span>
          </div>
        </div>
      </div>
      <div class="badge-ribbon">
        <div class="ribbon-left"></div>
        <div class="ribbon-right"></div>
      </div>
    </div>

    <!-- Certificate content -->
    <div class="cert-content">
      <div class="cert-header">
        ${s.logo_url ? `<img src="${s.logo_url}" alt="Logo" style="max-height:40px;margin-bottom:10px;display:block" />` : ''}
        <div class="cert-main-title">CERTIFICATE</div>
        <div class="cert-sub-title">of Achievement</div>
      </div>

      <div class="gold-divider"></div>

      <p class="presented-text">This certificate is proudly presented to</p>

      <div class="student-name">${studentName}</div>
      <div class="name-underline"></div>

      <p class="cert-description">
        Having demonstrated exceptional dedication, discipline, and commitment to mastering 
        professional architecture and design skills through the ${s.institution_name} platform.
      </p>

      <p class="for-completing">For successfully completing</p>
      <p class="course-title">${courseName}</p>

      <div class="cert-footer">
        <div class="footer-block">
          <div class="sig-cursive">${s.signature_name}</div>
          <div class="sig-line2"></div>
          <p class="sig-name2">${s.signature_name}</p>
          <p class="sig-title2">${s.signature_title}</p>
        </div>

        <div class="footer-block">
          <div class="footer-line"></div>
          <p class="footer-label">Date</p>
          <p class="footer-value">${issueDate}</p>
        </div>
      </div>

      <p class="verify">Verify at: https://archistudio.shop/verify/${certNumber}</p>
    </div>

    <!-- Seal stamp -->
    <div class="seal-stamp">
      <div class="seal-circle">
        <div class="seal-inner-circle">
          <span class="seal-icon">✦</span>
          <span class="seal-txt">Verified</span>
          <span class="seal-txt">Authentic</span>
        </div>
      </div>
    </div>

    <!-- Certificate number -->
    <div class="cert-number">NO. ${certNumber}</div>
  </div>
</div>

<script>window.onload=function(){setTimeout(function(){window.print()},600)}</script>
</body></html>`;
}
