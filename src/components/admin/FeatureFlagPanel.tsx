import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Flag, RefreshCw, Plus, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface FeatureFlag {
  id: string;
  flag_key: string;
  enabled: boolean;
  description: string | null;
  rollout_percentage: number;
  updated_at: string;
}

export function FeatureFlagPanel() {
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [loading, setLoading] = useState(true);
  const [newKey, setNewKey] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [adding, setAdding] = useState(false);

  const fetchFlags = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('feature_flags')
      .select('*')
      .order('flag_key');
    if (error) toast.error('Failed to load flags');
    setFlags((data as FeatureFlag[]) || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchFlags(); }, [fetchFlags]);

  const toggleFlag = async (id: string, enabled: boolean) => {
    const { error } = await supabase
      .from('feature_flags')
      .update({ enabled, updated_at: new Date().toISOString() })
      .eq('id', id);
    if (error) {
      toast.error('Failed to update');
    } else {
      toast.success(`Flag ${enabled ? 'enabled' : 'disabled'}`);
      setFlags(prev => prev.map(f => f.id === id ? { ...f, enabled } : f));
    }
  };

  const addFlag = async () => {
    if (!newKey.trim()) return;
    setAdding(true);
    const { error } = await supabase.from('feature_flags').insert({
      flag_key: newKey.trim().toLowerCase().replace(/\s+/g, '_'),
      description: newDesc.trim() || null,
      enabled: false,
    });
    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Flag created');
      setNewKey('');
      setNewDesc('');
      fetchFlags();
    }
    setAdding(false);
  };

  return (
    <div className="space-y-6">
      {/* Add New Flag */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Plus className="h-4 w-4" /> Add Feature Flag
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input placeholder="flag_key" value={newKey} onChange={(e) => setNewKey(e.target.value)} className="flex-1" />
            <Input placeholder="Description (optional)" value={newDesc} onChange={(e) => setNewDesc(e.target.value)} className="flex-1" />
            <Button onClick={addFlag} disabled={adding || !newKey.trim()}>
              {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Add'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Flag List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Flag className="h-5 w-5 text-accent" /> Feature Flags
              </CardTitle>
              <CardDescription>{flags.length} flags configured</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={fetchFlags} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} /> Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-14 w-full" />)}</div>
          ) : flags.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">No feature flags yet</p>
          ) : (
            <ScrollArea className="max-h-[500px]">
              <div className="space-y-2">
                {flags.map((flag) => (
                  <div key={flag.id} className="flex items-center justify-between p-4 rounded-lg border bg-muted/20">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <code className="text-sm font-mono font-medium">{flag.flag_key}</code>
                        <Badge variant={flag.enabled ? 'default' : 'secondary'} className="text-[10px]">
                          {flag.enabled ? 'ON' : 'OFF'}
                        </Badge>
                      </div>
                      {flag.description && (
                        <p className="text-xs text-muted-foreground mt-0.5">{flag.description}</p>
                      )}
                      <p className="text-[10px] text-muted-foreground/60 mt-0.5">
                        Updated {new Date(flag.updated_at).toLocaleString()}
                      </p>
                    </div>
                    <Switch checked={flag.enabled} onCheckedChange={(val) => toggleFlag(flag.id, val)} />
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
