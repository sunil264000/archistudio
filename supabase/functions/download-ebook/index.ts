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

    // Verify user is authenticated
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(
      authHeader.replace("Bearer ", "")
    );

    if (authError || !user) {
      throw new Error("Unauthorized");
    }

    const { ebookId } = await req.json();

    if (!ebookId) {
      throw new Error("eBook ID is required");
    }

    // Check if user has access to this ebook
    const { data: purchases, error: purchaseError } = await supabaseClient
      .from("ebook_purchases")
      .select("ebook_ids")
      .eq("user_id", user.id)
      .eq("status", "completed");

    if (purchaseError) {
      throw new Error("Failed to check purchase status");
    }

    // Check if the ebook is in any of the user's purchases
    const hasAccess = purchases?.some(purchase => 
      purchase.ebook_ids?.includes(ebookId)
    );

    if (!hasAccess) {
      throw new Error("You don't have access to this eBook");
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
    let fileName: string;

    if (ebook.drive_file_id) {
      // Fetch from Google Drive
      const googleApiKey = Deno.env.get("GOOGLE_API_KEY");
      if (!googleApiKey) {
        throw new Error("Google API key not configured");
      }

      // Use Google Drive API to download file
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
      fileName = `${ebook.title.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_')}.pdf`;
    } else if (ebook.file_url) {
      // Fetch from URL or Supabase storage
      if (ebook.file_url.startsWith('http')) {
        const driveUrlMatch = ebook.file_url.match(/\/d\/([a-zA-Z0-9_-]+)/) || ebook.file_url.match(/[?&]id=([a-zA-Z0-9_-]+)/);

        if (driveUrlMatch?.[1]) {
          const googleApiKey = Deno.env.get("GOOGLE_API_KEY");
          if (!googleApiKey) {
            throw new Error("Google API key not configured");
          }

          const driveResponse = await fetch(
            `https://www.googleapis.com/drive/v3/files/${driveUrlMatch[1]}?alt=media&key=${googleApiKey}`,
            {
              headers: {
                "Accept": "application/pdf",
              },
            }
          );

          if (!driveResponse.ok) {
            console.error("Drive URL fetch error:", await driveResponse.text());
            throw new Error("Failed to fetch file from Google Drive URL");
          }

          fileBuffer = await driveResponse.arrayBuffer();
        } else {
          const response = await fetch(ebook.file_url);
          if (!response.ok) {
            throw new Error("Failed to fetch file");
          }
          fileBuffer = await response.arrayBuffer();
        }
        // Supabase storage path
        const { data: fileData, error: fileError } = await supabaseClient
          .storage
          .from("ebook-files")
          .download(ebook.file_url);

        if (fileError || !fileData) {
          throw new Error("Failed to download file from storage");
        }
        fileBuffer = await fileData.arrayBuffer();
      }
      fileName = `${ebook.title.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_')}.pdf`;
    } else {
      throw new Error("No file available for this eBook");
    }

    // Return the file as a downloadable PDF
    return new Response(fileBuffer, {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Content-Length": fileBuffer.byteLength.toString(),
      },
    });
  } catch (error: any) {
    console.error("Download error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: error.message === "Unauthorized" ? 401 : 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
