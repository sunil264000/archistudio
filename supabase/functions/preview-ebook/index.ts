import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { ebookId, previewPages = 15 } = await req.json();

    if (!ebookId) {
      throw new Error("eBook ID is required");
    }

    // Get ebook details
    const { data: ebook, error: ebookError } = await supabaseClient
      .from("ebooks")
      .select("title, file_url, drive_file_id")
      .eq("id", ebookId)
      .single();

    if (ebookError || !ebook) {
      throw new Error("eBook not found");
    }

    // Get the file - either from Supabase storage or Google Drive
    let fileBuffer: ArrayBuffer;

    if (ebook.drive_file_id) {
      // Fetch from Google Drive
      const googleApiKey = Deno.env.get("GOOGLE_API_KEY");
      if (!googleApiKey) {
        throw new Error("Google API key not configured");
      }

      const driveResponse = await fetch(
        `https://www.googleapis.com/drive/v3/files/${ebook.drive_file_id}?alt=media&key=${googleApiKey}`,
        {
          headers: {
            "Accept": "application/pdf",
          },
        }
      );

      if (!driveResponse.ok) {
        console.error("Drive error:", await driveResponse.text());
        throw new Error("Failed to fetch file from Google Drive");
      }

      fileBuffer = await driveResponse.arrayBuffer();
    } else if (ebook.file_url) {
      if (ebook.file_url.startsWith('http')) {
        const response = await fetch(ebook.file_url);
        if (!response.ok) {
          throw new Error("Failed to fetch file");
        }
        fileBuffer = await response.arrayBuffer();
      } else {
        const { data: fileData, error: fileError } = await supabaseClient
          .storage
          .from("ebook-files")
          .download(ebook.file_url);

        if (fileError || !fileData) {
          throw new Error("Failed to download file from storage");
        }
        fileBuffer = await fileData.arrayBuffer();
      }
    } else {
      throw new Error("No file available for this eBook");
    }

    // Note: For a true page-limited preview, you would need a PDF library
    // to extract specific pages. For simplicity, we return the full PDF
    // and let the frontend handle page restrictions.
    // In production, consider using a service like pdf-lib to extract pages.

    return new Response(fileBuffer, {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/pdf",
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch (error: any) {
    console.error("Preview error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
