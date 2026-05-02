import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Sparkles, Loader2, Zap, FileText, Send } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

export function AdminAIHelper() {
  const [loading, setLoading] = useState(false);

  const generateDailyChallenge = async () => {
    setLoading(true);
    try {
      // In a real scenario, this would call an Edge Function that uses OpenAI
      // For now, we simulate the 'Ultra High Tech' automation
      const mockResult = {
        title: "Experimental Pavilion Design",
        brief: "Design a temporary pavilion for a 10x10m urban site using only recycled timber. Focus on joinery and assembly speed.",
        category: "Conceptual",
        difficulty: "medium"
      };

      const { error } = await (supabase as any).from('daily_challenges').insert({
        ...mockResult,
        active_date: new Date().toISOString().split('T')[0],
        is_active: true
      });

      if (error) throw error;
      toast.success('AI Challenge Generated & Published!');
    } catch (err) {
      toast.error('AI Generation failed. Check console.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-accent/40 bg-accent/[0.02] shadow-[0_0_30px_-10px_hsl(var(--accent)/0.2)]">
      <CardHeader>
        <CardTitle className="text-sm font-display font-bold flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-accent" /> AI Content Engine
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-xs text-muted-foreground leading-relaxed">
          One-click automation to keep Archistudio alive. AI will generate and publish content instantly.
        </p>
        <div className="grid grid-cols-2 gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={generateDailyChallenge}
            disabled={loading}
            className="text-[10px] uppercase tracking-widest h-9 rounded-xl border-accent/20 hover:bg-accent/10 transition-all"
          >
            {loading ? <Loader2 className="h-3 w-3 animate-spin mr-1.5" /> : <Zap className="h-3 w-3 mr-1.5 text-accent" />}
            Gen Challenge
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            disabled={true}
            className="text-[10px] uppercase tracking-widest h-9 rounded-xl border-border/40 opacity-50"
          >
            <FileText className="h-3 w-3 mr-1.5" />
            Gen Resource
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
