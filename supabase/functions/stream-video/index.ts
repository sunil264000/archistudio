import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

/**
 * Secure Video Streaming Proxy with Anti-Download Protection
 * 
 * This function streams video content directly without exposing the source URL.
 * Includes multiple layers of protection against download managers like IDM.
 */

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, range",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Expose-Headers": "Content-Range, Accept-Ranges, Content-Length",
};

// Known download manager user agents and patterns
const BLOCKED_USER_AGENTS = [
  'idm',
  'internet download manager',
  'flashget',
  'getright',
  'download accelerator',
  'freedownloadmanager',
  'jdownloader',
  'orbit',
  'axel',
  'aria2',
  'wget',
  'curl',
  'python-requests',
  'libwww',
  'java/',
  'winhttp',
  'go-http-client',
  'apache-httpclient',
  'okhttp',
  'httpunit',
  'thunderdownload',
  'eagleget',
  'ninja',
  'download',
  'manager',
];

// Check if user agent is a download manager
function isDownloadManager(userAgent: string | null): boolean {
  if (!userAgent) return true; // Block requests without user agent
  
  const ua = userAgent.toLowerCase();
  
  // Check against known patterns
  for (const pattern of BLOCKED_USER_AGENTS) {
    if (ua.includes(pattern)) {
      return true;
    }
  }
  
  // Check for suspicious patterns
  // IDM typically sends multiple Range requests simultaneously
  // and has specific header patterns
  if (!ua.includes('mozilla') && !ua.includes('chrome') && !ua.includes('safari') && !ua.includes('firefox') && !ua.includes('edge')) {
    // Not a standard browser
    return true;
  }
  
  return false;
}

// In-memory store for rate limiting and session tracking (per instance)
const sessionStore = new Map<string, { count: number; lastAccess: number; ranges: Set<string> }>();

// Clean up old sessions periodically
function cleanupSessions() {
  const now = Date.now();
  const maxAge = 10 * 60 * 1000; // 10 minutes
  
  for (const [key, session] of sessionStore.entries()) {
    if (now - session.lastAccess > maxAge) {
      sessionStore.delete(key);
    }
  }
}

