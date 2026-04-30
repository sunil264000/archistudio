export interface SearchResult {
  result_type: string;
  result_id: string;
  title: string;
  description: string | null;
  slug: string | null;
  image_url: string | null;
  relevance: number;
}

export const GLOBAL_SEARCH_COLUMNS = [
  'result_type',
  'result_id',
  'title',
  'description',
  'slug',
  'image_url',
  'relevance',
] as const;

type SearchClient = {
  rpc: (fn: 'global_search', args: { search_query: string; result_limit: number }) => Promise<{ data: unknown; error: unknown }>;
};

export const hasGlobalSearchColumns = (value: unknown): value is SearchResult => {
  if (!value || typeof value !== 'object') return false;
  return GLOBAL_SEARCH_COLUMNS.every((column) => column in value);
};

export const getAutocompleteTerms = (query: string, results: SearchResult[], limit = 5) => {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) return [];

  const terms = new Map<string, string>();
  results
    .filter((result) => result.result_type === 'course' || result.result_type === 'project')
    .flatMap((result) => [result.title, result.description ?? ''])
    .join(' ')
    .match(/[A-Za-z][A-Za-z0-9+#.-]{1,}/g)
    ?.forEach((term) => {
      const key = term.toLowerCase();
      if (key.startsWith(normalizedQuery) && !terms.has(key)) terms.set(key, term);
    });

  return Array.from(terms.values()).slice(0, limit);
};

export const fetchGlobalSearch = async (client: SearchClient, query: string, limit = 15) => {
  const searchQuery = query.trim();
  if (!searchQuery) return [];

  const { data, error } = await client.rpc('global_search', {
    search_query: searchQuery,
    result_limit: limit,
  });

  if (error || !Array.isArray(data)) return [];
  return data.filter(hasGlobalSearchColumns);
};