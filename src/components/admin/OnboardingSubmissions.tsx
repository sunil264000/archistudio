import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Sparkles, Search } from 'lucide-react';

interface OnboardingEntry {
  id: string;
  user_id: string;
  full_name: string | null;
  age: number | null;
  role_track: string;
  discovery_source: string;
  primary_challenge: string;
  notes: string | null;
  created_at: string;
}

const roleLabels: Record<string, string> = {
  college_student: 'College Student',
  architect: 'Architect',
  freelancer: 'Freelancer',
  other: 'Other',
};

const sourceLabels: Record<string, string> = {
  instagram: 'Instagram',
  youtube: 'YouTube',
  friend_referral: 'Friend Referral',
  google_search: 'Google Search',
  other: 'Other',
};

export function OnboardingSubmissions() {
  const [entries, setEntries] = useState<OnboardingEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    (async () => {
      const { data } = await (supabase as any)
        .from('user_onboarding_intake')
        .select('*')
        .order('created_at', { ascending: false });
      setEntries(data || []);
      setLoading(false);
    })();
  }, []);

  const filtered = entries.filter(e =>
    (e.full_name || '').toLowerCase().includes(search.toLowerCase()) ||
    e.primary_challenge.toLowerCase().includes(search.toLowerCase()) ||
    e.role_track.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Onboarding Submissions
            </CardTitle>
            <CardDescription>{entries.length} total submissions</CardDescription>
          </div>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-center text-muted-foreground py-8">Loading...</p>
        ) : filtered.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">No submissions found.</p>
        ) : (
          <div className="space-y-3">
            {filtered.map(entry => (
              <div key={entry.id} className="p-4 border rounded-xl space-y-2 hover:bg-muted/30 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-primary font-semibold text-sm">
                        {(entry.full_name || '?').charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium">{entry.full_name || 'Anonymous'}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(entry.created_at).toLocaleDateString()} • Age: {entry.age || 'N/A'}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Badge variant="secondary">{roleLabels[entry.role_track] || entry.role_track}</Badge>
                    <Badge variant="outline">{sourceLabels[entry.discovery_source] || entry.discovery_source}</Badge>
                  </div>
                </div>
                <div className="bg-muted/50 rounded-lg p-3">
                  <p className="text-xs font-medium text-muted-foreground mb-1">Challenge</p>
                  <p className="text-sm">{entry.primary_challenge}</p>
                </div>
                {entry.notes && (
                  <div className="bg-muted/30 rounded-lg p-3">
                    <p className="text-xs font-medium text-muted-foreground mb-1">Additional Notes</p>
                    <p className="text-sm">{entry.notes}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
