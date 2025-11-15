# Jazz DB Manager - Product Specification Document

**Version:** 1.0  
**Date:** November 16, 2025  
**Status:** Pre-Development Planning  
**Project Type:** Internal Admin Tool

---

## Executive Summary

### Purpose
A dedicated content management system for maintaining the 525-tune jazz standards database that powers the Jazz Tune Learning App. This tool solves the problem of efficiently curating and validating complex musical data, YouTube playlists, and metadata at scale.

### Primary User
Solo developer/curator maintaining the jazz tune database

### Key Problem Solved
**Before:** Manually editing a 8,600-line JSON file is error-prone, time-consuming, and doesn't allow for preview or validation  
**After:** Visual interface with live preview, YouTube curation workflow, validation, and bulk operations saves 200+ hours of work

### Success Metric
Build and deploy in 40 hours; enable efficient maintenance of all 525 tunes with complete YouTube playlists within 6 months

---

## Product Overview

### Core Value Proposition
"Maintain a 525-tune jazz database with YouTube playlists, validated chords, and rich metadata through an intuitive visual interface - 10x faster than manual JSON editing."

### Scope
This is a **private, single-user admin tool**, not a customer-facing application. It exists solely to maintain data quality for the main Jazz Tune Learning App.

### Key Differentiators from Manual Editing
1. **Visual workflow** - See what users will see as you edit
2. **YouTube integration** - Preview and test videos before adding
3. **Validation** - Catch formatting errors before they reach production
4. **Efficiency** - Bulk operations, keyboard shortcuts, auto-save
5. **Safety** - Version control, backups, undo capability

---

## Current Database Analysis

### What Exists (Good Foundation)
✅ 525 tunes with unique IDs  
✅ Chord progressions in display-ready format (pipe-delimited measures)  
✅ Rich metadata (composer, year, style, form, history)  
✅ Famous recordings arrays  
✅ Rank field for popularity

