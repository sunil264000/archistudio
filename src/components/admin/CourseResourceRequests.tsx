import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { 
  Download, Check, Clock, Loader2, 
  User, BookOpen, RefreshCw, ExternalLink 
} from 'lucide-react';

interface ResourceRequest {
  id: string;
  course_id: string;
  user_id: string;
  status: string;
  created_at: string;
  course_title?: string;
  user_email?: string;
}

export function CourseResourceRequests() {
  const [requests, setRequests] = useState<ResourceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('course_resource_requests')
        .select(`
          *,
          courses (title),
          profiles:user_id (email, full_name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedRequests = (data || []).map((r: any) => ({
        ...r,
        course_title: r.courses?.title,
        user_email: r.profiles?.full_name || r.profiles?.email || 'Unknown User'
      }));

      setRequests(formattedRequests);
    } catch (err: any) {
      toast.error('Failed to load resource requests');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleResolve = async (requestId: string) => {
    setProcessing(requestId);
    try {
      const { error } = await supabase
        .from('course_resource_requests')
        .update({ status: 'resolved' })
        .eq('id', requestId);

      if (error) throw error;
      toast.success('Request marked as resolved');
      fetchRequests();
    } catch (err: any) {
      toast.error('Failed to update request');
    } finally {
      setProcessing(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Course Resource Requests</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Manage student requests for project files and course resources.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchRequests}>
          <RefreshCw className="h-4 w-4 mr-1" /> Refresh
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : requests.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Download className="h-10 w-10 mx-auto mb-3 opacity-40" />
            <p>No resource requests found.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {requests.map(request => (
            <Card key={request.id} className="overflow-hidden">
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge variant={request.status === 'pending' ? 'secondary' : 'default'}>
                        {request.status}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(request.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-4 w-4 text-accent" />
                      <span className="font-medium">{request.course_title}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <User className="h-3 w-3" />
                      <span>{request.user_email}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    {request.status === 'pending' && (
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="flex-1 sm:flex-none text-green-600 border-green-600/20 hover:bg-green-600/10"
                        onClick={() => handleResolve(request.id)}
                        disabled={processing === request.id}
                      >
                        {processing === request.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3 mr-1" />}
                        Mark Resolved
                      </Button>
                    )}
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="flex-1 sm:flex-none"
                      onClick={() => window.open(`/course/${request.id}`, '_blank')} // Need slug for real link
                    >
                      <ExternalLink className="h-3 w-3 mr-1" />
                      View Course
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
