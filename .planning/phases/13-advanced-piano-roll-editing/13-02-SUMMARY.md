---
phase: 13-advanced-piano-roll-editing
plan: 02
subsystem: ui
tags: [piano-roll, velocity, canvas, drag, zustand, react, midi]

# Dependency graph
requires:
  - phase: 13-01
    provides: updateNoteDirectly action in editStore for real-time drag without history spam
  - phase: 03-piano-roll
    provides: gridUtils.ticksToX, PIANO_KEY_WIDTH, HaydnNote types
  - phase: 05-nl-editing
    provides: editStore with updateNote (history-aware update used on mouseup)
provides:
  - VelocityLane canvas component with stalk rendering and drag-edit interaction
  - VelocityLaneProps interface (exported for Plan 04 integration)
affects: [13-04, PianoRollEditor integration]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - dragRef (useRef) pattern for drag state that must not trigger re-renders
    - velocitySnapshot pattern: capture all note velocities on mousedown, compute delta from snapshot on each mousemove frame (not accumulated delta)
    - direct/history split: updateNoteDirectly during drag frames, updateNote once on mouseup

key-files:
  created:
    - src/components/PianoRoll/VelocityLane.tsx
  modified: []

key-decisions:
  - "dragRef uses useRef (not useState) for drag state — avoids React re-renders during mousemove, canvas redraws come from notes prop updating via projectStore"
  - "hitTest uses same 0.1 * zoomX formula as rendering — ensures hit-test and visual positions never drift"
  - "velocitySnapshot captured once on mousedown; delta recomputed from snapshot on every mousemove — avoids accumulated floating-point drift on fast drags"
  - "cursor: ns-resize on canvas signals vertical drag affordance to user"

patterns-established:
  - "dragRef pattern: store drag state in useRef<DragState | null>(null) — set on mousedown, read in window mousemove/mouseup, null on mouseup"
  - "Snapshot-delta pattern: snapshot all values at drag start, compute delta from snapshot each frame — clean and predictable on rapid mouse moves"

requirements-completed: [VEL-01, VEL-02, VEL-03, VEL-04, VEL-05, VEL-06]

# Metrics
duration: 2min
completed: 2026-03-02
---

# Phase 13 Plan 02: VelocityLane Component Summary

**Canvas velocity lane with velocity-proportional stalk rendering, selected-note bright cyan highlighting, and smooth real-time drag editing with multi-select delta support.**

## Performance

- **Duration:** ~2 min
- **Started:** 2026-03-02T20:33:31Z
- **Completed:** 2026-03-02T20:36:20Z
- **Tasks:** 2
- **Files modified:** 1

## Accomplishments

- Created `VelocityLane.tsx` — a standalone `'use client'` canvas component with full velocity stalk rendering using the same `0.1 * zoomX` pixel formula as PianoRollCanvas
- Canvas renders stalks proportional to `note.velocity`, growing upward from the bottom, with tip caps (4px arc) as wider grab targets; off-screen stalks culled for performance
- Added drag interaction: mousedown snapshots all velocities, mousemove calls `updateNoteDirectly` (no history entries), mouseup calls `updateNote` once for a single undoable history entry
- Multi-select drag: all selected notes shift by the same delta computed from their individual snapshots

## Task Commits

Each task was committed atomically:

1. **Task 1: Canvas stalk rendering** - `677716d` (feat)
2. **Task 2: Drag interaction** - `6c05f4a` (feat)

## Files Created/Modified

- `src/components/PianoRoll/VelocityLane.tsx` - Canvas velocity lane component: VelocityLane function + VelocityLaneProps interface, stalk rendering, hit-test, drag interaction with snapshot-delta pattern

## Decisions Made

- `dragRef` uses `useRef` (not `useState`) for drag state — avoids triggering React re-renders during mousemove; canvas redraws come naturally from the notes prop updating as projectStore changes propagate
- `hitTest` uses the same `0.1 * zoomX` formula as the rendering useEffect — ensures visual stalk position and interactive hit area never drift apart
- `velocitySnapshot` captured once on mousedown; delta recomputed from snapshot on every mousemove frame — avoids accumulated floating-point error on fast or long drags
- `cursor: ns-resize` on the canvas element signals vertical drag affordance to the user

## Deviations from Plan

None - plan executed exactly as written. The plan included a note about `require()` being fragile and provided the corrected `useProjectStore.getState()` pattern — implemented the corrected version directly with no `require()` calls.

## Issues Encountered

None. TypeScript compiled clean after each task with zero errors.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- `VelocityLane` and `VelocityLaneProps` exported and ready for Plan 04 integration into `PianoRollEditor`
- Component is fully self-contained: takes notes, scrollX, zoomX, selectedNoteIds, trackIndex, width, height as props
- Stalk X positions match PianoRollCanvas exactly (same `0.1 * zoomX` formula and `ticksToX` from gridUtils)
- No additional setup required before Plan 04 wires it into the editor

## Self-Check: PASSED

- FOUND: `src/components/PianoRoll/VelocityLane.tsx`
- FOUND: commit `677716d` (Task 1: canvas stalk rendering)
- FOUND: commit `6c05f4a` (Task 2: drag interaction)
- VERIFIED: `VelocityLane` and `VelocityLaneProps` both exported
- VERIFIED: `0.1 * zoomX` present in both rendering (line 63) and hitTest (line 99)
- VERIFIED: `velocitySnapshot` captured on mousedown (notes.map snapshot)
- VERIFIED: `updateNoteDirectly` called in mousemove, `updateNote` called in mouseup
- VERIFIED: No `require()` calls in file
- VERIFIED: TypeScript compiles with zero errors

---
*Phase: 13-advanced-piano-roll-editing*
*Completed: 2026-03-02*
