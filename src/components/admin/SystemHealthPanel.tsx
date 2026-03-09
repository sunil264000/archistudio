import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Wrench, CheckCircle, RefreshCw, AlertTriangle, Loader2, Zap } from 'lucide-react';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';

interface SystemError {
  id: string;
  service: string;
  error_type: string;
  payload: any;
  resolved: boolean;
  resolution_note: string | null;
  auto_fix_attempted: boolean;
  attempts: number;
  created_at: string;
  resolved_at: string | null;
}

export function SystemHealthPanel() {
  const [errors, setErrors] = useState<SystemError[]>([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);

  const fetchErrors = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('system_errors')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) toast.error('Failed to load system errors');
    setErrors((data as SystemError[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchErrors(); }, []);

  const runRepair = async () => {
    setRunning(true);
    try {
      const { data, error } = await supabase.functions.invoke('system-repair');
      if (error) throw error;
      toast.success(`Repair complete: ${data?.errors_fixed || 0} fixed, ${data?.integrity_issues || 0} issues found`);
      fetchErrors();
    } catch (e: any) {
      toast.error(e.message || 'Repair failed');
    } finally {
      setRunning(false);
    }
  };

  const unresolvedCount = errors.filter(e => !e.resolved).length;
  const resolvedCount = errors.filter(e => e.resolved).length;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-8 w-8 text-amber-500" />
              <div>
                <p className="text-2xl font-bold">{unresolvedCount}</p>
                <p className="text-sm text-muted-foreground">Unresolved</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-8 w-8 text-emerald-500" />
              <div>
                <p className="text-2xl font-bold">{resolvedCount}</p>
                <p className="text-sm text-muted-foreground">Auto-Fixed</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <Button onClick={runRepair} disabled={running} className="w-full h-full gap-2" variant="outline">
              {running ? <Loader2 className="h-5 w-5 animate-spin" /> : <Zap className="h-5 w-5 text-accent" />}
              {running ? 'Running Repair...' : 'Run System Repair'}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Error List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Wrench className="h-5 w-5 text-accent" />
                System Errors & Auto-Fixes
              </CardTitle>
              <CardDescription>{errors.length} total entries</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={fetchErrors} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} /> Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full rounded-lg" />)}
            </div>
          ) : errors.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <CheckCircle className="h-12 w-12 mx-auto mb-3 text-emerald-400" />
              <p className="font-medium">All Systems Healthy</p>
            </div>
          ) : (
            <ScrollArea className="max-h-[500px]">
              <div className="space-y-2">
                {errors.map((err) => (
                  <div key={err.id} className="flex items-start gap-3 p-3 rounded-lg border bg-muted/20">
                    {err.resolved ? (
                      <CheckCircle className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm">{err.error_type}</span>
                        <Badge variant="outline" className="text-[10px]">{err.service}</Badge>
                        <Badge variant={err.resolved ? 'default' : 'secondary'} className="text-[10px]">
                          {err.resolved ? 'Resolved' : `Attempt ${err.attempts}/3`}
                        </Badge>
                      </div>
                      {err.resolution_note && (
                        <p className="text-xs text-muted-foreground mt-1">{err.resolution_note}</p>
                      )}
                      <p className="text-xs text-muted-foreground/70 mt-1">
                        {new Date(err.created_at).toLocaleString()}
                        {err.resolved_at && ` → Fixed ${new Date(err.resolved_at).toLocaleString()}`}
                      </p>
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
