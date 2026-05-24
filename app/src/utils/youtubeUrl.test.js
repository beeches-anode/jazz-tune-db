import { describe, it, expect } from 'vitest';
import { parseVideoId, buildPlaylistUrl } from './youtubeUrl';

describe('parseVideoId', () => {
  it('extracts id from youtu.be short URL', () => {
    expect(parseVideoId('https://youtu.be/ytHMBYLwgVU')).toBe('ytHMBYLwgVU');
  });
  it('extracts id from youtube.com watch URL', () => {
    expect(parseVideoId('https://www.youtube.com/watch?v=ytHMBYLwgVU')).toBe('ytHMBYLwgVU');
  });
  it('extracts id from youtube.com watch URL with extra params', () => {
    expect(parseVideoId('https://www.youtube.com/watch?v=ytHMBYLwgVU&t=42s')).toBe('ytHMBYLwgVU');
  });
  it('extracts id from shorts URL', () => {
    expect(parseVideoId('https://www.youtube.com/shorts/ytHMBYLwgVU')).toBe('ytHMBYLwgVU');
  });
  it('returns null for non-YouTube URL', () => {
    expect(parseVideoId('https://example.com/watch?v=ytHMBYLwgVU')).toBe(null);
  });
  it('returns null for garbage input', () => {
    expect(parseVideoId('not a url')).toBe(null);
  });
});

describe('buildPlaylistUrl', () => {
  it('builds watch_videos URL from id array', () => {
    const url = buildPlaylistUrl(['id1', 'id2', 'id3']);
    expect(url).toBe('https://www.youtube.com/watch_videos?video_ids=id1,id2,id3');
  });
  it('handles single video', () => {
    expect(buildPlaylistUrl(['id1'])).toBe('https://www.youtube.com/watch_videos?video_ids=id1');
  });
  it('returns null for empty array', () => {
    expect(buildPlaylistUrl([])).toBe(null);
  });
});
