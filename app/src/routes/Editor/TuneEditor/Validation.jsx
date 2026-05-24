import { useState, useMemo } from 'react';
import { Button } from '../shared/Button';

const generateValidationPrompt = (tune) => {
  return `Please validate the following jazz tune record and check all data for accuracy. Review each field carefully and identify any potential inaccuracies, inconsistencies, or missing information.

**Instructions:**
- For each field, assess its accuracy and completeness
- Highlight any information that may be inaccurate, inconsistent, or questionable
- Assign a confidence level to each finding: HIGH (very confident), MEDIUM (somewhat confident), or LOW (uncertain)
- Provide specific reasons for any concerns
- Suggest corrections if you identify errors

**Tune Record to Validate:**

**Basic Information:**
- Tune Name: ${tune.tune_name || '(not provided)'}
- Composer: ${tune.composer || '(not provided)'}
- Lyricist: ${tune.lyricist || '(not provided)'}
- Year: ${tune.year || '(not provided)'}
- Style: ${tune.style || '(not provided)'}
- Form: ${tune.form || '(not provided)'}
- Standard Key: ${tune.standard_key || '(not provided)'}
- Time Signature: ${tune.time_signature || '(not provided)'}

**Musical Content:**
- Chord Progression: 
${tune.chords ? tune.chords.split('\n').map(line => `  ${line}`).join('\n') : '(not provided)'}

- Chord Progression Notes: ${tune.chord_progression_notes || '(not provided)'}

- Section Markers: ${tune.section_markers?.length > 0 
  ? tune.section_markers.map(m => `${m.label}: measures ${m.start}-${m.end}`).join(', ')
  : '(not provided)'}

**Historical Information:**
- History and Facts: ${tune.history_and_facts || '(not provided)'}

- Famous Recordings: ${tune.famous_recordings?.length > 0
  ? tune.famous_recordings.map((r, i) => `${i + 1}. ${typeof r === 'string' ? r : `${r.artist}${r.year ? ` - ${r.year}` : ''}${r.album ? ` (${r.album})` : ''}`}`).join('\n  ')
  : '(not provided)'}

**Please provide your validation assessment in the following format:**

For each field or finding, use this structure:
- **Field Name**: [Your assessment]
  - **Confidence**: [HIGH/MEDIUM/LOW]
  - **Issue**: [Description of any problems found]
  - **Suggestion**: [Recommended correction if applicable]

**Areas to Focus On:**
1. Historical accuracy (composer, year, historical facts)
2. Musical accuracy (chord progression syntax, form description, key)
3. Consistency (does the form match the section markers? does the key match the chords?)
4. Completeness (are all important fields filled?)
5. Famous recordings accuracy (are the artists, years, and albums correct?)
6. Overall data quality and coherence

Please be thorough and specific in your analysis.`;
};

const generateSpotifyVerificationPrompt = (tune) => {
  if (!tune.spotify_playlist_id) {
    return null;
  }

  const playlistUrl = `https://open.spotify.com/playlist/${tune.spotify_playlist_id}`;

  return `Please verify that the following Spotify playlist link is real and accessible. Check if:
1. The playlist exists and is publicly accessible
2. The playlist ID is valid
3. The link format is correct

**Tune:** ${tune.tune_name || 'Unknown'}

**Spotify Playlist Link to Verify:**
${playlistUrl}

**Please respond with:**
- VALID (playlist exists and is accessible) or INVALID (playlist broken/missing/private)
- If invalid, provide the reason
- If valid, briefly describe what the playlist contains (e.g., "Playlist with 10 recordings of [tune name]")

Thank you!`;
};

