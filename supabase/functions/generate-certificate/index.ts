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
  const ac = s.accent_color;
  const pc = s.primary_color;
  const gold = '#c8a55a';
  const warmCream = '#faf6f0';
  const softGold = '#e8d5a3';

  return `<!DOCTYPE html><html><head>
<meta charset="UTF-8">
<title>Proof of Completion – ${studentName} – ${courseName}</title>
<style>
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,400;1,500&family=Great+Vibes&family=Inter:wght@300;400;500;600&display=swap');
*{margin:0;padding:0;box-sizing:border-box}
@page{size:landscape;margin:0}
body{font-family:'Inter',sans-serif;background:${warmCream};min-height:100vh;display:flex;align-items:center;justify-content:center;padding:28px;-webkit-print-color-adjust:exact;print-color-adjust:exact}

.cert{width:1100px;min-height:770px;background:linear-gradient(145deg,#ffffff 0%,${warmCream} 40%,#fff9f0 100%);position:relative;overflow:hidden;box-shadow:0 25px 80px rgba(0,0,0,.08),0 4px 20px rgba(0,0,0,.04)}

/* Decorative top bar */
.top-bar{height:5px;background:linear-gradient(90deg,${ac},${gold},${ac})}

/* Subtle side accents */
.side-accent-l,.side-accent-r{position:absolute;top:0;bottom:0;width:2px}
.side-accent-l{left:32px;background:linear-gradient(180deg,transparent 5%,${gold}25 20%,${gold}40 50%,${gold}25 80%,transparent 95%)}
.side-accent-r{right:32px;background:linear-gradient(180deg,transparent 5%,${gold}25 20%,${gold}40 50%,${gold}25 80%,transparent 95%)}

/* Inner frame */
.inner-frame{position:absolute;top:22px;left:22px;right:22px;bottom:22px;border:1.5px solid ${gold}30;pointer-events:none}
.inner-frame-2{position:absolute;top:26px;left:26px;right:26px;bottom:26px;border:0.5px solid ${gold}18;pointer-events:none}

/* Watermark */
.watermark{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%) rotate(-20deg);font-family:'Playfair Display',serif;font-size:100px;font-weight:700;color:${pc}03;letter-spacing:20px;white-space:nowrap;pointer-events:none;text-transform:uppercase}

/* Corner ornaments */
.corner{position:absolute;width:50px;height:50px;opacity:0.35}
.corner svg{width:100%;height:100%}
.c-tl{top:14px;left:14px}.c-tr{top:14px;right:14px;transform:scaleX(-1)}
.c-bl{bottom:14px;left:14px;transform:scaleY(-1)}.c-br{bottom:14px;right:14px;transform:scale(-1)}

.cert-body{position:relative;padding:44px 80px 36px}

/* Header */
.header{text-align:center;margin-bottom:4px}
.brand{font-family:'Playfair Display',serif;font-size:26px;font-weight:700;letter-spacing:10px;color:${pc};text-transform:uppercase;margin-bottom:3px}
.tagline{font-size:9.5px;color:${pc}55;letter-spacing:5px;text-transform:uppercase;font-weight:400}

/* Decorative divider */
.divider{text-align:center;margin:16px 0 12px;position:relative;display:flex;align-items:center;justify-content:center;gap:12px}
.divider-line{flex:1;max-width:140px;height:0.5px;background:linear-gradient(90deg,transparent,${gold}60,${gold})}
.divider-line.right{background:linear-gradient(90deg,${gold},${gold}60,transparent)}
.divider-icon{color:${gold};font-size:14px;line-height:1}

/* Title */
.title{font-family:'Cormorant Garamond',serif;font-size:42px;font-weight:300;text-align:center;color:${pc};margin:8px 0 2px;letter-spacing:4px;font-style:italic}
.presented{text-align:center;font-size:11px;color:${pc}60;letter-spacing:6px;text-transform:uppercase;margin-bottom:20px;font-weight:300}

/* Student */
.student-name{font-family:'Great Vibes',cursive;font-size:52px;color:${pc};text-align:center;line-height:1.15;margin-bottom:4px}
.name-underline{width:300px;height:1.5px;margin:0 auto 18px;background:linear-gradient(90deg,transparent,${gold}80,${gold},${gold}80,transparent)}

/* Course */
.for-text{text-align:center;font-size:12px;color:${pc}70;margin-bottom:6px;letter-spacing:2px;font-weight:300;text-transform:uppercase}
.course-name{font-family:'Playfair Display',serif;font-size:22px;font-weight:600;text-align:center;color:${ac};margin-bottom:6px;letter-spacing:1.5px}
.course-desc{text-align:center;font-size:11px;color:${pc}50;max-width:500px;margin:0 auto;line-height:1.8;font-weight:300}

/* Best wishes */
.wishes{text-align:center;margin-top:14px;font-family:'Cormorant Garamond',serif;font-size:14px;font-style:italic;color:${gold};letter-spacing:1.5px}

/* Footer */
.footer{display:flex;justify-content:space-between;align-items:flex-end;margin-top:32px;padding:16px 60px 0;border-top:0.5px solid ${gold}20}
.footer-col{text-align:center;min-width:140px}
.footer-label{font-size:7.5px;color:${pc}40;letter-spacing:3px;text-transform:uppercase;margin-bottom:5px;font-weight:500}
.footer-val{font-size:12.5px;font-weight:600;color:${pc}}

/* Signature */
.sig-cursive{font-family:'Great Vibes',cursive;font-size:30px;color:${pc};margin-bottom:2px}
.sig-line{width:170px;height:0.5px;background:linear-gradient(90deg,transparent,${pc}30,transparent);margin:0 auto 5px}
.sig-name{font-size:12px;font-weight:600;color:${pc};letter-spacing:0.5px}
.sig-title{font-size:8.5px;color:${pc}50;letter-spacing:1.5px;font-weight:300}

/* Gold ribbon badge */
.ribbon-badge{position:absolute;top:22px;right:80px;width:48px;text-align:center}
.ribbon-shape{width:48px;height:62px;background:linear-gradient(160deg,${gold},#b8923d);clip-path:polygon(0 0,100% 0,100% 100%,50% 85%,0 100%);display:flex;align-items:center;justify-content:center;padding-bottom:10px;box-shadow:0 4px 12px ${gold}30}
.ribbon-star{color:#fff;font-size:18px;text-shadow:0 1px 3px rgba(0,0,0,0.2)}

/* Authentication seal */
.seal{position:absolute;bottom:16px;right:28px;width:82px;height:82px}
.seal-outer{width:82px;height:82px;border-radius:50%;border:2px solid ${ac}30;display:flex;align-items:center;justify-content:center;position:relative;transform:rotate(-12deg);background:radial-gradient(circle,${ac}04,transparent)}
.seal-ring{position:absolute;inset:4px;border-radius:50%;border:1px dashed ${ac}22}
.seal-inner{width:52px;height:52px;border-radius:50%;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;gap:1px}
.seal-icon{font-size:12px;color:${ac};margin-bottom:1px}
.seal-text{font-size:6.5px;font-weight:700;color:${ac};letter-spacing:1.5px;text-transform:uppercase;line-height:1.15}
.seal-sub{font-size:5px;color:${ac}70;letter-spacing:1px;text-transform:uppercase;margin-top:1px}

/* Authenticated badge */
.auth-mark{position:absolute;bottom:20px;left:28px;text-align:center}
.auth-box{width:54px;height:54px;border:1px solid ${gold}20;border-radius:6px;display:flex;flex-direction:column;align-items:center;justify-content:center;background:linear-gradient(135deg,${gold}06,${gold}02);gap:2px}
.auth-icon{font-size:14px}
.auth-text{font-size:5px;font-weight:600;color:${pc}50;letter-spacing:1.2px;text-transform:uppercase}

/* Verify */
.verify{font-family:monospace;font-size:8px;color:${pc}22;text-align:center;margin-top:16px;letter-spacing:1px}

@media print{body{background:#fff;padding:0}.cert{box-shadow:none;width:100%;min-height:100vh}.no-print{display:none}}
</style></head>
<body>
<div class="cert">
  <div class="top-bar"></div>
  <div class="side-accent-l"></div>
  <div class="side-accent-r"></div>
  <div class="inner-frame"></div>
  <div class="inner-frame-2"></div>
  <div class="watermark">${s.institution_name}</div>

  <!-- Corner ornaments -->
  <div class="corner c-tl"><svg viewBox="0 0 50 50"><path d="M0,0 L50,0 L50,3 L3,3 L3,50 L0,50 Z" fill="${gold}" opacity="0.6"/><path d="M0,6 L44,6 L44,3 L6,3 L6,44 L3,44 L3,6 Z" fill="${gold}" opacity="0.2"/></svg></div>
  <div class="corner c-tr"><svg viewBox="0 0 50 50"><path d="M0,0 L50,0 L50,3 L3,3 L3,50 L0,50 Z" fill="${gold}" opacity="0.6"/><path d="M0,6 L44,6 L44,3 L6,3 L6,44 L3,44 L3,6 Z" fill="${gold}" opacity="0.2"/></svg></div>
  <div class="corner c-bl"><svg viewBox="0 0 50 50"><path d="M0,0 L50,0 L50,3 L3,3 L3,50 L0,50 Z" fill="${gold}" opacity="0.6"/><path d="M0,6 L44,6 L44,3 L6,3 L6,44 L3,44 L3,6 Z" fill="${gold}" opacity="0.2"/></svg></div>
  <div class="corner c-br"><svg viewBox="0 0 50 50"><path d="M0,0 L50,0 L50,3 L3,3 L3,50 L0,50 Z" fill="${gold}" opacity="0.6"/><path d="M0,6 L44,6 L44,3 L6,3 L6,44 L3,44 L3,6 Z" fill="${gold}" opacity="0.2"/></svg></div>

  <!-- Gold ribbon -->
  <div class="ribbon-badge"><div class="ribbon-shape"><span class="ribbon-star">★</span></div></div>

  <div class="cert-body">
    <div class="header">
      ${s.logo_url ? `<img src="${s.logo_url}" alt="Logo" style="max-height:44px;margin-bottom:8px" />` : ''}
      <div class="brand">${s.institution_name}</div>
      <div class="tagline">${s.institution_tagline}</div>
    </div>

    <div class="divider">
      <span class="divider-line"></span>
      <span class="divider-icon">◆</span>
      <span class="divider-line right"></span>
    </div>

    <h1 class="title">Proof of Completion</h1>
    <p class="presented">This is proudly presented to</p>

    <div class="student-name">${studentName}</div>
    <div class="name-underline"></div>

    <p class="for-text">for successfully completing the studio program</p>
    <p class="course-name">${courseName}</p>
    <p class="course-desc">
      Having demonstrated dedication, discipline, and commitment to professional growth
      in architecture and design practice at ${s.institution_name}.
    </p>

    <p class="wishes">✦ Wishing you the very best in all your future endeavors ✦</p>

    <div class="footer">
      <div class="footer-col">
        <p class="footer-label">Date of Completion</p>
        <p class="footer-val">${issueDate}</p>
      </div>

      <div class="footer-col">
        <div class="sig-cursive">${s.signature_name}</div>
        <div class="sig-line"></div>
        <p class="sig-name">${s.signature_name}</p>
        <p class="sig-title">${s.signature_title}</p>
      </div>

      <div class="footer-col">
        <p class="footer-label">Certificate No.</p>
        <p class="footer-val">${certNumber}</p>
      </div>
    </div>

    <p class="verify">Verify at: https://archistudio.shop/verify/${certNumber}</p>
  </div>

  <!-- Authentication seal -->
  <div class="seal">
    <div class="seal-outer">
      <div class="seal-ring"></div>
      <div class="seal-inner">
        <span class="seal-icon">✦</span>
        <span class="seal-text">Verified</span>
        <span class="seal-text">Authentic</span>
        <span class="seal-sub">Archistudio</span>
      </div>
    </div>
  </div>

  <!-- Authenticated mark -->
  <div class="auth-mark">
    <div class="auth-box">
      <span class="auth-icon">🛡️</span>
      <span class="auth-text">Digitally</span>
      <span class="auth-text">Verified</span>
    </div>
  </div>
</div>

<script>window.onload=function(){setTimeout(function(){window.print()},600)}</script>
</body></html>`;
}
