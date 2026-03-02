import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface WhatYouLearnCardProps {
  courseId: string | null;
  courseTitle: string;
  modules: { id: string; title: string; lessons: { title: string }[] }[];
}

function generateLearningPoints(courseTitle: string, modules: { title: string; lessons: { title: string }[] }[]): string[] {
  const points: string[] = [];

  // Use module titles as learning points
  for (const mod of modules) {
    if (points.length >= 8) break;
    points.push(`Master ${mod.title}`);
  }

  // If modules have lessons, add top lesson titles as additional points
  if (points.length < 6) {
    for (const mod of modules) {
      for (const lesson of mod.lessons) {
        if (points.length >= 8) break;
        const cleaned = lesson.title.replace(/^\d+[\.\-\s]+/, '').trim();
        if (cleaned.length > 5 && !points.some(p => p.toLowerCase().includes(cleaned.toLowerCase()))) {
          points.push(cleaned);
        }
      }
      if (points.length >= 8) break;
    }
  }

  return points.slice(0, 8);
}

export function WhatYouLearnCard({ courseId, courseTitle, modules }: WhatYouLearnCardProps) {
  const [learningPoints, setLearningPoints] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPoints = async () => {
      // If we have modules from props (enrolled user), use them
      if (modules.length > 0) {
        const points = generateLearningPoints(courseTitle, modules);
        if (points.length >= 3) {
          setLearningPoints(points);
          setLoading(false);
          return;
        }
      }

      // Fetch from DB for non-enrolled users
      if (courseId) {
        const { data: dbModules } = await supabase
          .from('modules')
          .select('title, description')
          .eq('course_id', courseId)
          .order('order_index', { ascending: true })
          .limit(10);

        if (dbModules && dbModules.length > 0) {
          const points = dbModules.slice(0, 8).map(m => 
            m.description || `Master ${m.title}`
          );
          setLearningPoints(points);
          setLoading(false);
          return;
        }
      }

      // Fallback: generate generic points based on course title
      const titleLower = courseTitle.toLowerCase();
      const fallbacks: string[] = [];
      
      if (titleLower.includes('3ds max') || titleLower.includes('3d')) {
        fallbacks.push('3D modeling fundamentals and advanced techniques', 'Realistic material creation and texturing', 'Lighting setups for architectural scenes', 'Camera composition and rendering', 'Post-production workflow', 'Scene optimization and management');
      } else if (titleLower.includes('autocad')) {
        fallbacks.push('2D drafting and precision drawing', 'Layer management and organization', 'Working drawings and construction documents', 'Dimensioning and annotation standards', 'Plot setup and publishing', 'Template creation for efficiency');
      } else if (titleLower.includes('revit') || titleLower.includes('bim')) {
        fallbacks.push('BIM modeling fundamentals', 'Family creation and customization', 'Construction documentation', 'Collaborative workflows', 'Schedule generation and management', 'Rendering within Revit');
      } else if (titleLower.includes('sketchup') || titleLower.includes('sketch')) {
        fallbacks.push('3D modeling with SketchUp tools', 'Component and group management', 'Material application and texturing', 'Scene setup and presentation', 'Layout for construction documents', 'Plugin workflows for efficiency');
      } else if (titleLower.includes('corona') || titleLower.includes('render') || titleLower.includes('vray')) {
        fallbacks.push('Photorealistic rendering techniques', 'Material editor mastery', 'Interior and exterior lighting', 'Camera settings for best results', 'Post-production enhancements', 'Render optimization');
      } else if (titleLower.includes('interior')) {
        fallbacks.push('Space planning and layout design', 'Color theory and material selection', 'Furniture arrangement principles', 'Lighting design for interiors', 'Client presentation techniques', 'Portfolio-ready visualization');
      } else {
        fallbacks.push(`Core concepts of ${courseTitle}`, 'Real-world professional workflows', 'Industry-standard techniques', 'Hands-on project experience', 'Best practices and optimization', 'Portfolio-ready output');
      }
      
      setLearningPoints(fallbacks);
      setLoading(false);
    };

    fetchPoints();
  }, [courseId, courseTitle, modules]);

  if (loading) {
    return (
      <Card>
        <CardHeader><CardTitle>What You'll Learn</CardTitle></CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-2 gap-3">
            {[1,2,3,4,5,6].map(i => (
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
