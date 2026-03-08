import { useState, useRef } from 'react';
import { StudioProjectFile } from '@/hooks/useStudioProjects';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Upload, Trash2, Image, FileText, File, Download } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface StudioFilesTabProps {
  files: StudioProjectFile[];
  onUpload: (file: File, category: string) => Promise<any>;
  onDelete: (fileId: string) => void;
}

const categories = [
  { value: 'sketch', label: 'Sketch' },
  { value: 'plan', label: 'Plan' },
  { value: 'reference', label: 'Reference' },
  { value: 'inspiration', label: 'Inspiration' },
  { value: 'render', label: 'Render' },
  { value: 'drawing', label: 'Drawing' },
  { value: 'other', label: 'Other' },
];

const categoryColors: Record<string, string> = {
  sketch: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  plan: 'bg-green-500/10 text-green-600 border-green-500/20',
  reference: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
  inspiration: 'bg-pink-500/10 text-pink-600 border-pink-500/20',
  render: 'bg-accent/10 text-accent border-accent/20',
  drawing: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
  other: 'bg-muted text-muted-foreground border-border',
};

export function StudioFilesTab({ files, onUpload, onDelete }: StudioFilesTabProps) {
  const [category, setCategory] = useState('reference');
  const [uploading, setUploading] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList?.length) return;
    setUploading(true);
    for (let i = 0; i < fileList.length; i++) {
      await onUpload(fileList[i], category);
    }
    setUploading(false);
    if (inputRef.current) inputRef.current.value = '';
  };

  const filteredFiles = filterCategory === 'all' ? files : files.filter(f => f.category === filterCategory);
  const isImage = (type: string | null) => type?.startsWith('image/');

  const FileIcon = ({ type }: { type: string | null }) => {
    if (isImage(type)) return <Image className="h-4 w-4" />;
    if (type?.includes('pdf')) return <FileText className="h-4 w-4" />;
    return <File className="h-4 w-4" />;
  };

  return (
    <div className="space-y-4">
      {/* Upload Controls */}
      <div className="flex flex-wrap gap-3 items-center">
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            {categories.map(c => (
              <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <input
          ref={inputRef}
          type="file"
          multiple
          accept="image/*,.pdf,.dwg,.dxf,.skp,.3dm,.rvt"
          className="hidden"
          onChange={handleUpload}
        />
        <Button
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="gap-2 bg-accent text-accent-foreground hover:bg-accent/90"
        >
          <Upload className="h-4 w-4" />
          {uploading ? 'Uploading...' : 'Upload Files'}
        </Button>

        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-32 ml-auto">
            <SelectValue placeholder="Filter" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Files</SelectItem>
            {categories.map(c => (
              <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* File Grid */}
      {filteredFiles.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Upload className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>No files uploaded yet. Start adding your sketches and references.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {filteredFiles.map(file => (
            <Card key={file.id} className="overflow-hidden group">
              {isImage(file.file_type) ? (
                <div className="aspect-square overflow-hidden">
                  <img
                    src={file.file_url}
                    alt={file.file_name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                </div>
              ) : (
                <div className="aspect-square flex items-center justify-center bg-muted/50">
                  <FileIcon type={file.file_type} />
                  <span className="text-xs text-muted-foreground ml-1 truncate max-w-[80%]">{file.file_name}</span>
                </div>
              )}
              <div className="p-2 space-y-1">
                <p className="text-xs font-medium truncate">{file.file_name}</p>
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className={`text-[10px] ${categoryColors[file.category] || ''}`}>
                    {file.category}
                  </Badge>
                  <div className="flex gap-0.5">
                    <a href={file.file_url} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}>
                      <Button variant="ghost" size="icon" className="h-6 w-6">
                        <Download className="h-3 w-3" />
                      </Button>
                    </a>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 hover:text-destructive"
                      onClick={() => { if (confirm('Delete this file?')) onDelete(file.id); }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
