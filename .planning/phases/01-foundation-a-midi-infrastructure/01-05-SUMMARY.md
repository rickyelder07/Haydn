---
phase: 01-foundation-a-midi-infrastructure
plan: 05
subsystem: ui
tags: [react, components, file-upload, drag-drop, tailwind]
dependencies:
  requires:
    - 01-01: Types and state store foundation
    - 01-02: MIDI parser for file import
    - 01-03: MusicXML converter for file import
    - 01-04: MIDI exporter for download functionality
  provides:
    - FileUpload component with drag-drop and file selection
    - TrackList component showing track details
    - MetadataDisplay component with project info
    - ExportButton component for MIDI download
  affects:
    - Future phases: Core UI components ready for integration into main application layout
tech-stack:
  added: []
  patterns:
    - Drag-drop file upload with confirmation dialog
    - Collapsible UI sections for metadata
    - Component-level null checks for conditional rendering
    - Loading state management with visual feedback
key-files:
  created:
    - src/components/FileUpload/FileUpload.tsx
    - src/components/FileUpload/index.ts
    - src/components/TrackList/TrackList.tsx
    - src/components/TrackList/index.ts
    - src/components/MetadataDisplay/MetadataDisplay.tsx
    - src/components/MetadataDisplay/index.ts
    - src/components/ExportButton/ExportButton.tsx
    - src/components/ExportButton/index.ts
  modified: []
decisions:
  - id: card-based-track-layout
    what: Use card-based layout for track list instead of simple list
    why: Cards provide better visual separation and hover states
    alternatives: ["Table layout", "Simple list"]
    chosen: "Card-based with hover effects"
    rationale: More modern, easier to extend with future features
  - id: metadata-collapsible-default-expanded
    what: MetadataDisplay defaults to expanded state
    why: User likely wants to see project info immediately after import
    alternatives: ["Default collapsed"]
    chosen: "Default expanded (isExpanded: true)"
    rationale: Better UX for initial file inspection
  - id: filename-extension-handling
    what: Smart filename handling for export (remove old extension, add .mid)
    why: Prevents exports named "song.musicxml.mid"
    alternatives: ["Keep original extension", "Always use 'export.mid'"]
    chosen: "Strip original extension, add .mid"
    rationale: Clean filenames while preserving original name
metrics:
  duration: 2m 47s
  tasks_completed: 3
  commits: 3
  completed: 2026-01-24
---

# Phase 1 Plan 5: UI Components Summary

**One-liner:** Drag-drop file upload, track list with note counts, collapsible metadata display, and MIDI export button with Tailwind styling

## What Was Built

Created the complete user interface for Phase 1, enabling file import, project visualization, and MIDI export. These components wire together the parsing and export pipelines built in plans 01-02 through 01-04.

**Key capabilities:**
- Drag-and-drop or click-to-select file upload for MIDI and MusicXML
- Confirmation dialog when replacing existing project
- Track list showing all tracks with instrument, note count, and duration
- Collapsible metadata section with tempo, time signature, key, PPQ, and duration
- Current filename display with source format indicator
- Export button to download current project as MIDI

## Tasks Completed

### Task 1: Create FileUpload component (Commit: 7bf21dc)
**Status:** Complete
**Files created:** src/components/FileUpload/FileUpload.tsx, src/components/FileUpload/index.ts

Implemented full-featured file upload component:
- Drag-drop zone with visual feedback (border color change on drag-over)
- Click-to-browse file input with hidden native input
- Accepts .mid, .midi, .musicxml, .xml extensions
- Loading spinner during file processing
- Confirmation dialog when project already exists (warns about unsaved changes)
- Clear error messages for unsupported file types
- Integrates with useProjectStore for state updates
- Calls parseMidiFile() or convertMusicXmlFile() based on extension

**UX features:**
- Visual states: default, dragging, loading
- Modal confirmation with Cancel/Replace buttons
- File input reset after selection (allows re-selecting same file)
- Prevents interaction while loading (pointer-events-none)

### Task 2: Create TrackList and MetadataDisplay components (Commit: 1ae458f)
**Status:** Complete
**Files created:**
- src/components/TrackList/TrackList.tsx
- src/components/TrackList/index.ts
- src/components/MetadataDisplay/MetadataDisplay.tsx
- src/components/MetadataDisplay/index.ts

**TrackList component:**
- Displays all tracks from useProjectStore.trackDisplayInfo
- Card-based layout with border and hover states
- Shows track name, instrument name, note count, and formatted duration
- Responsive flexbox layout with text truncation
- Null check: returns null when no project loaded

**MetadataDisplay component:**
- Header showing current filename with music note icon and source format badge
- Collapsible "Project Info" section (defaults to expanded)
- Grid layout with tempo, time signature, key, resolution, duration, track count
- Shows change count for tempo/time signature variations ("+N changes")
- Duration calculated from project.durationTicks with formatDuration helper
- Responsive grid (2 columns mobile, 3 columns desktop)
- Smooth expand/collapse animation with rotate chevron

### Task 3: Create ExportButton component (Commit: 7c2f652)
**Status:** Complete
**Files created:** src/components/ExportButton/ExportButton.tsx, src/components/ExportButton/index.ts

