import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Loader2, Percent, DollarSign, Calendar, Copy } from 'lucide-react';

interface Coupon {
  id: string;
  code: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  description: string | null;
  is_active: boolean;
  max_uses: number | null;
  used_count: number;
  min_purchase_amount: number | null;
  valid_from: string | null;
  valid_until: string | null;
  applicable_course_id: string | null;
}

export function CouponManagement() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [courses, setCourses] = useState<{ id: string; title: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    code: '',
    discount_type: 'percentage' as 'percentage' | 'fixed',
    discount_value: 10,
    description: '',
    is_active: true,
    max_uses: '',
    min_purchase_amount: '',
    valid_from: '',
    valid_until: '',
    applicable_course_id: '',
  });

  const fetchData = async () => {
    setLoading(true);
    const [couponsRes, coursesRes] = await Promise.all([
      supabase.from('coupons').select('*').order('created_at', { ascending: false }),
      supabase.from('courses').select('id, title').order('title'),
    ]);
    setCoupons((couponsRes.data || []) as Coupon[]);
    setCourses(coursesRes.data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const resetForm = () => {
    setFormData({
      code: '',
      discount_type: 'percentage',
      discount_value: 10,
      description: '',
      is_active: true,
      max_uses: '',
      min_purchase_amount: '',
      valid_from: '',
      valid_until: '',
      applicable_course_id: '',
    });
    setEditingCoupon(null);
  };

  const openEditDialog = (coupon: Coupon) => {
    setEditingCoupon(coupon);
    setFormData({
      code: coupon.code,
      discount_type: coupon.discount_type || 'percentage',
      discount_value: coupon.discount_value,
      description: coupon.description || '',
      is_active: coupon.is_active,
      max_uses: coupon.max_uses?.toString() || '',
      min_purchase_amount: coupon.min_purchase_amount?.toString() || '',
      valid_from: coupon.valid_from ? coupon.valid_from.split('T')[0] : '',
      valid_until: coupon.valid_until ? coupon.valid_until.split('T')[0] : '',
      applicable_course_id: coupon.applicable_course_id || '',
    });
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.code.trim()) {
      toast.error('Coupon code is required');
      return;
    }

    setSaving(true);
    try {
      const data = {
        code: formData.code.toUpperCase().trim(),
        discount_type: formData.discount_type,
        discount_value: formData.discount_value,
        description: formData.description || null,
        is_active: formData.is_active,
        max_uses: formData.max_uses ? parseInt(formData.max_uses) : null,
        min_purchase_amount: formData.min_purchase_amount ? parseFloat(formData.min_purchase_amount) : null,
        valid_from: formData.valid_from || null,
        valid_until: formData.valid_until || null,
        applicable_course_id: formData.applicable_course_id || null,
      };

      if (editingCoupon) {
        await supabase.from('coupons').update(data).eq('id', editingCoupon.id);
        toast.success('Coupon updated');
      } else {
        await supabase.from('coupons').insert(data);
        toast.success('Coupon created');
      }

      setDialogOpen(false);
      resetForm();
      fetchData();
    } catch (error) {
      toast.error('Failed to save coupon');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this coupon?')) return;
    setDeleting(id);
    try {
      await supabase.from('coupons').delete().eq('id', id);
      toast.success('Coupon deleted');
      fetchData();
    } catch {
      toast.error('Failed to delete');
    } finally {
      setDeleting(null);
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success('Coupon code copied');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="font-semibold">Discount Coupons ({coupons.length})</h3>
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Add Coupon
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingCoupon ? 'Edit Coupon' : 'Create New Coupon'}</DialogTitle>
              <DialogDescription>Configure discount coupon settings</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Coupon Code *</Label>
                <Input
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  placeholder="e.g., SAVE20"
                  className="uppercase"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Discount Type</Label>
                  <Select
                    value={formData.discount_type}
                    onValueChange={(v) => setFormData({ ...formData, discount_type: v as 'percentage' | 'fixed' })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">Percentage (%)</SelectItem>
                      <SelectItem value="fixed">Fixed Amount (₹)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Discount Value</Label>
                  <Input
                    type="number"
                    value={formData.discount_value}
                    onChange={(e) => setFormData({ ...formData, discount_value: parseFloat(e.target.value) || 0 })}
                    min={0}
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label>Description</Label>
                <Input
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="e.g., Summer sale discount"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Max Uses</Label>
                  <Input
                    type="number"
                    value={formData.max_uses}
                    onChange={(e) => setFormData({ ...formData, max_uses: e.target.value })}
                    placeholder="Unlimited"
                    min={1}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Min. Purchase (₹)</Label>
                  <Input
                    type="number"
                    value={formData.min_purchase_amount}
                    onChange={(e) => setFormData({ ...formData, min_purchase_amount: e.target.value })}
                    placeholder="No minimum"
                    min={0}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Valid From</Label>
                  <Input
                    type="date"
                    value={formData.valid_from}
                    onChange={(e) => setFormData({ ...formData, valid_from: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Valid Until</Label>
                  <Input
                    type="date"
                    value={formData.valid_until}
                    onChange={(e) => setFormData({ ...formData, valid_until: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label>Applicable Course</Label>
                <Select
                  value={formData.applicable_course_id || "all"}
                  onValueChange={(v) => setFormData({ ...formData, applicable_course_id: v === "all" ? "" : v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All courses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All courses</SelectItem>
                    {courses.map((course) => (
                      <SelectItem key={course.id} value={course.id}>
                        {course.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <Label>Active</Label>
                <Switch
                  checked={formData.is_active}
                  onCheckedChange={(v) => setFormData({ ...formData, is_active: v })}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSubmit} disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {editingCoupon ? 'Update' : 'Create'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {coupons.length === 0 ? (
        <p className="text-muted-foreground text-center py-8">No coupons yet. Create one above.</p>
      ) : (
        <div className="space-y-2">
          {coupons.map((coupon) => (
            <div key={coupon.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/30 transition-colors">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  {coupon.discount_type === 'percentage' ? (
                    <Percent className="h-5 w-5 text-primary" />
                  ) : (
                    <DollarSign className="h-5 w-5 text-primary" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <code className="font-bold text-lg">{coupon.code}</code>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => copyCode(coupon.code)}>
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {coupon.discount_type === 'percentage' 
                      ? `${coupon.discount_value}% off`
                      : `₹${coupon.discount_value} off`}
                    {coupon.description && ` • ${coupon.description}`}
                  </p>
                  <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                    {coupon.max_uses && (
                      <span>Uses: {coupon.used_count}/{coupon.max_uses}</span>
                    )}
                    {coupon.valid_until && (
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Until {new Date(coupon.valid_until).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={coupon.is_active ? 'default' : 'secondary'}>
                  {coupon.is_active ? 'Active' : 'Inactive'}
                </Badge>
                <Button variant="ghost" size="icon" onClick={() => openEditDialog(coupon)}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => handleDelete(coupon.id)} disabled={deleting === coupon.id}>
                  {deleting === coupon.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4 text-destructive" />
                  )}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
