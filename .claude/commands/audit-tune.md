---
description: Perform a comprehensive audit and update of a jazz tune record
arguments:
  - name: tune_name
    description: Name of the tune to audit (must exist in jazz-tunes-jpp.json)
    required: true
---

# Jazz Tune Audit Workflow: **$ARGUMENTS.tune_name**

## Workflow
```
PHASE 1: Retrieve tune from jazz-tunes-jpp.json
PHASE 2: Run agents in parallel (recording-identifier, form-analyzer, web search)
PHASE 3: YouTube searches via MCP (conditional - skip if >= 8 items exist)
PHASE 4: Auditor verification
PHASE 5: Present report & await approval
```

## Phase 1: Retrieve Entry

Find tune in `/Users/trentjordan/code_projects/jazz-tune-manager/jazz-db-app/jazz-tunes-jpp.json`
- Search case-insensitive; if not found, list similar names and ASK user
- Extract current entry and note which fields are missing/incomplete

## Phase 2: Execute Agents (Parallel)

Run these simultaneously in a single message:

1. **jazz-recording-identifier** - Verify/expand famous_recordings (always run)
2. **jazz-tune-form-analyzer** - Verify form, generate section_markers (always run)
3. **Web search** - Verify composer, year, history facts

## Phase 3: YouTube Searches (Conditional)

Use MCP YouTube API directly. **Skip searches if entry already has >= 8 items.**

### Backing Tracks (if youtube_backing_track_ids.length < 8)
```
mcp__youtube__videos_searchVideos(query="[Tune Name] backing track jazz", maxResults=15)
mcp__youtube__videos_searchVideos(query="[Tune Name] play along", maxResults=10)
```
Prioritize: Guitare Improvisation, PRACTICE JAZZ, Jazzing, Backingtracks JAZZ

### Recording Videos (if youtube_video_ids.length < 8)
```
mcp__youtube__videos_searchVideos(query="[Tune Name] [Artist Name]", maxResults=5)
```
Prioritize: "[Artist] - Topic" channels, official channels

### Format
```json
{"id": "VIDEO_ID_ONLY", "title": "...", "artist": "", "channelTitle": "...", "verified": true, "added_date": "YYYY-MM-DD"}
```

## Phase 4: Auditor

Invoke `auditor` agent with ALL collected data. Input should include:
- Current entry + proposed changes
- New recordings, videos, backing tracks
- Any LOW confidence items from other agents

## Phase 5: Present Report

```
## Audit Report: [Tune Name]

### Summary
- Fields verified: X | Changes recommended: Y | Confidence: High/Medium/Low

### Changes
| Field | Current | Recommended | Change? |
|-------|---------|-------------|---------|

### Famous Recordings
[Current vs recommended list]

### YouTube (Videos: X→Y | Backing Tracks: X→Y)
[List additions]

### Proposed JSON
[Full entry ready to commit]

---
Reply **"approve"** to apply changes, **"reject"** to discard, or ask questions.
```

## Schema Notes
- Preserve `id` and `rank` fields
- Use `youtube_video_ids` and `youtube_backing_track_ids` (not legacy names)
- Video IDs are 11 characters only (not URLs)
- Set `validated: true` and `last_updated` to today's ISO date