Implemented MIDI export button:
- Calls exportAndDownload() from exporter library
- Shows loading state with spinner during export
- Disabled state while exporting (cursor-not-allowed)
- Smart filename handling: strips original extension, adds .mid
- Null check: hidden when no project loaded
- Visual feedback with 500ms delay before resetting loading state
- Download icon SVG with "Export MIDI" label

## Deviations from Plan

None - plan executed exactly as written.

## Decisions Made

### 1. Card-Based Track Layout
**Decision:** Use card-based layout for track list instead of simple list.
**Rationale:** Cards provide better visual separation and allow for hover effects. Easier to extend with future features (e.g., track selection, inline editing).
**Impact:** Slightly more CSS but significantly better UX.
**Location:** `src/components/TrackList/TrackList.tsx`

### 2. Metadata Default Expanded
**Decision:** MetadataDisplay defaults to expanded state.
**Rationale:** Users likely want to see project info immediately after importing a file for verification.
**Impact:** First-time users see all metadata without clicking. Can be collapsed for cleaner view.
**Location:** `src/components/MetadataDisplay/MetadataDisplay.tsx` - useState(true)

### 3. Smart Filename Handling for Export
**Decision:** Strip original file extension and add .mid for export.
**Rationale:** Prevents awkward filenames like "song.musicxml.mid". Preserves original name while ensuring correct extension.
**Impact:** Export files have clean names. Regex pattern handles all supported extensions.
**Location:** `src/components/ExportButton/ExportButton.tsx` - filename.replace()

## Technical Artifacts

**Created files (8 total):**
- `src/components/FileUpload/FileUpload.tsx` (192 lines)
- `src/components/FileUpload/index.ts` (1 line)
- `src/components/TrackList/TrackList.tsx` (47 lines)
- `src/components/TrackList/index.ts` (1 line)
- `src/components/MetadataDisplay/MetadataDisplay.tsx` (125 lines)
- `src/components/MetadataDisplay/index.ts` (1 line)
- `src/components/ExportButton/ExportButton.tsx` (68 lines)
- `src/components/ExportButton/index.ts` (1 line)

**Component directory structure:**
```
src/components/
├── FileUpload/
│   ├── FileUpload.tsx
│   └── index.ts
├── TrackList/
│   ├── TrackList.tsx
│   └── index.ts
├── MetadataDisplay/
│   ├── MetadataDisplay.tsx
│   └── index.ts
└── ExportButton/
    ├── ExportButton.tsx
    └── index.ts
```

**Dependencies:**
- useProjectStore from @/state/projectStore
- parseMidiFile from @/lib/midi/parser
- convertMusicXmlFile from @/lib/musicxml/converter
- exportAndDownload from @/lib/midi/exporter
- React hooks: useState, useCallback, useRef

**No circular dependencies:** All components import from libraries, not vice versa.

## Verification Results

All verification criteria met:
- ✅ TypeScript compiles without errors (npx tsc --noEmit)
- ✅ All components import from store and lib functions correctly
- ✅ FileUpload handles both MIDI and MusicXML
- ✅ FileUpload shows confirmation when replacing existing project
- ✅ TrackList displays track information from trackDisplayInfo
- ✅ MetadataDisplay is collapsible with expand/collapse animation
- ✅ MetadataDisplay shows tempo, time signature, key, PPQ, duration
- ✅ Current filename displayed with source format indicator
- ✅ ExportButton triggers download via exportAndDownload

**Success criteria validation:**
- ✅ FileUpload component handles drag-drop and click-to-select
- ✅ TrackList displays all tracks with correct info (name, instrument, note count, duration)
- ✅ MetadataDisplay shows all required info and is collapsible
- ✅ ExportButton downloads MIDI file with proper filename
- ✅ All components use Tailwind CSS for styling
- ✅ All components conditionally render (null when no project)

## Next Phase Readiness

**Phase 1 completion:** This completes Wave 4 of Phase 1 (Final Wave). All Phase 1 infrastructure is now complete:
- ✅ Wave 1: Foundation and types (01-01)
- ✅ Wave 2: Import pipelines (01-02, 01-03)
- ✅ Wave 3: Export pipeline (01-04)
- ✅ Wave 4: UI components (01-05)

**Ready for:**
- Integration into main application page (wire up components in src/app/page.tsx)
- End-to-end testing with real MIDI and MusicXML files
- User acceptance testing for Phase 1 functionality
- Phase 2: Natural language editing infrastructure

**Blockers:** None

**Concerns:** None

**Next integration step:** Update src/app/page.tsx to render FileUpload, MetadataDisplay, TrackList, and ExportButton in a cohesive layout. This will complete the Phase 1 user experience.

## Performance Notes

- All components render conditionally (null checks prevent rendering when no data)
- TrackList uses computed trackDisplayInfo from store (no component-level calculations)
- MetadataDisplay calculates duration inline (simple tick-to-seconds conversion)
- FileUpload processes files asynchronously (no UI blocking)
- ExportButton export is synchronous but fast for typical projects

**Completed:** 2026-01-24
**Duration:** 2m 47s
**Commits:** 3 (7bf21dc, 1ae458f, 7c2f652)
