# Sequential Tune Validation Prompt

## Task: Populate YouTube Data for Top-Ranked Tunes (One at a Time)

Process tunes sequentially, one at a time. Update the database and log results after each tune.

**Target**: Process **5 tunes** total, then stop. (Increase to 10 if context remains manageable.)

---

### Context Discipline (Important)

To keep context clean across multiple tunes:
- Keep all intermediate outputs brief
- Don't echo back large JSON structures - just confirm "updated"
- Write to files immediately, don't hold data in conversation
- After each tune, state only: "Processed [Title] (Rank #X) - X recordings, Y videos, Z backing tracks"

---

### Step 1: Identify Next Tune

Read `jazz-tune-manager/jazz-db-app/jazz-tunes-jpp.json` and find the tune with:
- The **lowest `rank`** value
- `validated` = false (or missing)

Select this single tune for processing.

---

### Step 2: Process the Tune

Execute the following phases sequentially:

#### Phase A: Identify Famous Recordings
Run `jazz-recording-identifier` → `auditor` to get verified famous recordings.
- Returns 3-8 recordings **pre-ranked by canonical importance** (most iconic first)
- **Capture the audited recordings** in the format: `"Artist - Year (Album Name)"`
- **For JSON output**: Take **up to 5 recordings** (first 5 if available, fewer if less)

#### Phase B: Find YouTube Content
Run sequentially:
1. `youtube-recording-identifier` (use MCP: `mcp__youtube__videos_searchVideos`, `mcp__youtube__videos_getVideo`)
2. `backing-track-identifier` (use MCP to search trusted channels)

#### Phase C: Audit Results
Run `auditor` to verify all YouTube data.

---

### Step 3: Update JSON

1. Read current `jazz-tune-manager/jazz-db-app/jazz-tunes-jpp.json`
2. Update the tune entry with:
   - `famous_recordings`: Up to 5 recordings from Phase A
   - `youtube_video_ids`: Verified videos from Phase B
   - `youtube_backing_track_ids`: Verified backing tracks from Phase B
   - `last_updated`: Current ISO timestamp
   - `validated`: true
3. Write the update to file immediately
4. Confirm briefly: "JSON updated for [Tune Title]"

---

### Step 4: Log Results

Append to `jazz-tune-manager/docs/results.md`:

```
## [Tune Title] (Rank #X)
- **Famous Recordings**: N added
- **YouTube Recordings**: N added
- **Backing Tracks**: N added
- **Processed**: [timestamp]
```

---

### Step 5: Repeat or Stop

- If fewer than **5 tunes** processed this session → Return to **Step 1**
- If **5 tunes** processed → Stop and report: "Session complete. Processed 5 tunes. See results.md for details."

---

### MCP Tools (Required)

- `mcp__youtube__videos_searchVideos` - primary search
- `mcp__youtube__videos_getVideo` - verify videos
- WebSearch only as fallback
