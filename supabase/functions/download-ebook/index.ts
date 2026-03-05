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
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Unauthorized");

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
    if (authError || !user) throw new Error("Unauthorized");

    const { ebookId } = await req.json();
    if (!ebookId) throw new Error("eBook ID is required");

    const { data: purchases, error: purchaseError } = await supabaseClient
      .from("ebook_purchases")
      .select("ebook_ids")
      .eq("user_id", user.id)
      .eq("status", "completed");

    if (purchaseError) throw new Error("Failed to check purchase status");

    const hasAccess = purchases?.some((purchase) => purchase.ebook_ids?.includes(ebookId));
    if (!hasAccess) throw new Error("You don't have access to this eBook");

    const { data: ebook, error: ebookError } = await supabaseClient
      .from("ebooks")
      .select("title, file_url, drive_file_id")
      .eq("id", ebookId)
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
      throw new Error("No file available for this eBook");
    }

    if (!sourceResponse.ok) {
      console.error("Download upstream failure:", await sourceResponse.text());
      throw new Error("Failed to fetch eBook file");
    }

    const fileName = `${ebook.title.replace(/[^a-zA-Z0-9\s]/g, "").replace(/\s+/g, "_")}.pdf`;
    const headers = new Headers({
      ...corsHeaders,
      "Content-Type": sourceResponse.headers.get("content-type") || "application/pdf",
      "Content-Disposition": `attachment; filename="${fileName}"`,
      "Cache-Control": "private, max-age=3600",
    });

    const contentLength = sourceResponse.headers.get("content-length");
    if (contentLength) headers.set("Content-Length", contentLength);

    return new Response(sourceResponse.body, {
      status: 200,
      headers,
    });
  } catch (error: any) {
    console.error("Download error:", error);
    const message = error?.message || "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      {
        status: message === "Unauthorized" ? 401 : 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
