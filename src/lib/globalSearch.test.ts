import { describe, expect, it, vi } from 'vitest';
import { fetchGlobalSearch, getAutocompleteTerms, hasGlobalSearchColumns } from './globalSearch';

const autocadResult = {
  result_type: 'course',
  result_id: 'course-1',
  title: 'Architectural AutoCAD Drafting',
  description: 'Essential drafting skills for architectural professionals.',
  slug: 'architectural-autocad-drafting',
  image_url: 'https://example.com/autocad.jpg',
  relevance: 0.65,
};

describe('globalSearch helpers', () => {
  it('keeps only rows with the expected global_search response columns', async () => {
    const rpc = vi.fn().mockResolvedValue({
      data: [autocadResult, { title: 'Broken row', thumbnail_url: 'wrong-field.jpg' }],
      error: null,
    });

    const results = await fetchGlobalSearch({ rpc }, 'autoc', 10);

    expect(rpc).toHaveBeenCalledWith('global_search', { search_query: 'autoc', result_limit: 10 });
    expect(results).toEqual([autocadResult]);
    expect(hasGlobalSearchColumns(results[0])).toBe(true);
    expect(results[0]).toHaveProperty('image_url', 'https://example.com/autocad.jpg');
  });

  it('suggests AutoCAD while the user types a prefix like autoc', () => {
    expect(getAutocompleteTerms('autoc', [autocadResult])).toContain('AutoCAD');
  });
});