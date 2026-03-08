import { useState } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { useSheetReviews } from '@/hooks/useSheetReviews';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Link } from 'react-router-dom';
import { Plus, MessageSquare, Star, Upload, Loader2, Image as ImageIcon } from 'lucide-react';
import { SEOHead } from '@/components/seo/SEOHead';

const TAGS = ['Concept', 'Presentation', 'Portfolio', 'Thesis', 'Competition', 'Interior', 'Urban Design'];

export default function SheetReviews() {
  const { sheets, loading, uploadSheet, fetchSheets } = useSheetReviews();
  const { user } = useAuth();
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [showFeatured, setShowFeatured] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);

  const filtered = sheets.filter(s => {
    if (showFeatured && !s.is_featured) return false;
    if (activeTag && !s.tags.includes(activeTag)) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Sheet Reviews — Archistudio"
        description="Upload your architecture presentation sheets and get critiques from the community."
        url="https://archistudio.shop/sheets"
      />
      <Navbar />

      <main className="pt-24 pb-16">
        <div className="container-wide">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl md:text-4xl font-display font-bold">Sheet Reviews</h1>
              <p className="text-muted-foreground mt-1">Upload sheets. Get real critiques. Improve faster.</p>
            </div>
            {user ? (
              <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-2 bg-accent text-accent-foreground hover:bg-accent/90">
                    <Plus className="h-4 w-4" /> Upload Sheet
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-lg">
                  <DialogHeader>
                    <DialogTitle>Upload a Presentation Sheet</DialogTitle>
                  </DialogHeader>
                  <UploadForm
                    onSubmit={async (file, title, desc, tags) => {
                      const result = await uploadSheet(file, title, desc, tags);
                      if (result) { setUploadOpen(false); fetchSheets(); }
                    }}
                  />
                </DialogContent>
              </Dialog>
            ) : (
              <Link to="/auth?mode=signup">
                <Button className="gap-2 bg-accent text-accent-foreground hover:bg-accent/90">
                  <Plus className="h-4 w-4" /> Sign Up to Upload
                </Button>
              </Link>
            )}
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-2 mb-8">
            <Button
              variant={!showFeatured && !activeTag ? 'default' : 'outline'}
              size="sm"
              onClick={() => { setShowFeatured(false); setActiveTag(null); }}
            >
              All
            </Button>
            <Button
              variant={showFeatured ? 'default' : 'outline'}
              size="sm"
              onClick={() => { setShowFeatured(!showFeatured); setActiveTag(null); }}
              className="gap-1"
            >
              <Star className="h-3 w-3" /> Featured
            </Button>
            {TAGS.map(tag => (
              <Button
                key={tag}
                variant={activeTag === tag ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveTag(activeTag === tag ? null : tag)}
              >
                {tag}
              </Button>
            ))}
          </div>

          {/* Grid */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20">
              <ImageIcon className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
              <p className="text-muted-foreground">No sheets yet. Be the first to upload!</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map(sheet => (
                <Link key={sheet.id} to={`/sheets/${sheet.id}`} className="group">
                  <div className="rounded-xl border border-border/40 bg-card overflow-hidden hover:border-accent/40 transition-all duration-300 hover:shadow-lg">
                    {/* Thumbnail */}
                    <div className="aspect-[4/3] bg-muted relative overflow-hidden">
                      {sheet.thumbnail_url ? (
                        <img
                          src={sheet.thumbnail_url}
                          alt={sheet.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ImageIcon className="h-12 w-12 text-muted-foreground/30" />
                        </div>
                      )}
                      {sheet.is_featured && (
                        <Badge className="absolute top-3 left-3 bg-accent text-accent-foreground">
                          <Star className="h-3 w-3 mr-1" /> Featured
                        </Badge>
                      )}
                      <Badge
                        variant={sheet.status === 'open' ? 'default' : 'secondary'}
                        className="absolute top-3 right-3"
                      >
                        {sheet.status === 'open' ? 'Open for Critique' : 'Resolved'}
                      </Badge>
                    </div>

                    {/* Info */}
                    <div className="p-4 space-y-2">
                      <h3 className="font-semibold text-foreground line-clamp-1 group-hover:text-accent transition-colors">
                        {sheet.title}
                      </h3>
                      {sheet.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">{sheet.description}</p>
                      )}
                      <div className="flex items-center justify-between pt-2">
                        <span className="text-xs text-muted-foreground">{sheet.author_name}</span>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <MessageSquare className="h-3 w-3" />
                          {sheet.critique_count}
                        </div>
                      </div>
                      {sheet.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 pt-1">
                          {sheet.tags.slice(0, 3).map(tag => (
                            <Badge key={tag} variant="outline" className="text-[10px] px-1.5 py-0">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}

function UploadForm({ onSubmit }: { onSubmit: (file: File, title: string, desc: string, tags: string[]) => Promise<void> }) {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      setFile(f);
      if (f.type.startsWith('image/')) {
        setPreview(URL.createObjectURL(f));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !title.trim()) return;
    setSubmitting(true);
    await onSubmit(file, title.trim(), desc.trim(), tags);
    setSubmitting(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* File upload */}
      <div>
        <label className="block text-sm font-medium mb-1.5">Sheet Image / PDF</label>
        <div className="border-2 border-dashed border-border/60 rounded-lg p-4 text-center hover:border-accent/40 transition-colors cursor-pointer relative">
          <input
            type="file"
            accept="image/*,.pdf"
            onChange={handleFile}
            className="absolute inset-0 opacity-0 cursor-pointer"
          />
          {preview ? (
            <img src={preview} alt="Preview" className="max-h-40 mx-auto rounded" />
          ) : (
            <div className="py-4">
              <Upload className="h-8 w-8 text-muted-foreground/50 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Drop your sheet or click to browse</p>
              <p className="text-xs text-muted-foreground/60 mt-1">JPG, PNG, or PDF up to 20MB</p>
            </div>
          )}
        </div>
        {file && <p className="text-xs text-muted-foreground mt-1">{file.name}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium mb-1.5">Title</label>
        <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Cultural Centre - Final Sheet" required />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1.5">Description (optional)</label>
        <Textarea value={desc} onChange={e => setDesc(e.target.value)} placeholder="What kind of feedback are you looking for?" rows={3} />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1.5">Tags</label>
        <div className="flex flex-wrap gap-1.5">
          {TAGS.map(tag => (
            <Button
              key={tag}
              type="button"
              variant={tags.includes(tag) ? 'default' : 'outline'}
              size="sm"
              className="text-xs h-7"
              onClick={() => setTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag])}
            >
              {tag}
            </Button>
          ))}
        </div>
      </div>

      <Button type="submit" className="w-full gap-2" disabled={!file || !title.trim() || submitting}>
        {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
        {submitting ? 'Uploading...' : 'Upload & Request Critique'}
      </Button>
    </form>
  );
}
