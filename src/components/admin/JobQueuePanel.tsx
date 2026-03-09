import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { ListTodo, RefreshCw, Play, CheckCircle, XCircle, Clock, Loader2, Zap } from 'lucide-react';
import { toast } from 'sonner';

interface Job {
  id: string;
  job_type: string;
  status: string;
  priority: number;
  attempts: number;
  max_attempts: number;
  error_message: string | null;
  created_at: string;
  completed_at: string | null;
}

export function JobQueuePanel() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [processing, setProcessing] = useState(false);

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    const query = supabase
      .from('job_queue')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);

    if (filter !== 'all') query.eq('status', filter);
    const { data, error } = await query;
    if (error) toast.error('Failed to load jobs');
    setJobs((data as Job[]) || []);
    setLoading(false);
  }, [filter]);

  useEffect(() => { fetchJobs(); }, [fetchJobs]);

  const runProcessor = async () => {
    setProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke('process-job-queue');
      if (error) throw error;
      toast.success(`Processed ${data?.processed || 0} jobs, ${data?.failed || 0} failed`);
      fetchJobs();
    } catch (e: any) {
      toast.error(e.message || 'Failed to process');
    } finally {
      setProcessing(false);
    }
  };

  const retryJob = async (id: string) => {
    await supabase.from('job_queue').update({ status: 'pending', attempts: 0, error_message: null }).eq('id', id);
    toast.success('Job re-queued');
    fetchJobs();
  };

  const statusIcon: Record<string, any> = {
    pending: <Clock className="h-3.5 w-3.5 text-amber-500" />,
    processing: <Loader2 className="h-3.5 w-3.5 text-blue-500 animate-spin" />,
    completed: <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />,
    failed: <XCircle className="h-3.5 w-3.5 text-red-500" />,
  };

  const counts = {
    pending: jobs.filter(j => j.status === 'pending').length,
    processing: jobs.filter(j => j.status === 'processing').length,
    completed: jobs.filter(j => j.status === 'completed').length,
    failed: jobs.filter(j => j.status === 'failed').length,
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-4">
        {Object.entries(counts).map(([status, count]) => (
          <Card key={status}>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold">{count}</p>
                  <p className="text-xs text-muted-foreground capitalize">{status}</p>
                </div>
                {statusIcon[status]}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <ListTodo className="h-5 w-5 text-accent" /> Job Queue
              </CardTitle>
              <CardDescription>{jobs.length} jobs total</CardDescription>
            </div>
            <div className="flex gap-2">
              <Select value={filter} onValueChange={setFilter}>
                <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" onClick={fetchJobs} disabled={loading}>
                <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} /> Refresh
              </Button>
              <Button size="sm" onClick={runProcessor} disabled={processing} className="gap-1">
                {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
                Process Now
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">{[1,2,3].map(i => <Skeleton key={i} className="h-14 w-full" />)}</div>
          ) : jobs.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <CheckCircle className="h-12 w-12 mx-auto mb-3 text-emerald-400" />
              <p>Queue is empty</p>
            </div>
          ) : (
            <ScrollArea className="max-h-[500px]">
              <div className="space-y-2">
                {jobs.map((job) => (
                  <div key={job.id} className="flex items-center gap-3 p-3 rounded-lg border bg-muted/20">
                    {statusIcon[job.status] || statusIcon.pending}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{job.job_type}</span>
                        <Badge variant="outline" className="text-[10px]">P{job.priority}</Badge>
                        <Badge variant="secondary" className="text-[10px]">{job.attempts}/{job.max_attempts}</Badge>
                      </div>
                      {job.error_message && (
                        <p className="text-xs text-destructive mt-0.5 truncate">{job.error_message}</p>
                      )}
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {new Date(job.created_at).toLocaleString()}
                      </p>
                    </div>
                    {job.status === 'failed' && (
                      <Button variant="ghost" size="sm" onClick={() => retryJob(job.id)} className="gap-1 text-xs">
                        <Play className="h-3 w-3" /> Retry
                      </Button>
                    )}
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
