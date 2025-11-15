# Jazz DB Manager

A content management system for maintaining the 525-tune jazz standards database.

## Features

- **Tune Browser**: Search, filter, and browse all 525 jazz tunes
- **Tune Editor**: Split-screen editor with live preview
  - Basic info editing (name, composer, year, style, etc.)
  - Chord progression editor with validation
  - Section marker builder with auto-generation
  - YouTube video curator with drag-and-drop
- **Validation Dashboard**: Track completion status and data quality
- **Import/Export**: Load and save JSON database files
- **Auto-save**: Changes saved to localStorage
- **Chord Transposition**: Preview charts in C, Bb, and Eb

## Getting Started

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

The app will open at `http://localhost:5173`

### Usage

1. **Import Database**: Click "Import JSON" and select `jazz-tunes-jpp.json` from the parent directory
2. **Browse Tunes**: Search and filter the tune list
3. **Edit a Tune**: Click on any tune to open the editor
4. **Add YouTube Videos**: Go to the YouTube tab and paste video URLs
5. **Save Changes**: Click "Save" to update the tune
6. **Export Database**: Click "Export JSON" to download the updated database

### File Structure

```
src/
├── components/
│   ├── TuneBrowser/    # Main tune list view
│   ├── TuneEditor/     # Split-screen editor
│   ├── YouTubeCurator/ # YouTube video management
│   ├── Dashboard/      # Validation dashboard
│   └── shared/         # Reusable components
├── context/
│   └── DatabaseContext.jsx  # Global state management
├── utils/
│   ├── chordUtils.js   # Chord parsing & transposition
│   └── validation.js   # Data validation
└── App.jsx             # Main app with routing
```

## Data Format

See `jazz-db-manager-specification.md` for complete data structure documentation.

## Technologies

- React 18
- React Router
- Tailwind CSS
- React Player (YouTube embeds)
- @hello-pangea/dnd (drag-and-drop)
- Vite (build tool)

## License

Internal tool for jazz database curation.
