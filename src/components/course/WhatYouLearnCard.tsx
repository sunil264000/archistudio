import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface WhatYouLearnCardProps {
  courseId: string | null;
  courseTitle: string;
  modules: { id: string; title: string; lessons: { title: string }[] }[];
}

function fallbackLearningPoints(courseTitle: string, modules: { title: string; lessons: { title: string }[] }[]): string[] {
  const courseTag = courseTitle.toLowerCase();
  const points: string[] = [];

  for (const module of modules) {
    for (const lesson of module.lessons || []) {
      const cleaned = lesson.title.replace(/^[\d\s._-]+/, '').trim();
      if (cleaned.length > 8 && !points.some((p) => p.toLowerCase() === cleaned.toLowerCase())) {
        points.push(`Build confidence in ${cleaned}`);
      }
      if (points.length >= 8) return points;
    }
  }

  if (points.length < 6) {
    if (courseTag.includes('revit') || courseTag.includes('bim')) {
      points.push('Create complete BIM-ready architectural models', 'Document projects with schedules, sheets, and annotations');
    } else if (courseTag.includes('autocad')) {
      points.push('Produce precise 2D drawings with professional standards', 'Organize drawing sets for real office workflows');
    } else if (courseTag.includes('sketchup')) {
      points.push('Model interior and exterior spaces quickly', 'Prepare clean presentation scenes for client communication');
    } else if (courseTag.includes('3ds') || courseTag.includes('render')) {
      points.push('Build photoreal scenes with materials and lighting', 'Deliver portfolio-quality renders and walkthrough visuals');
    } else {
      points.push(`Master practical workflows in ${courseTitle}`, 'Execute projects from concept to final presentation');
    }
  }

  return points.slice(0, 8);
}

export function WhatYouLearnCard({ courseId, courseTitle, modules }: WhatYouLearnCardProps) {
  const [learningPoints, setLearningPoints] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const fetchPoints = async () => {
      setLoading(true);

      const modulePayload = modules.map((m) => ({
        title: m.title,
        lessons: (m.lessons || []).map((l) => l.title),
      }));

      const { data } = await supabase.functions.invoke('generate-learning-points', {
        body: {
          courseId,
          courseTitle,
          modules: modulePayload,
        },
      });

      const aiPoints = Array.isArray(data?.points)
        ? data.points.filter((p: unknown) => typeof p === 'string' && p.trim().length > 0).slice(0, 8)
        : [];

      const finalPoints = aiPoints.length >= 4
        ? aiPoints
        : fallbackLearningPoints(courseTitle, modules);

      if (mounted) {
        setLearningPoints(finalPoints);
        setLoading(false);
      }
    };

    void fetchPoints();

    return () => {
      mounted = false;
    };
  }, [courseId, courseTitle, modules]);

  if (loading) {
    return (
      <Card>
        <CardHeader><CardTitle>What You'll Learn</CardTitle></CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-2 gap-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="flex items-start gap-2">
                <div className="h-5 w-5 rounded-full bg-muted animate-pulse" />
                <div className="h-4 flex-1 rounded bg-muted animate-pulse" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>What You'll Learn</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid sm:grid-cols-2 gap-3">
          {learningPoints.map((item, i) => (
            <div key={i} className="flex items-start gap-2">
              <CheckCircle className="h-5 w-5 text-success flex-shrink-0 mt-0.5" />
              <span className="text-sm">{item}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

