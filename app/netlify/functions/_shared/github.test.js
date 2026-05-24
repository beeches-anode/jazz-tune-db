import { describe, it, expect, vi } from 'vitest';
import { fetchTunesFile, commitTunesFile } from './github';

describe('fetchTunesFile', () => {
  it('returns { tunes, sha } on success', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        content: Buffer.from(JSON.stringify([{ id: 't1' }])).toString('base64'),
        sha: 'abc123',
      }),
    });
    const result = await fetchTunesFile({ token: 't', repo: 'r/r', path: 'p' });
    expect(result.sha).toBe('abc123');
    expect(result.tunes).toEqual([{ id: 't1' }]);
  });
});

describe('commitTunesFile', () => {
  it('PUTs the new content', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ commit: { sha: 'new123' }, content: { sha: 'newfile456' } }),
    });
    global.fetch = fetchMock;
    const result = await commitTunesFile({
      token: 't', repo: 'r/r', path: 'p',
      tunes: [{ id: 't1' }], sha: 'abc123', message: 'test',
    });
    expect(result.sha).toBe('newfile456');
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/contents/p'),
      expect.objectContaining({ method: 'PUT' })
    );
  });
});
