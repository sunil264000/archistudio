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
@import url('https://fonts.googleapis.com/css2?family=Pinyon+Script&family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400;1,700;1,900&family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400&family=Inter:wght@300;400;500;600;700&display=swap');
*{margin:0;padding:0;box-sizing:border-box}
@page{size:landscape;margin:0}
body{font-family:'Inter',sans-serif;background:#3d1c2e;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:30px;-webkit-print-color-adjust:exact;print-color-adjust:exact}

.cert-outer{width:1140px;height:800px;background:#3d1c2e;padding:14px;box-shadow:0 40px 100px rgba(0,0,0,.5)}
.cert{width:100%;height:100%;position:relative;background:#fffdf9;overflow:hidden}

/* Double gold border */
.border-o{position:absolute;top:6px;left:6px;right:6px;bottom:6px;border:2.5px solid #c9a84c;pointer-events:none;z-index:3}
.border-i{position:absolute;top:12px;left:12px;right:12px;bottom:12px;border:1px solid #c9a84c;pointer-events:none;z-index:3}

/* Left maroon panel */
.panel{position:absolute;left:0;top:0;bottom:0;width:140px;z-index:2}
.panel-bg{position:absolute;inset:0;background:linear-gradient(180deg,#6b1d3a 0%,#4a1228 50%,#7a2244 100%)}
.panel-curve{position:absolute;right:-50px;top:0;bottom:0;width:100px;background:#fffdf9;border-radius:55% 0 0 45%/50% 0 0 50%}
.panel-curve2{position:absolute;right:-25px;top:0;bottom:0;width:80px;background:rgba(255,253,249,0.12);border-radius:50% 0 0 55%/45% 0 0 50%}

/* Gold dots on panel */
.dots{position:absolute;right:15px;top:60px;bottom:60px;width:50px;z-index:3}
.dot{width:2.5px;height:2.5px;border-radius:50%;background:#c9a84c;position:absolute;opacity:0.7}

/* Main content area */
.content{position:absolute;top:0;left:160px;right:0;bottom:0;padding:45px 55px 35px 40px;display:flex;flex-direction:column;z-index:4}

/* Title */
.title{font-family:'Playfair Display',serif;font-size:56px;font-weight:900;font-style:italic;color:#2c1810;letter-spacing:3px;line-height:1;margin-bottom:2px}
.subtitle{font-family:'Playfair Display',serif;font-size:20px;font-weight:400;font-style:italic;color:#6b1d3a;letter-spacing:10px;text-transform:uppercase;margin-bottom:0}

/* Gold line */
.gold-line{width:100%;height:1.5px;background:linear-gradient(90deg,#c9a84c,#e8d48b,#c9a84c);margin:22px 0 20px;opacity:0.5}
.gold-line-thin{width:100%;height:1px;background:linear-gradient(90deg,transparent,#c9a84c50,transparent);margin:10px 0}

/* Presented to */
.presented{font-family:'Inter',sans-serif;font-size:10.5px;color:#8b7355;letter-spacing:7px;text-transform:uppercase;font-weight:500;margin-bottom:8px}

/* Student name - elegant script */
.name{font-family:'Pinyon Script',cursive;font-size:62px;color:#2c1810;line-height:1.2;margin-bottom:2px}
.name-line{width:380px;height:1.5px;background:linear-gradient(90deg,#c9a84c,#e8d48b,#c9a84c);margin-bottom:22px}

/* Description */
.desc{font-family:'Cormorant Garamond',serif;font-size:15px;color:#5a4a3a;line-height:1.8;max-width:580px;font-style:italic;margin-bottom:16px}

/* Course */
.for-text{font-family:'Inter',sans-serif;font-size:9.5px;color:#8b7355;letter-spacing:5px;text-transform:uppercase;font-weight:500;margin-bottom:8px}
.course{font-family:'Playfair Display',serif;font-size:21px;font-weight:700;font-style:italic;color:#6b1d3a;letter-spacing:1.5px}

/* Footer area */
.footer{margin-top:auto;display:flex;justify-content:space-between;align-items:flex-end;padding-top:15px}

/* Signature block */
.sig-block{text-align:center}
.sig-script{font-family:'Pinyon Script',cursive;font-size:42px;color:#1a0e12;line-height:1.1;margin-bottom:4px;transform:rotate(-2deg);display:inline-block}
.sig-underline{width:200px;height:1px;background:#2c1810;margin:0 auto 6px}
.sig-name{font-family:'Inter',sans-serif;font-size:11px;font-weight:700;color:#2c1810;letter-spacing:1.5px}
.sig-role{font-family:'Inter',sans-serif;font-size:8.5px;color:#8b7355;letter-spacing:3px;text-transform:uppercase;margin-top:3px}

/* Date block */
.date-block{text-align:center}
.date-label{font-family:'Inter',sans-serif;font-size:10px;font-weight:700;color:#2c1810;letter-spacing:5px;text-transform:uppercase;margin-bottom:6px}
.date-line{width:180px;height:1px;background:#2c1810;margin:0 auto 8px}
.date-val{font-family:'Inter',sans-serif;font-size:13px;color:#5a4a3a;font-weight:400}

/* Badge */
.badge{position:absolute;top:40px;right:50px;width:105px;height:105px;z-index:5}
.badge-outer{width:105px;height:105px;border-radius:50%;background:linear-gradient(145deg,#dbb84d,#c9a84c,#a67c30,#dbb84d);display:flex;align-items:center;justify-content:center;box-shadow:0 6px 25px rgba(166,124,48,0.35),inset 0 1px 2px rgba(255,255,255,0.4)}
.badge-mid{width:90px;height:90px;border-radius:50%;border:1.5px solid rgba(255,255,255,0.35);display:flex;align-items:center;justify-content:center}
.badge-inner{width:76px;height:76px;border-radius:50%;background:linear-gradient(145deg,#6b1d3a,#4a1228);display:flex;flex-direction:column;align-items:center;justify-content:center;border:1px solid #c9a84c50;box-shadow:inset 0 2px 8px rgba(0,0,0,0.3)}
.badge-year{font-family:'Playfair Display',serif;font-size:20px;font-weight:900;color:#e8d48b;letter-spacing:2px}
.badge-text{font-family:'Inter',sans-serif;font-size:7px;font-weight:700;color:#c9a84c;letter-spacing:3px;text-transform:uppercase;margin-top:1px}

/* Badge ribbon */
.ribbon{position:absolute;bottom:-20px;left:50%;transform:translateX(-50%);width:65px;height:28px}
.rib-l,.rib-r{position:absolute;bottom:0;width:26px;height:28px}
.rib-l{left:4px;background:linear-gradient(135deg,#dbb84d,#a67c30);clip-path:polygon(0 0,100% 0,55% 100%,0 65%)}
.rib-r{right:4px;background:linear-gradient(135deg,#dbb84d,#a67c30);clip-path:polygon(0 0,100% 0,100% 65%,45% 100%)}

/* Verify text */
.verify{font-family:'Inter',sans-serif;font-size:7px;color:#8b735530;text-align:center;margin-top:16px;letter-spacing:2px}

/* Seal */
.seal{position:absolute;bottom:35px;right:45px;width:72px;height:72px;z-index:5}
.seal-ring{width:72px;height:72px;border-radius:50%;border:1.5px solid #c9a84c30;display:flex;align-items:center;justify-content:center;transform:rotate(-15deg)}
.seal-inner{width:58px;height:58px;border-radius:50%;border:1px dashed #c9a84c20;display:flex;flex-direction:column;align-items:center;justify-content:center}
.seal-star{font-size:14px;color:#c9a84c;margin-bottom:1px}
.seal-t{font-size:5.5px;font-weight:700;color:#c9a84c80;letter-spacing:2px;text-transform:uppercase}

/* Cert number */
.cert-no{position:absolute;bottom:16px;left:170px;font-family:'Inter',sans-serif;font-size:7.5px;color:#8b735525;letter-spacing:2px}

@media print{body{background:#fff;padding:0}.cert-outer{box-shadow:none;padding:0;width:100%;height:100%}.cert{height:100%}}
</style></head>
<body>
<div class="cert-outer">
  <div class="cert">
    <div class="border-o"></div>
    <div class="border-i"></div>

    <!-- Left panel -->
    <div class="panel">
      <div class="panel-bg"></div>
      <div class="panel-curve2"></div>
      <div class="panel-curve"></div>
      <div class="dots">
        ${Array.from({length:28}, (_,i) => {
          const y = 8 + (i * 3);
          const x = 18 + Math.sin(i * 0.35) * 15;
          return `<div class="dot" style="top:${y}%;left:${x}px"></div>`;
        }).join('')}
      </div>
    </div>

    <!-- Badge -->
    <div class="badge">
      <div class="badge-outer">
        <div class="badge-mid">
          <div class="badge-inner">
            <span class="badge-year">${new Date().getFullYear()}</span>
            <span class="badge-text">Award</span>
          </div>
        </div>
      </div>
      <div class="ribbon"><div class="rib-l"></div><div class="rib-r"></div></div>
    </div>

    <!-- Content -->
    <div class="content">
      ${s.logo_url ? `<img src="${s.logo_url}" alt="Logo" style="max-height:36px;margin-bottom:8px;display:block" />` : ''}
      <div class="title">CERTIFICATE</div>
      <div class="subtitle">of Achievement</div>

      <div class="gold-line"></div>

      <p class="presented">This certificate is proudly presented to</p>
      <div class="name">${studentName}</div>
      <div class="name-line"></div>

      <p class="desc">Having demonstrated exceptional dedication, discipline, and commitment to mastering professional architecture and design skills through the ${s.institution_name} platform.</p>

      <p class="for-text">For successfully completing</p>
      <p class="course">${courseName}</p>

      <div class="footer">
        <div class="sig-block">
          <span class="sig-script">${s.signature_name}</span>
          <div class="sig-underline"></div>
          <p class="sig-name">${s.signature_name}</p>
          <p class="sig-role">${s.signature_title}</p>
        </div>

        <div class="date-block">
          <div class="date-line"></div>
          <p class="date-label">Date</p>
          <p class="date-val">${issueDate}</p>
        </div>
      </div>

      <p class="verify">Verify at: https://archistudio.shop/verify/${certNumber}</p>
    </div>

    <!-- Seal -->
    <div class="seal">
      <div class="seal-ring">
        <div class="seal-inner">
          <span class="seal-star">✦</span>
          <span class="seal-t">Verified</span>
          <span class="seal-t">Authentic</span>
        </div>
      </div>
    </div>

    <div class="cert-no">NO. ${certNumber}</div>
  </div>
</div>
<script>window.onload=function(){setTimeout(function(){window.print()},600)}</script>
</body></html>`;
}
