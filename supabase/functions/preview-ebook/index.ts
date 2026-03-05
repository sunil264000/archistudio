import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, range",
};

const getDriveFileIdFromUrl = (url: string) => {
  const byPath = url.match(/\/d\/([a-zA-Z0-9_-]+)/)?.[1];
  const byParam = url.match(/[?&]id=([a-zA-Z0-9_-]+)/)?.[1];
  return byPath || byParam || null;
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    let ebookId = "";
    if (req.method === "GET") {
      const url = new URL(req.url);
      ebookId = url.searchParams.get("ebookId") || "";
    } else {
      const body = await req.json().catch(() => ({}));
      ebookId = body.ebookId || "";
    }

    if (!ebookId) throw new Error("eBook ID is required");

    const { data: ebook, error } = await supabaseClient
      .from("ebooks")
      .select("file_url, drive_file_id")
      .eq("id", ebookId)
      .single();

    if (error || !ebook) throw new Error("eBook not found");

    const rangeHeader = req.headers.get("range");
    let requestHeaders: HeadersInit = {
      Accept: "application/pdf",
    };

    if (rangeHeader) {
      requestHeaders = {
        ...requestHeaders,
        Range: rangeHeader,
      };
    }

    let sourceResponse: Response;

    if (ebook.drive_file_id) {
      const googleApiKey = Deno.env.get("GOOGLE_API_KEY");
      if (!googleApiKey) throw new Error("Google API key not configured");

      sourceResponse = await fetch(
        `https://www.googleapis.com/drive/v3/files/${ebook.drive_file_id}?alt=media&key=${googleApiKey}`,
        { headers: requestHeaders },
      );
    } else if (ebook.file_url) {
      if (ebook.file_url.startsWith("http")) {
        const driveFileId = getDriveFileIdFromUrl(ebook.file_url);

        if (driveFileId) {
          const googleApiKey = Deno.env.get("GOOGLE_API_KEY");
          if (!googleApiKey) throw new Error("Google API key not configured");

          sourceResponse = await fetch(
            `https://www.googleapis.com/drive/v3/files/${driveFileId}?alt=media&key=${googleApiKey}`,
            { headers: requestHeaders },
          );
        } else {
          sourceResponse = await fetch(ebook.file_url, { headers: requestHeaders });
        }
      } else {
        const { data: signed, error: signError } = await supabaseClient.storage
          .from("ebook-files")
          .createSignedUrl(ebook.file_url, 60);

        if (signError || !signed?.signedUrl) throw new Error("Unable to access eBook file");
        sourceResponse = await fetch(signed.signedUrl, { headers: requestHeaders });
      }
    } else {
      throw new Error("No file available for this eBook");
    }

    if (!sourceResponse.ok && sourceResponse.status !== 206) {
      const reason = await sourceResponse.text();
      console.error("Preview upstream failure:", reason);
      throw new Error("Failed to fetch PDF content");
    }

    const headers = new Headers({
      ...corsHeaders,
      "Content-Type": sourceResponse.headers.get("content-type") || "application/pdf",
      "Content-Disposition": "inline",
      "X-Content-Type-Options": "nosniff",
      "Accept-Ranges": sourceResponse.headers.get("accept-ranges") || "bytes",
      "Cache-Control": "public, max-age=3600",
    });

    const contentRange = sourceResponse.headers.get("content-range");
    const contentLength = sourceResponse.headers.get("content-length");
    if (contentRange) headers.set("Content-Range", contentRange);
    if (contentLength) headers.set("Content-Length", contentLength);

    return new Response(sourceResponse.body, {
      status: sourceResponse.status === 206 ? 206 : 200,
      headers,
    });
  } catch (error: any) {
    console.error("Preview error:", error);
    return new Response(
      JSON.stringify({ error: error?.message || "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
