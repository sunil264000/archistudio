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

    console.log(`Preview request for eBook: ${ebookId}`);

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
        console.log(`Serving cached preview for ${ebookId}`);
        
        // Fetch from cache and return with optimized headers
        const cachedResponse = await fetch(ebook.preview_url);
        if (cachedResponse.ok) {
          const fileBuffer = await cachedResponse.arrayBuffer();
          
          return new Response(fileBuffer, {
            status: 200,
            headers: {
              ...corsHeaders,
              "Content-Type": "application/pdf",
              "Cache-Control": "public, max-age=604800", // 7 days browser cache
              "Content-Disposition": "inline",
              "X-Content-Type-Options": "nosniff",
            },
          });
        }
        console.log("Cache fetch failed, fetching from source");
      }
    }

    // Fetch from source with optimized settings
    let fileBuffer: ArrayBuffer;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 45000); // 45s timeout (reduced)

    try {
      if (ebook.drive_file_id) {
        const googleApiKey = Deno.env.get("GOOGLE_API_KEY");
        if (!googleApiKey) {
          throw new Error("Google API key not configured");
        }

        console.log(`Fetching from Google Drive: ${ebook.drive_file_id}`);
        
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
        console.log(`Downloaded ${fileBuffer.byteLength} bytes from Drive`);
      } else if (ebook.file_url) {
        console.log(`Fetching from storage: ${ebook.file_url}`);
        
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
                signal: controller.signal,
              }
            );

            if (!driveResponse.ok) {
              const errorText = await driveResponse.text();
              console.error("Drive URL fetch error:", errorText);
              throw new Error("Failed to fetch file from Google Drive URL");
            }

            fileBuffer = await driveResponse.arrayBuffer();
          } else {
            const response = await fetch(ebook.file_url, {
              signal: controller.signal,
            });
            if (!response.ok) {
              throw new Error("Failed to fetch file");
            }
            fileBuffer = await response.arrayBuffer();
          }
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
        console.log(`Downloaded ${fileBuffer.byteLength} bytes from storage`);
      } else {
        throw new Error("No file available for this eBook");
      }
    } finally {
      clearTimeout(timeoutId);
    }

    // Cache the preview in storage (async, don't block response)
    const previewFileName = `preview-${ebookId}.pdf`;
    
    // Start caching in background
    (async () => {
      try {
        const { data, error } = await supabaseClient
          .storage
          .from("ebook-previews")
          .upload(previewFileName, new Blob([fileBuffer], { type: "application/pdf" }), {
            upsert: true,
            contentType: "application/pdf",
            cacheControl: "604800", // 7 days
          });
        
        if (!error && data) {
          const { data: urlData } = supabaseClient
            .storage
            .from("ebook-previews")
            .getPublicUrl(previewFileName);
          
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
      } catch (err) {
        console.error("Preview caching error:", err);
      }
    })();

    // Return the PDF immediately with optimized headers
    return new Response(fileBuffer, {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/pdf",
        "Cache-Control": "public, max-age=86400", // 24 hours
        "Content-Disposition": "inline",
        "X-Content-Type-Options": "nosniff",
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
