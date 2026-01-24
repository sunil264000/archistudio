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

    // Get ebook details including cached preview URL
    const { data: ebook, error: ebookError } = await supabaseClient
      .from("ebooks")
      .select("title, file_url, drive_file_id, preview_url, preview_generated_at")
      .eq("id", ebookId)
      .single();

    if (ebookError || !ebook) {
      throw new Error("eBook not found");
    }

    // Check if we have a cached preview that's less than 7 days old
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    if (ebook.preview_url && ebook.preview_generated_at) {
      const generatedAt = new Date(ebook.preview_generated_at);
      if (generatedAt > sevenDaysAgo) {
        // Redirect to cached preview URL for fast loading
        console.log(`Serving cached preview for ${ebookId}`);
        
        // Fetch from cache and return
        const cachedResponse = await fetch(ebook.preview_url);
        if (cachedResponse.ok) {
          const fileBuffer = await cachedResponse.arrayBuffer();
          return new Response(fileBuffer, {
            status: 200,
            headers: {
              ...corsHeaders,
              "Content-Type": "application/pdf",
              "Cache-Control": "public, max-age=86400", // 24 hours browser cache
              "Content-Disposition": "inline",
            },
          });
        }
        // If cache fetch failed, continue to fetch from source
        console.log("Cache fetch failed, fetching from source");
      }
    }

    // Fetch from source
    let fileBuffer: ArrayBuffer;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 60s timeout

    try {
      if (ebook.drive_file_id) {
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
            signal: controller.signal,
          }
        );

        if (!driveResponse.ok) {
          const errorText = await driveResponse.text();
          console.error("Drive error:", errorText);
          throw new Error("Failed to fetch file from Google Drive");
        }

        fileBuffer = await driveResponse.arrayBuffer();
      } else if (ebook.file_url) {
        if (ebook.file_url.startsWith('http')) {
          const response = await fetch(ebook.file_url, {
            signal: controller.signal,
          });
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
    } finally {
      clearTimeout(timeoutId);
    }

    // Cache the preview in storage (async, don't wait)
    const previewFileName = `preview-${ebookId}.pdf`;
    supabaseClient
      .storage
      .from("ebook-previews")
      .upload(previewFileName, new Blob([fileBuffer], { type: "application/pdf" }), {
        upsert: true,
        contentType: "application/pdf",
      })
      .then(async ({ data, error }) => {
        if (!error && data) {
          const { data: urlData } = supabaseClient
            .storage
            .from("ebook-previews")
            .getPublicUrl(previewFileName);
          
          // Update ebook with cached preview URL
          await supabaseClient
            .from("ebooks")
            .update({
              preview_url: urlData.publicUrl,
              preview_generated_at: new Date().toISOString(),
            })
            .eq("id", ebookId);
          
          console.log(`Cached preview for ${ebookId}: ${urlData.publicUrl}`);
        } else if (error) {
          console.error("Failed to cache preview:", error);
        }
      })
      .catch((err) => console.error("Preview caching error:", err));

    // Return the PDF immediately
    return new Response(fileBuffer, {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/pdf",
        "Cache-Control": "public, max-age=7200", // 2 hours
        "Content-Disposition": "inline",
      },
    });
  } catch (error: any) {
    console.error("Preview error:", error);
    
    if (error.name === 'AbortError') {
      return new Response(
        JSON.stringify({ error: "Request timeout - please try again" }),
        {
          status: 504,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
    
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