// Check for suspicious range request patterns (IDM signature)
function isSuspiciousRangePattern(userId: string, lessonId: string, range: string | null): boolean {
  const sessionKey = `${userId}:${lessonId}`;
  const now = Date.now();
  
  if (!sessionStore.has(sessionKey)) {
    sessionStore.set(sessionKey, { count: 0, lastAccess: now, ranges: new Set() });
  }
  
  const session = sessionStore.get(sessionKey)!;
  session.lastAccess = now;
  session.count++;
  
  if (range) {
    session.ranges.add(range);
  }
  
  // IDM detection patterns:
  // 1. Too many requests in short time (>30 in 10 seconds)
  // 2. Too many different range requests (>20 unique ranges)
  // 3. Multiple simultaneous connections pattern
  
  if (session.count > 50) {
    return true; // Too many requests
  }
  
  if (session.ranges.size > 30) {
    return true; // Too many unique range requests (IDM splits downloads)
  }
  
  return false;
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

// Get Google Drive direct download URL using API
async function getGoogleDriveStream(fileId: string, apiKey: string, rangeHeader?: string | null): Promise<Response> {
  const metadataUrl = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media&key=${apiKey}`;
  
  const headers: HeadersInit = {};
  if (rangeHeader) {
    headers['Range'] = rangeHeader;
  }

  const response = await fetch(metadataUrl, { headers });
  
  if (!response.ok) {
    console.error(`Google Drive API error: ${response.status} ${response.statusText}`);
    throw new Error(`Failed to fetch from Google Drive: ${response.status}`);
  }

  return response;
}

serve(async (req) => {
  // Cleanup old sessions periodically
  cleanupSessions();
  
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // === PROTECTION LAYER 1: User-Agent Check ===
    const userAgent = req.headers.get("user-agent");
    
    if (isDownloadManager(userAgent)) {
      console.warn(`Blocked download manager: ${userAgent}`);
      // Return a fake error to confuse download managers
      return new Response(
        JSON.stringify({ error: "Video processing, please wait..." }),
        { 
          status: 503, // Service Unavailable - makes IDM think server is overloaded
          headers: { 
            ...corsHeaders, 
            "Content-Type": "application/json",
            "Retry-After": "3600" // Tell it to retry in 1 hour
          } 
        }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Get parameters from URL
    const url = new URL(req.url);
    const token = url.searchParams.get("t");
    const lessonId = url.searchParams.get("l");
    const videoPath = url.searchParams.get("p");
    const timestamp = url.searchParams.get("ts");
    const sessionId = url.searchParams.get("_"); // Random session ID

    // === PROTECTION LAYER 2: URL Expiration (reduced to 5 minutes) ===
    if (timestamp) {
      const urlTime = parseInt(timestamp, 10);
      const now = Date.now();
      const fiveMinutes = 5 * 60 * 1000; // Reduced from 30 to 5 minutes
      
      if (now - urlTime > fiveMinutes) {
        return new Response(
          JSON.stringify({ error: "Session expired. Please refresh the page." }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    if (!token || !lessonId || !videoPath) {
      return new Response(
        JSON.stringify({ error: "Missing parameters" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify user
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const rangeHeader = req.headers.get("range");

    // === PROTECTION LAYER 3: Suspicious Pattern Detection ===
    if (isSuspiciousRangePattern(user.id, lessonId, rangeHeader)) {
      console.warn(`Suspicious download pattern detected for user: ${user.id}`);
      // Return 429 Too Many Requests
      return new Response(
        JSON.stringify({ error: "Too many requests. Please wait and try again." }),
        { 
          status: 429, 
          headers: { 
            ...corsHeaders, 
            "Content-Type": "application/json",
            "Retry-After": "60"
          } 
        }
      );
    }

    // Check if user is admin
    const { data: adminRole } = await supabaseClient
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();

    const isAdmin = !!adminRole;

    // If not admin, verify enrollment
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
          .eq("user_id", user.id)
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

    // Anti-download response headers
    const antiDownloadHeaders = {
      ...corsHeaders,
      "Cache-Control": "no-store, no-cache, must-revalidate, private, max-age=0",
      "Pragma": "no-cache",
      "Expires": "0",
      "X-Content-Type-Options": "nosniff",
      "Content-Disposition": "inline; filename=protected.bin", // Hide real filename
      "X-Download-Options": "noopen",
      "X-Frame-Options": "SAMEORIGIN",
    };

    // Check if this is a Google Drive URL
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
        
        const contentType = driveResponse.headers.get("Content-Type") || "video/mp4";
        const contentLength = driveResponse.headers.get("Content-Length");
        const contentRange = driveResponse.headers.get("Content-Range");
        const acceptRanges = driveResponse.headers.get("Accept-Ranges");

        const responseHeaders: HeadersInit = {
          ...antiDownloadHeaders,
          "Content-Type": contentType,
        };

        if (contentLength) {
          responseHeaders["Content-Length"] = contentLength;
        }
        if (contentRange) {
          responseHeaders["Content-Range"] = contentRange;
        }
        if (acceptRanges) {
          responseHeaders["Accept-Ranges"] = acceptRanges;
        }

        return new Response(driveResponse.body, {
          status: driveResponse.status,
          headers: responseHeaders,
        });
      } catch (driveError: any) {
        console.error("Google Drive streaming error:", driveError);
        return new Response(
          JSON.stringify({ error: "Failed to stream video", details: driveError.message }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Handle internal storage videos
    const { data: fileData, error: fileError } = await supabaseClient
      .storage
      .from("course-videos")
      .download(videoPath);

    if (fileError || !fileData) {
      console.error("File download error:", fileError);
      return new Response(
        JSON.stringify({ error: "Video not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const fileSize = fileData.size;

    // Handle range requests for seeking
    if (rangeHeader) {
      const parts = rangeHeader.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunkSize = end - start + 1;

      const buffer = await fileData.arrayBuffer();
      const chunk = buffer.slice(start, end + 1);

      return new Response(chunk, {
        status: 206,
        headers: {
          ...antiDownloadHeaders,
          "Content-Type": "application/octet-stream", // Hide that it's video
          "Content-Range": `bytes ${start}-${end}/${fileSize}`,
          "Accept-Ranges": "bytes",
          "Content-Length": chunkSize.toString(),
        },
      });
    }

    // Full file response
    return new Response(fileData, {
      status: 200,
      headers: {
        ...antiDownloadHeaders,
        "Content-Type": "application/octet-stream", // Hide video MIME type
        "Content-Length": fileSize.toString(),
        "Accept-Ranges": "bytes",
      },
    });
  } catch (error: any) {
    console.error("Stream error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