export const Validation = ({ tune, validated, onChange }) => {
  const [copiedMain, setCopiedMain] = useState(false);
  const [copiedSpotify, setCopiedSpotify] = useState(false);

  const validationPrompt = useMemo(() => {
    return generateValidationPrompt(tune);
  }, [tune]);

  const spotifyPrompt = useMemo(() => {
    return generateSpotifyVerificationPrompt(tune);
  }, [tune]);

  // Check if all YouTube videos are validated
  const youtubeValidationStatus = useMemo(() => {
    if (!tune.youtube_video_ids || tune.youtube_video_ids.length === 0) {
      return null; // No videos to check
    }

    const videos = tune.youtube_video_ids;
    const allValidated = videos.every(video => {
      const videoData = typeof video === 'string' ? { id: video } : video;
      return videoData.verified === true;
    });

    const validatedCount = videos.filter(video => {
      const videoData = typeof video === 'string' ? { id: video } : video;
      return videoData.verified === true;
    }).length;

    return {
      allValidated,
      total: videos.length,
      validated: validatedCount,
    };
  }, [tune.youtube_video_ids]);

  const handleCopyPrompt = (prompt, setCopied) => {
    navigator.clipboard.writeText(prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="font-medium text-blue-900 mb-2">✅ Validation</div>
        <div className="text-sm text-blue-800">
          Mark this tune as validated when you've completed your review and quality checks.
        </div>
      </div>

      {/* Main AI Validation Prompt Generator */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">AI Validation Prompt</h3>
            <p className="text-sm text-gray-600">
              Generate a prompt to validate this tune's data using AI tools like ChatGPT. Copy the prompt below and paste it into your AI assistant.
            </p>
          </div>
          <Button 
            variant="primary" 
            size="sm" 
            onClick={() => handleCopyPrompt(validationPrompt, setCopiedMain)}
          >
            {copiedMain ? '✓ Copied!' : '📋 Copy Prompt'}
          </Button>
        </div>

        <div className="bg-gray-50 border border-gray-300 rounded-lg p-4">
          <textarea
            readOnly
            value={validationPrompt}
            className="w-full h-96 p-3 text-sm font-mono bg-white border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-jazz-blue resize-none"
            onClick={(e) => e.target.select()}
          />
        </div>

        <div className="mt-3 text-xs text-gray-500">
          💡 Tip: Click in the text area to select all, or use the Copy button above. Paste this prompt into ChatGPT, Claude, or another AI assistant to get a detailed validation report.
        </div>
      </div>

      {/* YouTube Link Validation Status */}
      {youtubeValidationStatus && (
        <div className={`bg-white border rounded-lg p-4 ${
          youtubeValidationStatus.allValidated 
            ? 'border-green-200 bg-green-50' 
            : 'border-yellow-200 bg-yellow-50'
        }`}>
          <div className="flex items-center gap-3">
            {youtubeValidationStatus.allValidated ? (
              <>
                <span className="text-2xl">✓</span>
                <div>
                  <div className="font-medium text-green-900">
                    All YouTube links validated
                  </div>
                  <div className="text-sm text-green-800">
                    All {youtubeValidationStatus.total} video link{youtubeValidationStatus.total !== 1 ? 's' : ''} on the YouTube tab have been verified.
                  </div>
                </div>
              </>
            ) : (
              <>
                <span className="text-2xl">⚠</span>
                <div>
                  <div className="font-medium text-yellow-900">
                    YouTube links need verification
                  </div>
                  <div className="text-sm text-yellow-800">
                    {youtubeValidationStatus.validated} of {youtubeValidationStatus.total} video link{youtubeValidationStatus.total !== 1 ? 's' : ''} verified. Use the "Verify All Links" button on the YouTube tab to check all links.
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Spotify Link Verification */}
      {spotifyPrompt && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">Spotify Playlist Verification</h3>
              <p className="text-sm text-gray-600">
                Verify that the Spotify playlist link is real and accessible.
              </p>
            </div>
            <Button 
              variant="secondary" 
              size="sm" 
              onClick={() => handleCopyPrompt(spotifyPrompt, setCopiedSpotify)}
            >
              {copiedSpotify ? '✓ Copied!' : '📋 Copy Prompt'}
            </Button>
          </div>

          <div className="bg-gray-50 border border-gray-300 rounded-lg p-4">
            <textarea
              readOnly
              value={spotifyPrompt}
              className="w-full h-48 p-3 text-sm font-mono bg-white border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-jazz-blue resize-none"
              onClick={(e) => e.target.select()}
            />
          </div>
        </div>
      )}

      {/* Validation Status */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={validated || false}
            onChange={(e) => onChange(e.target.checked)}
            className="w-6 h-6 text-jazz-blue rounded focus:ring-jazz-blue focus:ring-2"
          />
          <div>
            <div className="font-medium text-gray-900">Tune is validated</div>
            <div className="text-sm text-gray-600">
              Check this box when you've completed your validation review of this tune (including AI validation and link verification if used)
            </div>
          </div>
        </label>
      </div>
    </div>
  );
};
