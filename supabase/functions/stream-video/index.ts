import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

/**
 * Optimized Video Streaming Proxy
 * 
 * Prioritizes smooth playback and fast seeking while maintaining basic protection.
 */

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, range",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Expose-Headers": "Content-Range, Accept-Ranges, Content-Length",
};

type TicketPayload = {
  v: 1;
  uid: string;
  lessonId: string;
  videoPath: string;
  exp: number;
  ua: string;
  oh?: string;
  n: string;
};

const te = new TextEncoder();

function guessVideoContentType(path: string): string {
  const lower = (path || "").toLowerCase();
  if (lower.endsWith('.mp4')) return 'video/mp4';
  if (lower.endsWith('.webm')) return 'video/webm';
  if (lower.endsWith('.mov')) return 'video/quicktime';
  if (lower.endsWith('.m4v')) return 'video/x-m4v';
  if (lower.endsWith('.mkv')) return 'video/x-matroska';
  return 'video/mp4';
}

function base64UrlDecode(input: string): Uint8Array {
  const b64 = input.replace(/-/g, "+").replace(/_/g, "/");
  const padded = b64 + "===".slice((b64.length + 3) % 4);
  const bin = atob(padded);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

async function sha256Hex(input: string) {
  const digest = await crypto.subtle.digest("SHA-256", te.encode(input));
  const arr = new Uint8Array(digest);
  return Array.from(arr)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function hmacVerify(secret: string, message: string, signatureB64Url: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    te.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"],
  );
  const sigBytes = base64UrlDecode(signatureB64Url);
  return crypto.subtle.verify(
    "HMAC",
    key,
    sigBytes.buffer as ArrayBuffer,
    te.encode(message),
  );
}

function getRequestOriginHost(req: Request): string | null {
  const origin = req.headers.get("origin");
  const referer = req.headers.get("referer");
  try {
    if (origin) return new URL(origin).host;
  } catch { /* ignore */ }
  try {
    if (referer) return new URL(referer).host;
  } catch { /* ignore */ }
  return null;
}

function isLikelyOurSiteHost(host: string) {
  return (
    host.endsWith(".lovable.app") ||
    host.endsWith(".lovableproject.com") ||
    host === "archistudio.lovable.app" ||
    host === "archistudio.shop"
  );
}

// Extract Google Drive file ID from various URL formats
function extractGoogleDriveFileId(url: string): string | null {
  const patterns = [
    /drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/,
    /drive\.google\.com\/open\?id=([a-zA-Z0-9_-]+)/,
    /docs\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }
  return null;
}

// Check if URL is a Google Drive URL
function isGoogleDriveUrl(url: string): boolean {
  return /drive\.google\.com|docs\.google\.com/i.test(url);
}

// HIGH PERFORMANCE Google Drive streaming - tries multiple methods
async function getGoogleDriveStream(fileId: string, apiKey: string, rangeHeader?: string | null): Promise<Response> {
  const headers: HeadersInit = {
    'Accept': '*/*',
    'Accept-Encoding': 'identity',
    'Connection': 'keep-alive',
  };
  if (rangeHeader) {
    headers['Range'] = rangeHeader;
  }

  // Method 1: Google Drive API with API key (works for public files)
  try {
    const apiUrl = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media&key=${apiKey}`;
    const apiResponse = await fetch(apiUrl, { headers });
    if (apiResponse.ok || apiResponse.status === 206) {
      console.log("Google Drive API method succeeded");
      return apiResponse;
    }
    console.warn(`Google Drive API method failed: ${apiResponse.status}`);
    // Consume body to release connection
    await apiResponse.text().catch(() => {});
  } catch (e) {
    console.warn("Google Drive API method error:", e);
  }

  // Method 2: Direct download URL (works for "Anyone with the link" files)
  try {
    const directUrl = `https://drive.google.com/uc?export=download&id=${fileId}&confirm=t`;
    const directHeaders: HeadersInit = {
      ...headers,
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    };
    const directResponse = await fetch(directUrl, { headers: directHeaders, redirect: 'follow' });
    if (directResponse.ok || directResponse.status === 206) {
      console.log("Google Drive direct download method succeeded");
      return directResponse;
    }
    console.warn(`Google Drive direct method failed: ${directResponse.status}`);
    await directResponse.text().catch(() => {});
  } catch (e) {
    console.warn("Google Drive direct method error:", e);
  }

  // Method 3: Export download with confirm bypass
  try {
    const exportUrl = `https://drive.usercontent.google.com/download?id=${fileId}&export=download&confirm=t`;
    const exportHeaders: HeadersInit = {
      ...headers,
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    };
    const exportResponse = await fetch(exportUrl, { headers: exportHeaders, redirect: 'follow' });
    if (exportResponse.ok || exportResponse.status === 206) {
      console.log("Google Drive export method succeeded");
      return exportResponse;
    }
    console.error(`All Google Drive methods failed. Last status: ${exportResponse.status}`);
    await exportResponse.text().catch(() => {});
  } catch (e) {
    console.error("Google Drive export method error:", e);
  }

  throw new Error("Failed to fetch from Google Drive: all methods exhausted (403). Ensure the file is shared as 'Anyone with the link'.");
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Get parameters from URL
    const url = new URL(req.url);
    const token = url.searchParams.get("t"); // legacy
    const ticket = url.searchParams.get("ticket");
    const lessonId = url.searchParams.get("l");
    const videoPath = url.searchParams.get("p");

    if (!lessonId || !videoPath || (!ticket && !token)) {
      return new Response(
        JSON.stringify({ error: "Missing parameters" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Basic origin check (non-blocking for browsers)
    const reqHost = getRequestOriginHost(req);
    if (reqHost && !isLikelyOurSiteHost(reqHost)) {
      return new Response(
        JSON.stringify({ error: "Forbidden" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Resolve userId from signed ticket
    let userId: string | null = null;
    if (ticket) {
      const secret = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
      if (!secret) {
        return new Response(JSON.stringify({ error: "Server misconfigured" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const parts = ticket.split(".");
      if (parts.length !== 2) {
        return new Response(JSON.stringify({ error: "Invalid ticket" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const [payloadB64, sigB64] = parts;
      const ok = await hmacVerify(secret, payloadB64, sigB64);
      if (!ok) {
        return new Response(JSON.stringify({ error: "Invalid ticket" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const payloadJson = new TextDecoder().decode(base64UrlDecode(payloadB64));
      const payload = JSON.parse(payloadJson) as TicketPayload;
      
      if (payload.v !== 1) {
        return new Response(JSON.stringify({ error: "Invalid ticket" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Expiry check
      if (Date.now() > payload.exp) {
        return new Response(JSON.stringify({ error: "Session expired. Please refresh." }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // UA binding
      const ua = req.headers.get("user-agent") ?? "";
      const uaHash = await sha256Hex(ua);
      if (uaHash !== payload.ua) {
        return new Response(JSON.stringify({ error: "Forbidden" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Parameter binding
      if (payload.lessonId !== lessonId || payload.videoPath !== videoPath) {
        return new Response(JSON.stringify({ error: "Forbidden" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      userId = payload.uid;
    }

    // Legacy token fallback
    if (!userId && token) {
      const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
      if (authError || !user) {
        return new Response(
          JSON.stringify({ error: "Unauthorized" }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      userId = user.id;
    }

    if (!userId) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const rangeHeader = req.headers.get("range");

    // Check if user is admin
    const { data: adminRole } = await supabaseClient
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();

    const isAdmin = !!adminRole;

    // If not admin, verify enrollment (fast query)
    if (!isAdmin) {
      const { data: lesson } = await supabaseClient
        .from("lessons")
        .select(`id, is_free_preview, modules!inner (course_id)`)
        .eq("id", lessonId)
        .single();

      if (!lesson) {
        return new Response(
          JSON.stringify({ error: "Lesson not found" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (!lesson.is_free_preview) {
        const courseId = (lesson.modules as any).course_id;

        const { data: enrollment } = await supabaseClient
          .from("enrollments")
          .select("id")
          .eq("user_id", userId)
          .eq("course_id", courseId)
          .eq("status", "active")
          .maybeSingle();

        if (!enrollment) {
          return new Response(
            JSON.stringify({ error: "Not enrolled" }),
            { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }
    }

    // === GOOGLE DRIVE STREAMING (OPTIMIZED FOR SPEED) ===
    if (isGoogleDriveUrl(videoPath)) {
      const fileId = extractGoogleDriveFileId(videoPath);
      
      if (!fileId) {
        return new Response(
          JSON.stringify({ error: "Invalid Google Drive URL" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const googleApiKey = Deno.env.get("GOOGLE_API_KEY");
      if (!googleApiKey) {
        return new Response(
          JSON.stringify({ error: "Google API key not configured" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      try {
        const driveResponse = await getGoogleDriveStream(fileId, googleApiKey, rangeHeader);
        
        // Get headers from Drive response
        const contentType = driveResponse.headers.get("Content-Type") || "video/mp4";
        const contentLength = driveResponse.headers.get("Content-Length");
        const contentRange = driveResponse.headers.get("Content-Range");

        // MAXIMUM PERFORMANCE HEADERS for fastest streaming and seeking
        const responseHeaders: HeadersInit = {
          ...corsHeaders,
          "Content-Type": contentType.startsWith("video/") ? contentType : "video/mp4",
          "Accept-Ranges": "bytes",
          // Aggressive caching: 24h private cache, immutable chunks
          "Cache-Control": "private, max-age=86400, immutable",
          "X-Content-Type-Options": "nosniff",
          // Allow Service Worker to cache
          "Vary": "Range",
        };

        if (contentLength) {
          responseHeaders["Content-Length"] = contentLength;
        }
        if (contentRange) {
          responseHeaders["Content-Range"] = contentRange;
        }

        // Direct stream passthrough - zero buffering on edge function
        return new Response(driveResponse.body, {
          status: driveResponse.status,
          headers: responseHeaders,
        });
      } catch (driveError: any) {
        console.error("Google Drive streaming error:", driveError);
        return new Response(
          JSON.stringify({ error: "Failed to stream video" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // === SUPABASE STORAGE STREAMING ===
    // For storage videos, generate a signed URL and redirect (fastest approach)
    const { data: signedUrlData, error: signedUrlError } = await supabaseClient
      .storage
      .from("course-videos")
      .createSignedUrl(videoPath, 7200); // 2 hour validity

    if (signedUrlError || !signedUrlData?.signedUrl) {
      console.error("Signed URL error:", signedUrlError);
      return new Response(
        JSON.stringify({ error: "Video not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Redirect to signed URL - browser handles caching and range requests natively
    return Response.redirect(signedUrlData.signedUrl, 302);

  } catch (error: any) {
    console.error("Stream error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
