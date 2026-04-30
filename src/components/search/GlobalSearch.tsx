import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { fetchGlobalSearch, getAutocompleteTerms, type SearchResult } from '@/lib/globalSearch';
import { Badge } from '@/components/ui/badge';
import { Search, BookOpen, MessageSquare, FileText, Book, X, Loader2, Command, ArrowRight, BriefcaseBusiness } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

const TYPE_CONFIG: Record<string, { icon: typeof BookOpen; label: string; color: string; path: (r: SearchResult) => string }> = {
  course: { icon: BookOpen, label: 'Course', color: 'bg-accent/10 text-accent', path: (r) => `/course/${r.slug}` },
  project: { icon: BriefcaseBusiness, label: 'Project', color: 'bg-primary/10 text-primary', path: (r) => `/studio-hub/projects/${r.result_id}` },
  forum: { icon: MessageSquare, label: 'Forum', color: 'bg-secondary text-secondary-foreground', path: (r) => `/forum/${r.result_id}` },
  blog: { icon: FileText, label: 'Blog', color: 'bg-muted text-muted-foreground', path: (r) => `/blog/${r.slug}` },
  ebook: { icon: Book, label: 'E-Book', color: 'bg-card text-card-foreground', path: () => '/ebooks' },
};

export function GlobalSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const suggestions = getAutocompleteTerms(query, results);

  // Keyboard shortcut: Ctrl/Cmd + K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(true);
      }
      if (e.key === 'Escape') {
        setOpen(false);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Focus input when overlay opens
  useEffect(() => {
    if (open) {
      // Small delay to let animation start
      setTimeout(() => inputRef.current?.focus(), 50);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      setQuery('');
      setResults([]);
      setSelectedIndex(-1);
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  // Debounced search — prefix-aware (server uses tsquery :* + ILIKE),
  // so we trigger from the very first character for an instant feel.
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.trim().length < 1) { setResults([]); return; }

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      const nextResults = await fetchGlobalSearch(supabase, query, 15);
      setResults(nextResults);
      setLoading(false);
      setSelectedIndex(-1);
    }, 150);

    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query]);

  const handleSelect = useCallback((result: SearchResult) => {
    const config = TYPE_CONFIG[result.result_type];
    if (config) navigate(config.path(result));
    setOpen(false);
  }, [navigate]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => Math.min(prev + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter' && selectedIndex >= 0 && results[selectedIndex]) {
      e.preventDefault();
      handleSelect(results[selectedIndex]);
    }
  };

  return (
    <>
      {/* Compact trigger button */}
      <button
        onClick={() => setOpen(true)}
        className="global-search-trigger group"
        aria-label="Search"
      >
        <Search className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
        <span className="hidden xl:inline text-[13px] text-muted-foreground group-hover:text-foreground transition-colors">
          Search...
        </span>
        <kbd className="hidden xl:inline-flex global-search-kbd">
          <Command className="h-2.5 w-2.5" />K
        </kbd>
      </button>

      {/* Search overlay / command palette */}
      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-background/60 backdrop-blur-sm z-[100]"
              onClick={() => setOpen(false)}
            />

            {/* Search panel */}
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.98 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="global-search-panel"
            >
              {/* Search input */}
              <div className="global-search-input-wrapper">
                <Search className="h-5 w-5 text-muted-foreground shrink-0" />
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Search courses, projects, forum, blog, ebooks..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="global-search-input"
                  autoComplete="off"
                  spellCheck={false}
                />
                {loading && (
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground shrink-0" />
                )}
                {query && !loading && (
                  <button
                    onClick={() => { setQuery(''); setResults([]); inputRef.current?.focus(); }}
                    className="p-1 rounded-md hover:bg-muted transition-colors shrink-0"
                  >
                    <X className="h-3.5 w-3.5 text-muted-foreground" />
                  </button>
                )}
                <button
                  onClick={() => setOpen(false)}
                  className="ml-1 shrink-0"
                >
                  <kbd className="global-search-kbd text-[10px]">ESC</kbd>
                </button>
              </div>

              {/* Results */}
              <div className="global-search-results">
                {query.length < 1 ? (
                  <div className="global-search-empty">
                    <div className="global-search-empty-icon">
                      <Search className="h-6 w-6 text-muted-foreground/40" />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Start typing to search
                    </p>
                    <div className="flex items-center gap-3 mt-4">
                        {[
                          { label: 'Courses', icon: BookOpen },
                          { label: 'Projects', icon: BriefcaseBusiness },
                          { label: 'Forum', icon: MessageSquare },
                          { label: 'E-Books', icon: Book },
                        ].map((item) => (
                        <div key={item.label} className="flex items-center gap-1.5 text-[11px] text-muted-foreground/60">
                          <item.icon className="h-3 w-3" />
                          {item.label}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : results.length === 0 && !loading ? (
                  <div className="global-search-empty">
                    <div className="global-search-empty-icon">
                      <Search className="h-6 w-6 text-muted-foreground/40" />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      No results found for "<span className="text-foreground font-medium">{query}</span>"
                    </p>
                    <p className="text-xs text-muted-foreground/60 mt-1">
                      Try different keywords or browse categories
                    </p>
                  </div>
                ) : (
                  <div className="p-2">
                    {suggestions.length > 0 && (
                      <div className="global-search-suggestions">
                        {suggestions.map((term) => (
                          <button
                            key={term}
                            type="button"
                            onClick={() => { setQuery(term); inputRef.current?.focus(); }}
                            className="global-search-suggestion"
                          >
                            <Search className="h-3 w-3" />
                            {term}
                          </button>
                        ))}
                      </div>
                    )}
                    {results.map((result, i) => {
                      const config = TYPE_CONFIG[result.result_type] || TYPE_CONFIG.course;
                      const Icon = config.icon;
                      const isSelected = i === selectedIndex;
                      return (
                        <motion.button
                          key={`${result.result_type}-${result.result_id}-${i}`}
                          initial={{ opacity: 0, y: 4 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.03, duration: 0.2 }}
                          onClick={() => handleSelect(result)}
                          onMouseEnter={() => setSelectedIndex(i)}
                          className={`global-search-result-item ${isSelected ? 'global-search-result-selected' : ''}`}
                        >
                          <div className={`shrink-0 w-12 h-12 rounded-lg overflow-hidden flex items-center justify-center ${!result.image_url ? config.color : 'bg-muted'} transition-all group-hover:scale-105`}>
                            {result.image_url ? (
                              <img 
                                src={result.image_url} 
                                alt="" 
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = '';
                                  (e.target as HTMLImageElement).parentElement!.classList.add(config.color);
                                }}
                              />
                            ) : (
                              <Icon className="h-5 w-5" />
                            )}
                          </div>
                          <div className="flex-1 overflow-hidden text-left">
                            <p className="text-sm font-medium text-foreground truncate">{result.title || 'Untitled'}</p>
                            {result.description && (
                              <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{result.description}</p>
                            )}
                          </div>
                          <Badge variant="outline" className="text-[10px] shrink-0 ml-2 opacity-60">{config.label}</Badge>
                          <ArrowRight className={`h-3.5 w-3.5 text-muted-foreground shrink-0 ml-1 transition-all ${isSelected ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-1'}`} />
                        </motion.button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="global-search-footer">
                <div className="flex items-center gap-3 text-[11px] text-muted-foreground/60">
                  <span className="flex items-center gap-1">
                    <kbd className="global-search-kbd-sm">↑</kbd>
                    <kbd className="global-search-kbd-sm">↓</kbd>
                    Navigate
                  </span>
                  <span className="flex items-center gap-1">
                    <kbd className="global-search-kbd-sm">↵</kbd>
                    Select
                  </span>
                  <span className="flex items-center gap-1">
                    <kbd className="global-search-kbd-sm">ESC</kbd>
                    Close
                  </span>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
