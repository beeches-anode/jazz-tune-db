---
description: Perform a comprehensive audit and update of a jazz tune record
arguments:
  - name: tune_name
    description: Name of the tune to audit (must exist in jazz-tunes-jpp.json)
    required: true
---

# Jazz Tune Audit Workflow

You are performing a comprehensive audit and update of the jazz tune: **$ARGUMENTS.tune_name**

## Workflow Overview

```
PHASE 1: Retrieve & analyze current entry
    ↓
PHASE 2: Identify required agents
    ↓
PHASE 3a: Execute agents (parallel)
    ├─ jazz-recording-identifier (famous recordings)
    ├─ jazz-tune-form-analyzer (form, section markers)
    └─ Web search (factual verification)
    ↓
PHASE 3b: Coordinator YouTube searches (MCP direct)
    ├─ Search for backing tracks via MCP YouTube API
    └─ Search for famous recording videos via MCP YouTube API
    ↓
PHASE 4: Auditor (Opus - thorough verification)
    ↓
PHASE 5: Consolidate results
    ↓
PHASE 6: Present audit report & await approval
```

## Phase 1: Retrieve & Analyze Current Entry

1. **Find the tune** in `/Users/trentjordan/code_projects/jazz-tune-manager/jazz-db-app/jazz-tunes-jpp.json`
   - Search for exact match first (case-insensitive)
   - If not found, search for partial matches
   - **If no match found: ASK the user** - list similar tune names and ask which one they meant
   - Do NOT proceed until a valid tune is confirmed

2. **Extract the current entry** and analyze field completeness:

### Field Completeness Checklist

| Field | Status | Notes |
|-------|--------|-------|
| tune_name | | |
| composer | | Verify accuracy |
| lyricist | | Add if applicable |
| year | | Verify accuracy |
| style | | |
| standard_key | | |
| form | | Must be descriptive (e.g., "AABA, 32 bars") |
| chords | | Should not be "unknown" |
| section_markers | | Array of {label, start, end} |
| chord_progression_notes | | Harmonic analysis |
| history_and_facts | | Verify accuracy, completeness |
| famous_recordings | | Need 3-8 verified entries |
| youtube_video_ids | | Need 5-8 videos |
| youtube_backing_track_ids | | Need 5-10 backing tracks |
| validated | | Set to true after audit |
| last_updated | | Update to today's date |

## Phase 2: Identify Required Agents

Based on field completeness, determine which agents to run:

### Agent Decision Matrix

**Mode: Verification + Gap-filling** (always verify existing data AND fill gaps)

| Agent/Task | Runs In | Purpose |
|------------|---------|---------|
| `jazz-recording-identifier` | Phase 3a (Parallel) | Verify existing famous recordings AND identify missing ones |
| `jazz-tune-form-analyzer` | Phase 3a (Parallel) | Verify form, section markers, chord progression notes |
| Web search (factual verification) | Phase 3a (Parallel) | Verify composer, year, history facts |
| Coordinator MCP YouTube searches | Phase 3b | Find backing tracks and recording videos directly via MCP API |
| `auditor` | Phase 4 | Thorough verification of ALL data before commit (Opus model) |

**Note:** YouTube searches are performed directly by the coordinator using MCP tools because sub-agents cannot reliably access MCP server connections.

### Factual Verification (Always Run)

Use web search to verify:
- Composer attribution
- Lyricist (if applicable)
- Year of composition/publication
- Key historical facts

## Phase 3a: Execute Agents (Parallel)

Run these simultaneously using multiple Task tool calls in a single message:

- `jazz-recording-identifier` - Read agent file at `.claude/agents/jazz-recording-identifier.md`, then follow its instructions
- `jazz-tune-form-analyzer` - Read agent file at `.claude/agents/jazz-tune-form-analyzer.md`, then follow its instructions
- Web search for factual verification (composer, year, history)

### Agent Invocation Format

When invoking agents, use the Task tool with:
```
subagent_type: "jazz-recording-identifier" (or "jazz-tune-form-analyzer")
prompt: "[Instructions for the tune]
Current entry data: [relevant fields from the entry]"
```

Provide each agent with:
- The tune name
- Current entry data (relevant fields)
- Specific task instructions

## Phase 3b: Coordinator YouTube Searches (MCP Direct)

After Phase 3a agents complete, the coordinator performs YouTube searches directly using MCP tools.
This is more reliable than sub-agents because MCP server connections are not inherited by sub-agents.

### Backing Track Search

Use MCP YouTube API to find 5-10 backing tracks:

```
mcp__youtube__videos_searchVideos(query="[Tune Name] backing track jazz", maxResults=15)
mcp__youtube__videos_searchVideos(query="[Tune Name] play along", maxResults=10)
```

**Selection criteria:**
- Prioritize known backing track channels (Guitare Improvisation, PRACTICE JAZZ, Jazzing, Backingtracks JAZZ, etc.)
- Include tempo variety (slow ballad, medium swing, uptempo)
- Verify video titles indicate backing/play-along track (not full performances)
- Filter out unrelated results (check title contains tune name)

### Famous Recording Video Search

Use MCP YouTube API to find videos for each famous recording identified by jazz-recording-identifier:

```
# For each famous recording (artist, year):
mcp__youtube__videos_searchVideos(query="[Tune Name] [Artist Name]", maxResults=5)
```

