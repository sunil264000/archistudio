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

.wrap{width:1100px;height:780px;background:#3d1c2e;padding:12px;box-shadow:0 30px 80px rgba(0,0,0,.5)}
.cert{width:100%;height:100%;position:relative;background:#fffdf9;overflow:hidden}

/* Gold borders */
.bo{position:absolute;top:5px;left:5px;right:5px;bottom:5px;border:2px solid #c9a84c;pointer-events:none;z-index:3}
.bi{position:absolute;top:11px;left:11px;right:11px;bottom:11px;border:1px solid #c9a84c;pointer-events:none;z-index:3}

/* Left accent - narrow elegant strip */
.accent{position:absolute;left:0;top:0;bottom:0;width:55px;z-index:2;background:linear-gradient(180deg,#6b1d3a,#4a1228,#7a2244)}
.accent-curve{position:absolute;left:40px;top:0;bottom:0;width:50px;background:#fffdf9;border-radius:40% 0 0 40%/50% 0 0 50%;z-index:2}

/* Content */
.main{position:absolute;top:0;left:75px;right:0;bottom:0;padding:42px 50px 30px 30px;display:flex;flex-direction:column;z-index:4}

.h-title{font-family:'Playfair Display',serif;font-size:48px;font-weight:900;font-style:italic;color:#2c1810;letter-spacing:2px;line-height:1}
.h-sub{font-family:'Playfair Display',serif;font-size:16px;font-weight:400;font-style:italic;color:#6b1d3a;letter-spacing:8px;text-transform:uppercase;margin-top:2px}

.divider{width:100%;height:1.5px;background:linear-gradient(90deg,#c9a84c,#e8d48b,#c9a84c);margin:18px 0 16px;opacity:0.45}

.presented{font-family:'Inter',sans-serif;font-size:9.5px;color:#8b7355;letter-spacing:6px;text-transform:uppercase;font-weight:500;margin-bottom:6px}

.student{font-family:'Pinyon Script',cursive;font-size:54px;color:#2c1810;line-height:1.15;margin-bottom:2px}
.student-line{width:340px;height:1.5px;background:linear-gradient(90deg,#c9a84c,#e8d48b,#c9a84c);margin-bottom:18px}

.desc{font-family:'Cormorant Garamond',serif;font-size:14px;color:#5a4a3a;line-height:1.75;max-width:560px;font-style:italic;margin-bottom:14px}

.for-label{font-family:'Inter',sans-serif;font-size:9px;color:#8b7355;letter-spacing:5px;text-transform:uppercase;font-weight:500;margin-bottom:6px}
.course-name{font-family:'Playfair Display',serif;font-size:20px;font-weight:700;font-style:italic;color:#6b1d3a;letter-spacing:1px;margin-bottom:0}

/* Footer - pushed down naturally */
.foot{margin-top:auto;display:flex;justify-content:space-between;align-items:flex-end;padding-right:20px}

.sig{text-align:center}
.sig-hand{font-family:'Pinyon Script',cursive;font-size:38px;color:#1a0e12;line-height:1;display:inline-block;transform:rotate(-1.5deg);margin-bottom:3px;position:relative}
.sig-hand::after{content:'';position:absolute;bottom:-1px;left:-5%;width:110%;height:1px;background:linear-gradient(90deg,transparent,#2c1810,#2c1810,transparent)}
.sig-line{width:190px;height:1px;background:#2c1810;margin:6px auto 5px}
.sig-nm{font-family:'Inter',sans-serif;font-size:10px;font-weight:700;color:#2c1810;letter-spacing:1.5px}
.sig-rl{font-family:'Inter',sans-serif;font-size:7.5px;color:#8b7355;letter-spacing:3px;text-transform:uppercase;margin-top:2px}

.dt{text-align:center}
.dt-line{width:160px;height:1px;background:#2c1810;margin:0 auto 6px}
.dt-label{font-family:'Inter',sans-serif;font-size:9px;font-weight:700;color:#2c1810;letter-spacing:4px;text-transform:uppercase;margin-bottom:4px}
.dt-val{font-family:'Inter',sans-serif;font-size:12px;color:#5a4a3a}

.verify{font-family:'Inter',sans-serif;font-size:6.5px;color:#8b735525;text-align:center;margin-top:12px;letter-spacing:1.5px}

/* Badge - top right */
.badge{position:absolute;top:35px;right:45px;width:100px;height:100px;z-index:5}
.b-out{width:100px;height:100px;border-radius:50%;background:conic-gradient(from 0deg,#dbb84d,#c9a84c,#a67c30,#e8d48b,#c9a84c,#a67c30,#dbb84d);display:flex;align-items:center;justify-content:center;box-shadow:0 4px 20px rgba(166,124,48,0.3),inset 0 1px 3px rgba(255,255,255,0.3)}
.b-mid{width:86px;height:86px;border-radius:50%;border:1.5px solid rgba(255,255,255,0.3);display:flex;align-items:center;justify-content:center}
.b-in{width:72px;height:72px;border-radius:50%;background:linear-gradient(145deg,#6b1d3a,#4a1228);display:flex;flex-direction:column;align-items:center;justify-content:center;box-shadow:inset 0 2px 6px rgba(0,0,0,0.3)}
.b-yr{font-family:'Playfair Display',serif;font-size:18px;font-weight:900;color:#e8d48b;letter-spacing:2px}
.b-tx{font-family:'Inter',sans-serif;font-size:6.5px;font-weight:700;color:#c9a84c;letter-spacing:3px;text-transform:uppercase;margin-top:1px}
.rib{position:absolute;bottom:-18px;left:50%;transform:translateX(-50%);width:60px;height:24px}
.rl,.rr{position:absolute;bottom:0;width:24px;height:24px}
.rl{left:3px;background:linear-gradient(135deg,#dbb84d,#a67c30);clip-path:polygon(0 0,100% 0,55% 100%,0 60%)}
.rr{right:3px;background:linear-gradient(135deg,#dbb84d,#a67c30);clip-path:polygon(0 0,100% 0,100% 60%,45% 100%)}

/* Wax seal - bottom right, not overlapping */
.seal{position:absolute;bottom:55px;right:45px;width:55px;height:55px;z-index:5}
.seal-o{width:55px;height:55px;border-radius:50%;background:radial-gradient(circle at 35% 35%,#8b2020,#6b1515,#4a0e0e);box-shadow:0 3px 10px rgba(0,0,0,0.25),inset 0 1px 3px rgba(255,255,255,0.15);display:flex;align-items:center;justify-content:center;transform:rotate(-8deg)}
.seal-i{width:40px;height:40px;border-radius:50%;border:1px solid rgba(255,255,255,0.1);display:flex;flex-direction:column;align-items:center;justify-content:center}
.seal-s{font-size:12px;color:rgba(255,255,255,0.4);margin-bottom:0}
.seal-tx{font-size:4.5px;font-weight:700;color:rgba(255,255,255,0.35);letter-spacing:1.5px;text-transform:uppercase}

.cert-id{position:absolute;bottom:14px;left:85px;font-family:'Inter',sans-serif;font-size:7px;color:#8b735520;letter-spacing:2px}

@media print{body{background:#fff;padding:0}.wrap{box-shadow:none;padding:0;width:100%;height:100%}.cert{height:100%}}
</style></head>
<body>
<div class="wrap">
  <div class="cert">
    <div class="bo"></div>
    <div class="bi"></div>

    <div class="accent"></div>
    <div class="accent-curve"></div>

    <!-- Badge -->
    <div class="badge">
      <div class="b-out"><div class="b-mid"><div class="b-in">
        <span class="b-yr">${new Date().getFullYear()}</span>
        <span class="b-tx">Award</span>
      </div></div></div>
      <div class="rib"><div class="rl"></div><div class="rr"></div></div>
    </div>

    <!-- Content -->
    <div class="main">
      ${s.logo_url ? `<img src="${s.logo_url}" alt="Logo" style="max-height:32px;margin-bottom:6px;display:block" />` : ''}
      <div class="h-title">CERTIFICATE</div>
      <div class="h-sub">of Achievement</div>

      <div class="divider"></div>

      <p class="presented">This certificate is proudly presented to</p>
      <div class="student">${studentName}</div>
      <div class="student-line"></div>

      <p class="desc">Having demonstrated exceptional dedication, discipline, and commitment to mastering professional architecture and design skills through the ${s.institution_name} platform.</p>

      <p class="for-label">For successfully completing</p>
      <p class="course-name">${courseName}</p>

      <div class="foot">
        <div class="sig">
          <span class="sig-hand">${s.signature_name}</span>
          <div class="sig-line"></div>
          <p class="sig-nm">${s.signature_name}</p>
          <p class="sig-rl">${s.signature_title}</p>
        </div>
        <div class="dt">
          <div class="dt-line"></div>
          <p class="dt-label">Date</p>
          <p class="dt-val">${issueDate}</p>
        </div>
      </div>

      <p class="verify">Verify at: https://archistudio.shop/verify/${certNumber}</p>
    </div>

    <!-- Wax seal -->
    <div class="seal">
      <div class="seal-o"><div class="seal-i">
        <span class="seal-s">✦</span>
        <span class="seal-tx">Verified</span>
      </div></div>
    </div>

    <div class="cert-id">NO. ${certNumber}</div>
  </div>
</div>
<script>window.onload=function(){setTimeout(function(){window.print()},600)}</script>
</body></html>`;
}
