import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  FolderSync, 
  Loader2, 
  FileText, 
  Upload, 
  CheckCircle,
  RefreshCw,
  BookOpen
} from 'lucide-react';

interface ScannedFile {
  id: string;
  name: string;
  title: string;
  category: string;
  size?: string;
}

export function EbookDriveSync({ onSyncComplete }: { onSyncComplete?: () => void }) {
  const [folderUrl, setFolderUrl] = useState('');
  const [scanning, setScanning] = useState(false);
  const [importing, setImporting] = useState(false);
  const [scannedFiles, setScannedFiles] = useState<ScannedFile[]>([]);
  const { toast } = useToast();

  const handleScan = async () => {
    if (!folderUrl.trim()) {
      toast({ title: "Error", description: "Please enter a Google Drive folder URL", variant: "destructive" });
      return;
    }

    setScanning(true);
    setScannedFiles([]);

    try {
      const { data, error } = await supabase.functions.invoke('sync-ebooks-drive', {
        body: { folderUrl, action: 'scan' }
      });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Scan failed');

      setScannedFiles(data.files || []);
      toast({ 
        title: "Scan Complete", 
        description: `Found ${data.totalCount} PDF files` 
      });
    } catch (error: any) {
      console.error('Scan error:', error);
      toast({ 
        title: "Scan Failed", 
        description: error.message || "Failed to scan folder", 
        variant: "destructive" 
      });
    } finally {
      setScanning(false);
    }
  };

  const handleImport = async () => {
    if (!folderUrl.trim()) return;

    setImporting(true);

    try {
      const { data, error } = await supabase.functions.invoke('sync-ebooks-drive', {
        body: { folderUrl, action: 'import' }
      });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Import failed');

      toast({ 
        title: "Import Complete! 🎉", 
        description: `Imported ${data.imported} new eBooks, ${data.skipped} already existed` 
      });

      setScannedFiles([]);
      setFolderUrl('');
      onSyncComplete?.();
    } catch (error: any) {
      console.error('Import error:', error);
      toast({ 
        title: "Import Failed", 
        description: error.message || "Failed to import eBooks", 
        variant: "destructive" 
      });
    } finally {
      setImporting(false);
    }
  };

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FolderSync className="h-5 w-5 text-primary" />
          Google Drive Auto-Sync
        </CardTitle>
        <CardDescription>
          Automatically import eBooks from a Google Drive folder. PDFs will be detected and added to the library.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Google Drive Folder URL</Label>
          <div className="flex gap-2">
            <Input
              value={folderUrl}
              onChange={(e) => setFolderUrl(e.target.value)}
              placeholder="https://drive.google.com/drive/folders/..."
              className="flex-1"
            />
            <Button 
              onClick={handleScan} 
              disabled={scanning || !folderUrl.trim()}
              variant="outline"
            >
              {scanning ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              <span className="ml-2">Scan</span>
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Make sure the folder is shared publicly (Anyone with link → Viewer)
          </p>
        </div>

        {/* Scanned Files Preview */}
        {scannedFiles.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-medium flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                Found {scannedFiles.length} PDF Files
              </h4>
              <Button 
                onClick={handleImport} 
                disabled={importing}
                className="gap-2"
              >
                {importing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4" />
                )}
                Import All
              </Button>
            </div>

            <div className="max-h-64 overflow-y-auto space-y-2 rounded-lg border p-2 bg-background/50">
              {scannedFiles.map((file, idx) => (
                <div 
                  key={file.id}
                  className="flex items-center justify-between p-2 rounded-lg bg-card hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded bg-primary/10 flex items-center justify-center">
                      <FileText className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium truncate max-w-md">{file.title}</p>
                      <p className="text-xs text-muted-foreground">{file.category}</p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="text-xs">PDF</Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Success State */}
        {scannedFiles.length === 0 && folderUrl && !scanning && (
          <div className="text-center py-6 text-muted-foreground">
            <CheckCircle className="h-8 w-8 mx-auto mb-2 text-success" />
            <p className="text-sm">Ready to sync. Click "Scan" to detect PDFs.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}