### What Needs to Be Added
❌ `youtube_video_ids` array (0/525 tunes have this)  
❌ `tempo_range` field (missing from most tunes)  
❌ `section_markers` for A/B/A/C visualization  
⚠️ `standard_key` inconsistently populated (some have it, many don't)  
⚠️ `time_signature` not present (assumed 4/4)

### Current Data Structure Example
```json
{
  "tune_name": "There Will Never Be Another You",
  "composer": "Harry Warren",
  "year": "1942",
  "style": "swing",
  "form": "32-bar ABAC",
  "standard_key": "Eb major",
  "chords": "| Ebmaj7 | Cm7 | Fm7 | Bb7 |\n...",
  "history_and_facts": "...",
  "famous_recordings": ["Chet Baker - 1954", "Ella Fitzgerald - 1960"],
  "rank": 145,
  "id": "unique_id"
}
```

### Enhanced Data Structure (Target)
```json
{
  "tune_name": "There Will Never Be Another You",
  "composer": "Harry Warren",
  "lyricist": "Mack Gordon",
  "year": "1942",
  "style": "swing",
  "form": "32-bar ABAC",
  "standard_key": "Eb major",
  "tempo_range": "120-160 BPM",
  "time_signature": "4/4",
  
  "chords": "| Ebmaj7 | Cm7 | Fm7 | Bb7 |\n| Eb6 | Dm7b5 G7b9 | Cm7 | Cm7 |\n...",
  "section_markers": [
    {"label": "A", "start": 1, "end": 8},
    {"label": "B", "start": 9, "end": 16},
    {"label": "A", "start": 17, "end": 24},
    {"label": "C", "start": 25, "end": 32}
  ],
  
  "history_and_facts": "...",
  "famous_recordings": [
    {"artist": "Chet Baker", "year": "1954", "album": "Chet Baker Sings"},
    {"artist": "Ella Fitzgerald", "year": "1960", "album": "Ella Sings Gershwin"}
  ],
  
  "youtube_video_ids": [
    {
      "id": "dQw4w9WgXcQ",
      "title": "Chet Baker - There Will Never Be Another You (1954)",
      "artist": "Chet Baker",
      "verified": true,
      "added_date": "2025-11-16"
    },
    {
      "id": "abc123xyz",
      "title": "Ella Fitzgerald - Live 1960",
      "artist": "Ella Fitzgerald",
      "verified": true,
      "added_date": "2025-11-16"
    }
  ],
  
  "spotify_search_artists": [
    "Chet Baker",
    "Ella Fitzgerald",
    "Bill Evans"
  ],
  
  "rank": 145,
  "id": "mewjccgxvmb78mtwzvq",
  "last_updated": "2025-11-16T12:34:56Z",
  "curator_notes": "Need to add more modern recordings; check Bill Frisell version"
}
```

---

## Core Features

### 1. Tune Browser & Search

**Purpose:** Quickly find and filter tunes from the 525-item database

**Interface:**
```
┌─────────────────────────────────────────────────────────────┐
│ Jazz DB Manager                            [Export] [Import]│
├─────────────────────────────────────────────────────────────┤
│ Search: [autumn leaves________________] 🔍                  │
│                                                              │
│ Filters:                                                     │
│ Style: [All ▼] Key: [All ▼] Form: [All ▼]                  │
│ ☐ Has YouTube videos  ☐ Missing tempo  ☐ Incomplete        │
│                                                              │
│ Showing 12 of 525 tunes                    Sort: [Name ▼]   │
├─────────────────────────────────────────────────────────────┤
│ Name                  Composer       Year  Style    Status  │
│ ─────────────────────────────────────────────────────────── │
│ Autumn Leaves        Kosma          1945  Ballad   ⚠️ 3/5   │
│ All the Things...    Kern           1939  Swing    ✅ 5/5   │
│ There Will Never...  Warren         1942  Swing    ❌ 0/5   │
│ ...                                                          │
└─────────────────────────────────────────────────────────────┘
```

**Features:**
- **Search:** Real-time filter by tune name, composer, or lyricist
- **Filters:**
  - Style dropdown (swing, bebop, ballad, bossa nova, blues, etc.)
  - Key dropdown (all standard keys)
  - Form dropdown (AABA, ABAC, Blues, etc.)
  - Checkboxes: Has YouTube videos, Missing tempo, Missing standard key, Incomplete data
- **Sort options:**
  - Alphabetical (name)
  - By rank (popularity)
  - By year
  - By completion status (least to most complete)
  - By last updated (recently edited first)
- **Status indicators:**
  - ✅ Complete (all fields populated, 5+ YouTube videos)
  - ⚠️ Partial (missing some fields or <5 videos)
  - ❌ Needs work (multiple missing fields, no videos)
- **Bulk selection:** 
  - Checkbox column for selecting multiple tunes
  - "Select all matching filter" option
  - Bulk actions: Export selected, Mark as reviewed, etc.

**Keyboard Shortcuts:**
- `/` - Focus search
- `↓` `↑` - Navigate results
- `Enter` - Open selected tune
- `Cmd/Ctrl + F` - Advanced filter panel

---

### 2. Tune Editor (Split-Screen Interface)

**Purpose:** Edit all tune metadata with live preview of how it will display in the main app

**Layout:**
```
┌────────────────────────┬────────────────────────────────────┐
│ EDIT                   │ PREVIEW                            │
│                        │                                    │
│ [← Back to List]       │ [Concert] [Bb] [Eb] [Custom ▼]    │
│                        │                                    │
│ Basic Info             │ There Will Never Be Another You    │
│ ─────────────────      │ Harry Warren (Mack Gordon), 1942  │
│ Tune Name*             │                                    │
│ [There Will Never...] │ Style: Swing  |  Form: 32-bar ABAC │
│                        │ Key: Eb major  |  Tempo: 120-160   │
│ Composer*              │                                    │
│ [Harry Warren]         │ ═══════════════════════════════    │
│                        │ A Section                          │
│ Lyricist               │ ┌────┬────┬────┬────┐             │
│ [Mack Gordon]          │ │Ebmaj7│Cm7│Fm7│Bb7│             │
│                        │ └────┴────┴────┴────┘             │
│ Year*                  │ ┌────┬────────┬────┬────┐         │
│ [1942]                 │ │ Eb6 │Dm7b5 G7b9│Cm7│Cm7│        │
│                        │ └────┴────────┴────┴────┘         │
│ Style*                 │                                    │
│ [swing ▼]              │ B Section                          │
│                        │ ┌────┬────┬────┬────┐             │
│ Form                   │ │Fm7 │Bb7 │Ebmaj7│... │            │
│ [32-bar ABAC]          │ ...                                │
│                        │                                    │
│ Standard Key           │ Famous Recordings                  │
│ [Eb major]             │ • Chet Baker - 1954                │
│                        │ • Ella Fitzgerald - 1960           │
│ Tempo Range            │                                    │
│ [120] - [160] BPM     │ [▶ Watch Videos] [🎵 Spotify]      │
│                        │                                    │
│ Time Signature         │                                    │
│ [4/4 ▼]                │                                    │
│                        │                                    │
│ [▼ Chord Progression]  │                                    │
│ [▼ Section Markers]    │                                    │
│ [▼ History & Facts]    │                                    │
│ [▼ Famous Recordings]  │                                    │
│ [▼ YouTube Videos]     │                                    │
│ [▼ Curator Notes]      │                                    │
│                        │                                    │
│ Last saved: 2 min ago  │                                    │
│ [Save] [Cancel]        │                                    │
└────────────────────────┴────────────────────────────────────┘
```

**Edit Panel Features:**

**Basic Info Section:**
- Tune name (required)
- Composer (required)
- Lyricist (optional)
- Year (required, validation: 1900-2025)
- Style dropdown (swing, bebop, ballad, bossa nova, blues, Latin, modal, fusion, etc.)
- Form (text field with autocomplete suggestions: "32-bar AABA", "12-bar Blues", etc.)
- Standard key (dropdown: C major, Bb major, Eb major, F major, etc.)
- Tempo range (two number fields: min-max BPM)
- Time signature (dropdown: 4/4, 3/4, 5/4, 6/8, etc.)

**Chord Progression Section:**
- Large textarea for chord input
- Live validation (highlights malformed chords in red)
- Measure counter (shows total measures based on `|` delimiters)
- Format helper buttons:
  - "Add measure" - inserts `|  |`
  - "Add line break" - inserts `\n`
  - "Validate syntax" - checks for common errors
- Preview toggle to see rendered chart

**Section Markers Section:**
- Visual builder for form structure
- Auto-detect from measure count (e.g., 32 bars → suggest AABA)
- Drag handles to adjust section boundaries
- Interface:
  ```
  Total measures: 32
  
  ┌─A─┬─A─┬─B─┬─A─┐
  └1─8┴9─16┴17─24┴25─32┘
  
  [Add Section] [Auto-detect]
  
  Section 1: [A ▼] Measures [1] to [8]
  Section 2: [A ▼] Measures [9] to [16]
  Section 3: [B ▼] Measures [17] to [24]
  Section 4: [A ▼] Measures [25] to [32]
  ```

**History & Facts Section:**
- Rich text editor (Markdown support)
- Word count display
- Suggested length: 200-500 words
- Template button to insert standard structure

**Famous Recordings Section:**
- List of recording objects
- Each entry has:
  - Artist (text field)
  - Year (number field)
  - Album (text field, optional)
  - [Remove] button
- [+ Add Recording] button
- Drag handles to reorder

**YouTube Videos Section:** (See dedicated section below)

**Curator Notes Section:**
- Private notes not visible in main app
- Free-form text area
- Examples: "Need to verify chord on bridge", "Check if newer recordings exist"

**Preview Panel Features:**
- **Live updates** as you type in edit panel
- **Transposition tester**:
  - Concert (C), Bb, Eb buttons
  - Custom key dropdown for any key
  - Shows transposed chord chart in real-time
- **Mobile/Desktop toggle** to preview responsive layout
- **Print preview** mode
- Matches exact styling of main app

**Auto-save:**
- Saves to localStorage every 30 seconds
- "Unsaved changes" indicator
- Prompt before navigating away with unsaved edits

---

### 3. YouTube Video Curator (The Killer Feature)

**Purpose:** Efficiently find, preview, test, and manage 5-10 curated videos per tune

**Interface:**
```
┌──────────────────────────────────────────────────────────────┐
│ YouTube Video Curator - "There Will Never Be Another You"   │
├──────────────────────────────────────────────────────────────┤
│ Add by URL                                                   │
│ Paste YouTube URL: [https://youtube.com/watch?v=________]   │
│                    [Add Video]                               │
│                                                              │
│ ──────────────────────────────── OR ─────────────────────── │
│                                                              │
│ Search YouTube: [chet baker there will never____________] 🔍│
│                                                              │
│ Search Results:                                              │
│ ┌──────────────────────────────────────────────────────────┐│
│ │ [▶] Chet Baker - There Will Never Be Another You (1954) ││
│ │     youtube.com/watch?v=dQw4w9WgXcQ                      ││
│ │     [+ Add to Playlist]                                  ││
│ │                                                           ││
│ │ [▶] Ella Fitzgerald - Live in Berlin (1960)              ││
│ │     youtube.com/watch?v=abc123xyz                        ││
│ │     [+ Add to Playlist]                                  ││
│ │                                                           ││
│ │ [▶] Bill Evans Trio - Portrait in Jazz (1959)            ││
│ │     youtube.com/watch?v=xyz789abc                        ││
│ │     [+ Add to Playlist]                                  ││
│ └──────────────────────────────────────────────────────────┘│
│                                                              │
├──────────────────────────────────────────────────────────────┤
│ Current Playlist (5 videos) - Drag to reorder               │
│                                                              │
│ ┌──────────────────────────────────────────────────────────┐│
│ │ ⠿ 1. Chet Baker - 1954                     [▶] [×] [↑↓] ││
│ │    dQw4w9WgXcQ | Added: Nov 16 | ✅ Verified             ││
│ │                                                           ││
│ │ ⠿ 2. Ella Fitzgerald - 1960                [▶] [×] [↑↓] ││
│ │    abc123xyz | Added: Nov 16 | ✅ Verified               ││
│ │                                                           ││
│ │ ⠿ 3. Bill Evans - 1959                     [▶] [×] [↑↓] ││
│ │    xyz789abc | Added: Nov 16 | ✅ Verified               ││
│ │                                                           ││
│ │ ⠿ 4. Oscar Peterson - 1962                 [▶] [×] [↑↓] ││
│ │    def456ghi | Added: Nov 16 | ⚠️ Not verified           ││
│ │                                                           ││
│ │ ⠿ 5. Wes Montgomery - 1965                 [▶] [×] [↑↓] ││
│ │    ghi789def | Added: Nov 16 | ✅ Verified               ││
│ └──────────────────────────────────────────────────────────┘│
│                                                              │
│ Generated Playlist URL:                                      │
│ youtube.com/watch_videos?video_ids=dQw4w9WgXcQ,abc123xyz... │
│ [📋 Copy URL] [Test in New Tab]                             │
│                                                              │
│ Target: 5-10 videos | Current: 5 | Status: ✅ Ready         │
│                                                              │
│ [Verify All Videos] [Clear All] [Save Playlist]             │
└──────────────────────────────────────────────────────────────┘
```

**Features:**

**Add Videos:**
- **Method 1: Direct URL paste**
  - Paste any YouTube URL format (watch?v=, youtu.be/, etc.)
  - Auto-extract video ID
  - Fetch title via API (optional) or allow manual entry
- **Method 2: YouTube search**
  - Built-in search (if API key available)
  - Opens YouTube search in iframe/modal
  - Manual search workflow: copy URL from YouTube, paste into tool

**Playlist Management:**
- **Drag-and-drop reordering** (React Beautiful DnD or similar)
- **Order matters:** First video is "primary" recommendation
- Each video shows:
  - Position number
  - Title/artist
  - Video ID
  - Date added
  - Verification status (✅ verified = tested and plays, ⚠️ not verified)
- **Actions per video:**
  - [▶] Preview - Embed player modal
  - [×] Remove
  - [↑↓] Drag handles for reordering

**Verification:**
- "Verify All Videos" button checks each URL is valid
- Shows: ✅ Active, ⚠️ Private/Restricted, ❌ Deleted
- Auto-verify when adding (optional)
- Manual verification override for edge cases

**Playlist URL Generator:**
- Automatically creates: `youtube.com/watch_videos?video_ids=ID1,ID2,ID3...`
- Copy to clipboard button
- "Test in new tab" opens playlist to verify it works

**Curation Guidelines (Displayed in UI):**
- Target: 5-10 essential recordings
- Prefer: Official uploads, high audio quality, complete performances
- Avoid: Bootlegs, poor quality, unauthorized uploads
- Diversify: Different eras, vocalists vs instrumentalists, tempos

**Smart Suggestions (Nice-to-have):**
- Parse "famous_recordings" field
- Generate search queries: `"[Tune Name]" [Artist Name]`
- Suggest: "Search for Chet Baker version"

---

### 4. Data Validation Dashboard

**Purpose:** Quality control overview showing completion status across all tunes

**Interface:**
```
┌──────────────────────────────────────────────────────────────┐
│ Data Validation Dashboard                                    │
├──────────────────────────────────────────────────────────────┤
│ Overall Progress                                             │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│ Complete: 127/525 (24%) | In Progress: 198 | Not Started: 200│
│                                                              │
│ Field Completion Stats                                       │
│ ───────────────────────                                      │
│ ✅ Basic Info:        525/525 (100%) ████████████           │
│ ✅ Chord Progression: 525/525 (100%) ████████████           │
│ ⚠️  Standard Key:      312/525 (59%)  █████░░░░░            │
│ ❌ Tempo Range:        45/525  (9%)   █░░░░░░░░░            │
│ ❌ Section Markers:    23/525  (4%)   ░░░░░░░░░░            │
│ ⚠️  YouTube Videos:    78/525  (15%)  █░░░░░░░░░            │
│ ✅ History & Facts:   525/525 (100%) ████████████           │
│ ✅ Famous Recordings: 525/525 (100%) ████████████           │
│                                                              │
│ YouTube Video Stats                                          │
│ ───────────────────                                          │
│ 0 videos:   447 tunes                                        │
│ 1-4 videos:  45 tunes (below target)                         │
│ 5-10 videos: 33 tunes ✅ (target range)                      │
│ 10+ videos:   0 tunes (over-curated)                         │
│                                                              │
│ Quick Actions                                                │
│ ─────────────                                                │
│ [Find: Missing Tempo] [Find: No YouTube Videos]             │
│ [Find: Incomplete Standard Key] [Find: No Section Markers]  │
│ [Export Incomplete Tunes CSV]                                │
│                                                              │
│ Recent Activity                                              │
│ ───────────────                                              │
│ • Updated "Autumn Leaves" - added 3 YouTube videos (5 min)  │
│ • Updated "All the Things You Are" - set tempo (12 min)     │
│ • Created section markers for 5 tunes via bulk tool (45 min)│
└──────────────────────────────────────────────────────────────┘
```

**Features:**

**Completion Tracking:**
- Overall percentage complete
- Field-by-field breakdown
- Visual progress bars
- Color coding: ✅ >90%, ⚠️ 50-90%, ❌ <50%

**Quick Filters:**
- One-click to see all tunes missing specific fields
- Opens filtered tune browser
- Examples:
  - "Missing tempo range" → 480 tunes
  - "No YouTube videos" → 447 tunes
  - "Incomplete section markers" → 502 tunes

**Priority Recommendations:**
- Algorithm suggests which tunes to work on first:
  - High-rank tunes missing data (fix popular ones first)
  - Nearly complete tunes (knock out easy wins)
  - Tunes with 1-4 videos (get them to 5+ target)

**Export Options:**
- Export incomplete tunes to CSV for offline tracking
- Generate to-do list
- Print-friendly report

---

### 5. Bulk Operations & Tools

**Purpose:** Efficiently update multiple tunes at once

**Features:**

**Bulk Update Tools:**
- Select multiple tunes from browser
- Apply changes to all selected:
  - Set tempo range (if missing)
  - Add curator note
  - Mark as "reviewed"
  - Generate section markers (if measure count matches common forms)

**Auto-Generation Tools:**

**Section Marker Generator:**
- Scans chord progression, counts measures
- Matches to common forms:
  - 32 bars → Likely AABA or ABAC
  - 12 bars → Blues (AAB)
  - 24 bars → Likely ABA or song-specific
  - 64 bars → Double AABA or other extended form
- Suggests section structure based on `form` field text
- Batch process: "Generate for all 32-bar AABA tunes"

**Example:**
```
Detected: 32 measures, form field says "32-bar AABA"
Suggested sections:
A: measures 1-8
A: measures 9-16
B: measures 17-24
A: measures 25-32

[Apply] [Adjust] [Skip]
```

**Data Migration Scripts:**
- One-time tools for cleaning data:
  - "Convert famous_recordings from strings to objects"
  - "Extract lyricists from composer field"
  - "Standardize key naming (F major vs F vs Fmaj)"

---

### 6. Import/Export & Version Control

**Purpose:** Safe data management with backups and rollback capability

**Features:**

**Export:**
- **Full database:** Export complete JSON file
- **Single tune:** Export one tune as JSON
- **Filtered subset:** Export only tunes matching current filter
- **CSV export:** Spreadsheet-friendly format for offline review
- **Backup with timestamp:** Auto-named `jazz-db-backup-2025-11-16-14-30.json`

**Import:**
- **Full database replacement:** Upload new JSON file
- **Merge mode:** Import updates without overwriting unchanged tunes
- **Single tune import:** Update one tune from JSON
- **CSV import:** Bulk update specific fields from spreadsheet

**Version Control:**
- **Auto-backup before save:** Every save creates timestamped backup
- **Backup history:** Keep last 30 backups (rolling)
- **Diff viewer:** Compare current vs backup
  - Shows what changed (tune-by-tune)
  - Red = deleted, Green = added, Yellow = modified
- **Rollback:** Restore from any backup

**Example Diff View:**
```
Comparing: Current vs Backup (Nov 15, 14:23)

Modified Tunes (3):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
"Autumn Leaves"
  + youtube_video_ids: [3 videos added]
  ~ tempo_range: "100-120" → "120-140"
  
"All the Things You Are"
  + section_markers: [added AABA structure]
  
"There Will Never Be Another You"
  ~ chords: [measure 12 modified]

[Restore This Backup] [Export Diff]
```

**Safety Features:**
- Confirmation dialogs for destructive actions
- Undo buffer (last 10 actions)
- Read-only mode to prevent accidental edits
- Export before import (forced backup)

---

### 7. Chord Chart Validation & Preview

**Purpose:** Ensure chord data displays correctly and catches formatting errors

**Features:**

**Live Validation:**
- As you type in chord editor, highlight issues:
  - ⚠️ Yellow: Unusual chord names (might be typos: `Cbaj7` → `Cmaj7`?)
  - ❌ Red: Malformed syntax (missing `|` delimiters, invalid characters)
  - ℹ️ Blue: Suggestions (detected enharmonic issues: `Db` in C major context)

**Validation Rules:**
- Measures must start/end with `|`
- Line breaks only via `\n`
- Common chord types recognized: maj7, m7, 7, dim7, m7b5, sus, alt, etc.
- Detect missing spaces: `|Cmaj7Dm7|` should be `|Cmaj7 Dm7|`

**Preview Features:**
- **Real-time rendering** of chord chart
- **Transposition tester:**
  - Show chord in C, Bb, Eb simultaneously
  - Verify transposition algorithm works correctly
  - Preview shows: 
    - Chord grid (visual boxes)
    - Section labels (A/B/A/C)
    - Measure numbers
- **Mobile preview:** Toggle to see mobile layout
- **Print preview:** Check PDF/print formatting

**Measure Counter:**
- Auto-count measures based on `|` delimiters
- Display: "32 measures detected"
- Warning if measure count doesn't match form (e.g., "AABA" suggests 32 bars but only 28 detected)

---

### 8. Keyboard Shortcuts & Efficiency

**Purpose:** Speed up repetitive tasks for power users

**Global Shortcuts:**
- `Cmd/Ctrl + S` - Save current tune
- `Cmd/Ctrl + K` - Quick search (focus search bar)
- `Cmd/Ctrl + N` - New tune
- `Esc` - Cancel/close modal
- `Cmd/Ctrl + Z` - Undo last change

**Browser Navigation:**
- `↓` `↑` - Navigate tune list
- `Enter` - Open selected tune
- `Cmd/Ctrl + ←` - Back to tune list

**Editor Shortcuts:**
- `Tab` - Next field
- `Shift + Tab` - Previous field
- `Cmd/Ctrl + E` - Toggle edit/preview panels
- `Cmd/Ctrl + T` - Test transposition (cycle through keys)

**YouTube Curator:**
- `Cmd/Ctrl + V` - Auto-focus URL paste field when copying YouTube URL
- `Cmd/Ctrl + Enter` - Add video from paste field
- `Delete` - Remove selected video

**Workflow Optimizations:**
- **Auto-save:** Saves every 30s + on blur
- **Smart focus:** After saving, focus returns to search for next tune
- **Recently edited:** Quick access to last 5 edited tunes
- **Favorites/Starred:** Mark tunes you're actively working on

---

## Technical Architecture

### Frontend

**Framework:** React 18+
- Modern, component-based architecture
- Strong ecosystem for needed libraries
- Fast development with hot reload

**Key Libraries:**
- **UI Framework:** React + Tailwind CSS
  - Mobile-first responsive design
  - Dark mode support (optional)
- **Drag & Drop:** React Beautiful DnD or React DnD
  - For reordering YouTube videos, famous recordings
- **Form Handling:** React Hook Form
  - Validation, auto-save, field state management
- **Rich Text Editor:** TipTap or React Quill (for history/facts)
- **YouTube Player:** React Player
  - Embed preview player in curator
- **Data Validation:** Zod or Yup
  - Schema validation for JSON structure
- **File Handling:** File System Access API or manual upload
  - Read/write local JSON file

**State Management:**
- React Context or Zustand (lightweight)
- Local state for most UI
- Global state for:
  - Current database
  - Undo/redo buffer
  - User preferences

**Chord Parsing/Transposition:**
- Custom JavaScript library or adapt existing (TonalJS)
- Parse chord symbols: `Cmaj7`, `Dm7b5`, `G7alt`, etc.
- Transpose to any key
- Validate chord syntax

### Backend

**Option 1: No Backend (Recommended for MVP)**
- Pure client-side React app
- Runs locally via `npm start` or deployed as static site
- File operations:
  - User downloads JSON from app
  - User uploads JSON to edit
  - Browser localStorage for auto-save buffer
- **Pros:** 
  - Zero hosting costs
  - Simple deployment
  - Works offline
  - No security concerns (private local tool)
- **Cons:** 
  - Manual file download/upload workflow
  - No real-time collaboration (not needed)

**Option 2: Simple Node.js Server (Optional Enhancement)**
- Express.js API for file operations
- Endpoints:
  - `GET /api/database` - Load full JSON
  - `PUT /api/database` - Save full JSON
  - `GET /api/backups` - List backups
  - `POST /api/backups/:id/restore` - Restore backup
  - `GET /api/youtube/search?q=query` - YouTube API proxy (optional)
- **Pros:**
  - Seamless file saving
  - Automated backups
  - YouTube API integration
- **Cons:**
  - Requires hosting
  - More complex setup

**Recommended Approach:** Start with Option 1 (no backend), add Option 2 later if desired

### Data Storage

**Source of Truth:** 
- JSON file: `jazz-tunes-jpp.json` (8,622 lines currently)

**Backup Strategy:**
- Before each save, copy current file to `backups/` folder
- Filename: `jazz-db-backup-YYYY-MM-DD-HH-MM.json`
- Keep rolling 30 backups (delete older)
- User can manually export anytime

**Auto-Save Buffer:**
- Use browser localStorage to cache edits
- Restore on refresh if unsaved changes
- Clear on successful save

### Deployment Options

**Option 1: Local Development Server (Immediate Use)**
```bash
npm start
# Access at http://localhost:3000
```
- No deployment needed
- Start using immediately
- Edit database, download updated file

**Option 2: Private Static Site (Convenient Access)**
- Deploy to Vercel/Netlify
- Password-protect via Netlify Identity (free)
- Access from anywhere
- Still downloads/uploads JSON file

**Option 3: Private Server with Persistence (Full Solution)**
- Deploy to Railway/Render with Node.js backend
- Database file stored on server
- HTTP basic auth for security
- Auto-backup to S3/Backblaze

**Recommended for Solo Use:** Option 1 (local) for initial build, then Option 2 (private static site) for convenience

---

## Database Schema Changes

### New Fields to Add

#### Required for All Tunes:
```json
{
  "tempo_range": "120-160 BPM",
  "time_signature": "4/4",
  "section_markers": [
    {"label": "A", "start": 1, "end": 8},
    {"label": "A", "start": 9, "end": 16},
    {"label": "B", "start": 17, "end": 24},
    {"label": "A", "start": 25, "end": 32}
  ],
  "youtube_video_ids": [
    {
      "id": "dQw4w9WgXcQ",
      "title": "Chet Baker - There Will Never Be Another You (1954)",
      "artist": "Chet Baker",
      "verified": true,
      "added_date": "2025-11-16"
    }
  ],
  "spotify_search_artists": ["Chet Baker", "Ella Fitzgerald", "Bill Evans"],
  "last_updated": "2025-11-16T12:34:56Z",
  "curator_notes": "Private notes for curator"
}
```

#### Update Existing Field:
```json
{
  "famous_recordings": [
    // Old format (strings):
    "Chet Baker - 1954"
    
    // New format (objects):
    {
      "artist": "Chet Baker",
      "year": "1954",
      "album": "Chet Baker Sings"
    }
  ]
}
```

### Migration Strategy

**Phase 1: Additive (Non-Breaking)**
- Add new fields to tunes as they're edited
- Don't touch tunes you haven't reviewed
- Old format still valid (main app handles missing fields gracefully)

**Phase 2: Backfill**
- Use bulk tools to add defaults:
  - `time_signature: "4/4"` for all tunes (safe assumption)
  - `tempo_range: null` (to be filled manually)
  - `section_markers: []` (to be filled manually or auto-generated)
  - `youtube_video_ids: []` (to be curated)
  - `curator_notes: ""`

**Phase 3: Cleanup (Optional)**
- Convert all famous_recordings to object format
- Ensure all tunes have `standard_key` field
- Validate all chords parse correctly

**No Breaking Changes:** Main app must handle both old and new formats during transition

---

## UI/UX Design Principles

### Visual Design

**Color Scheme:**
- Professional, minimal design
- Jazz-inspired palette:
  - Primary: Deep blue (#1e3a8a) for headers
  - Accent: Gold (#f59e0b) for interactive elements
  - Background: Light gray (#f9fafb) or white
  - Text: Dark gray (#1f2937)
- Success: Green (#10b981)
- Warning: Amber (#f59e0b)
- Error: Red (#ef4444)

**Typography:**
- Headers: Inter or Roboto (clean, modern)
- Body text: System font stack (fast load)
- Chord symbols: Monospace font (consistent spacing)

**Layout:**
- Mobile-first (but primarily desktop tool)
- Responsive breakpoints: 768px (tablet), 1024px (desktop)
- Sidebar navigation (optional): Pin for desktop, drawer for mobile

### User Experience

**Guiding Principles:**
1. **Speed:** Every click should feel instant
2. **Clarity:** No ambiguity about what actions do
3. **Safety:** Hard to accidentally delete data
4. **Efficiency:** Common tasks take <5 clicks
5. **Feedback:** Always confirm actions (toasts, status indicators)

**Interaction Patterns:**
- **Hover states:** Show what's clickable
- **Loading states:** Skeleton screens, spinners
- **Empty states:** Helpful messages ("No YouTube videos yet. Add your first one!")
- **Error states:** Specific, actionable messages ("Invalid chord format at measure 12")
- **Success states:** Confirm saves ("Autumn Leaves updated ✓")

**Accessibility:**
- Keyboard navigation for all actions
- Focus indicators clearly visible
- Screen reader compatible (ARIA labels)
- Color not sole indicator (use icons + text)
- High contrast mode support

---

## Development Phases

### Phase 1: Foundation (Week 1 - 10 hours)
**Goal:** Basic CRUD operations working

**Deliverables:**
- [ ] Project setup (React, Tailwind, basic routing)
- [ ] JSON file upload/download
- [ ] Tune browser with search
- [ ] Basic filters (style, key)
- [ ] Single tune editor (basic fields only)
- [ ] Save functionality (download updated JSON)

**Success Criteria:**
- Can load database
- Can search and find a tune
- Can edit basic info (name, composer, year)
- Can save and download

---

### Phase 2: YouTube Curator (Week 2 - 12 hours)
**Goal:** Complete YouTube video workflow

**Deliverables:**
- [ ] YouTube video curator interface
- [ ] Add video by URL
- [ ] Video preview (React Player embed)
- [ ] Drag-and-drop reordering
- [ ] Playlist URL generator
- [ ] Verify video existence (optional: YouTube API)
- [ ] Save video IDs to tune object

**Success Criteria:**
- Can add 5 YouTube videos to a tune
- Can reorder them via drag-and-drop
- Can preview videos in modal
- Can generate and test playlist URL
- Video data persists in JSON

---

### Phase 3: Chord Tools & Validation (Week 3 - 10 hours)
**Goal:** Chord chart editing with live preview

**Deliverables:**
- [ ] Chord progression editor with validation
- [ ] Measure counter
- [ ] Section marker builder (visual interface)
- [ ] Live preview panel
- [ ] Transposition tester (C, Bb, Eb)
- [ ] Chord syntax validation (highlight errors)
- [ ] Auto-save to localStorage

**Success Criteria:**
- Can edit chord progression
- Can create section markers
- Preview shows correctly formatted chart
- Transposition works accurately
- Validation catches common errors

---

### Phase 4: Data Validation & Bulk Tools (Week 4 - 8 hours)
**Goal:** Quality control and efficiency features

**Deliverables:**
- [ ] Validation dashboard (completion stats)
- [ ] Quick filter actions
- [ ] Bulk selection in tune browser
- [ ] Section marker auto-generator
- [ ] Export incomplete tunes CSV
- [ ] Recent activity log

**Success Criteria:**
- Dashboard shows accurate completion percentages
- Can filter "missing tempo" → opens 480 tunes
- Can auto-generate section markers for 32-bar AABA tunes
- Can export filtered list to CSV

---

### Phase 5: Polish & Production (Ongoing - TBD)
**Goal:** Make tool production-ready and efficient

**Deliverables:**
- [ ] Keyboard shortcuts
- [ ] Undo/redo functionality
- [ ] Auto-backup system
- [ ] Diff viewer (compare backups)
- [ ] Dark mode (optional)
- [ ] Comprehensive error handling
- [ ] User guide/documentation

**Success Criteria:**
- Can undo last 10 actions
- Auto-backup works on every save
- Can compare current vs previous version
- Tool feels fast and responsive
- Zero data loss during testing

---

## Success Metrics

### Development Metrics
- **Time to MVP:** 40 hours (4 weeks part-time)
- **Time to full completion:** Add 10-15 hours for polish

### Usage Metrics (After Deployment)
- **Initial curation:** 50 tunes with YouTube playlists in first month
- **Efficiency gain:** <5 minutes per tune to add 5-10 videos (vs 30+ minutes manually)
- **Data quality:** 90%+ tunes have all required fields by 6 months
- **Error rate:** <1% of tunes have invalid/malformed data

### ROI Calculation
- **Investment:** 40-50 hours to build
- **Savings:** 
  - YouTube curation: 525 tunes × 25 min saved = 218 hours
  - Validation/editing: 100 hours saved (no manual JSON editing errors)
  - Total saved: ~300+ hours
- **ROI:** 6:1 time savings ratio

---

## Risks & Mitigation

### Technical Risks

**Risk:** YouTube video links die frequently  
**Mitigation:**
- Build verification tool into curator
- Accept 5-10% dead link rate as normal
- Make it easy to replace dead videos (quick workflow)

**Risk:** Chord transposition algorithm has bugs  
**Mitigation:**
- Test with 20 diverse tunes before deploying
- Have fallback: show original key if transposition fails
- Add manual override option

**Risk:** User accidentally deletes data  
**Mitigation:**
- Auto-backup before every save
- Undo buffer for last 10 actions
- Confirmation dialogs for destructive actions
- Can always restore from backup

### Scope Risks

**Risk:** Feature creep extends development time  
**Mitigation:**
- Strictly follow phased plan
- Mark features as "v2" if not essential for MVP
- Example v2 features: YouTube API integration, AI-assisted curation, collaborative editing

**Risk:** Tool is over-engineered for one user  
**Mitigation:**
- Keep it simple: no user auth, no database, just JSON
- Build only what saves time (don't build "nice to haves")
- 40-hour budget is hard limit

---

## Questions to Answer Before Building

### Technology Choices
1. ✅ React for frontend? (Yes - fast, familiar, good ecosystem)
2. ✅ Backend or client-side only? (Client-side for MVP)
3. ❓ YouTube API key or manual workflow? (Manual for MVP, API later)
4. ❓ Rich text editor for history field? (Yes - TipTap or Quill)
5. ✅ Deployment? (Local first, then Netlify/Vercel if desired)

### Data/Workflow Choices
1. ❓ Required vs optional fields? (Set minimum: name, composer, year, chords, style)
2. ❓ Target YouTube videos per tune? (5-10 ideal, 5 minimum)
3. ❓ How to handle tunes with no standard key? (Allow null, mark as "varies")
4. ❓ Tempo range format? (String: "120-160 BPM" or object: {min: 120, max: 160}?)
5. ❓ Should section markers be optional? (Yes - some non-standard forms can't be marked)

### Priority Decisions
1. ❓ Which 50 tunes to curate first? (Use rank field: top 50 by popularity)
2. ❓ Dark mode important? (Low priority - nice to have)
3. ❓ Mobile-responsive critical? (Medium priority - primarily desktop tool)
4. ❓ Keyboard shortcuts essential? (High priority - power user efficiency)

---

## Next Steps (Immediate Action Items)

### This Week
1. [ ] Review and approve this specification
2. [ ] Set up React project with Tailwind CSS
3. [ ] Create GitHub repository
4. [ ] Install key dependencies (React Router, React Hook Form, React Player)
5. [ ] Create basic file structure and routing

### Week 1 (Phase 1)
1. [ ] Build JSON upload/download functionality
2. [ ] Create tune browser component
3. [ ] Implement search and basic filters
4. [ ] Build single-tune editor layout
5. [ ] Test with real database file

### Ongoing
- Document decisions in README
- Keep changelog of significant changes
- Test with small subset of tunes first (10-20)
- Iterate based on real usage

---

## Appendix A: Component Structure

```
src/
├── components/
│   ├── TuneBrowser/
│   │   ├── TuneBrowser.jsx
│   │   ├── TuneList.jsx
│   │   ├── TuneRow.jsx
│   │   ├── SearchBar.jsx
│   │   └── FilterPanel.jsx
│   ├── TuneEditor/
│   │   ├── TuneEditor.jsx
│   │   ├── BasicInfoForm.jsx
│   │   ├── ChordEditor.jsx
│   │   ├── SectionMarkerBuilder.jsx
│   │   ├── HistoryEditor.jsx
│   │   ├── FamousRecordingsList.jsx
│   │   └── YouTubeCurator.jsx
│   ├── Preview/
│   │   ├── PreviewPanel.jsx
│   │   ├── ChordChart.jsx
│   │   └── TranspositionTester.jsx
│   ├── Dashboard/
│   │   ├── ValidationDashboard.jsx
│   │   ├── ProgressStats.jsx
│   │   └── QuickActions.jsx
│   └── shared/
│       ├── Button.jsx
│       ├── Modal.jsx
│       ├── Toast.jsx
│       └── FileUpload.jsx
├── utils/
│   ├── chordParser.js
│   ├── transposer.js
│   ├── validator.js
│   └── backupManager.js
├── hooks/
│   ├── useDatabase.js
│   ├── useAutoSave.js
│   └── useUndo.js
├── context/
│   └── DatabaseContext.jsx
└── App.jsx
```

---

## Appendix B: Sample Data Validation Rules

### Tune-Level Validation
```javascript
const tuneSchema = {
  tune_name: { required: true, minLength: 2, maxLength: 100 },
  composer: { required: true, minLength: 2, maxLength: 100 },
  lyricist: { required: false, maxLength: 100 },
  year: { required: true, min: 1900, max: 2025 },
  style: { required: true, enum: ['swing', 'bebop', 'ballad', 'bossa nova', 'blues', 'latin', 'modal', 'fusion', 'other'] },
  form: { required: true, minLength: 3, maxLength: 200 },
  standard_key: { required: false, pattern: /^[A-G][b#]?\s*(major|minor|maj|min)?$/i },
  tempo_range: { required: false, pattern: /^\d{2,3}-\d{2,3}\s*BPM$/i },
  time_signature: { required: false, pattern: /^\d\/\d{1,2}$/ },
  chords: { required: true, minLength: 10, validate: chordSyntaxValidator },
  section_markers: { required: false, type: 'array', validate: sectionMarkersValidator },
  history_and_facts: { required: true, minLength: 50, maxLength: 5000 },
  famous_recordings: { required: true, type: 'array', minItems: 1, validate: recordingsValidator },
  youtube_video_ids: { required: false, type: 'array', maxItems: 15, validate: youtubeValidator },
  spotify_search_artists: { required: false, type: 'array', maxItems: 10 },
  rank: { required: true, min: 1, max: 600 },
  id: { required: true, pattern: /^[a-z0-9]{19}$/ },
  last_updated: { required: false, type: 'datetime' },
  curator_notes: { required: false, maxLength: 1000 }
};
```

### Chord Syntax Validator
```javascript
function chordSyntaxValidator(chordString) {
  const errors = [];
  
  // Must start and end with |
  if (!chordString.startsWith('|') || !chordString.endsWith('|')) {
    errors.push('Chord progression must start and end with |');
  }
  
  // Count measures
  const measures = chordString.split('\n')
    .flatMap(line => line.split('|').filter(m => m.trim()));
  
  // Check each measure for valid chord symbols
  measures.forEach((measure, idx) => {
    const chords = measure.trim().split(/\s+/);
    chords.forEach(chord => {
      if (!isValidChord(chord)) {
        errors.push(`Invalid chord "${chord}" at measure ${idx + 1}`);
      }
    });
  });
  
  return { valid: errors.length === 0, errors };
}

function isValidChord(chord) {
  // Basic pattern: Root (C, Db, F#) + Quality (maj7, m7, 7, etc.) + Extensions
  const chordPattern = /^[A-G][b#]?(maj|min|m|dim|aug|sus)?\d*(b\d|#\d|add\d|alt)?$/i;
  return chordPattern.test(chord);
}
```

---

## Appendix C: YouTube Curator Workflow Example

### Scenario: Curating "Autumn Leaves"

**Step 1: Open Tune in Editor**
- Search: "autumn"
- Click "Autumn Leaves" → Opens split-screen editor

**Step 2: Navigate to YouTube Curator Tab**
- Scroll to "YouTube Videos" section
- Click "Open Curator"

**Step 3: Search for Videos**
- Search query: "autumn leaves chet baker"
- Results show 5+ videos
- Preview first result → [▶] button opens modal with embedded player

**Step 4: Add Videos**
- Click [+ Add to Playlist] on Chet Baker 1954 version
- Search: "autumn leaves bill evans"
- Add Bill Evans version
- Search: "autumn leaves cannonball adderley"
- Add Cannonball version
- Repeat for 2 more artists

**Step 5: Reorder Playlist**
- Drag Chet Baker to position 1 (primary recommendation)
- Drag Bill Evans to position 2
- Drag Cannonball to position 3

**Step 6: Verify & Test**
- Click [Verify All Videos] → All show ✅
- Click [Test Playlist URL] → Opens new tab, playlist works

**Step 7: Save**
- Click [Save Playlist]
- Status shows: "5 videos | ✅ Ready"
- Click [Save] in main editor
- Status toast: "Autumn Leaves updated ✓"

**Time elapsed:** ~3 minutes (vs 15+ minutes manually searching, copying URLs, editing JSON)

---

## Document Revision History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | Nov 16, 2025 | Initial comprehensive specification |

---

## Contact & Project Info

**Project Name:** Jazz DB Manager  
**Type:** Internal Admin Tool  
**Target Completion:** 40 hours (4 weeks part-time)  
**Dependencies:** Jazz Tune Learning App (main product)

**Key Resources:**
- Database: jazz-tunes-jpp.json (525 tunes, 8,622 lines)
- Tech stack: React + Tailwind CSS
- Deployment: Local development server (initial), Netlify (optional)

---

*This specification is a living document and will be updated as development progresses.*
