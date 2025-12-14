Optimized Parallel Prompt

## Task: Populate YouTube Data for Top-Ranked Tunes (Parallel Processing)

### Step 1: Identify Target Tunes

Read `jazz-tune-manager/jazz-db-app/jazz-tunes-jpp.json` and find **40 tunes** that meet BOTH criteria:

- `rank` < 60
- `validated` = false (or missing)

Sort by `rank` ascending and select the top 10 (lowest rank = highest priority).

### Step 2: Process All Selected Tunes in Parallel

Launch **parallel Task agents** (one per tune) for all 10 selected tunes. Each agent executes this workflow:

#### Per-Tune Workflow:

**Phase A**: Run `jazz-recording-identifier` → `auditor` to get verified famous recordings.

- The agent returns 3-8 recordings **pre-ranked by canonical importance** (most iconic first)
- **Capture the audited recordings** in the format: `"Artist - Year (Album Name)"`
- **For JSON output**: Take **up to 5 recordings** (first 5 if available, fewer if the agent returned less)

**Phase B**: Run in parallel:

- `youtube-recording-identifier` (use MCP: `mcp__youtube__videos_searchVideos`, `mcp__youtube__videos_getVideo`)
- `backing-track-identifier` (use MCP to search trusted channels)

**Phase C**: Run `auditor` to verify all YouTube data

**Phase D**: Return verified data in this schema:

```json
{
  "tune_id": "existing_tune_id",
  "famous_recordings": [
    "Artist - Year (Album Name)",
    "..."
  ],  // up to 5 (fewer if less available)
  "youtube_video_ids": [...],
  "youtube_backing_track_ids": [...],
  "audit_status": "APPROVED|FLAGGED",
  "summary": {
    "famous_recordings_count": N,
    "youtube_recordings_count": N,
    "backing_tracks_count": N,
    "flags": []
  }
}
```

### Step 3: Consolidate & Update JSON

Once all parallel agents complete:

1. Read current `jazz-tunes-jpp.json`
2. Update each tune entry with:
   - `famous_recordings`: Replace with **up to 5 recordings** from Phase A (pre-ranked by agent; write fewer if less available)
   - `youtube_video_ids`: Add/replace with verified videos from Phase B
   - `youtube_backing_track_ids`: Add/replace with verified backing tracks from Phase B
   - `last_updated`: Current ISO timestamp
   - `validated`: true
3. Write single consolidated update to file

**Note**: Pass all recordings (3-8) to YouTube search agents. Write only up to 5 to the JSON.

### Step 4: Summary Report

| Tune     | Rank | Famous Recordings | YouTube Videos | Backing Tracks | Audit Status |
| -------- | ---- | ----------------- | -------------- | -------------- | ------------ |
| [Tune 1] | #    | X                 | Y              | Z              | STATUS       |
| [Tune 2] | #    | X                 | Y              | Z              | STATUS       |

Include: famous recordings added, video IDs added, tempo coverage, any audit flags.

### MCP Tools (Required)

- `mcp__youtube__videos_searchVideos` - primary search
- `mcp__youtube__videos_getVideo` - verify videos
- WebSearch only as fallback
