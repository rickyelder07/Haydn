---
phase: 01-foundation-a-midi-infrastructure
plan: 01
subsystem: foundation
tags: [nextjs, typescript, midi, state-management, dependencies]
dependencies:
  requires: []
  provides:
    - project-scaffold
    - data-types
    - instrument-mapping
    - state-store
  affects: [01-02, 01-03, 02-01]
tech-stack:
  added:
    - Next.js 15.1.6 (App Router, TypeScript)
    - "@tonejs/midi": "^2.0.28"
    - "musicxml-interfaces": "^0.0.21"
    - "zustand": "^5.0.10"
    - Tailwind CSS 3.4.17
  patterns:
    - Tick-based time representation for all MIDI events
    - Zustand store with computed display info pattern
    - Path aliases (@/*) for clean imports
key-files:
  created:
    - src/lib/midi/types.ts
    - src/lib/instruments/gm-mapping.ts
    - src/state/projectStore.ts
    - package.json
    - tsconfig.json
    - next.config.ts
    - src/app/layout.tsx
    - src/app/page.tsx
  modified: []
decisions:
  - decision: Use ticks as primary time representation
    rationale: MIDI native format, avoids tempo-dependent conversions
    impact: All time calculations must convert ticks to seconds for display
    location: src/lib/midi/types.ts
  - decision: General MIDI instrument mapping (128 instruments)
    rationale: Standard mapping for consistent instrument naming
    impact: Non-GM MIDI files may show incorrect instrument names
    location: src/lib/instruments/gm-mapping.ts
  - decision: Zustand for state management
    rationale: Simple, lightweight, TypeScript-friendly
    impact: All components will use useProjectStore hook
    location: src/state/projectStore.ts
metrics:
  duration: 251 seconds
  completed: 2026-01-24
---

# Phase 01 Plan 01: Foundation Setup Summary

**One-liner:** Next.js 15 project foundation with tick-based MIDI types, GM instrument mapping, and Zustand state store.

## What Was Built

Established the complete foundation for the Haydn MIDI editor:

1. **Next.js 15 Application**
   - App Router with TypeScript
   - Tailwind CSS for styling
   - ESLint configuration
   - Minimal home page with "Haydn - MIDI Editor" branding

2. **Internal Data Model Types**
   - `HaydnProject`: Complete project representation
   - `HaydnTrack`: Track with notes, control changes, instrument info
   - `HaydnNote`: Note with tick-based timing and normalized velocity
   - `HaydnMetadata`: Tempo, time signature, key signature arrays
   - `TrackDisplayInfo`: Computed display values
   - `ParseResult<T>`: Generic parsing result type
   - All timing uses MIDI ticks (not seconds) as primary representation

3. **General MIDI Instrument Mapping**
   - Complete 128-instrument GM standard mapping
   - Helper functions: `getInstrumentName()`, `isPercussionChannel()`, `getPercussionTrackName()`
   - Organized by category (Piano, Chromatic Percussion, Organ, Guitar, etc.)

4. **Zustand State Store**
   - Project data management with `useProjectStore` hook
   - Computed track display info (duration, note count, formatted time)
   - Actions: `setProject`, `clearProject`, `setLoading`, `setError`, `updateTrackName`
   - Display info automatically recomputed when project updates

## Decisions Made

### 1. Tick-Based Time Representation
**Decision:** Use MIDI ticks as the primary time unit throughout the application.
**Rationale:** Ticks are the native MIDI format and avoid tempo-dependent conversions. Converting to seconds only happens at display time.
**Impact:** All MIDI operations work directly with ticks. Display layer must convert to human-readable time.
**Location:** `src/lib/midi/types.ts`

### 2. General MIDI Standard Mapping
**Decision:** Implement the full 128-instrument GM standard mapping.
**Rationale:** Provides consistent, human-readable instrument names across all MIDI files.
**Impact:** Non-GM MIDI files (e.g., custom soundfonts) may show incorrect instrument names.
**Location:** `src/lib/instruments/gm-mapping.ts`

### 3. Zustand for State Management
**Decision:** Use Zustand for global state management instead of Context API or Redux.
**Rationale:** Simple API, minimal boilerplate, excellent TypeScript support, no provider wrapping needed.
**Impact:** All components will access state via `useProjectStore()` hook. Single source of truth for project data.
**Location:** `src/state/projectStore.ts`

### 4. Computed Display Info Pattern
**Decision:** Store only source data in state, compute display values on-the-fly.
**Rationale:** Avoids state synchronization issues. Display info automatically updates when source data changes.
**Impact:** Display calculations happen in store, not components. Slight performance overhead (negligible for typical projects).
**Location:** `src/state/projectStore.ts` - `computeTrackDisplayInfo()` function

## Deviations from Plan

None - plan executed exactly as written.

## Technical Context

### Project Structure Established
```
Haydn/
├── src/
│   ├── app/                  # Next.js app router
│   │   ├── layout.tsx        # Root layout with metadata
│   │   ├── page.tsx          # Home page with placeholder
│   │   └── globals.css       # Tailwind directives
│   ├── lib/
│   │   ├── midi/
│   │   │   └── types.ts      # Core MIDI data types
│   │   └── instruments/
│   │       └── gm-mapping.ts # GM instrument names
│   └── state/
│       └── projectStore.ts   # Zustand store
├── package.json              # Dependencies
├── tsconfig.json             # TypeScript config with @/* alias
├── next.config.ts            # Next.js config
├── tailwind.config.ts        # Tailwind config
└── postcss.config.mjs        # PostCSS config
```

### Type System Foundation
The type system uses a clear hierarchy:
- **Project** → contains metadata and tracks
- **Track** → contains notes, control changes, and instrument info
- **Note** → tick-based timing with normalized velocity (0-1)
- **Metadata** → arrays of tempo, time signature, and key signature events

### State Management Pattern
```typescript
// Usage in components (future):
const { project, trackDisplayInfo, setProject } = useProjectStore();

// Display info automatically computed when project changes
// No manual sync needed
```

## Verification Results

All success criteria met:
- ✅ Next.js 15 app builds successfully (`npm run build`)
- ✅ TypeScript compiles without errors (`npx tsc --noEmit`)
- ✅ All dependencies installed (@tonejs/midi, musicxml-interfaces, zustand)
- ✅ Type definitions exported from `src/lib/midi/types.ts`
- ✅ GM instrument mapping has exactly 128 instruments
- ✅ Zustand store exports `useProjectStore` with all actions
- ✅ Path aliases (@/*) resolve correctly
- ✅ All imports verified working

## Next Phase Readiness

**Ready for:**
- ✅ **01-02 MIDI Parser:** Types ready to receive parsed MIDI data
- ✅ **01-03 Track List UI:** Store and display info ready for rendering
- ✅ **02-01 MusicXML Parser:** Types support `sourceFormat: 'musicxml'`

**Blockers:** None

**Concerns:** None

## Performance Notes

- Build time: ~2.3 seconds (Next.js optimized production build)
- Type checking: Fast, no errors
- Store performance: Negligible overhead for typical projects (< 50 tracks)

## Files Modified

**Created (11 files):**
- `package.json` - Project dependencies and scripts
- `package-lock.json` - Dependency lock file
- `tsconfig.json` - TypeScript configuration with @/* path alias
- `next.config.ts` - Next.js configuration
- `tailwind.config.ts` - Tailwind CSS configuration
- `postcss.config.mjs` - PostCSS configuration
- `.eslintrc.json` - ESLint configuration
- `.gitignore` - Git ignore patterns
- `src/app/layout.tsx` - Root layout with Haydn metadata
- `src/app/page.tsx` - Home page with placeholder
- `src/app/globals.css` - Tailwind directives and CSS variables
- `src/lib/midi/types.ts` - Internal MIDI data types
- `src/lib/instruments/gm-mapping.ts` - GM instrument mapping (128 instruments)
- `src/state/projectStore.ts` - Zustand state store

**Modified:** None (fresh project)

## Commits

| Hash | Type | Description |
|------|------|-------------|
| 4b1c376 | chore | Initialize Next.js 15 project with dependencies |
| cd59818 | feat | Add internal data model types |
| 4a55077 | feat | Add GM instrument mapping and Zustand store |

**Total commits:** 3 (one per task)
