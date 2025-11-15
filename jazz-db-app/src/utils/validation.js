// Calculate completion status for a tune
export const getTuneCompletionStatus = (tune) => {
  let score = 0;
  let maxScore = 8;

  // Required fields
  if (tune.tune_name?.trim()) score += 1;
  if (tune.composer?.trim()) score += 1;
  if (tune.chords?.trim()) score += 1;
  if (tune.year) score += 1;

  // Optional but important fields
  if (tune.standard_key?.trim()) score += 1;
  if (tune.tempo_range?.trim()) score += 1;
  if (tune.section_markers?.length > 0) score += 1;
  if (tune.youtube_video_ids?.length >= 5) score += 1;

  const percentage = (score / maxScore) * 100;

  if (percentage === 100) return { status: 'complete', score, maxScore, icon: '✅' };
  if (percentage >= 50) return { status: 'partial', score, maxScore, icon: '⚠️' };
  return { status: 'incomplete', score, maxScore, icon: '❌' };
};

// Get database-wide statistics
export const getDatabaseStats = (tunes) => {
  if (!tunes || tunes.length === 0) {
    return {
      totalTunes: 0,
      fieldStats: {},
      youtubeStats: {},
      completionStats: {}
    };
  }

  const totalTunes = tunes.length;

  // Field completion stats
  const fieldStats = {
    basicInfo: countField(tunes, t => t.tune_name && t.composer && t.year),
    chordProgression: countField(tunes, t => t.chords),
    standardKey: countField(tunes, t => t.standard_key),
    tempoRange: countField(tunes, t => t.tempo_range),
    sectionMarkers: countField(tunes, t => t.section_markers?.length > 0),
    youtubeVideos: countField(tunes, t => t.youtube_video_ids?.length > 0),
    historyAndFacts: countField(tunes, t => t.history_and_facts),
    famousRecordings: countField(tunes, t => t.famous_recordings?.length > 0),
  };

  // YouTube video stats
  const youtubeStats = {
    noVideos: tunes.filter(t => !t.youtube_video_ids || t.youtube_video_ids.length === 0).length,
    fewVideos: tunes.filter(t => t.youtube_video_ids?.length > 0 && t.youtube_video_ids.length < 5).length,
    targetVideos: tunes.filter(t => t.youtube_video_ids?.length >= 5 && t.youtube_video_ids.length <= 10).length,
    manyVideos: tunes.filter(t => t.youtube_video_ids?.length > 10).length,
  };

  // Overall completion stats
  const completionStats = {
    complete: 0,
    partial: 0,
    incomplete: 0,
  };

  tunes.forEach(tune => {
    const status = getTuneCompletionStatus(tune);
    completionStats[status.status]++;
  });

  return {
    totalTunes,
    fieldStats,
    youtubeStats,
    completionStats,
  };
};

// Helper to count how many tunes have a field
const countField = (tunes, predicate) => {
  const count = tunes.filter(predicate).length;
  const percentage = (count / tunes.length) * 100;
  return { count, total: tunes.length, percentage: percentage.toFixed(1) };
};

// Validate tune data
export const validateTune = (tune) => {
  const errors = [];
  const warnings = [];

  // Required fields
  if (!tune.tune_name?.trim()) {
    errors.push('Tune name is required');
  }

  if (!tune.composer?.trim()) {
    errors.push('Composer is required');
  }

  if (!tune.year) {
    errors.push('Year is required');
  } else if (tune.year < 1900 || tune.year > 2025) {
    warnings.push('Year seems unusual (should be between 1900-2025)');
  }

  if (!tune.chords?.trim()) {
    errors.push('Chord progression is required');
  }

  // Warnings for missing optional fields
  if (!tune.standard_key?.trim()) {
    warnings.push('Standard key is not set');
  }

  if (!tune.tempo_range?.trim()) {
    warnings.push('Tempo range is not set');
  }

  if (!tune.section_markers || tune.section_markers.length === 0) {
    warnings.push('Section markers are not defined');
  }

  if (!tune.youtube_video_ids || tune.youtube_video_ids.length === 0) {
    warnings.push('No YouTube videos added');
  } else if (tune.youtube_video_ids.length < 5) {
    warnings.push(`Only ${tune.youtube_video_ids.length} YouTube videos (target: 5-10)`);
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
};

// Extract YouTube video ID from URL
export const extractYouTubeId = (url) => {
  if (!url) return null;

  // Handle different YouTube URL formats
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /^([a-zA-Z0-9_-]{11})$/ // Direct ID
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
};

// Generate YouTube playlist URL from video IDs
export const generatePlaylistUrl = (videoIds) => {
  if (!videoIds || videoIds.length === 0) return '';

  const ids = videoIds.map(v => typeof v === 'string' ? v : v.id).join(',');
  return `https://www.youtube.com/watch_videos?video_ids=${ids}`;
};
