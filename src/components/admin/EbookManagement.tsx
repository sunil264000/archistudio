import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { EbookDriveSync } from './EbookDriveSync';
import { CourseEbookLinking } from './CourseEbookLinking';
import { 
  Plus, Edit2, Trash2, Upload, BookOpen, Save, Loader2, CheckCircle, AlertCircle, 
  ExternalLink, FolderSync, Link2, Trash, AlertTriangle, Search, Image, Eye, EyeOff,
  Library, FileText, ImagePlus
} from 'lucide-react';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface Ebook {
  id: string;
  title: string;
  description: string | null;
  category: string;
  file_url: string | null;
  cover_image_url: string | null;
  price_single: number;
  order_index: number;
  is_published: boolean;
}

const CATEGORIES = [
  'Fundamentals of Design',
  'Construction & Detailing',
  'Drawing & Representation',
  'Specialized Buildings & Interiors',
  'Sustainable Design',
  'History & Reference',
];

const CATEGORY_COLORS: Record<string, { bg: string; text: string; border: string; icon: string }> = {
  'Fundamentals of Design': { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20', icon: 'from-blue-500/20 to-blue-600/5' },
  'Construction & Detailing': { bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-500/20', icon: 'from-orange-500/20 to-orange-600/5' },
  'Drawing & Representation': { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/20', icon: 'from-purple-500/20 to-purple-600/5' },
  'Specialized Buildings & Interiors': { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20', icon: 'from-emerald-500/20 to-emerald-600/5' },
  'Sustainable Design': { bg: 'bg-green-500/10', text: 'text-green-400', border: 'border-green-500/20', icon: 'from-green-500/20 to-green-600/5' },
  'History & Reference': { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20', icon: 'from-amber-500/20 to-amber-600/5' },
};

export function EbookManagement() {
  const [ebooks, setEbooks] = useState<Ebook[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBook, setEditingBook] = useState<Ebook | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deletingAll, setDeletingAll] = useState(false);
  const [showImages, setShowImages] = useState(() => {
    const saved = localStorage.getItem('admin-ebook-show-covers');
    return saved !== null ? saved === 'true' : true;
  });
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [savingThumbnail, setSavingThumbnail] = useState<string | null>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: CATEGORIES[0],
    price_single: 50,
    is_published: true,
    cover_image_url: '',
  });

  useEffect(() => { fetchEbooks(); }, []);

  const fetchEbooks = async () => {
    setLoading(true);
    const { data } = await supabase.from('ebooks').select('*').order('category').order('order_index');
    if (data) setEbooks(data);
    setLoading(false);
  };

  const resetForm = () => {
    setFormData({ title: '', description: '', category: CATEGORIES[0], price_single: 50, is_published: true, cover_image_url: '' });
    setEditingBook(null);
  };

  const openEditDialog = (ebook: Ebook) => {
    setEditingBook(ebook);
    setFormData({
      title: ebook.title,
      description: ebook.description || '',
      category: ebook.category,
      price_single: ebook.price_single,
      is_published: ebook.is_published,
      cover_image_url: ebook.cover_image_url || '',
    });
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.title.trim()) {
      toast({ title: "Error", description: "Title is required", variant: "destructive" });
      return;
    }
    setSaving(true);
    
    const payload = {
      title: formData.title,
      description: formData.description,
      category: formData.category,
      price_single: formData.price_single,
      is_published: formData.is_published,
      cover_image_url: formData.cover_image_url || null,
      updated_at: new Date().toISOString(),
    };

    if (editingBook) {
      const { error } = await supabase.from('ebooks').update(payload).eq('id', editingBook.id);
      if (error) {
        toast({ title: "Error", description: "Failed to update eBook", variant: "destructive" });
      } else {
        toast({ title: "Success", description: "eBook updated successfully" });
        setDialogOpen(false); resetForm(); fetchEbooks();
      }
    } else {
      const maxOrder = ebooks.length > 0 ? Math.max(...ebooks.map(e => e.order_index)) : 0;
      const { error } = await supabase.from('ebooks').insert({ ...payload, order_index: maxOrder + 1 });
      if (error) {
        toast({ title: "Error", description: "Failed to create eBook", variant: "destructive" });
      } else {
        toast({ title: "Success", description: "eBook created successfully" });
        setDialogOpen(false); resetForm(); fetchEbooks();
      }
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this eBook?')) return;
    const { error } = await supabase.from('ebooks').delete().eq('id', id);
    if (error) {
      toast({ title: "Error", description: "Failed to delete eBook", variant: "destructive" });
    } else {
      toast({ title: "Deleted", description: "eBook removed successfully" });
      fetchEbooks();
    }
  };

  const handleDeleteAll = async () => {
    setDeletingAll(true);
    try {
      const { error } = await supabase.from('ebooks').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      if (error) throw error;
      toast({ title: "All Deleted", description: `Successfully deleted ${ebooks.length} eBooks` });
      fetchEbooks();
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to delete all eBooks", variant: "destructive" });
    } finally { setDeletingAll(false); }
  };

  const handleFileUpload = async (ebookId: string, file: File) => {
    if (!file.type.includes('pdf')) {
      toast({ title: "Error", description: "Only PDF files are allowed", variant: "destructive" });
      return;
    }
    setUploading(true);
    const fileName = `${ebookId}/${file.name}`;
    const { error: uploadError } = await supabase.storage.from('ebook-files').upload(fileName, file, { upsert: true });
    if (uploadError) {
      toast({ title: "Upload Failed", description: uploadError.message, variant: "destructive" });
      setUploading(false);
      return;
    }
    const { data: urlData } = supabase.storage.from('ebook-files').getPublicUrl(fileName);
    const { error: updateError } = await supabase.from('ebooks').update({ file_url: urlData.publicUrl }).eq('id', ebookId);
    if (updateError) {
      toast({ title: "Error", description: "Failed to link file", variant: "destructive" });
    } else {
      toast({ title: "Uploaded!", description: "PDF file uploaded successfully" });
      fetchEbooks();
    }
    setUploading(false);
  };

  const handleSaveThumbnail = async (ebookId: string, url: string) => {
    const isRemoving = !url.trim();
    setSavingThumbnail(ebookId);
    const { error } = await supabase.from('ebooks').update({ cover_image_url: isRemoving ? null : url.trim(), updated_at: new Date().toISOString() }).eq('id', ebookId);
    if (error) {
      toast({ title: "Error", description: isRemoving ? "Failed to remove cover" : "Failed to save thumbnail", variant: "destructive" });
    } else {
      toast({ title: isRemoving ? "Cover Removed" : "Thumbnail Saved", description: isRemoving ? "Cover image removed" : "Cover image updated successfully" });
      setThumbnailUrl('');
      fetchEbooks();
    }
    setSavingThumbnail(null);
  };

  const togglePublished = async (id: string, currentState: boolean) => {
    const { error } = await supabase.from('ebooks').update({ is_published: !currentState, updated_at: new Date().toISOString() }).eq('id', id);
    if (!error) {
      toast({ title: !currentState ? "eBook Visible" : "eBook Hidden", description: "Visibility updated and auto-saved." });
      fetchEbooks();
    } else {
      toast({ title: "Error", description: "Failed to update visibility.", variant: "destructive" });
    }
  };

  const filteredEbooks = searchQuery.trim()
    ? ebooks.filter(e => e.title.toLowerCase().includes(searchQuery.toLowerCase()) || e.category.toLowerCase().includes(searchQuery.toLowerCase()) || (e.description && e.description.toLowerCase().includes(searchQuery.toLowerCase())))
    : ebooks;

  const ebooksByCategory = filteredEbooks.reduce((acc, ebook) => {
    if (!acc[ebook.category]) acc[ebook.category] = [];
    acc[ebook.category].push(ebook);
    return acc;
  }, {} as Record<string, Ebook[]>);

  const totalPublished = ebooks.filter(e => e.is_published).length;
  const totalWithPdf = ebooks.filter(e => e.file_url).length;
  const totalWithCover = ebooks.filter(e => e.cover_image_url).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading library...</p>
        </div>
      </div>
    );
  }

  return (
    <Tabs defaultValue="library" className="space-y-6">
      <TabsList className="grid w-full grid-cols-3 h-12">
        <TabsTrigger value="library" className="gap-2 text-sm font-medium">
          <Library className="h-4 w-4" />
          Library
        </TabsTrigger>
        <TabsTrigger value="sync" className="gap-2 text-sm font-medium">
          <FolderSync className="h-4 w-4" />
          Drive Sync
        </TabsTrigger>
        <TabsTrigger value="linking" className="gap-2 text-sm font-medium">
          <Link2 className="h-4 w-4" />
          Course Linking
        </TabsTrigger>
      </TabsList>
      
      <TabsContent value="library">
        <div className="space-y-6">
          {/* Stats Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Total Books', value: ebooks.length, icon: BookOpen, color: 'text-primary' },
              { label: 'Published', value: totalPublished, icon: Eye, color: 'text-emerald-400' },
              { label: 'PDFs Ready', value: totalWithPdf, icon: FileText, color: 'text-blue-400' },
              { label: 'With Covers', value: totalWithCover, icon: Image, color: 'text-amber-400' },
            ].map((stat) => (
              <Card key={stat.label} className="bg-card/50 border-border/50">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-background/80 flex items-center justify-center">
                    <stat.icon className={`h-5 w-5 ${stat.color}`} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stat.value}</p>
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Header Actions */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search books..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-background/50"
              />
            </div>
            
            <div className="flex items-center gap-3 flex-wrap">
              <Button variant="outline" size="sm" onClick={() => { const next = !showImages; setShowImages(next); localStorage.setItem('admin-ebook-show-covers', String(next)); }} className="gap-2">
                {showImages ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                {showImages ? 'Hide' : 'Show'} Covers
              </Button>

              {ebooks.length > 0 && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm" className="gap-2" disabled={deletingAll}>
                      {deletingAll ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash className="h-4 w-4" />}
                      Delete All
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-destructive" />
                        Delete All eBooks?
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently delete all {ebooks.length} eBooks. This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDeleteAll} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                        Yes, Delete All
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}

              <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
                <DialogTrigger asChild>
                  <Button size="sm" className="gap-2">
                    <Plus className="h-4 w-4" />
                    Add eBook
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <BookOpen className="h-5 w-5 text-primary" />
                      {editingBook ? 'Edit eBook' : 'Add New eBook'}
                    </DialogTitle>
                  </DialogHeader>
                  
                  <div className="space-y-4 mt-2">
                    <div className="space-y-2">
                      <Label>Title *</Label>
                      <Input value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} placeholder="Enter book title" />
                    </div>

                    <div className="space-y-2">
                      <Label>Description</Label>
                      <Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Brief description" rows={3} />
                    </div>

                    <div className="space-y-2">
                      <Label>Cover Image URL</Label>
                      <div className="flex gap-2">
                        <Input value={formData.cover_image_url} onChange={(e) => setFormData({ ...formData, cover_image_url: e.target.value })} placeholder="https://example.com/cover.jpg" />
                        {formData.cover_image_url && (
                          <div className="h-10 w-8 rounded border border-border overflow-hidden shrink-0">
                            <img src={formData.cover_image_url} alt="Preview" className="h-full w-full object-cover" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Category</Label>
                      <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {CATEGORIES.map((cat) => (<SelectItem key={cat} value={cat}>{cat}</SelectItem>))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Price (₹)</Label>
                        <Input type="number" value={formData.price_single} onChange={(e) => setFormData({ ...formData, price_single: parseInt(e.target.value) || 0 })} />
                      </div>
                      <div className="space-y-2">
                        <Label>Published</Label>
                        <div className="pt-2">
                          <Switch checked={formData.is_published} onCheckedChange={(checked) => setFormData({ ...formData, is_published: checked })} />
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-2">
                      <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                      <Button onClick={handleSubmit} disabled={saving}>
                        {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                        {editingBook ? 'Update' : 'Create'}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* eBooks by Category */}
          {CATEGORIES.map((category) => {
            const categoryBooks = ebooksByCategory[category] || [];
            if (categoryBooks.length === 0) return null;
            const colors = CATEGORY_COLORS[category] || { bg: 'bg-muted', text: 'text-muted-foreground', border: 'border-border', icon: 'from-muted to-muted' };

            return (
              <Card key={category} className={`border ${colors.border} bg-gradient-to-br ${colors.icon}`}>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2.5">
                      <div className={`h-8 w-8 rounded-lg ${colors.bg} flex items-center justify-center`}>
                        <BookOpen className={`h-4 w-4 ${colors.text}`} />
                      </div>
                      <span className="text-base font-semibold">{category}</span>
                    </span>
                    <Badge variant="secondary" className="text-xs">{categoryBooks.length}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-3">
                    {categoryBooks.map((ebook) => (
                      <EbookRow 
                        key={ebook.id} 
                        ebook={ebook} 
                        showImages={showImages}
                        uploading={uploading}
                        savingThumbnail={savingThumbnail}
                        onEdit={openEditDialog}
                        onDelete={handleDelete}
                        onTogglePublished={togglePublished}
                        onFileUpload={handleFileUpload}
                        onSaveThumbnail={handleSaveThumbnail}
                      />
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}

          {/* Empty State */}
          {ebooks.length === 0 && (
            <Card className="border-dashed">
              <CardContent className="p-16 text-center">
                <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Library className="h-8 w-8 text-primary" />
                </div>
                <h3 className="font-semibold text-lg mb-2">No eBooks Yet</h3>
                <p className="text-muted-foreground mb-6 max-w-sm mx-auto">Start by adding your first eBook or sync from Google Drive</p>
                <Button onClick={() => setDialogOpen(true)} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add First eBook
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </TabsContent>
      
      <TabsContent value="sync">
        <EbookDriveSync onSyncComplete={fetchEbooks} />
      </TabsContent>
      
      <TabsContent value="linking">
        <CourseEbookLinking />
      </TabsContent>
    </Tabs>
  );
}

/* ─── Individual Ebook Row Component ──────────────────────────────── */

interface EbookRowProps {
  ebook: Ebook;
  showImages: boolean;
  uploading: boolean;
  savingThumbnail: string | null;
  onEdit: (ebook: Ebook) => void;
  onDelete: (id: string) => void;
  onTogglePublished: (id: string, current: boolean) => void;
  onFileUpload: (id: string, file: File) => void;
  onSaveThumbnail: (id: string, url: string) => void;
}

function EbookRow({ ebook, showImages, uploading, savingThumbnail, onEdit, onDelete, onTogglePublished, onFileUpload, onSaveThumbnail }: EbookRowProps) {
  const [showThumbInput, setShowThumbInput] = useState(false);
  const [thumbUrl, setThumbUrl] = useState('');

  return (
    <div className="group rounded-xl border border-border/50 bg-background/60 backdrop-blur-sm hover:bg-background/80 hover:border-border transition-all duration-200 overflow-hidden">
      <div className="flex items-stretch">
        {/* Thumbnail */}
        {showImages && (
          <div className="w-16 sm:w-20 shrink-0 bg-muted/30 flex items-center justify-center overflow-hidden">
            {ebook.cover_image_url ? (
              <img 
                src={ebook.cover_image_url} 
                alt={ebook.title}
                className="h-full w-full object-cover"
                onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.nextElementSibling && ((e.currentTarget.nextElementSibling as HTMLElement).style.display = 'flex'); }}
              />
            ) : null}
            {!ebook.cover_image_url && (
              <BookOpen className="h-6 w-6 text-muted-foreground/40" />
            )}
          </div>
        )}

        {/* Content */}
        <div className="flex-1 p-3 sm:p-4 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <p className="font-medium text-sm truncate">{ebook.title}</p>
                {!ebook.is_published && (
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-amber-500/30 text-amber-400">Draft</Badge>
                )}
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="font-medium">₹{ebook.price_single}</span>
                <span className="flex items-center gap-1">
                  {ebook.file_url ? (
                    <><CheckCircle className="h-3 w-3 text-emerald-400" /> PDF</>
                  ) : (
                    <><AlertCircle className="h-3 w-3 text-destructive" /> No PDF</>
                  )}
                </span>
                <span className="flex items-center gap-1">
                  {ebook.cover_image_url ? (
                    <><Image className="h-3 w-3 text-blue-400" /> Cover</>
                  ) : (
                    <><Image className="h-3 w-3 text-muted-foreground/40" /> No cover</>
                  )}
                </span>
              </div>
            </div>

             {/* Actions */}
            <div className="flex items-center gap-1.5 shrink-0">
              {ebook.cover_image_url ? (
                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive/80" title="Remove cover" onClick={() => onSaveThumbnail(ebook.id, '')}>
                  <EyeOff className="h-3.5 w-3.5" />
                </Button>
              ) : null}
              <Button variant="ghost" size="icon" className="h-7 w-7" title="Set thumbnail" onClick={() => { setShowThumbInput(!showThumbInput); setThumbUrl(ebook.cover_image_url || ''); }}>
                <ImagePlus className="h-3.5 w-3.5" />
              </Button>
              <input type="file" accept=".pdf" className="hidden" id={`upload-${ebook.id}`} onChange={(e) => { const file = e.target.files?.[0]; if (file) onFileUpload(ebook.id, file); }} />
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => document.getElementById(`upload-${ebook.id}`)?.click()} disabled={uploading} title="Upload PDF">
                <Upload className="h-3.5 w-3.5" />
              </Button>
              {ebook.file_url && (
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => window.open(ebook.file_url!, '_blank')} title="View PDF">
                  <ExternalLink className="h-3.5 w-3.5" />
                </Button>
              )}
              <Switch checked={ebook.is_published} onCheckedChange={() => onTogglePublished(ebook.id, ebook.is_published)} className="scale-75" />
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEdit(ebook)}>
                <Edit2 className="h-3.5 w-3.5" />
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => onDelete(ebook.id)}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          {/* Thumbnail URL Input (expandable) */}
          {showThumbInput && (
            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border/30">
              <Input
                value={thumbUrl}
                onChange={(e) => setThumbUrl(e.target.value)}
                placeholder="Paste cover image URL..."
                className="h-8 text-xs bg-background/50"
              />
              <Button 
                size="sm" 
                className="h-8 px-3 text-xs gap-1.5" 
                disabled={savingThumbnail === ebook.id}
                onClick={() => { onSaveThumbnail(ebook.id, thumbUrl); setShowThumbInput(false); }}
              >
                {savingThumbnail === ebook.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                Save
              </Button>
              <Button variant="ghost" size="sm" className="h-8 px-2" onClick={() => setShowThumbInput(false)}>
                <AlertCircle className="h-3 w-3" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
