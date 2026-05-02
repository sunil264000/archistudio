import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function useAIProjectAssistant() {
  const [isOptimizing, setIsOptimizing] = useState(false);

  const optimizeBrief = async (title: string, description: string) => {
    if (!title.trim() || description.trim().length < 10) {
      toast.error('Tell me a bit more first so I can help you better.');
      return null;
    }

    setIsOptimizing(true);
    try {
      const { data, error } = await supabase.functions.invoke('optimize-project-brief', {
        body: { title, description }
      });

      if (error) throw error;

      toast.success('Brief optimized with AI! ✨');
      return {
        optimizedDescription: data.optimizedDescription,
        suggestedSkills: data.suggestedSkills || [],
        suggestedTools: data.suggestedTools || []
      };
    } catch (error: any) {
      console.error('AI Optimization error:', error);
      toast.error('AI is taking a break. Please try again later.');
      return null;
    } finally {
      setIsOptimizing(false);
    }
  };

  return { optimizeBrief, isOptimizing };
}
