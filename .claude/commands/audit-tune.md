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
PHASE 3: Execute agents
    ├─ Parallel: jazz-recording-identifier, jazz-tune-form-analyzer,
    │            backing-track-identifier, web search (factual)
    ↓
    ├─ Sequential: youtube-recording-identifier (needs famous recordings)
    ↓
    └─ Final: auditor (Opus - thorough verification)
    ↓
PHASE 4: Consolidate results
    ↓
PHASE 5: Present audit report & await approval
```

## Phase 1: Retrieve & Analyze Current Entry

1. **Find the tune** in `/Users/trentjordan/code_projects/jazz-tune-manager/jazz-tune-manager/jazz-db-app/jazz-tunes-jpp.json`
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

| Agent | Runs In | Purpose |
|-------|---------|---------|
| `jazz-recording-identifier` | Parallel | Verify existing famous recordings AND identify missing ones |
| `jazz-tune-form-analyzer` | Parallel | Verify form, section markers, chord progression notes |
| `backing-track-identifier` | Parallel | Verify existing backing tracks AND find new ones |
| Web search (factual verification) | Parallel | Verify composer, year, history facts |
| `youtube-recording-identifier` | Sequential | Verify existing YouTube videos AND find new ones (needs famous recordings from above) |
| `auditor` | Final | Thorough verification of ALL data before commit (Opus model) |

### Factual Verification (Always Run)

Use web search to verify:
- Composer attribution
- Lyricist (if applicable)
- Year of composition/publication
- Key historical facts

## Phase 3: Execute Agents

### Execution Order

**Parallel Group 1** (run simultaneously using multiple Task tool calls in a single message):
- `jazz-recording-identifier` - Read agent file at `.claude/agents/jazz-recording-identifier.md`, then follow its instructions
- `backing-track-identifier` - Read agent file at `.claude/agents/backing-track-identifier.md`, then follow its instructions
- `jazz-tune-form-analyzer` - Read agent file at `.claude/agents/jazz-tune-form-analyzer.md`, then follow its instructions
- Web search for factual verification (composer, year, history)

**Sequential** (after Group 1 completes):
- `youtube-recording-identifier` - Read agent file at `.claude/agents/youtube-recording-identifier.md`, then follow its instructions
  - This agent needs the famous recordings from jazz-recording-identifier to prioritize searches

**Final Audit** (after all data gathering completes):
- `auditor` - Read agent file at `.claude/agents/auditor.md`, then follow its instructions
  - **Model**: Opus (most capable) - this is the only audit checkpoint, must be thorough
  - **Input**: ALL data collected from previous agents
  - **Verification scope**:
    - Cross-reference all facts against jazz history knowledge
    - Verify YouTube video IDs are valid and accessible
    - Check for duplicates and inconsistencies
    - Validate JSON schema compliance
    - Assign confidence levels (HIGH/MEDIUM/LOW) to each data point
  - **Output**: Audit report with one of:
    - APPROVED - proceed to commit
    - APPROVED WITH FLAGS - proceed but note concerns
    - NEEDS REVIEW - human review required
    - REJECTED - do not commit, significant issues found

### Agent Invocation Format

When invoking agents, use the Task tool with:
```
subagent_type: "general-purpose"
prompt: "Read the agent file at [path], then follow its instructions for the tune '[tune_name]'.
Current entry data: [relevant fields from the entry]"
```

Provide each agent with:
- The tune name
- Current entry data (relevant fields)
- Any context needed (e.g., famous recordings for YouTube search)

## Phase 4: Consolidate Results

After all agents complete, compile a unified update:

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

## Phase 5: Present Audit Report

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
6. **Agent file paths** - All agents are in `.claude/agents/` directory:
   - `jazz-recording-identifier.md`
   - `youtube-recording-identifier.md`
   - `backing-track-identifier.md`
   - `jazz-tune-form-analyzer.md`
   - `auditor.md` (final quality gate - Opus model)
