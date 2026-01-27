---
phase: 03-piano-roll-editor
plan: 03
subsystem: ui
tags: [react, canvas, mouse-interactions, zustand, piano-roll, editing]

# Dependency graph
requires:
  - phase: 03-01
    provides: Edit state management with undo/redo history
  - phase: 03-02
    provides: Canvas-based piano roll rendering with grid and notes
provides:
  - Full piano roll editor with mouse-based note editing
  - Add, delete, and move notes via mouse interactions
  - Undo/redo toolbar controls
  - Scroll and zoom viewport controls
affects: [03-04, 03-05, 03-06]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Invisible interaction layer over canvas for event handling"
    - "Global mouse listeners for drag operations"
    - "Grid snapping for all edit operations"

key-files:
  created:
    - src/components/PianoRoll/usePianoRollInteractions.ts
    - src/components/PianoRoll/PianoRollEditor.tsx
    - src/components/PianoRoll/index.ts
  modified:
    - src/components/PianoRoll/usePianoRollInteractions.ts

key-decisions:
  - "Invisible canvas layer for mouse event handling over PianoRollCanvas"
  - "Global window event listeners for smooth drag operations"
  - "Grid snapping applied on mouseup, not during drag"
  - "Right-click OR Shift+Left-click for delete (flexibility)"

patterns-established:
  - "usePianoRollInteractions hook encapsulates all mouse interaction logic"
  - "Hit-testing in reverse order for proper z-index (top notes first)"
  - "setEditing(true) during drag to provide visual feedback"

# Metrics
duration: 2.75 min
completed: 2026-01-27
---

# Phase 03 Plan 03: Piano Roll Interactions and Assembly Summary

**Full piano roll editor with mouse-based note editing (add/delete/move), undo/redo toolbar, and wheel-based scrolling**

## Performance

- **Duration:** 2.75 min
- **Started:** 2026-01-27T15:43:15Z
- **Completed:** 2026-01-27T15:46:00Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- Mouse interaction hook handles add, select, delete, and drag operations with grid snapping
- Assembled PianoRollEditor component integrates canvas, sidebar, toolbar, and interactions
- Toolbar with undo/redo buttons wired to editStore
- Wheel-based scrolling (vertical and shift+horizontal) with scroll bounds
- Default viewport centered on C4 (MIDI 60) for intuitive starting position
- Barrel export provides clean import path for consuming components

## Task Commits

Each task was committed atomically:

1. **Task 1: Create mouse interaction hook** - `ca3ed4e` (feat)
2. **Task 2: Assemble PianoRollEditor component with toolbar** - `2924a26` (feat)

## Files Created/Modified
- `src/components/PianoRoll/usePianoRollInteractions.ts` - Custom hook for mouse-based note editing (add/delete/drag with hit-testing)
- `src/components/PianoRoll/PianoRollEditor.tsx` - Main editor component assembling canvas, sidebar, toolbar, and interactions
- `src/components/PianoRoll/index.ts` - Barrel export for clean imports

## Decisions Made

**Invisible canvas layer for mouse event handling**
- Placed transparent canvas over PianoRollCanvas to capture mouse events
- Allows PianoRollCanvas to remain purely rendering-focused
- Maintains separation of concerns between rendering and interaction

**Global window event listeners for drag operations**
- Attach mousemove/mouseup to window during drag for smooth behavior
- Prevents loss of tracking when mouse leaves canvas bounds
- Clean up listeners on drag end or component unmount

**Grid snapping on mouseup, not during drag**
- Calculate snap position only when drag completes
- Provides responsive drag feedback without jarring snap adjustments
- Matches industry-standard DAW interaction patterns

**Right-click OR Shift+Left-click for delete**
- Two methods for note deletion provides flexibility
- Right-click prevents context menu with preventDefault
- Shift+Left-click alternative for trackpad users without right-click

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

**TypeScript ref type mismatch**
- `useRef<HTMLCanvasElement>(null)` incompatible with `React.RefObject<HTMLCanvasElement>`
- Fixed by adding nullable type: `useRef<HTMLCanvasElement | null>(null)`
- Updated hook interface to accept nullable ref type
- Rule 1 (Bug) - auto-fixed during Task 2

**playbackStore property name**
- Plan assumed `positionTicks` but actual property is `position.ticks`
- Fixed by reading playbackStore structure and using correct path
- Rule 3 (Blocking) - auto-fixed during Task 2

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

Piano roll editor is fully interactive and ready for:
- Note duration editing (03-04)
- Velocity editing (03-05)
- Additional editing features (copy/paste, multi-select, etc.)

All mouse interactions snap to grid and integrate with undo/redo system. Playhead visualization during playback is connected.

---
*Phase: 03-piano-roll-editor*
*Completed: 2026-01-27*
