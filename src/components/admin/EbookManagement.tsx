import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
  Plus, 
  Edit2, 
  Trash2, 
  Upload, 
  FileText, 
  BookOpen,
  Save,
  X,
  Loader2,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  FolderSync,
  Link2,
  Trash,
  AlertTriangle
} from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
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

export function EbookManagement() {
  const [ebooks, setEbooks] = useState<Ebook[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBook, setEditingBook] = useState<Ebook | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deletingAll, setDeletingAll] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: CATEGORIES[0],
    price_single: 50,
    is_published: true,
  });

  useEffect(() => {
    fetchEbooks();
  }, []);

  const fetchEbooks = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('ebooks')
      .select('*')
      .order('category')
      .order('order_index');
    
    if (data) setEbooks(data);
    setLoading(false);
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      category: CATEGORIES[0],
      price_single: 50,
      is_published: true,
    });
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
    });
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.title.trim()) {
      toast({ title: "Error", description: "Title is required", variant: "destructive" });
      return;
    }

    setSaving(true);
    
    if (editingBook) {
      // Update existing
      const { error } = await supabase
        .from('ebooks')
        .update({
          title: formData.title,
          description: formData.description,
          category: formData.category,
          price_single: formData.price_single,
          is_published: formData.is_published,
          updated_at: new Date().toISOString(),
        })
        .eq('id', editingBook.id);

      if (error) {
        toast({ title: "Error", description: "Failed to update eBook", variant: "destructive" });
      } else {
        toast({ title: "Success", description: "eBook updated successfully" });
        setDialogOpen(false);
        resetForm();
        fetchEbooks();
      }
    } else {
      // Create new
      const maxOrder = ebooks.length > 0 ? Math.max(...ebooks.map(e => e.order_index)) : 0;
      
      const { error } = await supabase
        .from('ebooks')
        .insert({
          title: formData.title,
          description: formData.description,
          category: formData.category,
          price_single: formData.price_single,
          is_published: formData.is_published,
          order_index: maxOrder + 1,
        });

      if (error) {
        toast({ title: "Error", description: "Failed to create eBook", variant: "destructive" });
      } else {
        toast({ title: "Success", description: "eBook created successfully" });
        setDialogOpen(false);
        resetForm();
        fetchEbooks();
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
      
      toast({ 
        title: "All Deleted", 
        description: `Successfully deleted ${ebooks.length} eBooks` 
      });
      fetchEbooks();
    } catch (error: any) {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to delete all eBooks", 
        variant: "destructive" 
      });
    } finally {
      setDeletingAll(false);
    }
  };

  const handleFileUpload = async (ebookId: string, file: File) => {
    if (!file.type.includes('pdf')) {
      toast({ title: "Error", description: "Only PDF files are allowed", variant: "destructive" });
      return;
    }

    setUploading(true);
    const fileName = `${ebookId}/${file.name}`;
    
    const { error: uploadError } = await supabase.storage
      .from('ebook-files')
      .upload(fileName, file, { upsert: true });

    if (uploadError) {
      toast({ title: "Upload Failed", description: uploadError.message, variant: "destructive" });
      setUploading(false);
      return;
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('ebook-files')
      .getPublicUrl(fileName);

    // Update ebook record
    const { error: updateError } = await supabase
      .from('ebooks')
      .update({ file_url: urlData.publicUrl })
      .eq('id', ebookId);

    if (updateError) {
      toast({ title: "Error", description: "Failed to link file", variant: "destructive" });
    } else {
      toast({ title: "Uploaded!", description: "PDF file uploaded successfully" });
      fetchEbooks();
    }
    
    setUploading(false);
  };

  const togglePublished = async (id: string, currentState: boolean) => {
    const { error } = await supabase
      .from('ebooks')
      .update({ is_published: !currentState })
      .eq('id', id);

    if (!error) {
      fetchEbooks();
    }
  };

  // Group ebooks by category
  const ebooksByCategory = ebooks.reduce((acc, ebook) => {
    if (!acc[ebook.category]) acc[ebook.category] = [];
    acc[ebook.category].push(ebook);
    return acc;
  }, {} as Record<string, Ebook[]>);

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Tabs defaultValue="library" className="space-y-6">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="library" className="gap-2">
          <BookOpen className="h-4 w-4" />
          Library
        </TabsTrigger>
        <TabsTrigger value="sync" className="gap-2">
          <FolderSync className="h-4 w-4" />
          Drive Sync
        </TabsTrigger>
        <TabsTrigger value="linking" className="gap-2">
          <Link2 className="h-4 w-4" />
          Course Linking
        </TabsTrigger>
      </TabsList>
      
      <TabsContent value="library">
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">eBook Library</h2>
          <p className="text-muted-foreground">{ebooks.length} books in library</p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Delete All Button */}
          {ebooks.length > 0 && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="gap-2" disabled={deletingAll}>
                  {deletingAll ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash className="h-4 w-4" />}
                  Delete All ({ebooks.length})
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-destructive" />
                    Delete All eBooks?
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete all {ebooks.length} eBooks from the library. 
                    This action cannot be undone. You can re-import them from Google Drive later.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={handleDeleteAll}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Yes, Delete All
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}

          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Add eBook
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingBook ? 'Edit eBook' : 'Add New eBook'}</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Title *</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Enter book title"
                />
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description of the book"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label>Category</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Single Price (₹)</Label>
                  <Input
                    type="number"
                    value={formData.price_single}
                    onChange={(e) => setFormData({ ...formData, price_single: parseInt(e.target.value) || 0 })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Published</Label>
                  <div className="pt-2">
                    <Switch
                      checked={formData.is_published}
                      onCheckedChange={(checked) => setFormData({ ...formData, is_published: checked })}
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
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

        return (
          <Card key={category}>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-primary" />
                  {category}
                </span>
                <Badge variant="secondary">{categoryBooks.length} books</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {categoryBooks.map((ebook) => (
                  <div
                    key={ebook.id}
                    className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 ${
                        ebook.file_url ? 'bg-success/20' : 'bg-muted'
                      }`}>
                        {ebook.file_url ? (
                          <CheckCircle className="h-5 w-5 text-success" />
                        ) : (
                          <AlertCircle className="h-5 w-5 text-muted-foreground" />
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{ebook.title}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>₹{ebook.price_single}</span>
                          {!ebook.is_published && (
                            <Badge variant="outline" className="text-xs">Draft</Badge>
                          )}
                          {ebook.file_url ? (
                            <span className="text-success">PDF uploaded</span>
                          ) : (
                            <span className="text-destructive">No PDF</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Upload PDF */}
                      <input
                        type="file"
                        accept=".pdf"
                        className="hidden"
                        id={`upload-${ebook.id}`}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileUpload(ebook.id, file);
                        }}
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => document.getElementById(`upload-${ebook.id}`)?.click()}
                        disabled={uploading}
                      >
                        <Upload className="h-4 w-4" />
                      </Button>

                      {/* View PDF */}
                      {ebook.file_url && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(ebook.file_url!, '_blank')}
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      )}

                      {/* Toggle Published */}
                      <Switch
                        checked={ebook.is_published}
                        onCheckedChange={() => togglePublished(ebook.id, ebook.is_published)}
                      />

                      {/* Edit */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditDialog(ebook)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>

                      {/* Delete */}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleDelete(ebook.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        );
      })}

      {/* Empty State */}
      {ebooks.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-semibold text-lg mb-2">No eBooks Yet</h3>
            <p className="text-muted-foreground mb-4">Start by adding your first eBook to the library</p>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
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
