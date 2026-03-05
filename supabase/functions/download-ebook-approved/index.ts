import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const getDriveFileIdFromUrl = (url: string) => {
  const byPath = url.match(/\/d\/([a-zA-Z0-9_-]+)/)?.[1];
  const byParam = url.match(/[?&]id=([a-zA-Z0-9_-]+)/)?.[1];
  return byPath || byParam || null;
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const url = new URL(req.url);
    const requestId = url.searchParams.get("requestId");
    if (!requestId) throw new Error("Request ID required");

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);

    // Find the approved request
    const { data: request, error: reqError } = await supabaseClient
      .from("download_requests")
      .select("*")
      .eq("id", requestId)
      .eq("download_granted", true)
      .single();

    if (reqError || !request) throw new Error("Download not authorized");

    // Get ebook details
    const { data: ebook, error: ebookError } = await supabaseClient
      .from("ebooks")
      .select("title, file_url, drive_file_id")
      .eq("id", request.ebook_id)
      .single();

    if (ebookError || !ebook) throw new Error("eBook not found");

    let sourceResponse: Response;

    if (ebook.drive_file_id) {
      const googleApiKey = Deno.env.get("GOOGLE_API_KEY");
      if (!googleApiKey) throw new Error("Google API key not configured");
      sourceResponse = await fetch(
        `https://www.googleapis.com/drive/v3/files/${ebook.drive_file_id}?alt=media&key=${googleApiKey}`,
        { headers: { Accept: "application/pdf" } },
      );
    } else if (ebook.file_url) {
      if (ebook.file_url.startsWith("http")) {
        const driveFileId = getDriveFileIdFromUrl(ebook.file_url);
        if (driveFileId) {
          const googleApiKey = Deno.env.get("GOOGLE_API_KEY");
          if (!googleApiKey) throw new Error("Google API key not configured");
          sourceResponse = await fetch(
            `https://www.googleapis.com/drive/v3/files/${driveFileId}?alt=media&key=${googleApiKey}`,
            { headers: { Accept: "application/pdf" } },
          );
        } else {
          sourceResponse = await fetch(ebook.file_url, { headers: { Accept: "application/pdf" } });
        }
      } else {
        const { data: signed, error: signError } = await supabaseClient.storage
          .from("ebook-files")
          .createSignedUrl(ebook.file_url, 120);
        if (signError || !signed?.signedUrl) throw new Error("Unable to access eBook file");
        sourceResponse = await fetch(signed.signedUrl, { headers: { Accept: "application/pdf" } });
      }
    } else {
      throw new Error("No file available");
    }

    if (!sourceResponse.ok) throw new Error("Failed to fetch eBook file");

    const fileName = `${ebook.title.replace(/[^a-zA-Z0-9\s]/g, "").replace(/\s+/g, "_")}.pdf`;
    const headers = new Headers({
      ...corsHeaders,
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${fileName}"`,
      "Cache-Control": "private, no-cache",
    });

    const contentLength = sourceResponse.headers.get("content-length");
    if (contentLength) headers.set("Content-Length", contentLength);

    return new Response(sourceResponse.body, { status: 200, headers });
  } catch (error: any) {
    console.error("Approved download error:", error);
    return new Response(JSON.stringify({ error: error?.message || "Download failed" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
