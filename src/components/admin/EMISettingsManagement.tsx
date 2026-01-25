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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { toast } from 'sonner';
import { 
  CreditCard, Pencil, Loader2, Plus, Trash2, Percent, ChevronDown, 
  Layers, FileText, TrendingUp, Wallet, AlertCircle, CheckCircle2,
  IndianRupee, Settings2, Sparkles
} from 'lucide-react';

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
  emi_surcharge_percent?: number;
  payment_tiers: PaymentTier[];
  course?: Course;
}

interface PaymentTier {
  percent: number;
  module_order_indices: number[];
  lesson_ids?: string[];
  unlock_mode: 'modules' | 'lessons';
  label: string;
}

interface Module {
  id: string;
  title: string;
  order_index: number;
}

interface Lesson {
  id: string;
  title: string;
  order_index: number;
  module_id: string;
}

interface ModuleWithLessons extends Module {
  lessons: Lesson[];
}

export function EMISettingsManagement() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [emiSettings, setEmiSettings] = useState<EMISetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [modulesWithLessons, setModulesWithLessons] = useState<ModuleWithLessons[]>([]);
  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({});

  const [form, setForm] = useState({
    is_emi_enabled: true,
    min_first_payment_percent: 25,
    max_splits: 3,
    early_payment_discount_percent: 2,
    emi_surcharge_percent: 10,
    payment_tiers: [] as PaymentTier[],
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: coursesData } = await supabase
        .from('courses')
        .select('id, title, slug, price_inr')
        .eq('is_published', true)
        .gt('price_inr', 0)
        .order('title');
      setCourses(coursesData || []);

      const { data: settingsData } = await supabase
        .from('course_emi_settings')
        .select('*');
      
      const parsed = (settingsData || []).map(s => ({
        ...s,
        emi_surcharge_percent: (s as any).emi_surcharge_percent ?? 10,
        payment_tiers: Array.isArray(s.payment_tiers) 
          ? (s.payment_tiers as unknown as PaymentTier[]).map(t => ({
              ...t,
              unlock_mode: t.unlock_mode || 'modules',
              lesson_ids: t.lesson_ids || [],
            }))
          : []
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

  const fetchModulesWithLessons = async (courseId: string) => {
    const { data: modulesData } = await supabase
      .from('modules')
      .select('id, title, order_index')
      .eq('course_id', courseId)
      .order('order_index');

    if (!modulesData) {
      setModulesWithLessons([]);
      return;
    }

    const moduleIds = modulesData.map(m => m.id);
    const { data: lessonsData } = await supabase
      .from('lessons')
      .select('id, title, order_index, module_id')
      .in('module_id', moduleIds)
      .order('order_index');

    const modulesWithLessonsList: ModuleWithLessons[] = modulesData.map(module => ({
      ...module,
      lessons: (lessonsData || []).filter(l => l.module_id === module.id)
    }));

    setModulesWithLessons(modulesWithLessonsList);
    
    const expanded: Record<string, boolean> = {};
    modulesData.forEach(m => { expanded[m.id] = true; });
    setExpandedModules(expanded);
  };

  const handleConfigureEMI = async (course: Course) => {
    setSelectedCourse(course);
    await fetchModulesWithLessons(course.id);

    const existing = emiSettings.find(s => s.course_id === course.id);
    if (existing) {
      setForm({
        is_emi_enabled: existing.is_emi_enabled,
        min_first_payment_percent: existing.min_first_payment_percent,
        max_splits: existing.max_splits,
        early_payment_discount_percent: Number(existing.early_payment_discount_percent),
        emi_surcharge_percent: existing.emi_surcharge_percent ?? 10,
        payment_tiers: existing.payment_tiers.map(t => ({
          ...t,
          unlock_mode: t.unlock_mode || 'modules',
          lesson_ids: t.lesson_ids || [],
        })),
      });
    } else {
      setForm({
        is_emi_enabled: true,
        min_first_payment_percent: 25,
        max_splits: 3,
        early_payment_discount_percent: 2,
        emi_surcharge_percent: 10,
        payment_tiers: [
          { percent: 25, module_order_indices: [0, 1], lesson_ids: [], unlock_mode: 'modules', label: 'Unlock Foundations' },
          { percent: 50, module_order_indices: [0, 1, 2, 3], lesson_ids: [], unlock_mode: 'modules', label: 'Unlock Intermediate' },
          { percent: 100, module_order_indices: [], lesson_ids: [], unlock_mode: 'modules', label: 'Full Access' },
        ],
      });
    }
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!selectedCourse) return;

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

      toast.success('EMI settings saved successfully!');
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
        { percent: 0, module_order_indices: [], lesson_ids: [], unlock_mode: 'modules', label: '' }
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

  const toggleLessonInTier = (tierIndex: number, lessonId: string) => {
    setForm(prev => ({
      ...prev,
      payment_tiers: prev.payment_tiers.map((t, i) => {
        if (i !== tierIndex) return t;
        const lessonIds = t.lesson_ids || [];
        const newLessonIds = lessonIds.includes(lessonId)
          ? lessonIds.filter(id => id !== lessonId)
          : [...lessonIds, lessonId];
        return { ...t, lesson_ids: newLessonIds };
      }),
    }));
  };

  const toggleAllLessonsInModule = (tierIndex: number, moduleId: string, lessons: Lesson[]) => {
    setForm(prev => ({
      ...prev,
      payment_tiers: prev.payment_tiers.map((t, i) => {
        if (i !== tierIndex) return t;
        const lessonIds = t.lesson_ids || [];
        const moduleLessonIds = lessons.map(l => l.id);
        const allSelected = moduleLessonIds.every(id => lessonIds.includes(id));
        
        let newLessonIds: string[];
        if (allSelected) {
          newLessonIds = lessonIds.filter(id => !moduleLessonIds.includes(id));
        } else {
          newLessonIds = [...new Set([...lessonIds, ...moduleLessonIds])];
        }
        return { ...t, lesson_ids: newLessonIds };
      }),
    }));
  };

  const getEMIStatus = (courseId: string) => {
    const setting = emiSettings.find(s => s.course_id === courseId);
    if (!setting) return { enabled: false, tiers: 0, surcharge: 0 };
    return { 
      enabled: setting.is_emi_enabled, 
      tiers: setting.payment_tiers.length,
      surcharge: setting.emi_surcharge_percent ?? 10
    };
  };

  const getTotalLessonsCount = () => {
    return modulesWithLessons.reduce((acc, m) => acc + m.lessons.length, 0);
  };

  const calculateEMIPrice = (basePrice: number, surchargePercent: number) => {
    return Math.round(basePrice * (1 + surchargePercent / 100));
  };

  if (loading) {
    return (
      <Card className="border-0 shadow-lg bg-gradient-to-br from-card to-muted/20">
        <CardContent className="py-16 flex flex-col items-center justify-center gap-4">
          <div className="relative">
            <div className="absolute inset-0 animate-ping rounded-full bg-primary/20" />
            <Loader2 className="h-8 w-8 animate-spin text-primary relative" />
          </div>
          <p className="text-muted-foreground">Loading EMI settings...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card className="border-0 shadow-lg bg-gradient-to-br from-card via-card to-primary/5 overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <CardHeader className="relative">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 border border-primary/20">
              <CreditCard className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-xl">EMI / Partial Payment Settings</CardTitle>
              <CardDescription className="mt-1">
                Configure installment payment options with progressive content unlocking
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="relative">
          {/* Info Banner */}
          <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-accent/10 via-accent/5 to-transparent border border-accent/20">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-accent/20">
                <TrendingUp className="h-4 w-4 text-accent-foreground" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-sm">EMI Surcharge System</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Users paying via EMI pay a surcharge (default 10%) on top of the course price. 
                  This covers transaction costs and encourages full upfront payment.
                </p>
              </div>
            </div>
          </div>

          {courses.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-muted/50 flex items-center justify-center">
                <CreditCard className="h-10 w-10 text-muted-foreground/50" />
              </div>
              <p className="text-muted-foreground font-medium">No paid courses found</p>
              <p className="text-sm text-muted-foreground/70 mt-1">
                Add courses with pricing to configure EMI options
              </p>
            </div>
          ) : (
            <div className="grid gap-3">
              {courses.map((course) => {
                const status = getEMIStatus(course.id);
                const emiPrice = calculateEMIPrice(course.price_inr, status.surcharge);
                
                return (
                  <div
                    key={course.id}
                    className="group flex items-center justify-between p-4 rounded-xl border bg-card/50 hover:bg-muted/30 hover:border-primary/30 transition-all duration-200"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`p-2.5 rounded-lg transition-colors ${
                        status.enabled 
                          ? 'bg-primary/10 text-primary' 
                          : 'bg-muted text-muted-foreground'
                      }`}>
                        <Wallet className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{course.title}</h3>
                          {status.enabled && (
                            <Badge className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/20">
                              <Sparkles className="h-3 w-3 mr-1" />
                              {status.tiers} tiers
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-sm text-muted-foreground flex items-center gap-1">
                            <IndianRupee className="h-3 w-3" />
                            {course.price_inr?.toLocaleString()} full price
                          </span>
                          {status.enabled && (
                            <>
                              <span className="text-muted-foreground/50">•</span>
                              <span className="text-sm text-primary flex items-center gap-1">
                                <IndianRupee className="h-3 w-3" />
                                {emiPrice.toLocaleString()} EMI total (+{status.surcharge}%)
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <Button 
                      variant={status.enabled ? "default" : "outline"} 
                      size="sm" 
                      onClick={() => handleConfigureEMI(course)}
                      className="opacity-70 group-hover:opacity-100 transition-opacity"
                    >
                      <Settings2 className="h-4 w-4 mr-2" />
                      Configure
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
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader className="pb-4 border-b">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-primary/10">
                <CreditCard className="h-5 w-5 text-primary" />
              </div>
              <div>
                <DialogTitle className="text-lg">Configure EMI Settings</DialogTitle>
                <DialogDescription className="mt-0.5">
                  {selectedCourse?.title}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <ScrollArea className="flex-1 pr-4">
            <div className="space-y-6 py-4">
              {/* Enable Toggle */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-muted/50 to-transparent border">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${form.is_emi_enabled ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'}`}>
                    <CreditCard className="h-4 w-4" />
                  </div>
                  <div>
                    <Label className="font-semibold">Enable EMI Payments</Label>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Allow users to pay in installments for this course
                    </p>
                  </div>
                </div>
                <Switch
                  checked={form.is_emi_enabled}
                  onCheckedChange={(checked) => setForm(prev => ({ ...prev, is_emi_enabled: checked }))}
                />
              </div>

              {form.is_emi_enabled && (
                <>
                  {/* EMI Surcharge - NEW PROMINENT SECTION */}
                  <div className="p-4 rounded-xl bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/20">
                    <div className="flex items-start gap-3 mb-4">
                      <div className="p-2 rounded-lg bg-primary/20">
                        <Percent className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1">
                        <Label className="font-semibold text-primary">EMI Surcharge</Label>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Extra charge on top of course price when paying via EMI
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-sm">Surcharge Percentage</Label>
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            min={0}
                            max={30}
                            value={form.emi_surcharge_percent}
                            onChange={(e) => setForm(prev => ({ 
                              ...prev, 
                              emi_surcharge_percent: parseFloat(e.target.value) || 0
                            }))}
                            className="bg-background"
                          />
                          <span className="text-muted-foreground font-medium">%</span>
                        </div>
                      </div>
                      {selectedCourse && (
                        <div className="space-y-2">
                          <Label className="text-sm">Total EMI Price</Label>
                          <div className="p-2.5 rounded-lg bg-background border flex items-center gap-2">
                            <IndianRupee className="h-4 w-4 text-muted-foreground" />
                            <span className="font-semibold">
                              {calculateEMIPrice(selectedCourse.price_inr, form.emi_surcharge_percent).toLocaleString()}
                            </span>
                            <span className="text-xs text-muted-foreground ml-auto">
                              vs ₹{selectedCourse.price_inr.toLocaleString()} full
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Basic Settings */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Min First Payment</Label>
                      <div className="flex items-center gap-2">
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
                        <span className="text-muted-foreground">%</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Max Installments</Label>
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
                      <Label className="text-sm font-medium">Early Pay Discount</Label>
                      <div className="flex items-center gap-2">
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
                        <span className="text-muted-foreground">%</span>
                      </div>
                    </div>
                  </div>

                  {/* Course structure info */}
                  <div className="p-3 rounded-lg bg-muted/50 border flex items-center gap-3">
                    <Layers className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      <strong>{modulesWithLessons.length}</strong> modules, <strong>{getTotalLessonsCount()}</strong> lessons
                    </span>
                  </div>

                  {/* Payment Tiers */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="font-semibold">Payment Tiers</Label>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Define what content unlocks at each payment level
                        </p>
                      </div>
                      {form.payment_tiers.length < 5 && (
                        <Button variant="outline" size="sm" onClick={addTier}>
                          <Plus className="h-3.5 w-3.5 mr-1.5" /> Add Tier
                        </Button>
                      )}
                    </div>

                    <div className="space-y-3">
                      {form.payment_tiers.map((tier, tierIndex) => {
                        const tierEmiAmount = selectedCourse 
                          ? Math.round((calculateEMIPrice(selectedCourse.price_inr, form.emi_surcharge_percent) * tier.percent) / 100)
                          : 0;
                        
                        return (
                          <div key={tierIndex} className="border rounded-xl overflow-hidden">
                            {/* Tier Header */}
                            <div className="p-4 bg-gradient-to-r from-muted/30 to-transparent flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm ${
                                  tier.percent === 100 
                                    ? 'bg-primary text-primary-foreground' 
                                    : 'bg-muted text-muted-foreground'
                                }`}>
                                  {tierIndex + 1}
                                </div>
                                <div>
                                  <span className="font-medium">Tier {tierIndex + 1}</span>
                                  {tier.percent > 0 && (
                                    <span className="text-xs text-muted-foreground ml-2">
                                      ₹{tierEmiAmount.toLocaleString()} payment
                                    </span>
                                  )}
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => removeTier(tierIndex)}
                                className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>

                            <div className="p-4 space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <Label className="text-sm">Payment Percentage</Label>
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
                                </div>
                                <div className="space-y-2">
                                  <Label className="text-sm">Tier Label</Label>
                                  <Input
                                    value={tier.label}
                                    onChange={(e) => updateTier(tierIndex, { label: e.target.value })}
                                    placeholder="e.g., Unlock Foundations"
                                  />
                                </div>
                              </div>

                              {tier.percent < 100 ? (
                                <div className="space-y-3">
                                  <Label className="text-sm font-medium">Content to Unlock</Label>
                                  <Tabs 
                                    value={tier.unlock_mode || 'modules'} 
                                    onValueChange={(v) => updateTier(tierIndex, { unlock_mode: v as 'modules' | 'lessons' })}
                                  >
                                    <TabsList className="grid w-full grid-cols-2 h-9">
                                      <TabsTrigger value="modules" className="text-xs gap-1.5">
                                        <Layers className="h-3.5 w-3.5" />
                                        By Modules
                                      </TabsTrigger>
                                      <TabsTrigger value="lessons" className="text-xs gap-1.5">
                                        <FileText className="h-3.5 w-3.5" />
                                        By Lessons
                                      </TabsTrigger>
                                    </TabsList>

                                    <TabsContent value="modules" className="mt-3">
                                      <div className="flex flex-wrap gap-2">
                                        {modulesWithLessons.map((module) => {
                                          const isSelected = tier.module_order_indices.includes(module.order_index || 0);
                                          return (
                                            <Button
                                              key={module.id}
                                              type="button"
                                              variant={isSelected ? 'default' : 'outline'}
                                              size="sm"
                                              onClick={() => toggleModuleInTier(tierIndex, module.order_index || 0)}
                                              className={`h-auto py-1.5 ${isSelected ? '' : 'border-dashed'}`}
                                            >
                                              {isSelected && <CheckCircle2 className="h-3 w-3 mr-1" />}
                                              {(module.order_index ?? 0) + 1}. {module.title.slice(0, 20)}{module.title.length > 20 ? '...' : ''}
                                            </Button>
                                          );
                                        })}
                                      </div>
                                    </TabsContent>

                                    <TabsContent value="lessons" className="mt-3">
                                      <ScrollArea className="h-[200px] border rounded-lg">
                                        <div className="p-3 space-y-2">
                                          {modulesWithLessons.map((module) => {
                                            const lessonIds = tier.lesson_ids || [];
                                            const moduleLessonIds = module.lessons.map(l => l.id);
                                            const allSelected = moduleLessonIds.length > 0 && moduleLessonIds.every(id => lessonIds.includes(id));
                                            const someSelected = moduleLessonIds.some(id => lessonIds.includes(id));

                                            return (
                                              <Collapsible
                                                key={module.id}
                                                open={expandedModules[module.id]}
                                                onOpenChange={(open) => setExpandedModules(prev => ({ ...prev, [module.id]: open }))}
                                              >
                                                <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                                                  <Checkbox
                                                    checked={allSelected}
                                                    onCheckedChange={() => toggleAllLessonsInModule(tierIndex, module.id, module.lessons)}
                                                    className={someSelected && !allSelected ? 'opacity-50' : ''}
                                                  />
                                                  <CollapsibleTrigger className="flex items-center gap-2 flex-1 text-left text-sm">
                                                    <ChevronDown className={`h-3.5 w-3.5 transition-transform ${expandedModules[module.id] ? 'rotate-180' : ''}`} />
                                                    <span className="font-medium truncate">
                                                      {(module.order_index ?? 0) + 1}. {module.title}
                                                    </span>
                                                    <Badge variant="secondary" className="ml-auto text-xs shrink-0">
                                                      {module.lessons.filter(l => lessonIds.includes(l.id)).length}/{module.lessons.length}
                                                    </Badge>
                                                  </CollapsibleTrigger>
                                                </div>
                                                <CollapsibleContent>
                                                  <div className="ml-7 mt-1 space-y-0.5 border-l-2 border-muted pl-3">
                                                    {module.lessons.map((lesson) => (
                                                      <div key={lesson.id} className="flex items-center gap-2 py-1 px-2 rounded hover:bg-muted/30">
                                                        <Checkbox
                                                          id={`lesson-${lesson.id}-${tierIndex}`}
                                                          checked={lessonIds.includes(lesson.id)}
                                                          onCheckedChange={() => toggleLessonInTier(tierIndex, lesson.id)}
                                                        />
                                                        <label
                                                          htmlFor={`lesson-${lesson.id}-${tierIndex}`}
                                                          className="text-xs cursor-pointer hover:text-primary truncate"
                                                        >
                                                          {(lesson.order_index ?? 0) + 1}. {lesson.title}
                                                        </label>
                                                      </div>
                                                    ))}
                                                  </div>
                                                </CollapsibleContent>
                                              </Collapsible>
                                            );
                                          })}
                                        </div>
                                      </ScrollArea>
                                      <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                                        <FileText className="h-3 w-3" />
                                        {(tier.lesson_ids || []).length} lessons selected
                                      </p>
                                    </TabsContent>
                                  </Tabs>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2 p-3 rounded-lg bg-primary/10 border border-primary/20">
                                  <CheckCircle2 className="h-4 w-4 text-primary" />
                                  <span className="text-sm font-medium text-primary">
                                    Full course access - all modules and lessons unlocked
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}
            </div>
          </ScrollArea>

          <div className="flex justify-end gap-2 pt-4 border-t mt-auto">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving} className="min-w-[100px]">
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Save Settings
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
