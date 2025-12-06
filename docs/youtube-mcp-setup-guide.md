# YouTube MCP Server Setup Guide for Claude Code

This document captures learnings from setting up and using the YouTube MCP server with Claude Code agents. Use this as a reference when implementing similar functionality in other projects.

---

## Table of Contents

1. [MCP Server Installation](#1-mcp-server-installation)
2. [Available Tools](#2-available-tools)
3. [Permission Configuration](#3-permission-configuration)
4. [Agent Architecture Learnings](#4-agent-architecture-learnings)
5. [Tool Usage Patterns](#5-tool-usage-patterns)
6. [Data Formats](#6-data-formats)
7. [Known Issues & Workarounds](#7-known-issues--workarounds)
8. [Example Agent Prompts](#8-example-agent-prompts)

---

## 1. MCP Server Installation

### Package Used
```
@sfiorini/youtube-mcp
```

### Installation Command
```bash
claude mcp add --transport stdio youtube \
  --env YOUTUBE_API_KEY=YOUR_API_KEY_HERE \
  -- npx -y @sfiorini/youtube-mcp
```

### Prerequisites
- A YouTube Data API v3 key from Google Cloud Console
- Claude Code CLI installed
- Node.js/npm available (for npx)

### Verify Installation
```bash
claude mcp list          # Shows installed MCP servers
claude mcp list-tools    # Shows available tools from all servers
```

---

## 2. Available Tools

The YouTube MCP server provides these tools:

| Tool Name | Purpose | Key Parameters |
|-----------|---------|----------------|
| `mcp__youtube__videos_searchVideos` | Search for videos | `query`, `maxResults` |
| `mcp__youtube__videos_getVideo` | Get video details | `videoId`, `parts[]` |
| `mcp__youtube__transcripts_getTranscript` | Get video transcript | `videoId`, `language` |
| `mcp__youtube__channels_getChannel` | Get channel info | `channelId` |
| `mcp__youtube__channels_listVideos` | List channel videos | `channelId`, `maxResults` |
| `mcp__youtube__playlists_getPlaylist` | Get playlist info | `playlistId` |
| `mcp__youtube__playlists_getPlaylistItems` | Get playlist videos | `playlistId`, `maxResults` |

### Tool Naming Convention
All MCP tools follow this pattern:
```
mcp__<server_name>__<tool_name>
```

For YouTube: `mcp__youtube__<tool_name>`

---

## 3. Permission Configuration

### Problem
By default, each MCP tool call requires manual user approval, which is disruptive for automated workflows.

### Solution
Add tools to the `permissions.allow` array in `.claude/settings.local.json`:

```json
{
  "permissions": {
    "allow": [
      "mcp__youtube__videos_searchVideos",
      "mcp__youtube__videos_getVideo",
      "mcp__youtube__transcripts_getTranscript",
      "mcp__youtube__channels_getChannel",
      "mcp__youtube__channels_listVideos",
      "mcp__youtube__playlists_getPlaylist",
      "mcp__youtube__playlists_getPlaylistItems"
    ],
    "deny": [],
    "ask": []
  }
}
```

### Important Notes

1. **Wildcards don't work reliably**: `mcp__youtube__*` should work but has bugs (GitHub issues #2928, #3107). List each tool explicitly.

2. **Use `.claude/settings.local.json`**: User-level settings (`~/.claude/settings.json`) may not be enforced properly (GitHub issue #5140).

3. **Restart required**: Permission changes require restarting Claude Code or starting a new session.

4. **File locations** (in order of precedence):
   - `.claude/settings.local.json` - Project-local, private (highest priority)
   - `.claude/settings.json` - Project-level, can be committed
   - `~/.claude/settings.json` - User-level (lowest priority)

---

## 4. Agent Architecture Learnings

### Critical Discovery: No Nested Sub-Agent Dispatch

**Sub-agents spawned via the Task tool do NOT have access to the Task tool themselves.**

This means you cannot do:
```
Parent → Task tool → Coordinator Agent → Task tool → Worker Agent
                                              ❌ NOT AVAILABLE
```

### Working Architecture: Flat Orchestration

The parent agent must orchestrate all sub-agents directly:

```
┌─────────────────────────────────────────────────────────────┐
│                    PARENT AGENT                             │
│              (orchestrates the workflow)                    │
└─────────────────────────────────────────────────────────────┘
        │              │              │              │
        ▼              ▼              ▼              ▼
   ┌─────────┐   ┌─────────┐   ┌─────────┐   ┌─────────┐
   │ Agent 1 │   │ Agent 2 │   │ Agent 3 │   │ Agent 4 │
   │         │   │         │   │         │   │         │
   └─────────┘   └─────────┘   └─────────┘   └─────────┘
```

### What Sub-Agents CAN Access
- File tools (Read, Write, Edit, Glob, Grep)
- Bash
- Web tools (WebFetch, WebSearch)
- MCP tools (mcp__youtube__*, etc.)
- TodoWrite

### What Sub-Agents CANNOT Access
- Task tool (no spawning other agents)
- User interaction tools

### Implications for Agent Design

1. **Coordinator agents are documentation only**: A "coordinator" agent's prompt is valuable for documenting workflows, but actual orchestration happens at the parent level.

2. **Pass context explicitly**: When calling agents in sequence, the parent must pass results from one agent to the next.

3. **Parallel execution works**: Independent agents can be called in parallel from the parent using multiple Task tool calls in a single message.

---

## 5. Tool Usage Patterns

### Basic Video Search

```javascript
// Search for videos
mcp__youtube__videos_searchVideos({
  query: "Blue Bossa backing track jazz",
  maxResults: 15
})
```

### Search Result Structure

```json
{
  "kind": "youtube#searchResult",
  "id": {
    "kind": "youtube#video",
    "videoId": "xYdk2xR9yI0"
  },
  "snippet": {
    "publishedAt": "2022-02-19T10:30:04Z",
    "channelId": "UCqepSCHTyWj4BzHxEEUNvlg",
    "title": "Blue Bossa - Backing Track",
    "description": "...",
    "channelTitle": "Channel Name",
    "thumbnails": { ... }
  }
}
```

### Extracting Video IDs

The video ID is nested: `result.id.videoId` (11 characters)

**Note**: The `url` field in results may show `[object Object]` - construct URLs manually:
```
https://www.youtube.com/watch?v={videoId}
```

### Get Video Details

```javascript
mcp__youtube__videos_getVideo({
  videoId: "xYdk2xR9yI0",
  parts: ["snippet", "contentDetails", "statistics"]
})
```

### Search Strategies for Different Content Types

#### For Performance Recordings:
```
"{Tune Name}" {Artist Name}
"{Tune Name}" jazz
"{Tune Name}" live
```

#### For Backing Tracks:
```
"{Tune Name}" backing track
"{Tune Name}" play along
"{Tune Name}" minus one
"{Tune Name}" backing track {tempo} BPM
```

#### Trusted Backing Track Channels:
- Guitare Improvisation
- Learn Jazz Standards
- PRACTICE JAZZ
- JGC Play-Alongs
- Real Jazz Backing Tracks
- Jamey Aebersold

---

## 6. Data Formats

### YouTube Video IDs Format (for database storage)

```json
{
  "youtube_video_ids": [
    {
      "id": "r-Z8KuwI7Gc",
      "title": "Bill Evans Trio - Autumn Leaves",
      "artist": "Bill Evans",
      "channelTitle": "JazzTuna",
      "verified": true,
      "added_date": "2025-12-05"
    }
  ]
}
```

### Backing Tracks Format

```json
{
  "youtube_backing_track_ids": [
    {
      "id": "Xjf2kiDO19Y",
      "title": "Autumn leaves (120 bpm) : Backing track",
      "artist": "",
      "channelTitle": "Guitare Improvisation",
      "verified": true,
      "added_date": "2025-12-05"
    }
  ]
}
```

### Field Specifications

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | 11-character YouTube video ID |
| `title` | string | Exact video title from YouTube |
| `artist` | string | Artist name (empty for backing tracks) |
| `channelTitle` | string | YouTube channel name |
| `verified` | boolean | Whether video was verified to exist |
| `added_date` | string | ISO date (YYYY-MM-DD) |

---

## 7. Known Issues & Workarounds

### Issue 1: URL Field Shows [object Object]

**Problem**: The `url` field in search results may display incorrectly.

**Workaround**: Construct URLs manually from the video ID:
```
https://www.youtube.com/watch?v={videoId}
```

### Issue 2: Wildcard Permissions Don't Work

**Problem**: `mcp__youtube__*` in permissions.allow doesn't auto-approve tools.

**Workaround**: List each tool explicitly in the allow array.

### Issue 3: Rate Limiting

**Problem**: YouTube API has quota limits.

**Workaround**:
- Use `maxResults` parameter wisely
- Cache results where possible
- Batch related searches

### Issue 4: Video Availability

**Problem**: Videos may be private, deleted, or region-locked.

**Workaround**:
- Verify videos using `getVideo` before storing
- Set `verified: true/false` appropriately
- Include audit step in workflow

---

## 8. Example Agent Prompts

### Agent Definition (in .claude/agents/)

```markdown
---
name: youtube-searcher
description: Use this agent to search for YouTube videos
model: sonnet
---

You have access to YouTube MCP tools:
- mcp__youtube__videos_searchVideos
- mcp__youtube__videos_getVideo

When searching:
1. Use searchVideos with relevant query terms
2. Verify results with getVideo if needed
3. Return data in the specified JSON format
```

### Calling the Agent from Parent

```javascript
Task({
  subagent_type: "youtube-searcher",
  prompt: `
    Search for YouTube videos of "Take Five" by Dave Brubeck.
    Find 5-8 quality recordings.
    Return results in JSON format with: id, title, channelTitle, verified, added_date
  `,
  description: "Find Take Five videos"
})
```

### Workflow Orchestration Example

```javascript
// Step 1: Get famous recordings (research agent)
const recordings = await Task({
  subagent_type: "recording-identifier",
  prompt: "Find famous recordings of 'Autumn Leaves'"
});

// Step 2 & 3: Run in parallel (independent tasks)
const [videos, backingTracks] = await Promise.all([
  Task({
    subagent_type: "youtube-recording-identifier",
    prompt: `Find YouTube videos for 'Autumn Leaves'.
             Famous recordings: ${recordings}`
  }),
  Task({
    subagent_type: "backing-track-identifier",
    prompt: "Find backing tracks for 'Autumn Leaves' in G minor"
  })
]);

// Step 4: Audit before saving
const audit = await Task({
  subagent_type: "auditor",
  prompt: `Audit this data: ${JSON.stringify({recordings, videos, backingTracks})}`
});
```

---

## Quick Reference Checklist

When setting up YouTube MCP in a new project:

- [ ] Get YouTube Data API v3 key from Google Cloud Console
- [ ] Install MCP server: `claude mcp add --transport stdio youtube --env YOUTUBE_API_KEY=xxx -- npx -y @sfiorini/youtube-mcp`
- [ ] Verify installation: `claude mcp list-tools`
- [ ] Create `.claude/settings.local.json` with explicit tool permissions
- [ ] Design agents with flat orchestration (no nested Task calls)
- [ ] Test MCP tools work: simple searchVideos call
- [ ] Restart Claude Code after permission changes

---

## Resources

- [YouTube MCP Package](https://www.npmjs.com/package/@sfiorini/youtube-mcp)
- [YouTube Data API Documentation](https://developers.google.com/youtube/v3)
- [Claude Code GitHub Issues](https://github.com/anthropics/claude-code/issues)
  - #2928 - Wildcard permissions feature request
  - #3107 - MCP wildcard permissions bug
  - #5140 - User settings permissions bug
