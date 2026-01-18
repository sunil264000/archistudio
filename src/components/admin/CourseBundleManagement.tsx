import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { Package, Plus, Pencil, Trash2, Loader2, Star, Sparkles } from 'lucide-react';

interface Bundle {
  id: string;
  name: string;
  description: string | null;
  discount_percentage: number;
  is_active: boolean;
  created_at: string;
}

interface Course {
  id: string;
  title: string;
  slug: string;
  price_inr: number | null;
  is_highlighted: boolean;
  bundle_id: string | null;
}

export function CourseBundleManagement() {
  const [bundles, setBundles] = useState<Bundle[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBundle, setEditingBundle] = useState<Bundle | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [selectedCourses, setSelectedCourses] = useState<string[]>([]);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    discount_percentage: 15,
    is_active: true,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const [bundlesRes, coursesRes] = await Promise.all([
      supabase.from('course_bundles').select('*').order('created_at', { ascending: false }),
      supabase.from('courses').select('id, title, slug, price_inr, is_highlighted, bundle_id').order('title'),
    ]);
    setBundles((bundlesRes.data || []) as Bundle[]);
    setCourses((coursesRes.data || []) as Course[]);
    setLoading(false);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      discount_percentage: 15,
      is_active: true,
    });
    setSelectedCourses([]);
    setEditingBundle(null);
  };

  const openEditDialog = (bundle: Bundle) => {
    setEditingBundle(bundle);
    setFormData({
      name: bundle.name,
      description: bundle.description || '',
      discount_percentage: bundle.discount_percentage,
      is_active: bundle.is_active,
    });
    setSelectedCourses(courses.filter(c => c.bundle_id === bundle.id).map(c => c.id));
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast.error('Bundle name is required');
      return;
    }

    setSaving(true);
    try {
      let bundleId = editingBundle?.id;

      if (editingBundle) {
        await supabase
          .from('course_bundles')
          .update({
            name: formData.name,
            description: formData.description || null,
            discount_percentage: formData.discount_percentage,
            is_active: formData.is_active,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingBundle.id);
      } else {
        const { data } = await supabase
          .from('course_bundles')
          .insert({
            name: formData.name,
            description: formData.description || null,
            discount_percentage: formData.discount_percentage,
            is_active: formData.is_active,
          })
          .select()
          .single();
        bundleId = data?.id;
      }

      // Update course associations
      if (bundleId) {
        // Remove old associations
        await supabase
          .from('courses')
          .update({ bundle_id: null })
          .eq('bundle_id', bundleId);

        // Add new associations
        if (selectedCourses.length > 0) {
          await supabase
            .from('courses')
            .update({ bundle_id: bundleId })
            .in('id', selectedCourses);
        }
      }

      toast.success(editingBundle ? 'Bundle updated' : 'Bundle created');
      setDialogOpen(false);
      resetForm();
      fetchData();
    } catch (error) {
      console.error('Error saving bundle:', error);
      toast.error('Failed to save bundle');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this bundle? Courses will be unbundled.')) return;
    setDeleting(id);
    try {
      await supabase.from('courses').update({ bundle_id: null }).eq('bundle_id', id);
      await supabase.from('course_bundles').delete().eq('id', id);
      toast.success('Bundle deleted');
      fetchData();
    } catch {
      toast.error('Failed to delete bundle');
    } finally {
      setDeleting(null);
    }
  };

  const toggleHighlight = async (courseId: string, currentState: boolean) => {
    try {
      await supabase
        .from('courses')
        .update({ is_highlighted: !currentState })
        .eq('id', courseId);
      toast.success(currentState ? 'Course unhighlighted' : 'Course highlighted');
      fetchData();
    } catch {
      toast.error('Failed to update course');
    }
  };

  const getBundledPrice = (bundle: Bundle) => {
    const bundledCourses = courses.filter(c => c.bundle_id === bundle.id);
    const totalPrice = bundledCourses.reduce((sum, c) => sum + (c.price_inr || 0), 0);
    const discountedPrice = totalPrice * (1 - bundle.discount_percentage / 100);
    return { totalPrice, discountedPrice, courseCount: bundledCourses.length };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Highlighted Courses Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Sparkles className="h-5 w-5 text-warning" />
            Highlighted Courses
          </CardTitle>
          <CardDescription>
            Toggle courses to highlight them on the homepage
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
            {courses.slice(0, 12).map((course) => (
              <motion.div
                key={course.id}
                whileHover={{ scale: 1.02 }}
                className={`p-3 border rounded-lg flex items-center justify-between transition-all ${
                  course.is_highlighted ? 'border-warning bg-warning/5' : ''
                }`}
              >
                <div className="flex items-center gap-2">
                  {course.is_highlighted && <Star className="h-4 w-4 text-warning fill-warning" />}
                  <span className="text-sm font-medium truncate max-w-[150px]">{course.title}</span>
                </div>
                <Switch
                  checked={course.is_highlighted || false}
                  onCheckedChange={() => toggleHighlight(course.id, course.is_highlighted || false)}
                />
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Course Bundles Section */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold flex items-center gap-2">
            <Package className="h-5 w-5" />
            Course Bundles ({bundles.length})
          </h3>
          <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Create Bundle
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingBundle ? 'Edit Bundle' : 'Create Course Bundle'}</DialogTitle>
                <DialogDescription>Group courses together with a discount</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label>Bundle Name *</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Complete Architecture Masterclass"
                  />
                </div>

                <div className="grid gap-2">
                  <Label>Description</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Describe what's included in this bundle..."
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Discount Percentage</Label>
                    <Input
                      type="number"
                      value={formData.discount_percentage}
                      onChange={(e) => setFormData({ ...formData, discount_percentage: parseInt(e.target.value) || 0 })}
                      min={0}
                      max={100}
                    />
                  </div>
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <Label>Active</Label>
                    <Switch
                      checked={formData.is_active}
                      onCheckedChange={(v) => setFormData({ ...formData, is_active: v })}
                    />
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label>Select Courses for Bundle</Label>
                  <div className="border rounded-lg max-h-60 overflow-y-auto p-2 space-y-1">
                    {courses.map((course) => (
                      <label
                        key={course.id}
                        className="flex items-center gap-3 p-2 hover:bg-muted rounded cursor-pointer"
                      >
                        <Checkbox
                          checked={selectedCourses.includes(course.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedCourses([...selectedCourses, course.id]);
                            } else {
                              setSelectedCourses(selectedCourses.filter(id => id !== course.id));
                            }
                          }}
                        />
                        <span className="flex-1 text-sm">{course.title}</span>
                        <span className="text-sm text-muted-foreground">₹{course.price_inr || 0}</span>
                      </label>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {selectedCourses.length} courses selected
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleSubmit} disabled={saving}>
                  {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  {editingBundle ? 'Update' : 'Create'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {bundles.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">No bundles yet. Create one above.</p>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {bundles.map((bundle) => {
              const { totalPrice, discountedPrice, courseCount } = getBundledPrice(bundle);
              return (
                <motion.div
                  key={bundle.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 border rounded-lg hover:shadow-md transition-all bg-card"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Package className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-semibold">{bundle.name}</h4>
                        <p className="text-xs text-muted-foreground">{courseCount} courses</p>
                      </div>
                    </div>
                    <Badge variant={bundle.is_active ? 'default' : 'secondary'}>
                      {bundle.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  
                  {bundle.description && (
                    <p className="text-sm text-muted-foreground mb-3">{bundle.description}</p>
                  )}

                  <div className="flex items-center gap-4 mb-3">
                    <div>
                      <span className="text-lg font-bold text-success">₹{Math.round(discountedPrice)}</span>
                      <span className="text-sm text-muted-foreground line-through ml-2">₹{totalPrice}</span>
                    </div>
                    <Badge variant="outline" className="bg-success/10 text-success border-success/30">
                      {bundle.discount_percentage}% OFF
                    </Badge>
                  </div>

                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => openEditDialog(bundle)}>
                      <Pencil className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleDelete(bundle.id)}
                      disabled={deleting === bundle.id}
                    >
                      {deleting === bundle.id ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Trash2 className="h-3 w-3 text-destructive" />
                      )}
                    </Button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
