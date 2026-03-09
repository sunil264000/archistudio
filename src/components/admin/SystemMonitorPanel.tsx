import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { BarChart3, RefreshCw, TrendingUp, Eye, Clock } from 'lucide-react';
import { toast } from 'sonner';

interface MetricSummary {
  name: string;
  value: number;
  trend: number;
}

export function SystemMonitorPanel() {
  const [metrics, setMetrics] = useState<MetricSummary[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMetrics = useCallback(async () => {
    setLoading(true);
    try {
      // Get recent metrics grouped by name
      const { data } = await supabase
        .from('system_metrics')
        .select('metric_name, metric_value, recorded_at')
        .order('recorded_at', { ascending: false })
        .limit(500);

      if (!data) { setLoading(false); return; }

      // Aggregate by metric name
      const grouped: Record<string, number[]> = {};
      for (const m of data) {
        if (!grouped[m.metric_name]) grouped[m.metric_name] = [];
        grouped[m.metric_name].push(Number(m.metric_value));
      }

      const summaries: MetricSummary[] = Object.entries(grouped).map(([name, values]) => ({
        name,
        value: values.reduce((a, b) => a + b, 0),
        trend: values.length > 1 ? values[0] - values[values.length - 1] : 0,
      }));

      setMetrics(summaries.sort((a, b) => b.value - a.value));
    } catch {
      toast.error('Failed to load metrics');
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchMetrics(); }, [fetchMetrics]);

  // Also fetch quick platform health stats
  const [health, setHealth] = useState<Record<string, number>>({});

  useEffect(() => {
    const fetchHealth = async () => {
      const [errors, jobs, events] = await Promise.all([
        supabase.from('system_errors').select('id', { count: 'exact', head: true }).eq('resolved', false),
        supabase.from('job_queue').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('platform_events').select('id', { count: 'exact', head: true }).eq('processed', false),
      ]);
      setHealth({
        unresolved_errors: errors.count || 0,
        pending_jobs: jobs.count || 0,
        unprocessed_events: events.count || 0,
      });
    };
    fetchHealth();
  }, []);

  return (
    <div className="space-y-6">
      {/* Health Overview */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-red-100 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{health.unresolved_errors ?? '...'}</p>
                <p className="text-xs text-muted-foreground">Unresolved Errors</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-amber-100 flex items-center justify-center">
                <Clock className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{health.pending_jobs ?? '...'}</p>
                <p className="text-xs text-muted-foreground">Pending Jobs</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <Eye className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{health.unprocessed_events ?? '...'}</p>
                <p className="text-xs text-muted-foreground">Pending Events</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Metrics */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-accent" /> System Metrics
              </CardTitle>
              <CardDescription>Aggregated performance data</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={fetchMetrics} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} /> Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : metrics.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">No metrics recorded yet. Run jobs to generate data.</p>
          ) : (
            <div className="space-y-2">
              {metrics.map((m) => (
                <div key={m.name} className="flex items-center justify-between p-3 rounded-lg border bg-muted/20">
                  <code className="text-sm font-mono">{m.name}</code>
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-bold">{m.value}</span>
                    {m.trend !== 0 && (
                      <span className={`text-xs ${m.trend > 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                        {m.trend > 0 ? '+' : ''}{m.trend}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
