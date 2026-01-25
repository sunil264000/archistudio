import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { CreditCard, Pencil, Loader2, Plus, Trash2, Percent } from 'lucide-react';

interface Course {
  id: string;
  title: string;
  slug: string;
  price_inr: number;
}

interface EMISetting {
  id: string;
  course_id: string;
  is_emi_enabled: boolean;
  min_first_payment_percent: number;
  max_splits: number;
  early_payment_discount_percent: number;
  payment_tiers: PaymentTier[];
  course?: Course;
}

interface PaymentTier {
  percent: number;
  module_order_indices: number[];
  label: string;
}

interface Module {
  id: string;
  title: string;
  order_index: number;
}

export function EMISettingsManagement() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [emiSettings, setEmiSettings] = useState<EMISetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [modules, setModules] = useState<Module[]>([]);

  // Form state
  const [form, setForm] = useState({
    is_emi_enabled: true,
    min_first_payment_percent: 25,
    max_splits: 3,
    early_payment_discount_percent: 2,
    payment_tiers: [] as PaymentTier[],
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch courses with pricing
      const { data: coursesData } = await supabase
        .from('courses')
        .select('id, title, slug, price_inr')
        .eq('is_published', true)
        .gt('price_inr', 0)
        .order('title');
      setCourses(coursesData || []);

      // Fetch existing EMI settings
      const { data: settingsData } = await supabase
        .from('course_emi_settings')
        .select('*');
      
      // Parse payment_tiers from JSONB
      const parsed = (settingsData || []).map(s => ({
        ...s,
        payment_tiers: Array.isArray(s.payment_tiers) ? s.payment_tiers as unknown as PaymentTier[] : []
      })) as EMISetting[];
      setEmiSettings(parsed);
    } catch (error: any) {
      toast.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchModules = async (courseId: string) => {
    const { data } = await supabase
      .from('modules')
      .select('id, title, order_index')
      .eq('course_id', courseId)
      .order('order_index');
    setModules(data || []);
  };

  const handleConfigureEMI = async (course: Course) => {
    setSelectedCourse(course);
    await fetchModules(course.id);

    // Check if settings already exist
    const existing = emiSettings.find(s => s.course_id === course.id);
    if (existing) {
      setForm({
        is_emi_enabled: existing.is_emi_enabled,
        min_first_payment_percent: existing.min_first_payment_percent,
        max_splits: existing.max_splits,
        early_payment_discount_percent: Number(existing.early_payment_discount_percent),
        payment_tiers: existing.payment_tiers,
      });
    } else {
      // Default tiers
      setForm({
        is_emi_enabled: true,
        min_first_payment_percent: 25,
        max_splits: 3,
        early_payment_discount_percent: 2,
        payment_tiers: [
          { percent: 25, module_order_indices: [0, 1], label: 'Unlock Foundations' },
          { percent: 50, module_order_indices: [0, 1, 2, 3], label: 'Unlock Intermediate' },
          { percent: 100, module_order_indices: [], label: 'Full Access' },
        ],
      });
    }
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!selectedCourse) return;

    // Validate tiers
    if (form.payment_tiers.length === 0) {
      toast.error('Please add at least one payment tier');
      return;
    }

    const hasFullAccess = form.payment_tiers.some(t => t.percent === 100);
    if (!hasFullAccess) {
      toast.error('Must include a 100% tier for full access');
      return;
    }

    setSaving(true);
    try {
      const settingsData = {
        course_id: selectedCourse.id,
        is_emi_enabled: form.is_emi_enabled,
        min_first_payment_percent: form.min_first_payment_percent,
        max_splits: form.max_splits,
        early_payment_discount_percent: form.early_payment_discount_percent,
        payment_tiers: form.payment_tiers as unknown as any,
      };

      const existing = emiSettings.find(s => s.course_id === selectedCourse.id);
      
      if (existing) {
        const { error } = await supabase
          .from('course_emi_settings')
          .update(settingsData as any)
          .eq('id', existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('course_emi_settings')
          .insert(settingsData as any);
        if (error) throw error;
      }

      toast.success('EMI settings saved');
      setDialogOpen(false);
      fetchData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const addTier = () => {
    if (form.payment_tiers.length >= 5) return;
    setForm(prev => ({
      ...prev,
      payment_tiers: [
        ...prev.payment_tiers,
        { percent: 0, module_order_indices: [], label: '' }
      ],
    }));
  };

  const updateTier = (index: number, updates: Partial<PaymentTier>) => {
    setForm(prev => ({
      ...prev,
      payment_tiers: prev.payment_tiers.map((t, i) => 
        i === index ? { ...t, ...updates } : t
      ),
    }));
  };

  const removeTier = (index: number) => {
    setForm(prev => ({
      ...prev,
      payment_tiers: prev.payment_tiers.filter((_, i) => i !== index),
    }));
  };

  const toggleModuleInTier = (tierIndex: number, moduleOrderIndex: number) => {
    setForm(prev => ({
      ...prev,
      payment_tiers: prev.payment_tiers.map((t, i) => {
        if (i !== tierIndex) return t;
        const indices = t.module_order_indices.includes(moduleOrderIndex)
          ? t.module_order_indices.filter(idx => idx !== moduleOrderIndex)
          : [...t.module_order_indices, moduleOrderIndex].sort((a, b) => a - b);
        return { ...t, module_order_indices: indices };
      }),
    }));
  };

  const getEMIStatus = (courseId: string) => {
    const setting = emiSettings.find(s => s.course_id === courseId);
    if (!setting) return { enabled: false, tiers: 0 };
    return { enabled: setting.is_emi_enabled, tiers: setting.payment_tiers.length };
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12 flex justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-accent" />
            EMI / Partial Payment Settings
          </CardTitle>
          <CardDescription>
            Configure installment payment options for each course with progressive content unlocking
          </CardDescription>
        </CardHeader>
        <CardContent>
          {courses.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No paid courses found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {courses.map((course) => {
                const status = getEMIStatus(course.id);
                return (
                  <div
                    key={course.id}
                    className="flex items-center justify-between p-4 border rounded-xl hover:bg-muted/30 transition-colors"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium">{course.title}</h3>
                        {status.enabled && (
                          <Badge variant="default" className="text-xs">
                            EMI Enabled • {status.tiers} tiers
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Price: ₹{course.price_inr?.toLocaleString()}
                      </p>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => handleConfigureEMI(course)}>
                      <Pencil className="h-4 w-4 mr-2" />
                      Configure EMI
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* EMI Configuration Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Configure EMI for {selectedCourse?.title}</DialogTitle>
            <DialogDescription>
              Set up payment tiers and map content to each payment level
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Enable Toggle */}
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <div>
                <Label>Enable EMI Payments</Label>
                <p className="text-xs text-muted-foreground">
                  Allow users to pay in installments for this course
                </p>
              </div>
              <Switch
                checked={form.is_emi_enabled}
                onCheckedChange={(checked) => setForm(prev => ({ ...prev, is_emi_enabled: checked }))}
              />
            </div>

            {form.is_emi_enabled && (
              <>
                {/* Basic Settings */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Min First Payment %</Label>
                    <Input
                      type="number"
                      min={10}
                      max={100}
                      value={form.min_first_payment_percent}
                      onChange={(e) => setForm(prev => ({ 
                        ...prev, 
                        min_first_payment_percent: parseInt(e.target.value) 
                      }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Max Splits</Label>
                    <Select
                      value={form.max_splits.toString()}
                      onValueChange={(v) => setForm(prev => ({ ...prev, max_splits: parseInt(v) }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[2, 3, 4, 5, 6].map(n => (
                          <SelectItem key={n} value={n.toString()}>{n} payments</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Early Payment Discount %</Label>
                    <Input
                      type="number"
                      min={0}
                      max={10}
                      step={0.5}
                      value={form.early_payment_discount_percent}
                      onChange={(e) => setForm(prev => ({ 
                        ...prev, 
                        early_payment_discount_percent: parseFloat(e.target.value) 
                      }))}
                    />
                  </div>
                </div>

                {/* Payment Tiers */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Payment Tiers</Label>
                    {form.payment_tiers.length < 5 && (
                      <Button variant="outline" size="sm" onClick={addTier}>
                        <Plus className="h-3 w-3 mr-1" /> Add Tier
                      </Button>
                    )}
                  </div>

                  {form.payment_tiers.map((tier, tierIndex) => (
                    <div key={tierIndex} className="border rounded-lg p-4 space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">Tier {tierIndex + 1}</h4>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeTier(tierIndex)}
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Payment Percentage</Label>
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              min={1}
                              max={100}
                              value={tier.percent}
                              onChange={(e) => updateTier(tierIndex, { percent: parseInt(e.target.value) })}
                            />
                            <Percent className="h-4 w-4 text-muted-foreground" />
                          </div>
                          {selectedCourse && (
                            <p className="text-xs text-muted-foreground">
                              = ₹{Math.round((selectedCourse.price_inr * tier.percent) / 100).toLocaleString()}
                            </p>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label>Tier Label</Label>
                          <Input
                            value={tier.label}
                            onChange={(e) => updateTier(tierIndex, { label: e.target.value })}
                            placeholder="e.g., Unlock Foundations"
                          />
                        </div>
                      </div>

                      {tier.percent < 100 && (
                        <div className="space-y-2">
                          <Label>Modules to Unlock</Label>
                          <div className="flex flex-wrap gap-2">
                            {modules.map((module) => (
                              <Button
                                key={module.id}
                                type="button"
                                variant={tier.module_order_indices.includes(module.order_index || 0) ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => toggleModuleInTier(tierIndex, module.order_index || 0)}
                              >
                                {module.order_index !== null ? module.order_index + 1 : '?'}. {module.title.slice(0, 20)}...
                              </Button>
                            ))}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Click modules to include/exclude from this tier
                          </p>
                        </div>
                      )}

                      {tier.percent === 100 && (
                        <p className="text-sm text-emerald-600 bg-emerald-500/10 p-2 rounded">
                          ✓ Full course access (all modules unlocked)
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save Settings
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
