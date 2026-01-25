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
import { CreditCard, Pencil, Loader2, Plus, Trash2, Percent, ChevronDown, Layers, FileText } from 'lucide-react';

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
  lesson_ids?: string[]; // NEW: Support individual lesson selection
  unlock_mode: 'modules' | 'lessons'; // NEW: Choose unlock mode
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
    // Fetch modules
    const { data: modulesData } = await supabase
      .from('modules')
      .select('id, title, order_index')
      .eq('course_id', courseId)
      .order('order_index');

    if (!modulesData) {
      setModulesWithLessons([]);
      return;
    }

    // Fetch all lessons for this course's modules
    const moduleIds = modulesData.map(m => m.id);
    const { data: lessonsData } = await supabase
      .from('lessons')
      .select('id, title, order_index, module_id')
      .in('module_id', moduleIds)
      .order('order_index');

    // Group lessons by module
    const modulesWithLessonsList: ModuleWithLessons[] = modulesData.map(module => ({
      ...module,
      lessons: (lessonsData || []).filter(l => l.module_id === module.id)
    }));

    setModulesWithLessons(modulesWithLessonsList);
    
    // Auto-expand all modules initially
    const expanded: Record<string, boolean> = {};
    modulesData.forEach(m => { expanded[m.id] = true; });
    setExpandedModules(expanded);
  };

  const handleConfigureEMI = async (course: Course) => {
    setSelectedCourse(course);
    await fetchModulesWithLessons(course.id);

    // Check if settings already exist
    const existing = emiSettings.find(s => s.course_id === course.id);
    if (existing) {
      setForm({
        is_emi_enabled: existing.is_emi_enabled,
        min_first_payment_percent: existing.min_first_payment_percent,
        max_splits: existing.max_splits,
        early_payment_discount_percent: Number(existing.early_payment_discount_percent),
        payment_tiers: existing.payment_tiers.map(t => ({
          ...t,
          unlock_mode: t.unlock_mode || 'modules',
          lesson_ids: t.lesson_ids || [],
        })),
      });
    } else {
      // Default tiers
      setForm({
        is_emi_enabled: true,
        min_first_payment_percent: 25,
        max_splits: 3,
        early_payment_discount_percent: 2,
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
          // Remove all lessons from this module
          newLessonIds = lessonIds.filter(id => !moduleLessonIds.includes(id));
        } else {
          // Add all lessons from this module
          newLessonIds = [...new Set([...lessonIds, ...moduleLessonIds])];
        }
        return { ...t, lesson_ids: newLessonIds };
      }),
    }));
  };

  const getEMIStatus = (courseId: string) => {
    const setting = emiSettings.find(s => s.course_id === courseId);
    if (!setting) return { enabled: false, tiers: 0 };
    return { enabled: setting.is_emi_enabled, tiers: setting.payment_tiers.length };
  };

  const getTotalLessonsCount = () => {
    return modulesWithLessons.reduce((acc, m) => acc + m.lessons.length, 0);
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
            Configure installment payment options for each course with progressive content unlocking (by modules OR individual lessons)
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
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Configure EMI for {selectedCourse?.title}</DialogTitle>
            <DialogDescription>
              Set up payment tiers and map content (modules or lessons) to each payment level
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

                {/* Course structure info */}
                <div className="p-3 bg-accent/10 border border-accent/20 rounded-lg">
                  <p className="text-sm text-accent-foreground">
                    <strong>Course Structure:</strong> {modulesWithLessons.length} modules, {getTotalLessonsCount()} lessons total
                  </p>
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
                        <div className="space-y-3">
                          {/* Unlock Mode Selector */}
                          <div className="space-y-2">
                            <Label>Unlock Mode</Label>
                            <Tabs 
                              value={tier.unlock_mode || 'modules'} 
                              onValueChange={(v) => updateTier(tierIndex, { unlock_mode: v as 'modules' | 'lessons' })}
                            >
                              <TabsList className="grid w-full grid-cols-2">
                                <TabsTrigger value="modules" className="flex items-center gap-2">
                                  <Layers className="h-4 w-4" />
                                  By Modules
                                </TabsTrigger>
                                <TabsTrigger value="lessons" className="flex items-center gap-2">
                                  <FileText className="h-4 w-4" />
                                  By Lessons
                                </TabsTrigger>
                              </TabsList>

                              <TabsContent value="modules" className="mt-3">
                                <div className="flex flex-wrap gap-2">
                                  {modulesWithLessons.map((module) => (
                                    <Button
                                      key={module.id}
                                      type="button"
                                      variant={tier.module_order_indices.includes(module.order_index || 0) ? 'default' : 'outline'}
                                      size="sm"
                                      onClick={() => toggleModuleInTier(tierIndex, module.order_index || 0)}
                                    >
                                      {(module.order_index ?? 0) + 1}. {module.title.slice(0, 25)}{module.title.length > 25 ? '...' : ''}
                                    </Button>
                                  ))}
                                </div>
                                <p className="text-xs text-muted-foreground mt-2">
                                  Click modules to include/exclude from this tier
                                </p>
                              </TabsContent>

                              <TabsContent value="lessons" className="mt-3">
                                <ScrollArea className="h-[250px] border rounded-lg p-3">
                                  <div className="space-y-3">
                                    {modulesWithLessons.map((module) => {
                                      const lessonIds = tier.lesson_ids || [];
                                      const moduleLessonIds = module.lessons.map(l => l.id);
                                      const allSelected = moduleLessonIds.every(id => lessonIds.includes(id));
                                      const someSelected = moduleLessonIds.some(id => lessonIds.includes(id));

                                      return (
                                        <Collapsible
                                          key={module.id}
                                          open={expandedModules[module.id]}
                                          onOpenChange={(open) => setExpandedModules(prev => ({ ...prev, [module.id]: open }))}
                                        >
                                          <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg">
                                            <Checkbox
                                              checked={allSelected}
                                              onCheckedChange={() => toggleAllLessonsInModule(tierIndex, module.id, module.lessons)}
                                              className={someSelected && !allSelected ? 'data-[state=checked]:bg-muted-foreground' : ''}
                                            />
                                            <CollapsibleTrigger className="flex items-center gap-2 flex-1 text-left">
                                              <ChevronDown className={`h-4 w-4 transition-transform ${expandedModules[module.id] ? 'rotate-180' : ''}`} />
                                              <span className="font-medium text-sm">
                                                Module {(module.order_index ?? 0) + 1}: {module.title}
                                              </span>
                                              <Badge variant="secondary" className="ml-auto text-xs">
                                                {module.lessons.filter(l => lessonIds.includes(l.id)).length}/{module.lessons.length}
                                              </Badge>
                                            </CollapsibleTrigger>
                                          </div>
                                          <CollapsibleContent>
                                            <div className="ml-6 mt-2 space-y-1 border-l-2 border-muted pl-3">
                                              {module.lessons.map((lesson) => (
                                                <div key={lesson.id} className="flex items-center gap-2 py-1">
                                                  <Checkbox
                                                    id={`lesson-${lesson.id}-${tierIndex}`}
                                                    checked={lessonIds.includes(lesson.id)}
                                                    onCheckedChange={() => toggleLessonInTier(tierIndex, lesson.id)}
                                                  />
                                                  <label
                                                    htmlFor={`lesson-${lesson.id}-${tierIndex}`}
                                                    className="text-sm cursor-pointer hover:text-primary"
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
                                <p className="text-xs text-muted-foreground mt-2">
                                  Select individual lessons to unlock for this tier ({(tier.lesson_ids || []).length} selected)
                                </p>
                              </TabsContent>
                            </Tabs>
                          </div>
                        </div>
                      )}

                      {tier.percent === 100 && (
                        <p className="text-sm text-primary bg-primary/10 p-2 rounded">
                          ✓ Full course access (all modules and lessons unlocked)
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
