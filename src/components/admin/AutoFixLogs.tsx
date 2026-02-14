import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Wrench, CheckCircle, AlertTriangle, RefreshCw, Image, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface AutoFixLog {
  key: string;
  value: string;
  description: string | null;
  updated_at: string | null;
}

interface ParsedLog {
  key: string;
  type: string;
  course_slug?: string;
  course_title?: string;
  failed_url?: string;
  fixed_with?: string;
  fixed_at?: string;
  status?: string;
  description: string | null;
  updated_at: string | null;
}

export function AutoFixLogs() {
  const [logs, setLogs] = useState<ParsedLog[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('site_settings')
      .select('key, value, description, updated_at')
      .like('key', 'auto_fix_log_%')
      .order('updated_at', { ascending: false })
      .limit(50);

    const parsed: ParsedLog[] = (data || []).map((item: AutoFixLog) => {
      let parsed = {};
      try { parsed = JSON.parse(item.value || '{}'); } catch {}
      return { ...parsed, key: item.key, description: item.description, updated_at: item.updated_at } as ParsedLog;
    });

    setLogs(parsed);
    setLoading(false);
  };

  useEffect(() => { fetchLogs(); }, []);

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
      case 'thumbnail_auto_fix': return <Image className="h-4 w-4 text-sky-400" />;
      default: return <Wrench className="h-4 w-4 text-accent" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Wrench className="h-5 w-5 text-accent" />
              Auto-Fix Logs
            </CardTitle>
            <CardDescription>
              Issues automatically detected and resolved by the system
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
                Clear All
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {logs.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <CheckCircle className="h-12 w-12 mx-auto mb-3 text-emerald-500/50" />
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
                      <span className="font-medium text-sm">{log.course_title || 'Unknown'}</span>
                      <Badge variant="outline" className="text-xs border-emerald-500/30 text-emerald-500">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        {log.status || 'resolved'}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 break-all">
                      {log.description}
                    </p>
                    {log.fixed_at && (
                      <p className="text-xs text-muted-foreground/70 mt-1">
                        Fixed at: {new Date(log.fixed_at).toLocaleString()}
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
  );
}
