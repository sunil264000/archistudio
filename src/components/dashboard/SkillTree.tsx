import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Lock, CheckCircle2, BookOpen, Paintbrush, FileImage, Code, Layers, Ruler, Compass, Target } from 'lucide-react';
import { motion } from 'framer-motion';

interface SkillNode {
  id: string;
  name: string;
  icon: any;
  color: string;
  children: SkillNode[];
  progress: number;
  unlocked: boolean;
  courseIds: string[];
}

const ICON_MAP: Record<string, any> = {
  concept: Compass,
  technical: Code,
  presentation: FileImage,
  modeling: Layers,
  detailing: Ruler,
  design: Paintbrush,
  default: BookOpen,
};

export function SkillTree() {
  const { user } = useAuth();
  const [tree, setTree] = useState<SkillNode[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    buildSkillTree();
  }, [user]);

  const buildSkillTree = async () => {
    if (!user) return;

    // Get all courses with categories
    const { data: courses } = await supabase
      .from('courses')
      .select('id, title, category_id, subcategory, tags, total_lessons')
      .eq('is_published', true);

    // Get user's progress
    const { data: enrollments } = await supabase
      .from('enrollments')
      .select('course_id')
      .eq('user_id', user.id)
      .eq('status', 'active');

    const { data: certs } = await supabase
      .from('certificates')
      .select('course_id')
      .eq('user_id', user.id);

    const { data: progressData } = await supabase
      .from('progress')
      .select('lesson_id, completed, lessons:lesson_id (module_id, modules:module_id (course_id))')
      .eq('user_id', user.id);

    const enrolledIds = new Set((enrollments || []).map((e: any) => e.course_id));
    const completedCourseIds = new Set((certs || []).map((c: any) => c.course_id));

    // Build course completion map
    const courseCompletionMap = new Map<string, { completed: number; total: number }>();
    for (const course of (courses || [])) {
      const courseLessons = (progressData || []).filter((p: any) =>
        p.lessons?.modules?.course_id === course.id
      );
      const completed = courseLessons.filter((p: any) => p.completed).length;
      courseCompletionMap.set(course.id, {
        completed,
        total: course.total_lessons || 1,
      });
    }

    // Group courses by category
    const categoryMap = new Map<string, typeof courses>();
    for (const course of (courses || [])) {
      const cat = course.category_id || 'general';
      if (!categoryMap.has(cat)) categoryMap.set(cat, []);
      categoryMap.get(cat)!.push(course);
    }

    // Build tree nodes
    const SKILL_COLORS = ['text-blue-500', 'text-emerald-500', 'text-purple-500', 'text-orange-500', 'text-pink-500', 'text-cyan-500'];
    const nodes: SkillNode[] = [];
    let colorIdx = 0;

    for (const [category, catCourses] of categoryMap) {
      const courseIds = catCourses.map(c => c.id);
      const totalLessons = catCourses.reduce((sum, c) => sum + (c.total_lessons || 0), 0);
      const completedLessons = courseIds.reduce((sum, id) => sum + (courseCompletionMap.get(id)?.completed || 0), 0);
      const progress = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
      const hasEnrolled = courseIds.some(id => enrolledIds.has(id));

      const catName = category.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
      const iconKey = Object.keys(ICON_MAP).find(k => category.toLowerCase().includes(k)) || 'default';

      // Sub-skills from subcategories
      const subcatMap = new Map<string, typeof catCourses>();
      for (const course of catCourses) {
        const sub = course.subcategory || 'Core';
        if (!subcatMap.has(sub)) subcatMap.set(sub, []);
        subcatMap.get(sub)!.push(course);
      }

      const children: SkillNode[] = [];
      for (const [subcat, subCourses] of subcatMap) {
        const subCourseIds = subCourses.map(c => c.id);
        const subTotal = subCourses.reduce((sum, c) => sum + (c.total_lessons || 0), 0);
        const subCompleted = subCourseIds.reduce((sum, id) => sum + (courseCompletionMap.get(id)?.completed || 0), 0);
        const subProgress = subTotal > 0 ? Math.round((subCompleted / subTotal) * 100) : 0;

        children.push({
          id: `${category}-${subcat}`,
          name: subcat,
          icon: ICON_MAP[iconKey],
          color: SKILL_COLORS[colorIdx % SKILL_COLORS.length],
          children: [],
          progress: subProgress,
          unlocked: subCourseIds.some(id => enrolledIds.has(id)),
          courseIds: subCourseIds,
        });
      }

      nodes.push({
        id: category,
        name: catName,
        icon: ICON_MAP[iconKey],
        color: SKILL_COLORS[colorIdx % SKILL_COLORS.length],
        children,
        progress,
        unlocked: hasEnrolled,
        courseIds,
      });
      colorIdx++;
    }

    setTree(nodes.sort((a, b) => b.progress - a.progress));
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[1, 2, 3, 4].map(i => (
          <Card key={i}><CardContent className="p-6"><div className="h-28 animate-pulse bg-muted rounded-xl" /></CardContent></Card>
        ))}
      </div>
    );
  }

  if (tree.length === 0) {
    return (
      <Card>
        <CardContent className="py-10 text-center">
          <Target className="h-10 w-10 mx-auto text-muted-foreground/40 mb-3" />
          <p className="text-muted-foreground">Enroll in courses to build your skill tree</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Target className="h-5 w-5 text-accent" />
        <h3 className="font-semibold text-foreground">Architecture Skill Tree</h3>
      </div>

      <TooltipProvider>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {tree.map((node, i) => {
            const Icon = node.icon;
            return (
              <motion.div
                key={node.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
              >
                <Card className={`overflow-hidden transition-all ${node.unlocked ? 'hover:border-accent/30' : 'opacity-70'}`}>
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className={`h-8 w-8 rounded-lg bg-muted flex items-center justify-center`}>
                          {node.unlocked ? (
                            <Icon className={`h-4 w-4 ${node.color}`} />
                          ) : (
                            <Lock className="h-4 w-4 text-muted-foreground" />
                          )}
                        </div>
                        <div>
                          <h4 className="text-sm font-semibold text-foreground">{node.name}</h4>
                          <p className="text-[10px] text-muted-foreground">{node.courseIds.length} courses</p>
                        </div>
                      </div>
                      <Badge variant={node.progress === 100 ? 'default' : 'secondary'} className="text-xs">
                        {node.progress === 100 ? <CheckCircle2 className="h-3 w-3 mr-0.5" /> : null}
                        {node.progress}%
                      </Badge>
                    </div>

                    <Progress value={node.progress} className="h-1.5" />

                    {/* Sub-skills */}
                    {node.children.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {node.children.map(child => (
                          <Tooltip key={child.id}>
                            <TooltipTrigger asChild>
                              <div className={`px-2 py-0.5 rounded-full text-[10px] font-medium border transition-colors ${
                                child.progress === 100
                                  ? 'bg-accent/10 text-accent border-accent/20'
                                  : child.unlocked
                                    ? 'bg-muted text-foreground border-border'
                                    : 'bg-muted/50 text-muted-foreground border-border/50'
                              }`}>
                                {child.progress === 100 && <CheckCircle2 className="h-2.5 w-2.5 inline mr-0.5" />}
                                {child.name}
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="text-xs">{child.name}: {child.progress}% complete</p>
                            </TooltipContent>
                          </Tooltip>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </TooltipProvider>
    </div>
  );
}
