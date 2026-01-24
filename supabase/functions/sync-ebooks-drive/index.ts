import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  webViewLink?: string;
  webContentLink?: string;
}

interface DriveListResponse {
  files: DriveFile[];
  nextPageToken?: string;
}

// PDF MIME types
const PDF_MIMETYPES = ['application/pdf'];
const PDF_EXTENSIONS = ['.pdf'];

function isPdfFile(file: DriveFile): boolean {
  if (PDF_MIMETYPES.includes(file.mimeType)) return true;
  const lowerName = file.name.toLowerCase();
  return PDF_EXTENSIONS.some(ext => lowerName.endsWith(ext));
}

// Extract folder ID from various Google Drive URL formats
function extractFolderId(input: string): string | null {
  if (!input.includes('/') && !input.includes('?')) {
    return input;
  }
  
  const patterns = [
    /\/folders\/([a-zA-Z0-9_-]+)/,
    /id=([a-zA-Z0-9_-]+)/,
    /\/d\/([a-zA-Z0-9_-]+)/,
  ];
  
  for (const pattern of patterns) {
    const match = input.match(pattern);
    if (match) return match[1];
  }
  
  return null;
}

// Scan Google Drive folder for PDF files
async function scanFolderForPdfs(folderId: string, apiKey: string): Promise<DriveFile[]> {
  const allFiles: DriveFile[] = [];
  let pageToken: string | undefined;
  
  do {
    const url = new URL('https://www.googleapis.com/drive/v3/files');
    url.searchParams.set('q', `'${folderId}' in parents and trashed=false`);
    url.searchParams.set('fields', 'nextPageToken,files(id,name,mimeType,size,webViewLink,webContentLink)');
    url.searchParams.set('pageSize', '1000');
    url.searchParams.set('key', apiKey);
    if (pageToken) url.searchParams.set('pageToken', pageToken);
    
    const response = await fetch(url.toString());
    if (!response.ok) {
      const error = await response.text();
      console.error('Drive API error:', error);
      throw new Error(`Drive API error: ${response.status}`);
    }
    
    const data: DriveListResponse = await response.json();
    
    // Filter for PDFs only
    const pdfFiles = data.files.filter(isPdfFile);
    allFiles.push(...pdfFiles);
    
    // Also check subfolders
    const subfolders = data.files.filter(f => f.mimeType === 'application/vnd.google-apps.folder');
    for (const subfolder of subfolders) {
      const subFiles = await scanFolderForPdfs(subfolder.id, apiKey);
      allFiles.push(...subFiles);
    }
    
    pageToken = data.nextPageToken;
  } while (pageToken);
  
  return allFiles;
}

// Clean and optimize book title from filename
function cleanBookTitle(filename: string): string {
  let title = filename
    .replace(/\.pdf$/i, '')
    // Remove common prefixes/suffixes
    .replace(/^[\d\s._-]+/, '') // Leading numbers
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  
  // Capitalize properly (Title Case)
  title = title.split(' ').map(word => {
    if (word.length <= 2 && !['3d', '2d', 'bim', 'cad'].includes(word.toLowerCase())) {
      return word.toLowerCase();
    }
    // Keep acronyms uppercase
    if (word.toUpperCase() === word && word.length <= 4) {
      return word;
    }
    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
  }).join(' ');
  
  // Fix common architecture terms
  const termFixes: Record<string, string> = {
    'neufert': 'Neufert',
    'autocad': 'AutoCAD',
    'revit': 'Revit',
    '3ds max': '3ds Max',
    'sketchup': 'SketchUp',
    'vray': 'V-Ray',
    'corona': 'Corona',
    'photoshop': 'Photoshop',
    'illustrator': 'Illustrator',
    'archicad': 'ArchiCAD',
    'rhino': 'Rhino',
    'grasshopper': 'Grasshopper',
    'lumion': 'Lumion',
    'enscape': 'Enscape',
    'twinmotion': 'Twinmotion',
    'bim': 'BIM',
    'cad': 'CAD',
    'pdf': '',
    'ebook': '',
    'e-book': '',
  };
  
  for (const [find, replace] of Object.entries(termFixes)) {
    const regex = new RegExp(`\\b${find}\\b`, 'gi');
    title = title.replace(regex, replace);
  }
  
  // Clean up any double spaces or trailing content
  title = title.replace(/\s+/g, ' ').trim();
  
  // Remove empty brackets/parentheses
  title = title.replace(/\(\s*\)/g, '').replace(/\[\s*\]/g, '').trim();
  
  return title || filename.replace(/\.pdf$/i, '');
}

