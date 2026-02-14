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
  const pc = s.primary_color;

  return `<!DOCTYPE html><html><head>
<meta charset="UTF-8">
<title>Proof of Completion – ${studentName} – ${courseName}</title>
<style>
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;0,800;1,400;1,500&family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400;1,500&family=Great+Vibes&family=Inter:wght@300;400;500;600&display=swap');
*{margin:0;padding:0;box-sizing:border-box}
@page{size:landscape;margin:0}
body{font-family:'Inter',sans-serif;background:#f5f0eb;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:20px;-webkit-print-color-adjust:exact;print-color-adjust:exact}

.cert{width:1120px;min-height:790px;position:relative;overflow:hidden;background:#fffbf7;box-shadow:0 30px 100px rgba(120,80,50,.12),0 4px 20px rgba(0,0,0,.05)}

/* Rose gold gradient top & bottom bars */
.bar-top{height:6px;background:linear-gradient(90deg,#b76e79,#e8c4b8,#d4a574,#e8c4b8,#b76e79)}
.bar-bottom{height:4px;background:linear-gradient(90deg,#b76e79,#e8c4b8,#d4a574,#e8c4b8,#b76e79);position:absolute;bottom:0;left:0;right:0}

/* Elegant border system */
.border-outer{position:absolute;top:14px;left:14px;right:14px;bottom:14px;border:1.5px solid #d4a57440;pointer-events:none}
.border-inner{position:absolute;top:20px;left:20px;right:20px;bottom:20px;border:0.5px solid #d4a57420;pointer-events:none}
.border-accent{position:absolute;top:17px;left:17px;right:17px;bottom:17px;border:0.5px solid #b76e7918;pointer-events:none}

/* Side filigree lines */
.filigree-l,.filigree-r{position:absolute;top:60px;bottom:60px;width:1px}
.filigree-l{left:36px;background:linear-gradient(180deg,transparent,#d4a57425 15%,#d4a57435 50%,#d4a57425 85%,transparent)}
.filigree-r{right:36px;background:linear-gradient(180deg,transparent,#d4a57425 15%,#d4a57435 50%,#d4a57425 85%,transparent)}

/* Dotted accents on sides */
.dots-l,.dots-r{position:absolute;top:50%;transform:translateY(-50%);display:flex;flex-direction:column;gap:8px;opacity:0.2}
.dots-l{left:30px}.dots-r{right:30px}
.dot{width:3px;height:3px;border-radius:50%;background:#b76e79}

/* Watermark */
.watermark{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%) rotate(-18deg);font-family:'Playfair Display',serif;font-size:110px;font-weight:800;color:rgba(180,130,100,0.025);letter-spacing:24px;white-space:nowrap;pointer-events:none;text-transform:uppercase}

/* Corner flourishes */
.corner{position:absolute;width:70px;height:70px;opacity:0.5}
.corner svg{width:100%;height:100%}
.c-tl{top:10px;left:10px}
.c-tr{top:10px;right:10px;transform:scaleX(-1)}
.c-bl{bottom:10px;left:10px;transform:scaleY(-1)}
.c-br{bottom:10px;right:10px;transform:scale(-1)}

.cert-body{position:relative;padding:46px 90px 30px}

/* Header */
.header{text-align:center;margin-bottom:6px}
.brand{font-family:'Playfair Display',serif;font-size:28px;font-weight:700;letter-spacing:12px;color:#2c1810;text-transform:uppercase;margin-bottom:4px}
.tagline{font-size:9px;color:#8b7355;letter-spacing:6px;text-transform:uppercase;font-weight:400}

/* Ornamental divider */
.divider{display:flex;align-items:center;justify-content:center;gap:14px;margin:18px 0 14px}
.div-line{flex:1;max-width:160px;height:1px;background:linear-gradient(90deg,transparent,#d4a574)}
.div-line.r{background:linear-gradient(90deg,#d4a574,transparent)}
.div-diamond{width:8px;height:8px;background:#d4a574;transform:rotate(45deg);opacity:0.6}
.div-dot{width:4px;height:4px;border-radius:50%;background:#b76e79;opacity:0.5}

/* Title */
.title{font-family:'Cormorant Garamond',serif;font-size:44px;font-weight:300;text-align:center;color:#2c1810;margin:6px 0 2px;letter-spacing:5px;font-style:italic}
.presented{text-align:center;font-size:10.5px;color:#8b7355;letter-spacing:7px;text-transform:uppercase;margin-bottom:22px;font-weight:300}

/* Student name */
.student-name{font-family:'Great Vibes',cursive;font-size:56px;color:#2c1810;text-align:center;line-height:1.1;margin-bottom:6px}
.name-line{width:340px;height:2px;margin:0 auto 20px;background:linear-gradient(90deg,transparent,#b76e7960,#d4a574,#b76e7960,transparent);border-radius:1px}

/* Course */
.for-text{text-align:center;font-size:11px;color:#8b7355;margin-bottom:8px;letter-spacing:3px;font-weight:300;text-transform:uppercase}
.course-name{font-family:'Playfair Display',serif;font-size:23px;font-weight:600;text-align:center;color:#b76e79;margin-bottom:8px;letter-spacing:2px}
.course-desc{text-align:center;font-size:10.5px;color:#8b735590;max-width:520px;margin:0 auto;line-height:1.9;font-weight:300;font-family:'Cormorant Garamond',serif;font-size:13px}

/* Wishes */
.wishes{text-align:center;margin-top:16px;font-family:'Cormorant Garamond',serif;font-size:14px;font-style:italic;color:#d4a574;letter-spacing:2px}

/* Footer */
.footer{display:flex;justify-content:space-between;align-items:flex-end;margin-top:34px;padding:18px 40px 0;border-top:1px solid #d4a57415}
.footer-col{text-align:center;min-width:150px}
.footer-label{font-size:7px;color:#8b735560;letter-spacing:3.5px;text-transform:uppercase;margin-bottom:6px;font-weight:600}
.footer-val{font-size:12px;font-weight:600;color:#2c1810;letter-spacing:0.5px}

/* Signature */
.sig-cursive{font-family:'Great Vibes',cursive;font-size:32px;color:#2c1810;margin-bottom:3px}
.sig-line{width:180px;height:1px;background:linear-gradient(90deg,transparent,#b76e7940,transparent);margin:0 auto 6px}
.sig-name{font-size:11.5px;font-weight:600;color:#2c1810;letter-spacing:0.5px}
.sig-title{font-size:8px;color:#8b735570;letter-spacing:2px;font-weight:400}

/* Rose gold ribbon badge */
.ribbon{position:absolute;top:18px;right:75px;width:52px;text-align:center;filter:drop-shadow(0 4px 12px rgba(183,110,121,0.2))}
.ribbon-shape{width:52px;height:68px;background:linear-gradient(165deg,#d4a574,#b76e79,#c4917a);clip-path:polygon(0 0,100% 0,100% 100%,50% 82%,0 100%);display:flex;align-items:center;justify-content:center;padding-bottom:14px}
.ribbon-icon{color:#fff;font-size:20px;text-shadow:0 1px 4px rgba(0,0,0,0.15)}

/* Verified seal */
.seal{position:absolute;bottom:14px;right:24px;width:90px;height:90px}
.seal-outer{width:90px;height:90px;border-radius:50%;border:2px solid #b76e7935;display:flex;align-items:center;justify-content:center;position:relative;transform:rotate(-10deg);background:radial-gradient(circle,#b76e7906,transparent)}
.seal-ring{position:absolute;inset:5px;border-radius:50%;border:1px dashed #d4a57425}
.seal-ring2{position:absolute;inset:9px;border-radius:50%;border:0.5px solid #b76e7912}
.seal-inner{width:56px;height:56px;border-radius:50%;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;gap:1px}
.seal-star{font-size:14px;color:#b76e79;margin-bottom:2px}
.seal-text{font-size:6px;font-weight:700;color:#b76e79;letter-spacing:2px;text-transform:uppercase;line-height:1.2}
.seal-brand{font-size:5px;color:#b76e7970;letter-spacing:1.5px;text-transform:uppercase;margin-top:2px;font-weight:600}

/* Shield badge */
.shield{position:absolute;bottom:18px;left:24px;text-align:center}
.shield-box{width:60px;height:60px;border:1px solid #d4a57420;border-radius:8px;display:flex;flex-direction:column;align-items:center;justify-content:center;background:linear-gradient(135deg,#d4a57408,#b76e7904);gap:3px}
.shield-icon{font-size:16px}
.shield-text{font-size:5px;font-weight:700;color:#8b735570;letter-spacing:1.5px;text-transform:uppercase}

/* Verify URL */
.verify{font-family:'Inter',sans-serif;font-size:8px;color:#8b735530;text-align:center;margin-top:14px;letter-spacing:1.5px}

@media print{body{background:#fff;padding:0}.cert{box-shadow:none;width:100%;min-height:100vh}.no-print{display:none}}
</style></head>
<body>
<div class="cert">
  <div class="bar-top"></div>
  <div class="bar-bottom"></div>
  <div class="border-outer"></div>
  <div class="border-inner"></div>
  <div class="border-accent"></div>
  <div class="filigree-l"></div>
  <div class="filigree-r"></div>

  <!-- Side dots -->
  <div class="dots-l">${Array(7).fill('<div class="dot"></div>').join('')}</div>
  <div class="dots-r">${Array(7).fill('<div class="dot"></div>').join('')}</div>

  <div class="watermark">${s.institution_name}</div>

  <!-- Corner flourishes -->
  <div class="corner c-tl"><svg viewBox="0 0 70 70"><path d="M0,0 Q35,3 70,0 L70,4 Q35,7 0,4 Z" fill="#d4a574" opacity="0.4"/><path d="M0,0 Q3,35 0,70 L4,70 Q7,35 4,0 Z" fill="#d4a574" opacity="0.4"/><circle cx="6" cy="6" r="2.5" fill="#b76e79" opacity="0.3"/><path d="M0,12 Q20,14 40,12" stroke="#d4a574" stroke-width="0.5" fill="none" opacity="0.25"/><path d="M12,0 Q14,20 12,40" stroke="#d4a574" stroke-width="0.5" fill="none" opacity="0.25"/></svg></div>
  <div class="corner c-tr"><svg viewBox="0 0 70 70"><path d="M0,0 Q35,3 70,0 L70,4 Q35,7 0,4 Z" fill="#d4a574" opacity="0.4"/><path d="M0,0 Q3,35 0,70 L4,70 Q7,35 4,0 Z" fill="#d4a574" opacity="0.4"/><circle cx="6" cy="6" r="2.5" fill="#b76e79" opacity="0.3"/><path d="M0,12 Q20,14 40,12" stroke="#d4a574" stroke-width="0.5" fill="none" opacity="0.25"/><path d="M12,0 Q14,20 12,40" stroke="#d4a574" stroke-width="0.5" fill="none" opacity="0.25"/></svg></div>
  <div class="corner c-bl"><svg viewBox="0 0 70 70"><path d="M0,0 Q35,3 70,0 L70,4 Q35,7 0,4 Z" fill="#d4a574" opacity="0.4"/><path d="M0,0 Q3,35 0,70 L4,70 Q7,35 4,0 Z" fill="#d4a574" opacity="0.4"/><circle cx="6" cy="6" r="2.5" fill="#b76e79" opacity="0.3"/><path d="M0,12 Q20,14 40,12" stroke="#d4a574" stroke-width="0.5" fill="none" opacity="0.25"/><path d="M12,0 Q14,20 12,40" stroke="#d4a574" stroke-width="0.5" fill="none" opacity="0.25"/></svg></div>
  <div class="corner c-br"><svg viewBox="0 0 70 70"><path d="M0,0 Q35,3 70,0 L70,4 Q35,7 0,4 Z" fill="#d4a574" opacity="0.4"/><path d="M0,0 Q3,35 0,70 L4,70 Q7,35 4,0 Z" fill="#d4a574" opacity="0.4"/><circle cx="6" cy="6" r="2.5" fill="#b76e79" opacity="0.3"/><path d="M0,12 Q20,14 40,12" stroke="#d4a574" stroke-width="0.5" fill="none" opacity="0.25"/><path d="M12,0 Q14,20 12,40" stroke="#d4a574" stroke-width="0.5" fill="none" opacity="0.25"/></svg></div>

  <!-- Rose gold ribbon -->
  <div class="ribbon"><div class="ribbon-shape"><span class="ribbon-icon">★</span></div></div>

  <div class="cert-body">
    <div class="header">
      ${s.logo_url ? `<img src="${s.logo_url}" alt="Logo" style="max-height:44px;margin-bottom:8px" />` : ''}
      <div class="brand">${s.institution_name}</div>
      <div class="tagline">${s.institution_tagline}</div>
    </div>

    <div class="divider">
      <div class="div-dot"></div>
      <div class="div-line"></div>
      <div class="div-diamond"></div>
      <div class="div-line r"></div>
      <div class="div-dot"></div>
    </div>

    <h1 class="title">Proof of Completion</h1>
    <p class="presented">This is proudly presented to</p>

    <div class="student-name">${studentName}</div>
    <div class="name-line"></div>

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

  <!-- Verified seal -->
  <div class="seal">
    <div class="seal-outer">
      <div class="seal-ring"></div>
      <div class="seal-ring2"></div>
      <div class="seal-inner">
        <span class="seal-star">✦</span>
        <span class="seal-text">Verified</span>
        <span class="seal-text">Authentic</span>
        <span class="seal-brand">Archistudio</span>
      </div>
    </div>
  </div>

  <!-- Shield badge -->
  <div class="shield">
    <div class="shield-box">
      <span class="shield-icon">🛡️</span>
      <span class="shield-text">Digitally</span>
      <span class="shield-text">Verified</span>
    </div>
  </div>
</div>

<script>window.onload=function(){setTimeout(function(){window.print()},600)}</script>
</body></html>`;
}
