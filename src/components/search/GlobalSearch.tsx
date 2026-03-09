import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, BookOpen, MessageSquare, FileText, Book, X, Loader2 } from 'lucide-react';

interface SearchResult {
  result_type: string;
  result_id: string;
  title: string;
  description: string | null;
  slug: string | null;
  relevance: number;
}

const TYPE_CONFIG: Record<string, { icon: typeof BookOpen; label: string; color: string; path: (r: SearchResult) => string }> = {
  course: { icon: BookOpen, label: 'Course', color: 'bg-accent/10 text-accent', path: (r) => `/course/${r.slug}` },
  forum: { icon: MessageSquare, label: 'Forum', color: 'bg-blue-500/10 text-blue-600', path: (r) => `/forum/${r.result_id}` },
  blog: { icon: FileText, label: 'Blog', color: 'bg-emerald-500/10 text-emerald-600', path: (r) => `/blog/${r.slug}` },
  ebook: { icon: Book, label: 'E-Book', color: 'bg-purple-500/10 text-purple-600', path: () => '/ebooks' },
};

export function GlobalSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const ref = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.trim().length < 2) { setResults([]); return; }

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      const { data, error } = await supabase.rpc('global_search', {
        search_query: query.trim(),
        result_limit: 15,
      });
      if (!error && data) setResults(data as SearchResult[]);
      setLoading(false);
    }, 300);

    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query]);

  const handleSelect = (result: SearchResult) => {
    const config = TYPE_CONFIG[result.result_type];
    if (config) navigate(config.path(result));
    setOpen(false);
    setQuery('');
  };

  return (
    <div ref={ref} className="relative w-full max-w-md">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search courses, forum, blog..."
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => query.length >= 2 && setOpen(true)}
          className="pl-9 pr-8 bg-secondary/50 border-border/50 h-9 text-sm"
        />
        {query && (
          <button onClick={() => { setQuery(''); setResults([]); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {open && (query.length >= 2) && (
        <div className="absolute top-full mt-2 w-full bg-card border border-border rounded-xl shadow-elevated z-50 max-h-80 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : results.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              No results found for "{query}"
            </div>
          ) : (
            <div className="p-2">
              {results.map((result, i) => {
                const config = TYPE_CONFIG[result.result_type] || TYPE_CONFIG.course;
                const Icon = config.icon;
                return (
                  <button
                    key={`${result.result_type}-${result.result_id}-${i}`}
                    onClick={() => handleSelect(result)}
                    className="w-full text-left flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className={`shrink-0 p-1.5 rounded-md ${config.color}`}>
                      <Icon className="h-3.5 w-3.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground truncate">{result.title}</p>
                      {result.description && (
                        <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{result.description}</p>
                      )}
                    </div>
                    <Badge variant="outline" className="text-[10px] shrink-0">{config.label}</Badge>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