**Selection criteria:**
- Prioritize "[Artist] - Topic" channels (official YouTube auto-generated)
- Look for official artist channels
- Prefer complete recordings over clips
- Target 6-8 total videos with artist variety (avoid multiple videos of same artist)

### Format YouTube Results

Format all YouTube results into the database schema:
```json
{
  "id": "VIDEO_ID_ONLY",
  "title": "Exact Title from API",
  "artist": "",
  "channelTitle": "Channel Name from API",
  "verified": true,
  "added_date": "YYYY-MM-DD"
}
```

**Important:** Extract video ID from the API response (11 characters, e.g., "4azzupZwiy4"), NOT full URLs.

## Phase 4: Auditor (Final Verification)

After all data gathering completes, invoke the auditor:

- `auditor` - Read agent file at `.claude/agents/auditor.md`, then follow its instructions
  - **Model**: Opus (most capable) - this is the only audit checkpoint, must be thorough
  - **Input**: ALL data collected from previous phases
  - **Verification scope**:
    - Cross-reference all facts against jazz history knowledge
    - Verify YouTube video IDs are valid format (11 characters)
    - Check for duplicates and inconsistencies
    - Validate JSON schema compliance
    - Assign confidence levels (HIGH/MEDIUM/LOW) to each data point
  - **Output**: Audit report with one of:
    - APPROVED - proceed to commit
    - APPROVED WITH FLAGS - proceed but note concerns
    - NEEDS REVIEW - human review required
    - REJECTED - do not commit, significant issues found

## Phase 5: Consolidate Results

After all phases complete, compile a unified update:

### Update JSON Structure

```json
{
  "tune_name": "...",
  "composer": "...",
  "lyricist": "...",
  "year": 1234,
  "style": "...",
  "standard_key": "...",
  "form": "...",
  "chords": "...",
  "section_markers": [...],
  "chord_progression_notes": "...",
  "history_and_facts": "...",
  "famous_recordings": [...],
  "youtube_video_ids": [...],
  "youtube_backing_track_ids": [...],
  "id": "[preserve existing]",
  "is_approved": true,
  "key": "",
  "rank": "[preserve existing]",
  "validated": true,
  "last_updated": "[today's date ISO format]"
}
```

## Phase 6: Present Audit Report

### Report Format

```
## Audit Report: [Tune Name]

### Summary
- Agents run: [list all 4 agents + factual verification]
- Fields verified: X
- Fields with recommended changes: Y
- Confidence level: High/Medium/Low

---

### Current Data vs Recommended Changes

#### Core Metadata
| Field | Current Value | Recommended | Change? |
|-------|---------------|-------------|---------|
| composer | [current] | [recommended] | ✓/— |
| lyricist | [current] | [recommended] | ✓/— |
| year | [current] | [recommended] | ✓/— |
| style | [current] | [recommended] | ✓/— |
| standard_key | [current] | [recommended] | ✓/— |

#### Form & Structure
| Field | Current Value | Recommended | Change? |
|-------|---------------|-------------|---------|
| form | [current] | [recommended] | ✓/— |
| section_markers | [count] | [new count] | ✓/— |
| chord_progression_notes | [present/missing] | [recommended] | ✓/— |

#### Famous Recordings
**Current:** [count] recordings
**Recommended:** [count] recordings
| # | Current | Recommended | Change? |
|---|---------|-------------|---------|
| 1 | [artist - album (year)] | [same or new] | ✓/— |
| ... | | | |

#### YouTube Videos
**Current:** [count] videos
**Recommended:** [count] videos
[List additions/removals]

#### YouTube Backing Tracks
**Current:** [count] backing tracks
**Recommended:** [count] backing tracks
[List additions/removals]

#### History & Facts
**Current length:** [word count] words
**Recommended:** [verified/updated with X additions]
[Show diff if changes recommended]

---

### Proposed JSON Update
[Full JSON block ready to replace existing entry]

---

### Awaiting Approval
Please review the changes above. Reply **"approve"** to apply all changes to jazz-tunes-jpp.json.

You can also:
- Reply **"approve partial"** and specify which sections to apply
- Reply **"reject"** to discard all changes
- Ask questions about any recommended changes
```

## Important Notes

1. **Preserve existing IDs** - Never change the `id` field
2. **Preserve rank** - Don't modify `rank` unless explicitly incorrect
3. **Schema compliance** - Ensure YouTube objects use correct field names:
   - `youtube_video_ids` (not `youtubeRecordings`)
   - `youtube_backing_track_ids` (not `backingTracks`)
   - Use `id` for video ID only, not full URLs
4. **Date format** - Use ISO 8601 for `last_updated`: "YYYY-MM-DDTHH:mm:ss.sssZ"
5. **Verification** - Set `verified: true` only for confirmed data
6. **Agent file paths** - Agents in `.claude/agents/` directory:
   - `jazz-recording-identifier.md` - Famous recordings research
   - `jazz-tune-form-analyzer.md` - Form and harmonic analysis
   - `auditor.md` - Final quality gate (Opus model)

   **Note:** YouTube searches (backing tracks and recording videos) are performed directly
   by the coordinator using MCP tools, not by sub-agents. This is because sub-agents cannot
   reliably access MCP server connections.
