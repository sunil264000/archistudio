import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface Course {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  short_description: string | null;
  thumbnail_url: string | null;
  level: string | null;
  price_inr: number | null;
  price_usd: number | null;
  duration_hours: number | null;
  is_published: boolean | null;
  is_featured: boolean | null;
}

interface CourseEditDialogProps {
  course: Course | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: () => void;
}

export function CourseEditDialog({ course, open, onOpenChange, onSave }: CourseEditDialogProps) {
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<Partial<Course>>({});

  // Reset form when course changes
  const currentCourse = course ? { ...course, ...formData } : formData;

  const handleSave = async () => {
    if (!course?.id) return;
    
    setSaving(true);
    try {
      let thumbnailUrl = currentCourse.thumbnail_url;
      
      // If thumbnail URL changed and is external, download and store it permanently
      if (
        thumbnailUrl && 
        thumbnailUrl !== course.thumbnail_url &&
        !thumbnailUrl.includes('/storage/v1/object/public/course-thumbnails/')
      ) {
        toast.info('Downloading and storing thumbnail permanently...');
        
        const { data, error: uploadError } = await supabase.functions.invoke('upload-thumbnail', {
          body: { courseId: course.id, imageUrl: thumbnailUrl }
        });
        
        if (uploadError) throw uploadError;
        if (data?.error) throw new Error(data.error);
        
        thumbnailUrl = data.thumbnailUrl;
      }
      
      const { error } = await supabase
        .from("courses")
        .update({
          title: currentCourse.title,
          description: currentCourse.description,
          short_description: currentCourse.short_description,
          thumbnail_url: thumbnailUrl,
          level: currentCourse.level,
          price_inr: currentCourse.price_inr,
          price_usd: currentCourse.price_usd,
          duration_hours: currentCourse.duration_hours,
          is_published: currentCourse.is_published,
          is_featured: currentCourse.is_featured,
          updated_at: new Date().toISOString(),
        })
        .eq("id", course.id);

      if (error) throw error;
      
      toast.success("Course updated successfully");
      setFormData({});
      onSave();
      onOpenChange(false);
    } catch (error: unknown) {
      const errMessage = error instanceof Error ? error.message : 'Unknown error';
      toast.error("Failed to update course: " + errMessage);
    } finally {
      setSaving(false);
    }
  };

  const updateField = (field: keyof Course, value: unknown) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Course</DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={currentCourse.title || ""}
              onChange={(e) => updateField("title", e.target.value)}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="short_description">Short Description</Label>
            <Input
              id="short_description"
              value={currentCourse.short_description || ""}
              onChange={(e) => updateField("short_description", e.target.value)}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="description">Full Description</Label>
            <Textarea
              id="description"
              rows={4}
              value={currentCourse.description || ""}
              onChange={(e) => updateField("description", e.target.value)}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="thumbnail_url">Thumbnail URL</Label>
            <Input
              id="thumbnail_url"
              value={currentCourse.thumbnail_url || ""}
              onChange={(e) => updateField("thumbnail_url", e.target.value)}
              placeholder="https://example.com/image.jpg"
            />
            {currentCourse.thumbnail_url && (
              <img
                src={currentCourse.thumbnail_url}
                alt="Thumbnail preview"
                className="h-32 w-auto object-cover rounded-md border"
                onError={(e) => (e.currentTarget.style.display = "none")}
              />
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="level">Level</Label>
              <Select
                value={currentCourse.level || "beginner"}
                onValueChange={(value) => updateField("level", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner">Beginner</SelectItem>
                  <SelectItem value="intermediate">Intermediate</SelectItem>
                  <SelectItem value="advanced">Advanced</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="duration">Duration (hours)</Label>
              <Input
                id="duration"
                type="number"
                value={currentCourse.duration_hours || 0}
                onChange={(e) => updateField("duration_hours", parseInt(e.target.value) || 0)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="price_inr">Price (INR)</Label>
              <Input
                id="price_inr"
                type="number"
                value={currentCourse.price_inr || 0}
                onChange={(e) => updateField("price_inr", parseFloat(e.target.value) || 0)}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="price_usd">Price (USD)</Label>
              <Input
                id="price_usd"
                type="number"
                value={currentCourse.price_usd || 0}
                onChange={(e) => updateField("price_usd", parseFloat(e.target.value) || 0)}
              />
            </div>
          </div>

          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Switch
                id="is_published"
                checked={currentCourse.is_published || false}
                onCheckedChange={(checked) => updateField("is_published", checked)}
              />
              <Label htmlFor="is_published">Published</Label>
            </div>

            <div className="flex items-center gap-2">
              <Switch
                id="is_featured"
                checked={currentCourse.is_featured || false}
                onCheckedChange={(checked) => updateField("is_featured", checked)}
              />
              <Label htmlFor="is_featured">Featured</Label>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
