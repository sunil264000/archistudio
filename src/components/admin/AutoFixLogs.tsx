import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Wrench, CheckCircle, RefreshCw, Image, Trash2, Bot, Settings, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';

interface ParsedLog {
  key: string;
  type: string;
  course_slug?: string;
  course_title?: string;
  failed_url?: string;
  fixed_with?: string;
  fixed_at?: string;
  status?: string;
  severity?: string;
  description: string | null;
  updated_at: string | null;
}

export function AutoFixLogs() {
  const [logs, setLogs] = useState<ParsedLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [aiLevel, setAiLevel] = useState('medium');

  const fetchLogs = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('site_settings')
      .select('key, value, description, updated_at')
      .like('key', 'auto_fix_log_%')
      .order('updated_at', { ascending: false })
      .limit(50);

    const parsed: ParsedLog[] = (data || []).map((item: any) => {
      let p = {};
      try { p = JSON.parse(item.value || '{}'); } catch {}
      return { ...p, key: item.key, description: item.description, updated_at: item.updated_at } as ParsedLog;
    });

    setLogs(parsed);
    setLoading(false);
  };

  const fetchAiLevel = async () => {
    const { data } = await supabase
      .from('site_settings')
      .select('value')
      .eq('key', 'ai_autofix_level')
      .single();
    if (data?.value) setAiLevel(data.value);
  };

  useEffect(() => { fetchLogs(); fetchAiLevel(); }, []);

  const updateAiLevel = async (level: string) => {
    setAiLevel(level);
    await supabase.from('site_settings').upsert({
      key: 'ai_autofix_level',
      value: level,
      description: `AI auto-fix solvability level: ${level}`,
    }, { onConflict: 'key' });
    toast.success(`AI auto-fix level set to: ${level}`);
  };

  const clearLogs = async () => {
    const keys = logs.map(l => l.key);
    if (keys.length === 0) return;
    for (const key of keys) {
      await supabase.from('site_settings').delete().eq('key', key);
    }
    toast.success('All auto-fix logs cleared');
    fetchLogs();
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'thumbnail_auto_fix': return <Image className="h-4 w-4 text-accent" />;
      default: return <Wrench className="h-4 w-4 text-accent" />;
    }
  };

  const levelDescriptions: Record<string, { label: string; desc: string; color: string }> = {
    off: { label: 'Off', desc: 'No automatic fixes. All issues require manual intervention.', color: 'text-muted-foreground' },
    low: { label: 'Low - Cosmetic Only', desc: 'Auto-fix only visual issues like broken thumbnails and missing images.', color: 'text-accent' },
    medium: { label: 'Medium - Safe Fixes', desc: 'Fix thumbnails, placeholder data, and minor UI issues automatically.', color: 'text-warning' },
    high: { label: 'High - Aggressive', desc: 'Attempt to fix all detectable issues including data inconsistencies.', color: 'text-destructive' },
  };

  return (
    <div className="space-y-6">
      {/* AI Auto-Fix Level Control */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-accent" />
            AI Auto-Fix Configuration
          </CardTitle>
          <CardDescription>
            Control how aggressively the AI resolves issues automatically
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Solvability Level</Label>
              <Select value={aiLevel} onValueChange={updateAiLevel}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(levelDescriptions).map(([key, { label }]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <div className={`p-3 rounded-lg border bg-muted/30 w-full ${levelDescriptions[aiLevel]?.color || ''}`}>
                <div className="flex items-center gap-2 mb-1">
                  <ShieldAlert className="h-4 w-4" />
                  <span className="font-medium text-sm">{levelDescriptions[aiLevel]?.label}</span>
                </div>
                <p className="text-xs text-muted-foreground">{levelDescriptions[aiLevel]?.desc}</p>
              </div>
            </div>
          </div>

          {/* Quick level badges */}
          <div className="flex gap-2 flex-wrap">
            {Object.entries(levelDescriptions).map(([key, { label, color }]) => (
              <Badge
                key={key}
                variant={aiLevel === key ? 'default' : 'outline'}
                className={`cursor-pointer transition-all ${aiLevel === key ? '' : 'hover:bg-muted'}`}
                onClick={() => updateAiLevel(key)}
              >
                {label}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Logs */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Wrench className="h-5 w-5 text-accent" />
                Auto-Fix Activity Log
              </CardTitle>
              <CardDescription>
                {logs.length} issue{logs.length !== 1 ? 's' : ''} automatically resolved
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={fetchLogs} disabled={loading}>
                <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              {logs.length > 0 && (
                <Button variant="outline" size="sm" onClick={clearLogs}>
                  <Trash2 className="h-4 w-4 mr-1" />
                  Clear
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {logs.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <CheckCircle className="h-12 w-12 mx-auto mb-3 text-accent/40" />
              <p className="font-medium">All Systems Running Smoothly</p>
              <p className="text-sm mt-1">No auto-fix events to report</p>
            </div>
          ) : (
            <ScrollArea className="max-h-[500px]">
              <div className="space-y-3">
                {logs.map((log) => (
                  <div key={log.key} className="flex items-start gap-3 p-3 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors">
                    <div className="mt-0.5">{getIcon(log.type)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm">{log.course_title || 'System'}</span>
                        <Badge variant="outline" className="text-xs">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          {log.status || 'resolved'}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 break-all">
                        {log.description}
                      </p>
                      {log.fixed_at && (
                        <p className="text-xs text-muted-foreground/70 mt-1">
                          {new Date(log.fixed_at).toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
