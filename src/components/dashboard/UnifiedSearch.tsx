import { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Search, BookOpen, FileImage, MessageSquare, Paintbrush, Library, Loader2, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface SearchResult {
  type: 'course' | 'sheet' | 'forum' | 'resource' | 'project';
  id: string;
  title: string;
  subtitle?: string;
  link: string;
}

const TYPE_META: Record<string, { icon: any; color: string; label: string }> = {
  course: { icon: BookOpen, color: 'text-blue-500', label: 'Course' },
  sheet: { icon: FileImage, color: 'text-green-500', label: 'Sheet' },
  forum: { icon: MessageSquare, color: 'text-purple-500', label: 'Forum' },
  resource: { icon: Library, color: 'text-orange-500', label: 'Resource' },
  project: { icon: Paintbrush, color: 'text-pink-500', label: 'Project' },
};

interface UnifiedSearchProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UnifiedSearch({ open, onOpenChange }: UnifiedSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setSearched(true);
    const q = `%${query.trim()}%`;

    const [coursesRes, sheetsRes, forumRes, resourcesRes] = await Promise.all([
      supabase.from('courses').select('id, title, slug, short_description').ilike('title', q).eq('is_published', true).limit(5),
      supabase.from('sheet_reviews').select('id, title').ilike('title', q).limit(5),
      supabase.from('forum_topics').select('id, title, category').ilike('title', q).limit(5),
      supabase.from('resources').select('id, title, category').ilike('title', q).eq('is_published', true).limit(5),
    ]);

    const all: SearchResult[] = [
      ...(coursesRes.data || []).map((c: any) => ({
        type: 'course' as const, id: c.id, title: c.title,
        subtitle: c.short_description, link: `/course/${c.slug}`,
      })),
      ...(sheetsRes.data || []).map((s: any) => ({
        type: 'sheet' as const, id: s.id, title: s.title, link: `/sheets/${s.id}`,
      })),
      ...(forumRes.data || []).map((f: any) => ({
        type: 'forum' as const, id: f.id, title: f.title,
        subtitle: f.category, link: `/forum/${f.id}`,
      })),
      ...(resourcesRes.data || []).map((r: any) => ({
        type: 'resource' as const, id: r.id, title: r.title,
        subtitle: r.category, link: `/resources`,
      })),
    ];

    setResults(all);
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Search className="h-5 w-5 text-accent" /> Search Everything
          </DialogTitle>
        </DialogHeader>

        <div className="flex gap-2">
          <Input
            placeholder="Search courses, sheets, forum, resources..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            autoFocus
          />
          <Button onClick={handleSearch} disabled={loading || !query.trim()}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Search'}
          </Button>
        </div>

        {searched && (
          <div className="max-h-80 overflow-y-auto space-y-1 mt-2">
            {results.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">No results found for "{query}"</p>
            ) : (
              results.map((r) => {
                const meta = TYPE_META[r.type];
                const Icon = meta.icon;
                return (
                  <Link key={`${r.type}-${r.id}`} to={r.link} onClick={() => onOpenChange(false)}>
                    <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                      <Icon className={`h-4 w-4 shrink-0 ${meta.color}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{r.title}</p>
                        {r.subtitle && <p className="text-xs text-muted-foreground truncate">{r.subtitle}</p>}
                      </div>
                      <Badge variant="outline" className="text-[10px] shrink-0">{meta.label}</Badge>
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