// Generate Google Drive direct download/view URL
function getDriveFileUrl(fileId: string): string {
  // Use the export/view link that works for public files
  return `https://drive.google.com/file/d/${fileId}/view`;
}

// Detect category from folder name or file name
function detectCategory(name: string, folderName?: string): string {
  const text = `${name} ${folderName || ''}`.toLowerCase();
  
  if (text.includes('fundamental') || text.includes('basic') || text.includes('intro')) {
    return 'Fundamentals of Design';
  }
  if (text.includes('construction') || text.includes('detail') || text.includes('build')) {
    return 'Construction & Detailing';
  }
  if (text.includes('draw') || text.includes('sketch') || text.includes('represent')) {
    return 'Drawing & Representation';
  }
  if (text.includes('interior') || text.includes('special') || text.includes('furniture')) {
    return 'Specialized Buildings & Interiors';
  }
  if (text.includes('sustain') || text.includes('green') || text.includes('eco')) {
    return 'Sustainable Design';
  }
  if (text.includes('history') || text.includes('reference') || text.includes('classic')) {
    return 'History & Reference';
  }
  
  return 'Fundamentals of Design'; // Default
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { folderUrl, action } = await req.json();
    const GOOGLE_API_KEY = Deno.env.get("GOOGLE_API_KEY");
    
    if (!GOOGLE_API_KEY) {
      return new Response(JSON.stringify({ success: false, error: "Google API key not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const folderId = extractFolderId(folderUrl);
    if (!folderId) {
      return new Response(JSON.stringify({ success: false, error: "Invalid folder URL" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Scanning folder: ${folderId} for PDFs...`);
    
    // Scan for all PDF files
    const pdfFiles = await scanFolderForPdfs(folderId, GOOGLE_API_KEY);
    console.log(`Found ${pdfFiles.length} PDF files`);

    if (action === 'scan') {
      // Just return the scanned structure
      return new Response(JSON.stringify({ 
        success: true, 
        files: pdfFiles.map(f => ({
          id: f.id,
          name: f.name,
          title: cleanBookTitle(f.name),
          size: f.size,
          category: detectCategory(f.name),
        })),
        totalCount: pdfFiles.length,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === 'import') {
      // Import to database
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const supabase = createClient(supabaseUrl, supabaseKey);

      let imported = 0;
      let skipped = 0;
      let updated = 0;

      for (const file of pdfFiles) {
        const title = cleanBookTitle(file.name);
        const driveViewUrl = getDriveFileUrl(file.id);
        
        // Check if ebook with same drive_file_id exists
        const { data: existingById } = await supabase
          .from('ebooks')
          .select('id')
          .eq('drive_file_id', file.id)
          .limit(1);

        if (existingById && existingById.length > 0) {
          // Update existing with latest info and file URL
          await supabase
            .from('ebooks')
            .update({ 
              title, // Update with optimized title
              drive_folder_url: folderUrl,
              file_url: driveViewUrl, // Auto-link the Drive file
              updated_at: new Date().toISOString(),
            })
            .eq('id', existingById[0].id);
          updated++;
        } else {
          // Check by similar title
          const { data: existingByTitle } = await supabase
            .from('ebooks')
            .select('id')
            .ilike('title', `%${title.slice(0, 20)}%`)
            .limit(1);
          
          if (existingByTitle && existingByTitle.length > 0) {
            // Update existing
            await supabase
              .from('ebooks')
              .update({ 
                title,
                drive_file_id: file.id,
                drive_folder_url: folderUrl,
                file_url: driveViewUrl,
                updated_at: new Date().toISOString(),
              })
              .eq('id', existingByTitle[0].id);
            updated++;
          } else {
            // Create new ebook with auto-linked Drive URL
            const { error } = await supabase
              .from('ebooks')
              .insert({
                title,
                category: detectCategory(file.name),
                drive_file_id: file.id,
                drive_folder_url: folderUrl,
                file_url: driveViewUrl, // Auto-link Drive file
                price_single: 50,
                is_published: true,
                order_index: imported,
              });

            if (!error) imported++;
          }
        }
      }

      return new Response(JSON.stringify({ 
        success: true, 
        imported,
        updated,
        skipped: pdfFiles.length - imported - updated,
        totalScanned: pdfFiles.length,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: false, error: "Invalid action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: unknown) {
    console.error("Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ success: false, error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});