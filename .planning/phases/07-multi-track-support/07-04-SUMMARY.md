---
phase: 07-multi-track-support
plan: 04
subsystem: ui
tags: [zustand, track-management, react, modal, drag-drop]

# Dependency graph
requires:
  - phase: 07-01
    provides: trackUIStore foundation for ephemeral UI state management
provides:
  - addTrack and removeTrack actions in projectStore
  - AddTrackModal component for instrument selection
  - Track deletion UI with confirmation
  - 32-track limit enforcement with visual feedback
affects: [07-05, 07-06, future-track-operations]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Track lifecycle management via projectStore"
    - "Modal pattern for track creation with auto-focus"
    - "Confirmation dialogs for destructive actions"
    - "Channel assignment algorithm avoiding percussion channel 9"

key-files:
  created:
    - src/components/TrackList/AddTrackModal.tsx
  modified:
    - src/state/projectStore.ts
    - src/components/TrackList/TrackList.tsx
    - src/components/TrackList/TrackItem.tsx
    - src/components/TrackList/index.ts

key-decisions:
  - "Maximum 32 tracks per project with visual X/32 counter"
  - "Minimum 1 track enforced (cannot delete last track)"
  - "Channel 9 (percussion) skipped for non-drum instruments"
  - "Auto-generated track names using GM instrument name + 'Track'"
  - "Native confirm() dialog for deletion (no custom modal needed)"
  - "trackUIStore order reinitialized when track count changes"

patterns-established:
  - "findNextAvailableChannel helper for smart MIDI channel assignment"
  - "Track deletion adjusts editStore selection to maintain valid state"
  - "Modal state managed locally in parent component (TrackList)"
  - "Delete button in TrackItem with event propagation stop"

# Metrics
duration: 5.0min
completed: 2026-02-09
---

# Phase 07 Plan 04: Track Management Summary

**Add and remove tracks UI with instrument selection modal, 32-track limit enforcement, and smart MIDI channel assignment avoiding percussion**

## Performance

- **Duration:** 5.0 min
- **Started:** 2026-02-09T14:40:34Z
- **Completed:** 2026-02-09T14:45:35Z
- **Tasks:** 3
- **Files modified:** 5

## Accomplishments
- Users can add new empty tracks via modal with full GM instrument selection (128 instruments)
- Users can remove tracks with confirmation dialog (minimum 1 track enforced)
- Track count displays X/32 format with Add button disabled at limit
- Smart channel assignment skips percussion channel 9 for non-drum instruments

## Task Commits

Each task was committed atomically:

1. **Task 1: Add addTrack and removeTrack to projectStore** - `ad64b8c` (feat)
2. **Task 2: Create AddTrackModal component** - `d0d8bc9` (feat)
3. **Task 3: Integrate AddTrackModal and delete button into TrackList** - `f37269f` (feat)

## Files Created/Modified
- `src/state/projectStore.ts` - Added addTrack and removeTrack actions with track limit and channel assignment
- `src/components/TrackList/AddTrackModal.tsx` - Modal dialog for track creation with instrument dropdown and optional name
- `src/components/TrackList/TrackList.tsx` - Integrated Add Track button and modal state management
- `src/components/TrackList/TrackItem.tsx` - Added delete button with confirmation dialog
- `src/components/TrackList/index.ts` - Exported AddTrackModal

## Decisions Made

**Maximum 32 tracks per project:**
- Standard MIDI limit is 16 channels but many DAWs support 32+ tracks with channel reuse
- 32 provides sufficient flexibility while keeping UI manageable
- Visual counter (X/32) provides clear feedback on remaining capacity

**Minimum 1 track enforcement:**
- Prevents edge case of empty project with no tracks
- Ensures there's always a valid track for editing
- Consistent with DAW conventions

**Channel assignment algorithm:**
- Skip channel 9 (percussion) for melodic instruments by default
- Only use channel 9 if all other 15 channels exhausted
- Prevents accidental drum track creation when adding piano/guitar/etc.

**Auto-generated track names:**
- Format: "{InstrumentName} Track" (e.g., "Acoustic Grand Piano Track")
- Users can override during creation via optional name field
- Provides sensible defaults reducing friction for quick workflow

**Native confirm() for deletion:**
- Lightweight compared to custom modal component
- Built-in browser dialog is familiar and accessible
- Sufficient UX for destructive action confirmation in v1

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None - all tasks completed without issues. TypeScript compilation succeeded, build passed, all verification criteria met.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

Track management foundation complete. Ready for:
- **07-05:** Advanced track operations (duplicate, merge, split)
- **07-06:** Track-level effects and routing

All must-have truths verified:
- User can add new empty track via modal
- New track has selected instrument and default MIDI channel
- User can remove track with confirmation dialog
- Projects support up to 32 tracks

## Self-Check: PASSED

**Created files verified:**
- FOUND: src/components/TrackList/AddTrackModal.tsx

**Commits verified:**
- FOUND: ad64b8c (Task 1)
- FOUND: d0d8bc9 (Task 2)
- FOUND: f37269f (Task 3)

**Modified files verified:**
- addTrack action exists in projectStore.ts (lines 22, 109)
- removeTrack action exists in projectStore.ts (lines 23, 141)
- AddTrackModal imported and used in TrackList.tsx (lines 22, 115)
- Delete button with handleDelete in TrackItem.tsx (line 118)

---
*Phase: 07-multi-track-support*
*Completed: 2026-02-09*
