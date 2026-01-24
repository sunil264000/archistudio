import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { FolderOpen, Video, FileText, Upload, Loader2, Check, AlertCircle } from "lucide-react";

interface DriveStructure {
  folders: Array<{
    id: string;
    name: string;
    type: string;
    videos?: Array<{ id: string; name: string; embedUrl: string }>;
    resources?: Array<{ id: string; name: string; downloadUrl: string }>;
    folders?: DriveStructure["folders"];
  }>;
  videos?: Array<{ id: string; name: string; embedUrl: string }>;
  resources?: Array<{ id: string; name: string; downloadUrl: string }>;
}

interface GoogleDriveImportProps {
  courseId: string;
  courseName: string;
  onImportComplete: () => void;
}

export function GoogleDriveImport({ courseId, courseName, onImportComplete }: GoogleDriveImportProps) {
  const [folderUrl, setFolderUrl] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [structure, setStructure] = useState<DriveStructure | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleScan = async () => {
    if (!folderUrl.trim()) {
      toast.error("Please enter a Google Drive folder URL or ID");
      return;
    }

    setIsScanning(true);
    setError(null);
    setStructure(null);

    try {
      // Ultra-deep scan up to 12 levels of subfolders for complete content discovery
      const { data, error } = await supabase.functions.invoke("scan-google-drive", {
        body: { folderId: folderUrl, action: "scan", maxDepth: 12 },
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error);

      setStructure(data.structure);
      
      const totalFolders = data.structure.folders?.length || 0;
      const totalVideos = countVideos(data.structure);
      
      toast.success(`Found ${totalFolders} modules and ${totalVideos} videos`);
    } catch (err: any) {
      console.error("Scan error:", err);
      setError(err.message || "Failed to scan folder");
      toast.error(err.message || "Failed to scan folder");
    } finally {
      setIsScanning(false);
    }
  };

  const handleImport = async () => {
    if (!structure) return;

    setIsImporting(true);

    try {
      // Import with ultra-deep scanning (12 levels) for nested subfolder structures
      const { data, error } = await supabase.functions.invoke("scan-google-drive", {
        body: { folderId: folderUrl, courseId, action: "import", maxDepth: 12 },
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error);

      toast.success(`Successfully imported ${data.modulesCreated} modules and ${data.lessonsCreated} lessons!`);
      setStructure(null);
      setFolderUrl("");
      onImportComplete();
    } catch (err: any) {
      console.error("Import error:", err);
      toast.error(err.message || "Failed to import content");
    } finally {
      setIsImporting(false);
    }
  };

  const countVideos = (struct: DriveStructure): number => {
    let count = struct.videos?.length || 0;
    for (const folder of struct.folders || []) {
      count += folder.videos?.length || 0;
      if (folder.folders) {
        count += countVideos({ folders: folder.folders });
      }
    }
    return count;
  };

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FolderOpen className="h-5 w-5" />
          Import from Google Drive
        </CardTitle>
        <CardDescription>
          Paste your Google Drive folder link and we'll automatically create modules and lessons from your folder structure.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="folderUrl">Google Drive Folder URL or ID</Label>
          <div className="flex gap-2">
            <Input
              id="folderUrl"
              placeholder="https://drive.google.com/drive/folders/... or folder ID"
              value={folderUrl}
              onChange={(e) => setFolderUrl(e.target.value)}
              disabled={isScanning || isImporting}
            />
            <Button onClick={handleScan} disabled={isScanning || isImporting}>
              {isScanning ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Scanning...
                </>
              ) : (
                "Scan Folder"
              )}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Make sure the folder is set to "Anyone with the link can view"
          </p>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive rounded-md">
            <AlertCircle className="h-4 w-4" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        {structure && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Preview Structure</h4>
              <div className="flex gap-2">
                <Badge variant="secondary">
                  {structure.folders?.length || 0} modules
                </Badge>
                <Badge variant="secondary">
                  {countVideos(structure)} videos
                </Badge>
              </div>
            </div>

            <div className="max-h-[400px] overflow-y-auto border rounded-md p-2">
              <Accordion type="multiple" className="w-full">
                {structure.folders?.map((folder, idx) => (
                  <AccordionItem key={folder.id} value={folder.id}>
                    <AccordionTrigger className="text-sm">
                      <div className="flex items-center gap-2">
                        <FolderOpen className="h-4 w-4 text-primary" />
                        <span>{folder.name}</span>
                        <Badge variant="outline" className="ml-2">
                          {folder.videos?.length || 0} videos
                        </Badge>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-1 pl-6">
                        {folder.videos?.map((video) => (
                          <div key={video.id} className="flex items-center gap-2 text-sm text-muted-foreground py-1">
                            <Video className="h-3 w-3" />
                            <span>{video.name}</span>
                          </div>
                        ))}
                        {folder.resources?.map((resource) => (
                          <div key={resource.id} className="flex items-center gap-2 text-sm text-muted-foreground py-1">
                            <FileText className="h-3 w-3" />
                            <span>{resource.name}</span>
                          </div>
                        ))}
                        {folder.folders?.map((subFolder) => (
                          <div key={subFolder.id} className="pl-2 border-l">
                            <div className="flex items-center gap-2 text-sm py-1">
                              <FolderOpen className="h-3 w-3 text-primary" />
                              <span>{subFolder.name}</span>
                            </div>
                            {subFolder.videos?.map((video) => (
                              <div key={video.id} className="flex items-center gap-2 text-sm text-muted-foreground py-1 pl-4">
                                <Video className="h-3 w-3" />
                                <span>{video.name}</span>
                              </div>
                            ))}
                          </div>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>

              {structure.videos && structure.videos.length > 0 && (
                <div className="mt-2 p-2 bg-muted/50 rounded">
                  <p className="text-sm font-medium mb-2">Root Videos (will create "Course Content" module)</p>
                  {structure.videos.map((video) => (
                    <div key={video.id} className="flex items-center gap-2 text-sm text-muted-foreground py-1">
                      <Video className="h-3 w-3" />
                      <span>{video.name}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setStructure(null)}>
                Cancel
              </Button>
              <Button onClick={handleImport} disabled={isImporting}>
                {isImporting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Import to "{courseName}"
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
