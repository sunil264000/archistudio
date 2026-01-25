import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

/**
 * Mints a short-lived, signed ticket for the stream-video endpoint.
 * IMPORTANT: We intentionally DO NOT return the user's access token in any URL.
 */

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type TicketPayload = {
  v: 1;
  uid: string;
  lessonId: string;
  videoPath: string;
  exp: number; // ms epoch
  ua: string; // sha256(user-agent)
  oh?: string; // origin host (best-effort)
  n: string; // nonce
};

const te = new TextEncoder();

function base64UrlEncode(bytes: Uint8Array) {
  let str = btoa(String.fromCharCode(...bytes));
  return str.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

async function sha256Hex(input: string) {
  const digest = await crypto.subtle.digest("SHA-256", te.encode(input));
  const arr = new Uint8Array(digest);
  return Array.from(arr)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function hmacSignBase64Url(secret: string, message: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    te.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );

  const sig = await crypto.subtle.sign("HMAC", key, te.encode(message));
  return base64UrlEncode(new Uint8Array(sig));
}

function safeOriginHost(req: Request): string | undefined {
  const origin = req.headers.get("origin");
  const referer = req.headers.get("referer");
  try {
    if (origin) return new URL(origin).host;
  } catch {
    // ignore
  }
  try {
    if (referer) return new URL(referer).host;
  } catch {
    // ignore
  }
  return undefined;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(
      authHeader.replace("Bearer ", ""),
    );

    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const lessonId = body?.lessonId as string | undefined;
    const videoPath = body?.videoPath as string | undefined;

    if (!lessonId || !videoPath) {
      return new Response(JSON.stringify({ error: "Missing lessonId or videoPath" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Keep this long enough to avoid playback interruptions,
    // but still short enough that copy-pasted links expire quickly.
    const expiresInMs = 10 * 60 * 1000; // 10 minutes
    const exp = Date.now() + expiresInMs;
    const ua = req.headers.get("user-agent") ?? "";
    const uaHash = await sha256Hex(ua);
    const oh = safeOriginHost(req);

    const payload: TicketPayload = {
      v: 1,
      uid: user.id,
      lessonId,
      videoPath,
      exp,
      ua: uaHash,
      oh,
      n: crypto.randomUUID(),
    };

    const payloadJson = JSON.stringify(payload);
    const payloadB64 = base64UrlEncode(te.encode(payloadJson));

    // Use server-only secret for signing (service role key is already secret).
    const secret = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    if (!secret) {
      return new Response(JSON.stringify({ error: "Server misconfigured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const sigB64 = await hmacSignBase64Url(secret, payloadB64);
    const ticket = `${payloadB64}.${sigB64}`;

    return new Response(JSON.stringify({ ticket, expiresInMs }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("mint-video-ticket error:", error);
    return new Response(JSON.stringify({ error: "Failed to mint ticket" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
