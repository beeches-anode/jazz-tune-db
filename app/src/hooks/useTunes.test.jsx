import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useTunes } from './useTunes';

describe('useTunes', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('fetches tunes from GitHub raw URL on mount', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve([
        { id: 't1', tune_name: 'Stella by Starlight', composer: 'Victor Young', is_archived: false },
        { id: 't2', tune_name: 'Autumn Leaves', composer: 'Joseph Kosma', is_archived: false },
      ]),
      headers: new Headers({ ETag: 'abc123' }),
    });

    const { result } = renderHook(() => useTunes());

    await waitFor(() => expect(result.current.tunes).toHaveLength(2));
    expect(result.current.loading).toBe(false);
    expect(result.current.tunes[0].tune_name).toBe('Stella by Starlight');
  });

  it('filters out archived tunes', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve([
        { id: 't1', tune_name: 'Active', is_archived: false },
        { id: 't2', tune_name: 'Archived', is_archived: true },
      ]),
      headers: new Headers({ ETag: 'abc123' }),
    });

    const { result } = renderHook(() => useTunes());

    await waitFor(() => expect(result.current.tunes).toHaveLength(1));
    expect(result.current.tunes[0].tune_name).toBe('Active');
  });

  it('serves from localStorage cache while revalidating', async () => {
    localStorage.setItem('jazz-tunes-cache', JSON.stringify({
      sha: 'old-sha',
      tunes: [{ id: 't1', tune_name: 'Cached', is_archived: false }],
    }));

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve([
        { id: 't1', tune_name: 'Fresh', is_archived: false },
      ]),
      headers: new Headers({ ETag: 'new-sha' }),
    });

    const { result } = renderHook(() => useTunes());

    // Should immediately show cached data
    expect(result.current.tunes[0].tune_name).toBe('Cached');

    // Then revalidate
    await waitFor(() => expect(result.current.tunes[0].tune_name).toBe('Fresh'));
  });
});
