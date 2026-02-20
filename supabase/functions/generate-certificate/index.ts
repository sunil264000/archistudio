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
  accent_color: '#c9a84c',
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

    if (req.method === "GET") {
      certificateId = url.searchParams.get("certificateId") || undefined;
      userId = url.searchParams.get("userId") || undefined;
      courseId = url.searchParams.get("courseId") || undefined;
    } else {
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
  s: CertificateSettings,
  studentName: string,
  courseName: string,
  issueDate: string,
  certNumber: string
): string {
  const year = new Date().getFullYear();

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Proof of Completion — ${studentName}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;500;600;700&family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400;1,500&family=Playfair+Display:ital,wght@0,400;0,700;1,400;1,700&family=Dancing+Script:wght@600;700&family=Inter:wght@300;400;500;600&display=swap" rel="stylesheet">
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
@page { size: 297mm 210mm landscape; margin: 0; }
html, body {
  width: 297mm; height: 210mm;
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}
body {
  font-family: 'Inter', sans-serif;
  background: #180a10;
  display: flex; align-items: center; justify-content: center;
  min-height: 100vh; padding: 14px;
}

/* ─── Outer shell ─── */
.shell {
  width: 1050px; height: 742px;
  background: linear-gradient(150deg, #2a0d1e 0%, #180a10 55%, #220d18 100%);
  padding: 9px;
  box-shadow: 0 40px 100px rgba(0,0,0,.85), 0 0 0 1px rgba(201,168,76,.2);
  position: relative;
}
/* Corner bracket ornaments */
.shell::before, .shell::after {
  content: ''; position: absolute;
  width: 36px; height: 36px;
  border-color: rgba(201,168,76,.6); border-style: solid; opacity: .8;
}
.shell::before { top: 2px; left: 2px; border-width: 2px 0 0 2px; }
.shell::after  { bottom: 2px; right: 2px; border-width: 0 2px 2px 0; }

/* ─── Inner cream page ─── */
.page {
  width: 100%; height: 100%;
  background: linear-gradient(155deg, #fefcf4 0%, #fff9e8 45%, #fdf6e0 75%, #fefcf4 100%);
  position: relative; overflow: hidden;
}

/* Gold hairline frames */
.f1 { position: absolute; inset: 6px; border: 1.5px solid rgba(201,168,76,.65); pointer-events: none; z-index: 10; }
.f2 { position: absolute; inset: 12px; border: .5px solid rgba(201,168,76,.35); pointer-events: none; z-index: 10; }

/* ─── Maroon left sidebar ─── */
.sidebar {
  position: absolute; left: 0; top: 0; bottom: 0; width: 60px;
  background: linear-gradient(180deg, #4d1230 0%, #2d0b1c 40%, #3d1020 70%, #4d1230 100%);
  z-index: 6;
}
/* Gold edge on sidebar */
.sidebar::after {
  content: ''; position: absolute; right: 0; top: 0; bottom: 0; width: 1.5px;
  background: linear-gradient(180deg, transparent, #c9a84c 20%, #e8d48b 50%, #c9a84c 80%, transparent);
}
/* Soft scallop masking sidebar into cream */
.sidebar-curve {
  position: absolute; left: 52px; top: 0; bottom: 0; width: 24px;
  background: linear-gradient(155deg, #fefcf4 0%, #fff9e8 45%, #fdf6e0 75%, #fefcf4 100%);
  clip-path: ellipse(100% 54% at 100% 50%);
  z-index: 7;
}
/* Rotated text label on sidebar */
.sidebar-text {
  position: absolute; left: 0; top: 50%; width: 60px;
  transform: translateY(-50%) rotate(-90deg);
  font-family: 'Cinzel', serif; font-size: 5.5px; font-weight: 600;
  color: rgba(201,168,76,.45); letter-spacing: 4px; text-transform: uppercase;
  text-align: center; white-space: nowrap;
}

/* ─── Subtle background watermark pattern ─── */
.bg-pattern {
  position: absolute; inset: 0; z-index: 1; opacity: .025;
  background-image:
    radial-gradient(circle at 20% 50%, #4a1228 0%, transparent 60%),
    radial-gradient(circle at 80% 50%, #4a1228 0%, transparent 60%);
}

/* ─── Main content ─── */
.main {
  position: absolute; left: 78px; right: 0; top: 0; bottom: 0;
  padding: 28px 44px 26px 26px;
  display: flex; flex-direction: column;
  z-index: 9;
}

/* ─── Header row ─── */
.header {
  display: flex; align-items: flex-start; justify-content: space-between; gap: 16px;
}
.header-text { flex: 1; }
.institution {
  font-family: 'Cinzel', serif; font-size: 9.5px; font-weight: 600;
  color: #6b1d3a; letter-spacing: 5.5px; text-transform: uppercase; margin-bottom: 4px;
}
.cert-title {
  font-family: 'Cinzel', serif; font-size: 34px; font-weight: 700;
  color: #180810; letter-spacing: 4px; line-height: 1;
  text-shadow: 0 1px 2px rgba(0,0,0,.07);
}
.cert-of {
  font-family: 'Cormorant Garamond', serif; font-size: 13px; font-weight: 300;
  font-style: italic; color: #6b1d3a; letter-spacing: 8px; text-transform: uppercase; margin-top: 2px;
}

/* Badge */
.badge-col { flex-shrink: 0; display: flex; flex-direction: column; align-items: center; margin-top: -2px; }
.badge-ring {
  width: 88px; height: 88px; border-radius: 50%;
  background: conic-gradient(from 0deg, #c9a84c, #e8d48b, #a67c30, #dbb84d, #c9a84c, #f0e09a, #a67c30, #c9a84c);
  display: flex; align-items: center; justify-content: center;
  box-shadow: 0 6px 22px rgba(166,124,48,.4), inset 0 1px 3px rgba(255,255,255,.35);
}
.badge-inner {
  width: 72px; height: 72px; border-radius: 50%;
  background: linear-gradient(145deg, #5a1630 0%, #2d0b1c 60%, #4a1228 100%);
  border: 1.5px solid rgba(255,255,255,.1);
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  box-shadow: inset 0 2px 8px rgba(0,0,0,.5);
}
.badge-year { font-family: 'Cinzel', serif; font-size: 15px; font-weight: 700; color: #e8d48b; letter-spacing: 1px; line-height: 1; }
.badge-label { font-family: 'Inter', sans-serif; font-size: 5px; font-weight: 600; color: #c9a84c; letter-spacing: 2.5px; text-transform: uppercase; margin-top: 2px; }
.ribbon { display: flex; justify-content: center; gap: 7px; margin-top: 2px; }
.ribbon-l { width: 19px; height: 17px; background: linear-gradient(135deg, #e8d48b, #a67c30); clip-path: polygon(0 0, 100% 0, 58% 100%, 0 62%); }
.ribbon-r { width: 19px; height: 17px; background: linear-gradient(135deg, #e8d48b, #a67c30); clip-path: polygon(0 0, 100% 0, 100% 62%, 42% 100%); }

/* ─── Gold rule ─── */
.rule {
  height: 1px; margin: 9px 0 11px;
  background: linear-gradient(90deg, transparent 0%, #c9a84c 15%, #e8d48b 50%, #c9a84c 85%, transparent 100%);
  opacity: .55;
}

/* ─── Presented-to ─── */
.presented {
  font-family: 'Cormorant Garamond', serif; font-size: 10px; font-weight: 300;
  color: #9b8560; letter-spacing: 5px; text-transform: uppercase;
  text-align: center; margin-bottom: 5px;
}

/* ─── Student name ─── */
.name-wrap { text-align: center; margin-bottom: 4px; line-height: 1; }
.name {
  font-family: 'Playfair Display', serif; font-size: 54px; font-weight: 700;
  font-style: italic; color: #180810; line-height: 1.05;
  text-shadow: 0 2px 6px rgba(0,0,0,.06);
  display: inline-block;
}
.name-rule {
  width: 360px; height: 1.5px; margin: 6px auto 11px;
  background: linear-gradient(90deg, transparent, #c9a84c 25%, #e8d48b 50%, #c9a84c 75%, transparent);
}

/* ─── Body copy ─── */
.body-copy {
  font-family: 'Cormorant Garamond', serif; font-size: 13.5px; font-weight: 400;
  font-style: italic; color: #4a3a2a; line-height: 1.8;
  text-align: center; max-width: 560px; margin: 0 auto 11px;
}

/* ─── Course ─── */
.course-label {
  font-family: 'Inter', sans-serif; font-size: 7px; font-weight: 600;
  color: #9b8560; letter-spacing: 5px; text-transform: uppercase;
  text-align: center; margin-bottom: 3px;
}
.course-name {
  font-family: 'Playfair Display', serif; font-size: 19px; font-weight: 700;
  font-style: italic; color: #4a1228; letter-spacing: .5px;
  text-align: center; line-height: 1.25;
}

/* ─── Footer ─── */
.footer {
  display: flex; justify-content: space-between; align-items: flex-end;
  margin-top: auto; padding-top: 14px;
  border-top: .75px solid rgba(201,168,76,.28);
}

/* Signature */
.sig-block { text-align: center; min-width: 155px; }
.sig-script {
  font-family: 'Dancing Script', cursive; font-size: 29px; font-weight: 700;
  color: #180810; line-height: 1; display: inline-block;
  transform: rotate(-2.5deg) skewX(-4deg); margin-bottom: 0;
}
.sig-line { width: 155px; height: .75px; background: #2c1810; margin: 4px auto; }
.sig-name { font-family: 'Cinzel', serif; font-size: 7.5px; font-weight: 600; color: #180810; letter-spacing: 1.5px; }
.sig-role { font-family: 'Inter', sans-serif; font-size: 6px; color: #9b8560; letter-spacing: 2px; text-transform: uppercase; margin-top: 1px; }

/* Center: cert no. */
.cert-center { text-align: center; display: flex; flex-direction: column; align-items: center; gap: 2px; }
.cert-no-lbl { font-family: 'Inter', sans-serif; font-size: 6px; color: #9b8560; letter-spacing: 4px; text-transform: uppercase; }
.cert-no { font-family: 'Cinzel', serif; font-size: 8.5px; font-weight: 600; color: #4a1228; letter-spacing: 2px; }
.verify-lnk { font-family: 'Inter', sans-serif; font-size: 5.5px; color: #b0986e; letter-spacing: .8px; margin-top: 4px; opacity: .7; }

/* Wax seal + date */
.date-block { text-align: center; min-width: 155px; display: flex; flex-direction: column; align-items: center; }
.seal {
  width: 52px; height: 52px; border-radius: 50%;
  background: radial-gradient(circle at 38% 32%, #b03030, #6b1515, #3d0c0c);
  box-shadow: 0 4px 14px rgba(0,0,0,.35), inset 0 1px 3px rgba(255,255,255,.12);
  display: flex; align-items: center; justify-content: center;
  transform: rotate(-7deg); margin-bottom: 5px;
}
.seal-inner {
  width: 38px; height: 38px; border-radius: 50%;
  border: .75px solid rgba(255,255,255,.15);
  display: flex; flex-direction: column; align-items: center; justify-content: center;
}
.seal-star { font-size: 11px; color: rgba(255,255,255,.4); line-height: 1; }
.seal-word { font-family: 'Inter', sans-serif; font-size: 4.5px; font-weight: 700; color: rgba(255,255,255,.28); letter-spacing: 2px; text-transform: uppercase; }
.date-line { width: 130px; height: .75px; background: #2c1810; margin-bottom: 3px; }
.date-label { font-family: 'Cinzel', serif; font-size: 7px; font-weight: 600; color: #180810; letter-spacing: 3px; text-transform: uppercase; margin-bottom: 2px; }
.date-val { font-family: 'Cormorant Garamond', serif; font-size: 12px; font-style: italic; color: #4a3a2a; }

@media print {
  body { background: transparent; padding: 0; }
  .shell { box-shadow: none; padding: 0; }
  .page {
    background: linear-gradient(155deg, #fefcf4 0%, #fff9e8 45%, #fdf6e0 75%, #fefcf4 100%);
  }
}
</style>
</head>
<body>
<div class="shell">
  <div class="page">
    <!-- Frame hairlines -->
    <div class="f1"></div>
    <div class="f2"></div>

    <!-- Background warmth -->
    <div class="bg-pattern"></div>

    <!-- Left sidebar -->
    <div class="sidebar">
      <div class="sidebar-text">${s.institution_name}&nbsp;&nbsp;✦&nbsp;&nbsp;Proof of Completion</div>
    </div>
    <div class="sidebar-curve"></div>

    <!-- Main content -->
    <div class="main">

      <!-- Header -->
      <div class="header">
        <div class="header-text">
          ${s.logo_url ? `<img src="${s.logo_url}" alt="Logo" style="max-height:24px;margin-bottom:5px;display:block;opacity:.8">` : ''}
          <div class="institution">${s.institution_name}</div>
          <div class="cert-title">CERTIFICATE</div>
          <div class="cert-of">of Completion</div>
        </div>
        <div class="badge-col">
          <div class="badge-ring">
            <div class="badge-inner">
              <span class="badge-year">${year}</span>
              <span class="badge-label">Excellence</span>
            </div>
          </div>
          <div class="ribbon">
            <div class="ribbon-l"></div>
            <div class="ribbon-r"></div>
          </div>
        </div>
      </div>

      <!-- Divider -->
      <div class="rule"></div>

      <!-- Recipient -->
      <p class="presented">This Certificate is Proudly Presented to</p>

      <div class="name-wrap">
        <span class="name">${studentName}</span>
      </div>
      <div class="name-rule"></div>

      <p class="body-copy">
        for demonstrating exceptional dedication, discipline, and mastery<br>
        of professional architecture and design skills through ${s.institution_name}.
      </p>

      <p class="course-label">For Successfully Completing</p>
      <p class="course-name">${courseName}</p>

      <!-- Footer -->
      <div class="footer">

        <!-- Signature -->
        <div class="sig-block">
          <div class="sig-script">${s.signature_name}</div>
          <div class="sig-line"></div>
          <p class="sig-name">${s.signature_name}</p>
          <p class="sig-role">${s.signature_title}</p>
        </div>

        <!-- Certificate number -->
        <div class="cert-center">
          <span class="cert-no-lbl">Certificate No.</span>
          <span class="cert-no">${certNumber}</span>
          <span class="verify-lnk">archistudio.shop/verify/${certNumber}</span>
        </div>

        <!-- Wax seal + date -->
        <div class="date-block">
          <div class="seal">
            <div class="seal-inner">
              <span class="seal-star">✦</span>
              <span class="seal-word">Verified</span>
            </div>
          </div>
          <div class="date-line"></div>
          <p class="date-label">Date of Issue</p>
          <p class="date-val">${issueDate}</p>
        </div>

      </div>
    </div>
  </div>
</div>

<script>
document.fonts.ready.then(function () {
  setTimeout(function () { window.print(); }, 900);
});
</script>
</body>
</html>`;
}
