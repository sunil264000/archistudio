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

    // Handle both GET (query params) and POST (JSON body)
    const url = new URL(req.url);
    
    // Preview mode
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

    let certificateId: string | undefined;
    let userId: string | undefined;
    let courseId: string | undefined;

    // GET request: read from query params
    if (req.method === "GET") {
      certificateId = url.searchParams.get("certificateId") || undefined;
      userId = url.searchParams.get("userId") || undefined;
      courseId = url.searchParams.get("courseId") || undefined;
    } else {
      // POST request: read from JSON body
      const body = await req.json();
      certificateId = body.certificateId;
      userId = body.userId;
      courseId = body.courseId;
    }

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
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400;1,700;1,900&family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400&family=Dancing+Script:wght@400;500;600;700&family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
<style>
*{margin:0;padding:0;box-sizing:border-box}
@page{size:landscape;margin:0}
body{font-family:'Inter',sans-serif;background:#3d1c2e;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:30px;-webkit-print-color-adjust:exact;print-color-adjust:exact}

.wrap{width:1100px;height:780px;background:#3d1c2e;padding:12px;box-shadow:0 30px 80px rgba(0,0,0,.5)}
.page{width:100%;height:100%;position:relative;background:#fffdf9;overflow:hidden}

/* Gold double border */
.gb1{position:absolute;top:5px;left:5px;right:5px;bottom:5px;border:2px solid #c9a84c;pointer-events:none;z-index:3}
.gb2{position:absolute;top:11px;left:11px;right:11px;bottom:11px;border:1px solid #c9a84c;pointer-events:none;z-index:3}

/* Left maroon accent - clean narrow strip with soft curve */
.lp{position:absolute;left:0;top:0;bottom:0;width:50px;z-index:2;background:linear-gradient(180deg,#6b1d3a,#4a1228,#7a2244)}
.lc{position:absolute;left:36px;top:0;bottom:0;width:44px;background:#fffdf9;border-radius:38% 0 0 38%/50% 0 0 50%;z-index:2}

/* Content grid - uses CSS grid for perfect vertical distribution */
.body{position:absolute;top:0;left:70px;right:0;bottom:0;padding:40px 50px 28px 28px;display:grid;grid-template-rows:auto auto 1fr auto auto;z-index:4}

/* Header row */
.hdr{margin-bottom:0}
.ttl{font-family:'Playfair Display',serif;font-size:46px;font-weight:900;font-style:italic;color:#2c1810;letter-spacing:2px;line-height:1}
.sub{font-family:'Playfair Display',serif;font-size:15px;font-weight:400;font-style:italic;color:#6b1d3a;letter-spacing:8px;text-transform:uppercase;margin-top:2px}

/* Divider */
.gd{width:100%;height:1.5px;background:linear-gradient(90deg,#c9a84c,#e8d48b,#c9a84c);margin:16px 0 14px;opacity:0.4}

/* Middle content */
.mid{display:flex;flex-direction:column;justify-content:center}
.pre{font-family:'Inter',sans-serif;font-size:9px;color:#8b7355;letter-spacing:6px;text-transform:uppercase;font-weight:500;margin-bottom:8px}
.name{font-family:'Playfair Display',serif;font-size:46px;font-weight:700;font-style:italic;color:#2c1810;line-height:1.15;margin-bottom:4px}
.nline{width:320px;height:1.5px;background:linear-gradient(90deg,#c9a84c,#e8d48b,#c9a84c);margin-bottom:16px}
.dsc{font-family:'Cormorant Garamond',serif;font-size:13.5px;color:#5a4a3a;line-height:1.7;max-width:540px;font-style:italic;margin-bottom:14px}
.fl{font-family:'Inter',sans-serif;font-size:8.5px;color:#8b7355;letter-spacing:5px;text-transform:uppercase;font-weight:500;margin-bottom:6px}
.cn{font-family:'Playfair Display',serif;font-size:19px;font-weight:700;font-style:italic;color:#6b1d3a;letter-spacing:1px}

/* Footer */
.ft{display:flex;justify-content:space-between;align-items:flex-end;padding-right:15px;padding-top:8px}

/* Signature - realistic handwriting style */
.sb{text-align:center}
.sh{font-family:'Dancing Script',cursive;font-size:32px;font-weight:700;color:#111;line-height:1;display:inline-block;transform:rotate(-2deg) skewX(-3deg);margin-bottom:2px}
.sl{width:180px;height:1px;background:#2c1810;margin:4px auto 5px}
.sn{font-family:'Inter',sans-serif;font-size:9.5px;font-weight:700;color:#2c1810;letter-spacing:1.5px}
.sr{font-family:'Inter',sans-serif;font-size:7px;color:#8b7355;letter-spacing:3px;text-transform:uppercase;margin-top:2px}

/* Date */
.db{text-align:center}
.dl{width:150px;height:1px;background:#2c1810;margin:0 auto 5px}
.dlb{font-family:'Inter',sans-serif;font-size:8.5px;font-weight:700;color:#2c1810;letter-spacing:4px;text-transform:uppercase;margin-bottom:4px}
.dv{font-family:'Inter',sans-serif;font-size:11.5px;color:#5a4a3a}

/* Verify */
.vf{font-family:'Inter',sans-serif;font-size:6px;color:#8b735520;text-align:center;margin-top:10px;letter-spacing:1.5px}

/* Badge */
.bdg{position:absolute;top:32px;right:42px;width:95px;height:95px;z-index:5}
.bo2{width:95px;height:95px;border-radius:50%;background:conic-gradient(from 0deg,#dbb84d,#c9a84c,#a67c30,#e8d48b,#c9a84c,#a67c30,#dbb84d);display:flex;align-items:center;justify-content:center;box-shadow:0 4px 18px rgba(166,124,48,0.3),inset 0 1px 2px rgba(255,255,255,0.3)}
.bm{width:82px;height:82px;border-radius:50%;border:1.5px solid rgba(255,255,255,0.3);display:flex;align-items:center;justify-content:center}
.bn{width:68px;height:68px;border-radius:50%;background:linear-gradient(145deg,#6b1d3a,#4a1228);display:flex;flex-direction:column;align-items:center;justify-content:center;box-shadow:inset 0 2px 5px rgba(0,0,0,0.3)}
.by{font-family:'Playfair Display',serif;font-size:17px;font-weight:900;color:#e8d48b;letter-spacing:2px}
.bt{font-family:'Inter',sans-serif;font-size:6px;font-weight:700;color:#c9a84c;letter-spacing:3px;text-transform:uppercase;margin-top:1px}
.rb{position:absolute;bottom:-16px;left:50%;transform:translateX(-50%);width:56px;height:22px}
.r1,.r2{position:absolute;bottom:0;width:22px;height:22px}
.r1{left:3px;background:linear-gradient(135deg,#dbb84d,#a67c30);clip-path:polygon(0 0,100% 0,55% 100%,0 60%)}
.r2{right:3px;background:linear-gradient(135deg,#dbb84d,#a67c30);clip-path:polygon(0 0,100% 0,100% 60%,45% 100%)}

/* Wax seal */
.ws{position:absolute;bottom:42px;right:42px;width:50px;height:50px;z-index:5}
.wo{width:50px;height:50px;border-radius:50%;background:radial-gradient(circle at 35% 35%,#8b2020,#6b1515,#4a0e0e);box-shadow:0 2px 8px rgba(0,0,0,0.25),inset 0 1px 2px rgba(255,255,255,0.12);display:flex;align-items:center;justify-content:center;transform:rotate(-10deg)}
.wi{width:36px;height:36px;border-radius:50%;border:1px solid rgba(255,255,255,0.08);display:flex;flex-direction:column;align-items:center;justify-content:center}
.ws2{font-size:10px;color:rgba(255,255,255,0.35)}
.wt{font-size:4px;font-weight:700;color:rgba(255,255,255,0.3);letter-spacing:1.5px;text-transform:uppercase}

.cid{position:absolute;bottom:12px;left:80px;font-family:'Inter',sans-serif;font-size:6.5px;color:#8b735518;letter-spacing:2px}

@media print{body{background:#fff;padding:0}.wrap{box-shadow:none;padding:0;width:100%;height:100%}.page{height:100%}}
</style></head>
<body>
<div class="wrap">
  <div class="page">
    <div class="gb1"></div>
    <div class="gb2"></div>
    <div class="lp"></div>
    <div class="lc"></div>

    <!-- Badge -->
    <div class="bdg">
      <div class="bo2"><div class="bm"><div class="bn">
        <span class="by">${new Date().getFullYear()}</span>
        <span class="bt">Award</span>
      </div></div></div>
      <div class="rb"><div class="r1"></div><div class="r2"></div></div>
    </div>

    <!-- Content -->
    <div class="body">
      <div class="hdr">
        ${s.logo_url ? `<img src="${s.logo_url}" alt="Logo" style="max-height:30px;margin-bottom:6px;display:block" />` : ''}
        <div class="ttl">CERTIFICATE</div>
        <div class="sub">of Achievement</div>
      </div>

      <div class="gd"></div>

      <div class="mid">
        <p class="pre">This certificate is proudly presented to</p>
        <div class="name">${studentName}</div>
        <div class="nline"></div>
        <p class="dsc">Having demonstrated exceptional dedication, discipline, and commitment to mastering professional architecture and design skills through the ${s.institution_name} platform.</p>
        <p class="fl">For successfully completing</p>
        <p class="cn">${courseName}</p>
      </div>

      <div class="ft">
        <div class="sb">
          <span class="sh">${s.signature_name}</span>
          <div class="sl"></div>
          <p class="sn">${s.signature_name}</p>
          <p class="sr">${s.signature_title}</p>
        </div>
        <div class="db">
          <div class="dl"></div>
          <p class="dlb">Date</p>
          <p class="dv">${issueDate}</p>
        </div>
      </div>

      <p class="vf">Verify at: https://archistudio.shop/verify/${certNumber}</p>
    </div>

    <!-- Wax seal -->
    <div class="ws">
      <div class="wo"><div class="wi">
        <span class="ws2">✦</span>
        <span class="wt">Verified</span>
      </div></div>
    </div>

    <div class="cid">NO. ${certNumber}</div>
  </div>
</div>
<script>
document.fonts.ready.then(function(){
  setTimeout(function(){window.print()},800);
});
</script>
</body></html>`;
}
